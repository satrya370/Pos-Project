# Code Review — Phase 1 (1.1 - 1.3)

**Tanggal:** 2026-06-18  
**Status:** PASS  
**Reviewer:** AI Assistant

---

## Files yang Dibuat

| File | Lines | Status |
|------|-------|--------|
| `src/lib/prisma.ts` | 7 | ✅ |
| `src/lib/jwt.ts` | 17 | ✅ |
| `src/lib/errors.ts` | 33 | ✅ |
| `src/middlewares/auth.ts` | 25 | ✅ |
| `src/middlewares/validate.ts` | 17 | ✅ |
| `src/utils/format.ts` | 8 | ✅ |
| `src/utils/invoice.ts` | 16 | ✅ |
| `src/features/auth/auth.types.ts` | 17 | ✅ |
| `src/features/auth/auth.service.ts` | 33 | ✅ (refactored) |
| `src/features/auth/auth.controller.ts` | 25 | ✅ |
| `src/features/auth/auth.routes.ts` | 13 | ✅ |
| `src/index.ts` | 39 | ✅ |
| `prisma/seed.ts` | 50 | ✅ |

---

## Code Review Checklist (RULES.md)

| Rule | Status | Catatan |
|------|--------|---------|
| Max 300 baris/file | ✅ | Semua file < 50 baris |
| Max 20 baris/fungsi | ✅ | `login()` direfactored dari 25 → 14 baris |
| Max 3 parameter | ✅ | Tidak ada fungsi dengan > 2 parameter |
| Komentar hanya untuk non-obvious | ✅ | Tidak ada komentar berlebihan |
| No `any` | ✅ | |
| No redundant type annotation | ✅ | Pakai `z.infer` untuk inferred types |
| Early return | ✅ | Auth middleware pakai early return |
| Error handling | ✅ | Custom errors, tidak swallow |
| Naming convention | ✅ | camelCase functions, PascalCase types |
| No console.log (kecuali error) | ✅ | Hanya ada di error handler + seed |

---

## TypeScript Check

```
npx tsc --noEmit → CLEAN (0 errors)
```

---

## Manual Test Results

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Login success | 200 + token | 200 + token | ✅ |
| Login wrong password | 401 | 401 + error msg | ✅ |
| Login wrong email | 401 | 401 + error msg | ✅ |
| Get Me with token | 200 + owner | 200 + owner data | ✅ |
| Get Me no token | 401 | 401 + error msg | ✅ |
| Get Me invalid token | 401 | 401 + error msg | ✅ |

---

## Refactoring yang Dilakukan

1. **`auth.service.ts`**: `login()` function dipisah jadi `findOwnerByEmail()` + `verifyPassword()` + `login()` — setiap fungsi < 20 baris

---

## Database

- Migration: `20260618035112_init` — applied
- Unique constraints: Category(ownerId, name), Supplier(ownerId, name)
- Seed data: 1 owner, 3 categories, 4 products

---

## Jest Test Results

```
PASS src/features/auth/auth.test.ts
  Auth Service
    login
      ✓ should return token and owner data with valid credentials (161 ms)
      ✓ should throw UnauthorizedError with wrong password (60 ms)
      ✓ should throw UnauthorizedError with non-existent email (1 ms)
    getMe
      ✓ should return owner data with valid ownerId (1 ms)
      ✓ should throw NotFoundError with invalid ownerId (1 ms)
    JWT
      ✓ should sign and verify token correctly (1 ms)
      ✓ should throw on invalid token (2 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

---

## Kesimpulan

Phase 1 (1.1 - 1.7) **PASS**. Semua kode sesuai RULES.md, TypeScript clean, semua endpoint berfungsi, 7/7 tests pass.
