<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Konwencje projektu (SUPON Kielce)

Pełny opis: [PROJECT.md](PROJECT.md). Kluczowe zasady, których trzymaj się przy zmianach:

- **Soft-delete:** `Employee` i `Order` mają `deletedAt`. Usuwanie = ustawienie znacznika, nie `delete()`. Każde zapytanie listujące/zliczające musi filtrować `deletedAt: null` (również w `_count`, np. `employees: { where: { deletedAt: null } }`).
- **Numery dokumentów:** NIE używaj `count()` do generowania numerów. Użyj `nextSequence(tx, key)` z `src/lib/sequences.ts` wewnątrz transakcji (klucze: `order`, `wz`, `delivery`, `ticket`).
- **Walidacja Server Actions:** dane wejściowe od klienta waliduj schematem Zod z `src/lib/schemas.ts` (`safeParse` + `firstError`) zanim dotkniesz bazy. Autoryzacja (rola/własność) zostaje w akcji.
- **Powiadomienia:** używaj helperów z `src/lib/notifications.ts` (`notifyUsers`, `notifyClientUsers`, `notifySuponUsers`), nie powielaj inline.
- **Migracje:** `DATABASE_URL` to PgBouncer (6543, bez DDL). Migracje stosuj przez `DATABASE_URL="$SESSION_URL" npx prisma migrate deploy`. Indeksy partial (`WHERE`) pisz ręcznie w pliku migracji — Prisma ich nie wyraża w schemacie.
- **Role:** `BRANCH_HEAD`, `CLIENT_HEAD`, `SUPON_ADMIN`, `SUPON_DEV` (brak `SUPON_MANAGER`). Sprawdzaj przez helpery z `src/config/permissions.config.ts`.
