# SUPON Kielce — Platforma Obsługi Klienta

B2B-portal dla firmy SUPON Kielce — dostawcy odzieży i sprzętu BHP/ŚOI. Platforma łączy dwa panele: **adminowski** (dla pracowników SUPON) i **kliencki** (dla firm-klientów).

---

## Stack techniczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| ORM / DB | Prisma 7, PostgreSQL (Supabase) |
| Auth | NextAuth v5 (beta), JWT sessions, bcryptjs |
| UI | CSS custom properties, Lucide React, Recharts |
| PDF | @react-pdf/renderer |
| Excel | xlsx |
| Dev tools | ESLint, tsx, ts-node |

Konfiguracja bazy: `web/prisma/schema.prisma`  
Klient Prisma (singleton): `web/src/lib/db.ts`  
Auth: `web/src/lib/auth.ts`

---

## Struktura katalogów

```
web/src/
├── app/
│   ├── (admin)/admin/       # Panel SUPON
│   ├── (client)/client/     # Panel klienta
│   ├── (auth)/login/        # Strona logowania
│   ├── actions/             # Server Actions (notifications, search)
│   └── api/                 # API Routes
├── components/              # Współdzielone komponenty
├── config/
│   └── permissions.config.ts  # System uprawnień wg ról
├── lib/
│   ├── auth.ts
│   └── db.ts
├── types/                   # Rozszerzenia next-auth typów
└── utils/                   # Helpers (format, daty itd.)
```

---

## Role i uprawnienia

Plik: [src/config/permissions.config.ts](src/config/permissions.config.ts)

| Rola | Portal | Opis |
|---|---|---|
| `BRANCH_HEAD` | `/client` | Kierownik oddziału — widzi tylko swój oddział |
| `CLIENT_HEAD` | `/client` | Kierownik firmy-klienta — widzi wszystkie oddziały |
| `SUPON_MANAGER` | `/admin` | Pracownik SUPON — obsługa zamówień i zgłoszeń |
| `SUPON_ADMIN` | `/admin` | Admin SUPON — pełny dostęp, zarządzanie katalogiem i klientami |

Helpery: `hasPermission(role, permission)`, `isClientRole(role)`, `isSuponRole(role)`, `getPortalPath(role)`

Po zalogowaniu użytkownik jest automatycznie przekierowany do właściwego portalu.

---

## Moduły aplikacji

### Panel adminowski `/admin`

| Ścieżka | Opis |
|---|---|
| `/admin/dashboard` | KPI (klienci, zamówienia, zgłoszenia, katalog), wykresy Recharts, ostatnia aktywność |
| `/admin/clients` | Lista klientów; `/admin/clients/[id]` — szczegóły klienta |
| `/admin/orders` | Lista wszystkich zamówień z filtrami; `/admin/orders/[id]` — szczegóły i zmiana statusu |
| `/admin/tickets` | Lista zgłoszeń z filtrami; `/admin/tickets/[id]` — wątek + notatki wewnętrzne |
| `/admin/catalog` | Zarządzanie produktami BHP/ŚOI |
| `/admin/settings` | Ustawienia systemu, feature flags |

### Panel kliencki `/client`

| Ścieżka | Opis |
|---|---|
| `/client/dashboard` | Widok ogólny dla zalogowanego klienta |
| `/client/orders` | Zamówienia klienta; `/client/orders/new` — nowe zamówienie; `/client/orders/[id]` — szczegóły |
| `/client/personnel` | Lista pracowników oddziału; CRUD pracownika + rozmiary ŚOI |
| `/client/tickets` | Zgłoszenia (reklamacje, wymiany, ogólne); `/client/tickets/new` — nowe zgłoszenie |
| `/client/branches` | Oddziały firmy-klienta |
| `/client/catalog` | Katalog dostępnych produktów (przypisany do klienta) |
| `/client/documents` | Dokumenty WZ; `/client/documents/[id]` — szczegóły WZ |
| `/client/reports` | Raporty i analityka (z eksportem PDF) |

---

## Model danych (kluczowe encje)

```
Client (firma-klient)
  └── Branch[] (oddziały)
        └── Employee[] (pracownicy z rozmiarami ŚOI)
        └── Order[] (zamówienia)
        └── Ticket[] (zgłoszenia)

Product (katalog BHP/ŚOI)
  └── PpeCategory (kategoria)
  └── ClientProduct (M2M z niestandardową ceną per klient)

Order
  └── OrderItem[] (pozycje: artykuł, rozmiar, ilość, pracownik)
  └── Delivery[] (wysyłki z numerem trackingu)
  └── WzDocument[] (dokumenty WZ)

Ticket (typ: COMPLAINT | EXCHANGE | GENERAL)
  └── TicketMessage[] (wiadomości klient↔SUPON)
  └── InternalNote[] (notatki widoczne tylko dla SUPON)

PpeLimit (limit ŚOI per klient per kategoria per okres)
  └── PpeLimitUsage (zużycie per pracownik)
```

### Statusy zamówień
`DRAFT → IN_PROGRESS → PARTIALLY_SENT / SENT → DELIVERED / APPROVED / CANCELLED`

### Statusy zgłoszeń
`NEW → IN_PROGRESS → RESOLVED → CLOSED`

---

## API Routes

| Endpoint | Opis |
|---|---|
| `POST /api/auth/[...nextauth]` | NextAuth handler |
| `POST /api/client/orders/action` | Akcje na zamówieniu (zmiana statusu ze strony klienta) |
| `GET /api/client/reports/pdf` | Generowanie PDF raportu przez @react-pdf/renderer |

---

## Współdzielone komponenty

| Komponent | Opis |
|---|---|
| `PortalLayout` | Sidebar + header wspólny dla obu portali |
| `GlobalSearchModal` | Globalne wyszukiwanie (Server Action w `actions/search.ts`) |
| `NotificationBell` | Powiadomienia w czasie rzeczywistym (`actions/notifications.ts`) |
| `PrintButton` | Drukowanie/zapis do PDF widoku |

---

## Uruchamianie i baza danych

```bash
# Instalacja zależności
cd web && npm install

# Generowanie klienta Prisma
npm run db:generate

# Synchronizacja schematu z bazą (dev)
npm run db:push

# Seed podstawowych danych
npm run db:seed

# Seed danych demonstracyjnych (zamówienia)
npm run db:seed-demo

# Prisma Studio (GUI bazy)
npm run db:studio

# Dev server (http://localhost:3000)
npm run dev
```

Zmienne środowiskowe wymagane w `.env`:
- `DATABASE_URL` — connection string PostgreSQL
- `AUTH_SECRET` — sekret dla NextAuth (min. 32 znaki)

---

## Konwencje numerowania

| Typ | Format | Przykład |
|---|---|---|
| Zamówienie | `Z-YYYY-NNNN` | `Z-2025-1195` |
| Zgłoszenie | `SRV-YYYY-NNNN` | `SRV-2025-0145` |
| Dokument WZ | `WZ-YYYY-MM-NNN` | `WZ-2025-08-044` |
| Dostawa | `DEL-NNNNN` | `DEL-99401` |
| Pracownik | `NP-NNNN` | `NP-0001` |
