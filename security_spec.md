# Security Specification — BudgetPay

## Data Invariants
- **Identity Lock**: All data under `/users/{userId}` MUST have a `userId` field matching the `userId` in the path and `request.auth.uid`.
- **Relational Integrity**: Every transaction MUST reference a valid `categoryId` that exists within the user's own `categories` or `goals` collection.
- **Financial Integrity**: Transaction `amount` MUST be a non-zero number.
- **Temporal Integrity**: `createdAt` and `updatedAt` MUST match `request.time`. User-provided `date` MUST be a valid timestamp.
- **Schema Strictness**: All documents MUST strictly follow the defined schema with no "Shadow Fields" (Ghost fields like `isAdmin`).

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Creating a transaction with `userId: "target_uid"` while authenticated as `victim_uid`.
2. **Path Traversal / ID Poisoning**: Specifying a 1MB string or `/../` sequence as a `transactionId`.
3. **Shadow Update**: Attempting to add `{ "role": "admin" }` to the `UserProfile` document.
4. **Orphaned Transaction**: Creating a transaction with a `categoryId` that does not exist in the user's `categories` collection.
5. **Immutable Breach**: Attempting to update `createdAt` or `userId` on an existing transaction.
6. **Future Dating Abuse**: Setting a transaction `date` to a value in the year 2099.
7. **Cross-User Leak**: Authenticated user `A` attempting to `list` transactions for user `B`.
8. **Negative Budget**: Setting `monthlyBudget: -100` in the user profile.
9. **Spamming Categories**: Creating a category with a 50KB name string.
10. **State Corrupt**: Manually updating a transaction `amount` without providing the mandatory `updatedAt` server timestamp.
11. **PII Scraping**: Attempting to `get` the user profile of another user via their UID.
12. **Goal Hijack**: User `A` attempting to update `currentAmount` on user `B`'s `goal`.

## Test Scenarios (Logical Expectations)
- `REJECT`: `create` transaction where `amount` is not a number.
- `REJECT`: `update` category changing `userId`.
- `REJECT`: `create` user profile where `email` doesn't match `request.auth.token.email`.
- `ALLOW`: `list` user's own transactions where query is filtered by `userId == auth.uid`.

