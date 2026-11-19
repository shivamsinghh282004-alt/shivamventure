export type TaxRegime = '44ada' | 'new_regime';

export type PlatformType =
  | 'Direct UPI / Bank'
  | 'Upwork'
  | 'Fiverr'
  | 'Razorpay'
  | 'Stripe'
  | 'Other';

export type ServiceCategory =
  | 'Design'
  | 'Development'
  | 'Content & Video'
  | 'Tutoring'
  | 'Consulting'
  | 'Other';

export type IncomeStatus = 'received' | 'pending';

export type WorkflowCategory =
  | 'Tax & GST'
  | 'Client Follow-up'
  | 'Deliverable'
  | 'Invoicing';

export type WorkflowPriority = 'high' | 'medium' | 'low';

export type WorkflowStatus = 'todo' | 'in_progress' | 'completed';

export type ClientBillingType = 'Retainer' | 'Milestone' | 'Hourly';

export type ClientTaxScope = 'domestic_tds' | 'domestic_no_tds' | 'export_lut';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  businessName: string;
  city: string;
  taxRegime: TaxRegime;
  gstRegistered: boolean;
  annualTarget: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface IncomeEntry {
  id: string;
  ownerId: string;
  clientName: string;
  platform: PlatformType;
  category: ServiceCategory;
  grossAmount: number;
  tdsAmount: number;
  gstAmount: number;
  status: IncomeStatus;
  receivedDate: string;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkflowTask {
  id: string;
  ownerId: string;
  title: string;
  clientName: string;
  category: WorkflowCategory;
  priority: WorkflowPriority;
  status: WorkflowStatus;
  dueDate: string;
  amountLinked: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClientRecord {
  id: string;
  ownerId: string;
  name: string;
  platform: PlatformType;
  billingType: ClientBillingType;
  retainerAmount: number;
  taxScope: ClientTaxScope;
  contactNote: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const PLATFORMS: PlatformType[] = [
  'Direct UPI / Bank',
  'Upwork',
  'Fiverr',
  'Razorpay',
  'Stripe',
  'Other',
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Design',
  'Development',
  'Content & Video',
  'Tutoring',
  'Consulting',
  'Other',
];

export const WORKFLOW_CATEGORIES: WorkflowCategory[] = [
  'Tax & GST',
  'Client Follow-up',
  'Deliverable',
  'Invoicing',
];

export const BLUEPRINT_LIMITS = {
  maxDisplayName: 120,
  maxBusinessName: 120,
  maxCity: 80,
  maxPhotoUrl: 500,
  maxClientName: 120,
  maxNotes: 400,
  maxTaskTitle: 160,
  maxContactNote: 240,
  maxAmount: 100000000,
  maxAnnualTarget: 1000000000,
  datePattern: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
};
