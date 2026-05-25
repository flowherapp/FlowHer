# Security Specification and Audit Matrix

## 1. Data Invariants
- **Identity Isolation**: A user's dataset (`/users/{userId}`) and all nested subcollections are strictly isolated. No regular authenticated user may view or modify another user's workspace documents under any circumstance.
- **Strict Schema Enforcement**: All write payloads to endpoints must conform exactly to specified field keys, values, and boundary restrictions. No unrecognized fields (Ghost Fields) can be stored.
- **Identity Consistency**: Document owners cannot update references to impersonate another UID.
- **Verification Rule**: All operations require an authenticated user with a verified email address (`email_verified == true`).

---

## 2. The "Dirty Dozen" (Malicious Payloads)

### User Profile Payloads
1. **P1: Spoofing Admin Identity via Profile Key**
   - *Payload*: `update /users/{userId} { "isAdmin": true, "email": "s.strain04@gmail.com" }`
   - *Result*: `PERMISSION_DENIED` (No permission to create self-appointed permissions).
2. **P2: Shadow Update with Ghost Fields**
   - *Payload*: `update /users/{userId} { "username": "Admin", "ghost_verified": true }`
   - *Result*: `PERMISSION_DENIED` (Strict schema verification blocks unapproved keys).
3. **P3: Injecting Oversized Bio Data (Resource Poisoning)**
   - *Payload*: `update /users/{userId} { "profileBio": "[10MB String...]" }`
   - *Result*: `PERMISSION_DENIED` (Length verification restricts bio to <= 1000 chars).

### Win Journal Payloads
4. **P4: Impersonating User UID on Wins Creation**
   - *Payload*: `create /users/{anotherUserId}/wins/win123 { "id": "win123", "text": "Won a contract", "category": "Professional", "date": "May 25", "ownerId": "anotherUserId" }`
   - *Result*: `PERMISSION_DENIED` (The route constraint `{userId}` must match `request.auth.uid`).
5. **P5: Setting Invalid Category (Type/Value Poisoning)**
   - *Payload*: `create /users/{userId}/wins/win123 { "id": "win123", "text": "Valid Text", "category": false, "date": "May 25" }`
   - *Result*: `PERMISSION_DENIED` (Category must be a string and part of an approved list).
6. **P6: Bypassing ID Format Validation**
   - *Payload*: `create /users/{userId}/wins/win_%$123-POISONED { "id": "win_%$123-POISONED", "text": "Bypass!", "category": "Professional", "date": "May 25" }`
   - *Result*: `PERMISSION_DENIED` (Document ID must match alphanumeric regex `^[a-zA-Z0-9_\-]+$`).

### Time Blindness Corrector Payloads
7. **P7: Negative Ratio/Duration Values**
   - *Payload*: `create /users/{userId}/tbcHistory/tbc123 { "id": "tbc123", "task": "Write Code", "estimated": -120, "actual": 30, "date": "May 25", "ratio": -4.0 }`
   - *Result*: `PERMISSION_DENIED` (No negative metrics are acceptable).
8. **P8: Modifying Read-Only Historical Logs**
   - *Payload*: `update /users/{userId}/tbcHistory/tbc123 { "estimated": 50, "actual": 20 }`
   - *Result*: `PERMISSION_DENIED` (TBC logs are immutable once written).

### Masking Debt tracking Payloads
9. **P9: Oversized Types Array Array Injection**
   - *Payload*: `create /users/{userId}/maskMoments/m1 { "id": "m1", "types": ["[100 strings...]"], "intensity": 5, "cost": 10, "date": "May 25" }`
   - *Result*: `PERMISSION_DENIED` (Array must be bounded `size() <= 10`).
10. **P10: Elevating Intensity Beyond Constraints**
    - *Payload*: `create /users/{userId}/maskMoments/m1 { "id": "m1", "types": ["sensory"], "intensity": 9999, "cost": 10, "date": "May 25" }`
    - *Result*: `PERMISSION_DENIED` (Intensity bound: `1 <= intensity <= 10`).

### Preset/Signposts Custom Templates Payloads
11. **P11: Bulk Writing Malicious Signatures**
    - *Payload*: `create /users/{userId}/customSignatures/sig1 { "id": "sig1", "label": "Dangerous Label", "text": "[Huge 1MB script payload]" }`
    - *Result*: `PERMISSION_DENIED` (Strict size restrictions prohibit strings longer than 1000 characters).
12. **P12: Stealing Configuration Files**
    - *Payload*: `get /users/{anotherUserId}/customEmailPresets/preset1`
    - *Result*: `PERMISSION_DENIED` (No global list/get reads allowed for non-proprietors).
