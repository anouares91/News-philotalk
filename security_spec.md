# Security Specification & "Dirty Dozen" Hardening

## 1. Data Invariants

### User Profiles (`/users/{userId}`)
1. **Ownership Constraint:** A user document at `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. **Immutable Identity:** The `uid` field inside the document must match the document ID (`userId`) and the authenticated user's `uid`.
3. **No Impersonation:** Users cannot read or modify other users' profile documents.

### Dialogues (`/dialogues/{dialogueId}`)
1. **Author Integrity:** The `userId` field of a created dialogue must match `request.auth.uid`.
2. **Public vs Private Readability:** A dialogue can be read by anyone (authenticated or unauthenticated) if `isPublic == true`. Otherwise, only the owner (`request.auth.uid == userId`) may read or list it.
3. **Restricted Non-Owner Updates:** A non-owner may only update the `likes` field (for liking/unliking). All other fields (`userId`, `philosopher1`, `topic`, `dialogue`, `video_url`, etc.) can only be updated by the owner.
4. **Deletion Guard:** Only the dialogue owner may delete the dialogue document.

### Likes (`/likes/{likeId}`)
1. **Deterministic Path / ID Integrity:** Each like document ID MUST match `{userId}_{dialogueId}`.
2. **Author Matching:** The `userId` field in the document must match `request.auth.uid`.
3. **No Impersonation:** Users cannot create or delete likes on behalf of other users.

### Video Generations (`/generations/{generationId}`)
1. **Owner Exclusivity:** Generations are strictly private to the user who initiated them (`userId == request.auth.uid`).
2. **Schema Invariant:** Must contain valid `id`, `philosopher1`, `topic`, `status`, `createdAt`, and `userId`.

---

## 2. The "Dirty Dozen" Test Payloads (Designed to Fail with PERMISSION_DENIED)

1. **Payload 1: Unauthenticated User Read Attempt**
   - Operation: `GET /users/victim123`
   - Auth: Unauthenticated (`request.auth == null`)
   - Expected: `PERMISSION_DENIED`

2. **Payload 2: Cross-User Profile Read Attempt**
   - Operation: `GET /users/victim123`
   - Auth: `uid: attacker456`
   - Expected: `PERMISSION_DENIED`

3. **Payload 3: User Profile Impersonation on Create**
   - Operation: `CREATE /users/victim123`
   - Auth: `uid: attacker456`
   - Data: `{ uid: "victim123", displayName: "Impostor" }`
   - Expected: `PERMISSION_DENIED`

4. **Payload 4: User Profile UID Tampering on Create**
   - Operation: `CREATE /users/attacker456`
   - Auth: `uid: attacker456`
   - Data: `{ uid: "victim123", displayName: "Attacker" }`
   - Expected: `PERMISSION_DENIED`

5. **Payload 5: Unauthenticated Dialogue Creation**
   - Operation: `CREATE /dialogues/dial789`
   - Auth: Unauthenticated (`request.auth == null`)
   - Data: `{ userId: "user1", philosopher1: "Socrates", topic: "Virtue", video_url: "" }`
   - Expected: `PERMISSION_DENIED`

6. **Payload 6: Spoofed Dialogue Author on Create**
   - Operation: `CREATE /dialogues/dial789`
   - Auth: `uid: attacker456`
   - Data: `{ userId: "victim123", philosopher1: "Socrates", topic: "Virtue", video_url: "" }`
   - Expected: `PERMISSION_DENIED`

7. **Payload 7: Private Dialogue Read by Non-Owner**
   - Operation: `GET /dialogues/private_dial`
   - Target Doc: `{ userId: "user1", isPublic: false }`
   - Auth: `uid: user2`
   - Expected: `PERMISSION_DENIED`

8. **Payload 8: Unauthorized Field Mutation by Non-Owner**
   - Operation: `UPDATE /dialogues/dial789`
   - Target Doc: `{ userId: "owner123", topic: "Original", isPublic: true, likes: 5 }`
   - Auth: `uid: attacker456`
   - Data: `{ topic: "Hacked Topic" }`
   - Expected: `PERMISSION_DENIED`

9. **Payload 9: Deletion of Other User's Dialogue**
   - Operation: `DELETE /dialogues/dial789`
   - Target Doc: `{ userId: "owner123" }`
   - Auth: `uid: attacker456`
   - Expected: `PERMISSION_DENIED`

10. **Payload 10: Like Spoofing for Another User**
    - Operation: `CREATE /likes/victim123_dial789`
    - Auth: `uid: attacker456`
    - Data: `{ userId: "victim123", dialogueId: "dial789" }`
    - Expected: `PERMISSION_DENIED`

11. **Payload 11: Like ID Mismatch on Create**
    - Operation: `CREATE /likes/attacker456_fakeId`
    - Auth: `uid: attacker456`
    - Data: `{ userId: "attacker456", dialogueId: "dial789" }`
    - Expected: `PERMISSION_DENIED`

12. **Payload 12: Unauthorized Read of Another User's Video Generation**
    - Operation: `GET /generations/gen123`
    - Target Doc: `{ userId: "victim123", status: "completed" }`
    - Auth: `uid: attacker456`
    - Expected: `PERMISSION_DENIED`
