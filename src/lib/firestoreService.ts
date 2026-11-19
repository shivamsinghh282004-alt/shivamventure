import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  BLUEPRINT_LIMITS,
  type ClientBillingType,
  type ClientRecord,
  type ClientTaxScope,
  type IncomeEntry,
  type IncomeStatus,
  type PlatformType,
  type ServiceCategory,
  type TaxRegime,
  type UserProfile,
  type WorkflowCategory,
  type WorkflowPriority,
  type WorkflowStatus,
  type WorkflowTask,
} from '../types';
import { OperationType, db, handleFirestoreError } from './firebase';

function sanitizeString(value: string, maxLength: number, fallback = ''): string {
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed.length > 0 ? trimmed : fallback;
}

function clampAmount(value: number, min = 0, max = BLUEPRINT_LIMITS.maxAmount): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function sanitizeDate(value: string): string {
  if (BLUEPRINT_LIMITS.datePattern.test(value)) {
    return value;
  }
  return '2026-11-19';
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);

  const safeEmail = sanitizeString(user.email ?? 'user@example.com', 254, 'user@example.com');
  const safeDisplayName = sanitizeString(
    user.displayName ?? safeEmail.split('@')[0] ?? 'Freelancer',
    BLUEPRINT_LIMITS.maxDisplayName,
    'Freelancer'
  );
  const safePhoto = (user.photoURL ?? '').trim().slice(0, BLUEPRINT_LIMITS.maxPhotoUrl);
  const firstName = safeDisplayName.split(' ')[0] || 'My';

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: safeEmail,
        displayName: safeDisplayName,
        photoURL: safePhoto,
        businessName: sanitizeString(`${firstName} Studio`, BLUEPRINT_LIMITS.maxBusinessName, 'Freelance Studio'),
        city: 'Delhi NCR',
        taxRegime: '44ada',
        gstRegistered: false,
        annualTarget: 1500000,
      };
      await setDoc(ref, {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newProfile;
    }

    const existing = snap.data() as UserProfile;
    if (
      existing.displayName !== safeDisplayName ||
      existing.photoURL !== safePhoto ||
      existing.email !== safeEmail
    ) {
      await updateDoc(ref, {
        displayName: safeDisplayName,
        photoURL: safePhoto,
        email: safeEmail,
        updatedAt: serverTimestamp(),
      });
    }
    return {
      ...existing,
      displayName: safeDisplayName,
      photoURL: safePhoto,
      email: safeEmail,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as UserProfile) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function updateUserSettings(
  uid: string,
  updates: {
    businessName: string;
    city: string;
    taxRegime: TaxRegime;
    gstRegistered: boolean;
    annualTarget: number;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      businessName: sanitizeString(updates.businessName, BLUEPRINT_LIMITS.maxBusinessName, 'Freelance Studio'),
      city: sanitizeString(updates.city, BLUEPRINT_LIMITS.maxCity, ''),
      taxRegime: updates.taxRegime,
      gstRegistered: Boolean(updates.gstRegistered),
      annualTarget: clampAmount(updates.annualTarget, 0, BLUEPRINT_LIMITS.maxAnnualTarget),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeIncomes(
  uid: string,
  onData: (entries: IncomeEntry[]) => void
): Unsubscribe {
  const path = 'incomes';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<IncomeEntry, 'id'>),
      }));
      items.sort((a, b) => b.receivedDate.localeCompare(a.receivedDate));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface IncomeInput {
  clientName: string;
  platform: PlatformType;
  category: ServiceCategory;
  grossAmount: number;
  tdsAmount: number;
  gstAmount: number;
  status: IncomeStatus;
  receivedDate: string;
  notes: string;
}

