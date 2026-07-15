# Platforma — SUPON Kielce

A B2B customer portal for **SUPON Kielce**, a supplier of workwear and PPE (BHP/ŚOI) equipment. Connects three roles: SUPON's own admin/dev staff and their client companies' branch managers.

This repository has two parts:

- **`web/`** — the actual application: Next.js 16 + TypeScript + Prisma 7 + PostgreSQL (Supabase), NextAuth v5. Full architecture, data model, and setup instructions: [`web/PROJECT.md`](web/PROJECT.md) and [`web/README.md`](web/README.md).
- **`demo/`** — a static HTML/CSS/JS mockup of the client-facing screens (login, dashboard, orders, employee cards, delivery notes), used for early UI iteration ahead of the real implementation.

## Quick start

```bash
cd web
npm install
# create .env.local with DATABASE_URL, AUTH_SECRET, Supabase keys — see PROJECT.md for the full list
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

See [`web/PROJECT.md`](web/PROJECT.md) for the full environment variable list, data model, and role/permission system.
