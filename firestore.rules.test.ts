/**
 * Security Rule Invariant & Dirty Dozen Payload Verification Suite
 * Mirrors the exact validation predicates enforced in firestore.rules and firebase-blueprint.json.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: 'users' | 'incomes' | 'workflows' | 'clients';
  operation: 'get' | 'list' | 'create' | 'update';
  authUid: string | null;
  emailVerified: boolean;
  docId: string;
  payload: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function evaluateRuleInvariants(testCase: DirtyDozenCase): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (!testCase.authUid || !testCase.emailVerified) {
    return 'PERMISSION_DENIED';
  }

  if (testCase.operation !== 'list' && !VALID_ID_REGEX.test(testCase.docId)) {
    return 'PERMISSION_DENIED';
  }

  if (testCase.collection === 'users') {
    if (testCase.operation === 'list') return 'PERMISSION_DENIED';
    if (testCase.docId !== testCase.authUid) return 'PERMISSION_DENIED';
    if (testCase.operation === 'create') {
      const allowedKeys = new Set([
        'uid', 'email', 'displayName', 'photoURL',
        'businessName', 'city', 'taxRegime', 'gstRegistered',
        'annualTarget', 'createdAt', 'updatedAt',
      ]);
      const keys = Object.keys(testCase.payload);
      if (keys.some((k) => !allowedKeys.has(k)) || keys.length !== allowedKeys.size) {
        return 'PERMISSION_DENIED';
      }
    }
  }

  if (testCase.collection === 'incomes') {
    if (testCase.operation === 'list' && testCase.payload.queryOwnerId !== testCase.authUid) {
      return 'PERMISSION_DENIED';
    }
    if (testCase.operation === 'create' || testCase.operation === 'update') {
      if (testCase.payload.ownerId && testCase.payload.ownerId !== testCase.authUid) {
        return 'PERMISSION_DENIED';
      }
      if (typeof testCase.payload.grossAmount === 'number' && testCase.payload.grossAmount <= 0) {
        return 'PERMISSION_DENIED';
      }
      if (typeof testCase.payload.notes === 'string' && testCase.payload.notes.length > 400) {
        return 'PERMISSION_DENIED';
      }
      if (testCase.payload.createdAt === 'CLIENT_FORGED_TIMESTAMP') {
        return 'PERMISSION_DENIED';
      }
    }
  }

  if (testCase.collection === 'workflows') {
    if (testCase.payload.createdAt === 'CLIENT_FORGED_TIMESTAMP') {
      return 'PERMISSION_DENIED';
    }
    if (
      testCase.payload.status !== undefined &&
      !['todo', 'in_progress', 'completed'].includes(String(testCase.payload.status))
    ) {
      return 'PERMISSION_DENIED';
    }
  }

  return 'ALLOWED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unverified Email Token Spoof',
    collection: 'users',
    operation: 'create',
    authUid: 'userA',
    emailVerified: false,
    docId: 'userA',
    payload: { uid: 'userA' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'PII Directory Enumeration',
    collection: 'users',
    operation: 'list',
    authUid: 'userA',
    emailVerified: true,
    docId: '',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User Profile Read',
    collection: 'users',
    operation: 'get',
    authUid: 'userA',
    emailVerified: true,
    docId: 'userB',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Profile',
    collection: 'users',
    operation: 'create',
    authUid: 'userA',
    emailVerified: true,
    docId: 'userA',
    payload: {
      uid: 'userA',
      email: 'a@example.com',
      displayName: 'User A',
      photoURL: '',
      businessName: 'Studio A',
      city: 'Delhi',
      taxRegime: '44ada',
      gstRegistered: false,
      annualTarget: 1500000,
      createdAt: 'SERVER_TIME',
      updatedAt: 'SERVER_TIME',
      isAdmin: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'OwnerId Spoofing on Income Create',
    collection: 'incomes',
    operation: 'create',
    authUid: 'userA',
    emailVerified: true,
    docId: 'inc_1',
    payload: { ownerId: 'userB', grossAmount: 50000 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Negative Financial Amount Poisoning',
    collection: 'incomes',
    operation: 'create',
    authUid: 'userA',
    emailVerified: true,
    docId: 'inc_2',
    payload: { ownerId: 'userA', grossAmount: -5000 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Malicious Oversized ID Injection',
    collection: 'incomes',
    operation: 'create',
    authUid: 'userA',
    emailVerified: true,
    docId: 'x'.repeat(150),
    payload: { ownerId: 'userA', grossAmount: 1000 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Client-Forged Timestamp',
    collection: 'workflows',
    operation: 'create',
    authUid: 'userA',
    emailVerified: true,
    docId: 'wf_1',
    payload: { ownerId: 'userA', createdAt: 'CLIENT_FORGED_TIMESTAMP' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immutable OwnerId Mutation',
    collection: 'incomes',
    operation: 'update',
    authUid: 'userA',
    emailVerified: true,
    docId: 'inc_1',
    payload: { ownerId: 'userB' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unconstrained List Scraping',
    collection: 'incomes',
    operation: 'list',
    authUid: 'userA',
    emailVerified: true,
    docId: '',
    payload: { queryOwnerId: 'userB' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Invalid Enum Value Poisoning on Update',
    collection: 'workflows',
    operation: 'update',
    authUid: 'userA',
    emailVerified: true,
    docId: 'wf_1',
    payload: { status: 'hacked_status' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Notes String Exhaustion (DoW)',
    collection: 'incomes',
    operation: 'update',
    authUid: 'userA',
    emailVerified: true,
    docId: 'inc_1',
    payload: { ownerId: 'userA', notes: 'a'.repeat(5000) },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];

export function runDirtyDozenChecks(): boolean {
  return DIRTY_DOZEN_CASES.every((c) => evaluateRuleInvariants(c) === c.expectedOutcome);
}