export async function createIncome(uid: string, input: IncomeInput): Promise<void> {
  const path = 'incomes';
  const gross = clampAmount(input.grossAmount, 1);
  const tds = clampAmount(input.tdsAmount, 0, gross);
  const gst = clampAmount(input.gstAmount, 0, gross);

  try {
    await addDoc(collection(db, path), {
      ownerId: uid,
      clientName: sanitizeString(input.clientName, BLUEPRINT_LIMITS.maxClientName, 'Client'),
      platform: input.platform,
      category: input.category,
      grossAmount: gross,
      tdsAmount: tds,
      gstAmount: gst,
      status: input.status,
      receivedDate: sanitizeDate(input.receivedDate),
      notes: sanitizeString(input.notes, BLUEPRINT_LIMITS.maxNotes, ''),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateIncome(id: string, input: IncomeInput): Promise<void> {
  const path = `incomes/${id}`;
  const gross = clampAmount(input.grossAmount, 1);
  const tds = clampAmount(input.tdsAmount, 0, gross);
  const gst = clampAmount(input.gstAmount, 0, gross);

  try {
    await updateDoc(doc(db, 'incomes', id), {
      clientName: sanitizeString(input.clientName, BLUEPRINT_LIMITS.maxClientName, 'Client'),
      platform: input.platform,
      category: input.category,
      grossAmount: gross,
      tdsAmount: tds,
      gstAmount: gst,
      status: input.status,
      receivedDate: sanitizeDate(input.receivedDate),
      notes: sanitizeString(input.notes, BLUEPRINT_LIMITS.maxNotes, ''),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleIncomeStatus(id: string, nextStatus: IncomeStatus): Promise<void> {
  const path = `incomes/${id}`;
  try {
    await updateDoc(doc(db, 'incomes', id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteIncome(id: string): Promise<void> {
  const path = `incomes/${id}`;
  try {
    await deleteDoc(doc(db, 'incomes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeWorkflows(
  uid: string,
  onData: (tasks: WorkflowTask[]) => void
): Unsubscribe {
  const path = 'workflows';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<WorkflowTask, 'id'>),
      }));
      items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface WorkflowInput {
  title: string;
  clientName: string;
  category: WorkflowCategory;
  priority: WorkflowPriority;
  status: WorkflowStatus;
  dueDate: string;
  amountLinked: number;
}

export async function createWorkflow(uid: string, input: WorkflowInput): Promise<void> {
  const path = 'workflows';
  try {
    await addDoc(collection(db, path), {
      ownerId: uid,
      title: sanitizeString(input.title, BLUEPRINT_LIMITS.maxTaskTitle, 'Follow-up task'),
      clientName: sanitizeString(input.clientName, BLUEPRINT_LIMITS.maxClientName, ''),
      category: input.category,
      priority: input.priority,
      status: input.status,
      dueDate: sanitizeDate(input.dueDate),
      amountLinked: clampAmount(input.amountLinked, 0),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateWorkflow(id: string, input: WorkflowInput): Promise<void> {
  const path = `workflows/${id}`;
  try {
    await updateDoc(doc(db, 'workflows', id), {
      title: sanitizeString(input.title, BLUEPRINT_LIMITS.maxTaskTitle, 'Follow-up task'),
      clientName: sanitizeString(input.clientName, BLUEPRINT_LIMITS.maxClientName, ''),
      category: input.category,
      priority: input.priority,
      status: input.status,
      dueDate: sanitizeDate(input.dueDate),
      amountLinked: clampAmount(input.amountLinked, 0),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateWorkflowStatus(id: string, status: WorkflowStatus): Promise<void> {
  const path = `workflows/${id}`;
  try {
    await updateDoc(doc(db, 'workflows', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteWorkflow(id: string): Promise<void> {
  const path = `workflows/${id}`;
  try {
    await deleteDoc(doc(db, 'workflows', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeClients(
  uid: string,
  onData: (clients: ClientRecord[]) => void
): Unsubscribe {
  const path = 'clients';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ClientRecord, 'id'>),
      }));
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface ClientInput {
  name: string;
  platform: PlatformType;
  billingType: ClientBillingType;
  retainerAmount: number;
  taxScope: ClientTaxScope;
  contactNote: string;
}

export async function createClient(uid: string, input: ClientInput): Promise<void> {
  const path = 'clients';
  try {
    await addDoc(collection(db, path), {
      ownerId: uid,
      name: sanitizeString(input.name, BLUEPRINT_LIMITS.maxClientName, 'Client'),
      platform: input.platform,
      billingType: input.billingType,
      retainerAmount: clampAmount(input.retainerAmount, 0),
      taxScope: input.taxScope,
      contactNote: sanitizeString(input.contactNote, BLUEPRINT_LIMITS.maxContactNote, ''),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
  const path = `clients/${id}`;
  try {
    await updateDoc(doc(db, 'clients', id), {
      name: sanitizeString(input.name, BLUEPRINT_LIMITS.maxClientName, 'Client'),
      platform: input.platform,
      billingType: input.billingType,
      retainerAmount: clampAmount(input.retainerAmount, 0),
      taxScope: input.taxScope,
      contactNote: sanitizeString(input.contactNote, BLUEPRINT_LIMITS.maxContactNote, ''),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClient(id: string): Promise<void> {
  const path = `clients/${id}`;
  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedStarterWorkspace(uid: string): Promise<void> {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  const sampleClients: Array<ClientInput> = [
    {
      name: 'Kaya FinTech Delhi',
      platform: 'Direct UPI / Bank',
      billingType: 'Retainer',
      retainerAmount: 145000,
      taxScope: 'domestic_tds',
      contactNote: 'Monthly UI/UX retainer · 10% Sec 194J TDS deducted',
    },
    {
      name: 'Northstar SaaS (UK)',
      platform: 'Upwork',
      billingType: 'Milestone',
      retainerAmount: 210000,
      taxScope: 'export_lut',
      contactNote: 'Export of services under LUT · Zero GST rated',
    },
    {
      name: 'Doon Commerce Labs',
      platform: 'Razorpay',
      billingType: 'Retainer',
      retainerAmount: 85000,
      taxScope: 'domestic_no_tds',
      contactNote: 'Dehradun D2C storefront optimization · Bi-weekly sprint',
    },
  ];

  const sampleIncomes: Array<IncomeInput> = [
    {
      clientName: 'Kaya FinTech Delhi',
      platform: 'Direct UPI / Bank',
      category: 'Design',
      grossAmount: 145000,
      tdsAmount: 14500,
      gstAmount: 0,
      status: 'received',
      receivedDate: '2026-05-12',
      notes: 'Q1 design system retainer',
    },
    {
      clientName: 'Northstar SaaS (UK)',
      platform: 'Upwork',
      category: 'Development',
      grossAmount: 245000,
      tdsAmount: 0,
      gstAmount: 0,
      status: 'received',
      receivedDate: '2026-06-24',
      notes: 'Dashboard frontend milestone 1 & 2',
    },
    {
      clientName: 'Doon Commerce Labs',
      platform: 'Razorpay',
      category: 'Consulting',
      grossAmount: 85000,
      tdsAmount: 0,
      gstAmount: 0,
      status: 'received',
      receivedDate: '2026-07-18',
      notes: 'Checkout conversion audit',
    },
    {
      clientName: 'Kaya FinTech Delhi',
      platform: 'Direct UPI / Bank',
      category: 'Design',
      grossAmount: 145000,
      tdsAmount: 14500,
      gstAmount: 0,
      status: 'received',
      receivedDate: '2026-08-14',
      notes: 'Mobile onboarding sprint',
    },
    {
      clientName: 'Northstar SaaS (UK)',
      platform: 'Upwork',
      category: 'Development',
      grossAmount: 280000,
      tdsAmount: 0,
      gstAmount: 0,
      status: 'received',
      receivedDate: '2026-09-28',
      notes: 'Analytics module release',
    },
    {
      clientName: 'Kaya FinTech Delhi',
      platform: 'Direct UPI / Bank',
      category: 'Design',
      grossAmount: 165000,
      tdsAmount: 16500,
      gstAmount: 0,
      status: 'received',
      receivedDate: '2026-10-19',
      notes: 'October product retainer + prototype',
    },
    {
      clientName: 'Doon Commerce Labs',
      platform: 'Razorpay',
      category: 'Consulting',
      grossAmount: 95000,
      tdsAmount: 9500,
      gstAmount: 0,
      status: 'received',
      receivedDate: '2026-11-08',
      notes: 'Festive campaign funnel optimization',
    },
    {
      clientName: 'Northstar SaaS (UK)',
      platform: 'Stripe',
      category: 'Development',
      grossAmount: 190000,
      tdsAmount: 0,
      gstAmount: 0,
      status: 'pending',
      receivedDate: '2026-11-28',
      notes: 'Invoice #NS-042 awaiting wire settlement',
    },
  ];

  const sampleWorkflows: Array<WorkflowInput> = [
    {
      title: 'Pay Q3 Advance Tax installment (75% cumulative)',
      clientName: 'Income Tax India · Challan 280',
      category: 'Tax & GST',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-12-15',
      amountLinked: 34500,
    },
    {
      title: 'Follow up on Invoice #NS-042 wire settlement',
      clientName: 'Northstar SaaS (UK)',
      category: 'Invoicing',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2026-11-28',
      amountLinked: 190000,
    },
    {
      title: 'Reconcile Form 26AS / AIS TDS entries for Q2',
      clientName: 'Kaya FinTech Delhi',
      category: 'Tax & GST',
      priority: 'medium',
      status: 'todo',
      dueDate: '2026-11-30',
      amountLinked: 45500,
    },
    {
      title: 'Deliver November UX handoff & Figma tokens',
      clientName: 'Doon Commerce Labs',
      category: 'Deliverable',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2026-11-24',
      amountLinked: 95000,
    },
  ];

  for (const c of sampleClients) {
    const ref = doc(collection(db, 'clients'));
    batch.set(ref, { ...c, ownerId: uid, createdAt: now, updatedAt: now });
  }
  for (const inc of sampleIncomes) {
    const ref = doc(collection(db, 'incomes'));
    batch.set(ref, { ...inc, ownerId: uid, createdAt: now, updatedAt: now });
  }
  for (const wf of sampleWorkflows) {
    const ref = doc(collection(db, 'workflows'));
    batch.set(ref, { ...wf, ownerId: uid, createdAt: now, updatedAt: now });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch/seedStarterWorkspace');
  }
}
