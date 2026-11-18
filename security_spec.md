# GoToLive Stream Security Specification

## 1. Data Invariants
1. **Identity & RBAC Isolation**: Users cannot self-assign `role: 'admin'` in `users/{userId}` or create records in `admins/{userId}` unless they are the verified bootstrapped admin (`rituparno.tnts@gmail.com` with `email_verified == true`) or already exist in `admins/{uid}`.
2. **PII Isolation**: `users/{userId}` and `contactSubmissions/{submissionId}` contain email/phone PII. `users/{userId}` may only be read by `isOwner(userId) || isAdmin()`. `contactSubmissions` may only be read, updated, or deleted by `isAdmin()`; public create is strictly validated and forced to `status: 'new'`.
3. **Stream & Chat Relational Integrity**: A chat message in `streams/{streamId}/chat/{messageId}` cannot exist without its parent `streams/{streamId}` document existing (`exists(...)`), and `incoming().streamId == streamId` and `incoming().authorUid == request.auth.uid`.
4. **Immutable Ownership & Temporal Integrity**: `createdAt` must equal `request.time` on creation and never change on update. `updatedAt` must equal `request.time` on creation and update. `ownerUid` / `uid` / `authorUid` cannot be spoofed or reassigned on update.
5. **Strict Key & Size Enforcement**: Every collection enforces `keys().hasAll(...)` and `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, `isValidId()` on document IDs, and `.size()` limits on all strings and bounded arrays.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Self-Admin Escalation on User Create**: Unprivileged user writes `{ uid: auth.uid, role: 'admin', ... }` to `/users/{uid}`.
2. **Role Escalation on User Update**: Existing user updates `{ role: 'admin' }` on `/users/{uid}`.
3. **Unverified Email Admin Spoof**: Token with `email: 'rituparno.tnts@gmail.com'` and `email_verified: false` writes to `/siteSettings/homepage`.
4. **Shadow Field Injection on Stream Create**: Creator sends valid stream payload plus `{ shadowVerified: true }` to `/streams/{id}`.
5. **Owner Spoofing on Stream Create**: User creates `/streams/{id}` with `ownerUid: 'other-user-uid'`.
6. **PII Blanket Read on Users**: Authenticated non-admin user runs `get` or `list` on `/users/other-uid` or `/users`.
7. **PII Read on Contact Submissions**: Non-admin user attempts `get` or `list` on `/contactSubmissions`.
8. **Forged Contact Status on Submit**: Public visitor submits contact form with `status: 'resolved'` instead of `'new'`.
9. **Orphaned Chat Message**: User creates message under `/streams/nonexistent-stream/chat/msg1`.
10. **Chat Author Spoofing**: User posts chat message with `authorUid: 'someone-else'`.
11. **Resource Exhaustion / ID Poisoning**: User creates document with 200-char ID or 5000-char title string.
12. **Client Timestamp Forgery**: User submits `createdAt: '2020-01-01'` or mismatched timestamp instead of `serverTimestamp()`.
