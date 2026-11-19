# Security Specification — ShivamVenture Firestore Rules

## 1. Data Invariants
1. **Strict Owner Isolation (PII & Financial Privacy)**:
   - `/users/{userId}` contains PII (`email`, `displayName`, `photoURL`) and financial targets. Only the verified authenticated user whose `request.auth.uid == userId` may `get`, `create`, or `update` their own document. `list` and `delete` are denied.
   - `/incomes/{incomeId}`, `/workflows/{workflowId}`, and `/clients/{clientId}` belong strictly to a single `ownerId == request.auth.uid`. Cross-user `get`, `list`, `create`, `update`, or `delete` operations are unconditionally denied.
2. **Verified Identity Mandate**:
   - Every read and write requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Ownership & Creation Timestamps**:
   - `uid` / `ownerId` and `createdAt` cannot be modified after document creation.
   - `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
4. **Volumetric & Enum Boundaries**:
   - Every string length, numeric range (no negative amounts or absurd overflow), date format (`^[0-9]{4}-[0-9]{2}-[0-9]{2}$`), and enum value matches `firebase-blueprint.json` verbatim.
   - Document IDs must satisfy `^[a-zA-Z0-9_\-]+$` and length `<= 128`.
5. **Action-Based Updates (Zero Shadow Fields)**:
   - Every `create` validates exact `keys().hasAll(...)` and `keys().hasOnly(...)`.
   - Every `update` validates `isValid[Entity](incoming())` AND branches into explicit named actions using `incoming().diff(existing()).affectedKeys().hasOnly([...])`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Token Spoof**: Authenticated user with `email_verified: false` attempts to create `/users/{uid}`. -> `PERMISSION_DENIED`.
2. **PII Directory Enumeration**: Authenticated user attempts `list` on `/users`. -> `PERMISSION_DENIED`.
3. **Cross-User Profile Read**: User A attempts `get` on `/users/{userB}`. -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Profile**: User A creates `/users/{userA}` with an extra `isAdmin: true` ghost key. -> `PERMISSION_DENIED`.
5. **OwnerId Spoofing on Income Create**: User A attempts to create `/incomes/inc1` with `ownerId: "userB"`. -> `PERMISSION_DENIED`.
6. **Negative Financial Amount Poisoning**: User A attempts to create `/incomes/inc2` with `grossAmount: -5000`. -> `PERMISSION_DENIED`.
7. **Malicious Oversized ID Injection**: User A attempts to create `/incomes/<150-char-id>` or `/incomes/bad$id`. -> `PERMISSION_DENIED`.
8. **Client-Forged Timestamp**: User A creates `/workflows/wf1` with `createdAt: "2020-01-01T00:00:00Z"` instead of server `request.time`. -> `PERMISSION_DENIED`.
9. **Immutable OwnerId Mutation**: User A updates `/incomes/inc1` attempting to transfer `ownerId` to `"userB"`. -> `PERMISSION_DENIED`.
10. **Unconstrained List Scraping**: User A attempts `list` on `/incomes` without a matching `where('ownerId', '==', userA)` constraint (or reads documents belonging to User B). -> `PERMISSION_DENIED`.
11. **Invalid Enum / Value Poisoning on Update**: User A updates `/workflows/wf1` setting `status: "hacked_status"`. -> `PERMISSION_DENIED`.
12. **Notes String Exhaustion (DoW)**: User A updates `/incomes/inc1` with a 5,000-character `notes` string exceeding `maxLength: 400`. -> `PERMISSION_DENIED`.
