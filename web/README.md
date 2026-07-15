# SUPON Kielce — Platforma Obsługi Klienta

B2B-portal dla firmy SUPON Kielce — dostawcy odzieży i sprzętu BHP/ŚOI. Łączy
panel **adminowski** (pracownicy SUPON), **kliencki** (firmy-klienci) oraz
**deweloperski** (zarządzanie platformą).

Pełna dokumentacja architektury, modułów i modelu danych: **[PROJECT.md](PROJECT.md)**.

## Stack

Next.js 16 · React 19 · TypeScript · Prisma 7 · PostgreSQL (Supabase) ·
NextAuth v5 · Zod · Recharts · @react-pdf/renderer

## Szybki start

```bash
cd web
npm install

# Utwórz .env.local i uzupełnij zmienne — pełna lista w PROJECT.md
# (DATABASE_URL, SESSION_URL, AUTH_SECRET, NEXT_PUBLIC_SUPABASE_*, ...)

npm run db:generate          # klient Prisma
npm run db:push              # schemat → baza (dev)
npm run db:seed              # dane podstawowe

npm run dev                  # http://localhost:3000
```

## Migracje (produkcja)

`DATABASE_URL` używa PgBouncera (port 6543) bez obsługi DDL — migracje
uruchamiaj przez połączenie bezpośrednie (`SESSION_URL`, port 5432):

```bash
DATABASE_URL="$SESSION_URL" npx prisma migrate deploy
```

## Konta testowe (po seedzie)

| Rola | Email | Hasło |
|---|---|---|
| SUPON_ADMIN | `admin@suponkielce.pl` | `admin1234` |
| SUPON_DEV | `dev@suponkielce.pl` | `dev1234` |
| CLIENT_HEAD | `centralny@kghm-kielce.pl` | `client1234` |
| BRANCH_HEAD | `zaklad1@kghm-kielce.pl` | `branch1234` |
