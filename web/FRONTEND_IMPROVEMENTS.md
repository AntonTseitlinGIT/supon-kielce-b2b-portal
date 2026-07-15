# Plan ulepszeń frontendu — SUPON Kielce

Status bazowy: trzy portale (developer / admin / client) przeszły audyt a11y (ui-ux-pro-max). Build zielony. Ten dokument to plan dalszych prac — pogrupowany w fazy wg zależności i zwrotu z inwestycji.

Legenda nakładu: **S** = ~0.5 dnia · **M** = ~1–2 dni · **L** = ~3–5 dni.
Każdy punkt ma: cel → kroki → pliki → kryteria akceptacji.

---

## FAZA 0 — Fundament współdzielony (odblokowuje resztę)

Te trzy elementy są wykorzystywane przez kolejne fazy, więc robimy je najpierw.

### 0.1 — Hook `useModalA11y` (focus-trap + scroll-lock + return-focus)  · M · a11y #1
**Cel:** każda modal/sheet domyka pełny standard WCAG: pułapka fokusu, blokada scrolla tła, powrót fokusu na trigger, `aria-modal`.
**Kroki:**
1. `src/hooks/useModalA11y.ts` — przyjmuje `{ isOpen, onClose }`, zwraca `ref` na kontener; w środku: zapamiętanie `document.activeElement`, focus pierwszego elementu, trap na Tab/Shift+Tab, `Escape`, `overflow:hidden` na `body`, restore fokusu w cleanup.
2. Podłączyć do istniejących modali (Escape/overlay już są — hook je zastąpi spójnie).
**Pliki:** nowy hook + `OrdersListClient` (admin/client), `OrderActions` (WZ), `PersonnelList` (import/export), tracking-popup, lightbox.
**Akceptacja:** Tab nie wychodzi poza modal; po zamknięciu fokus wraca na przycisk; tło nie scrolluje; działa z czytnikiem ekranu.

### 0.2 — Komponent `<ConfirmDialog>` (zastępuje `window.confirm`)  · M · UX #5
**Cel:** ujednolicić potwierdzenia destrukcyjnych akcji; usunąć natywne `confirm()`.
**Kroki:**
1. `src/components/ConfirmDialog.tsx` na bazie `.modal-*` + `useModalA11y` (0.1). Props: `title, message, confirmLabel, variant: 'danger'|'default', onConfirm`.
2. Hook `useConfirm()` zwracający funkcję `confirm(opts): Promise<boolean>` (imperatywne API, by łatwo podmienić istniejące `if (confirm(...))`).
3. Podmienić wszystkie `window.confirm`.
**Pliki (znane wystąpienia `confirm()`):** `DeleteEmployeeButton`, `CloseTicketButton`, `OrderActions`, admin `OrderActions`, `OrdersListClient` (admin+client, potwierdzenia odbioru/paczek), `BranchForm` (usuń adres), `EmployeeForm`/`NewOrderForm`/`NewTicketForm` (guard niezapisanych zmian).
**Akceptacja:** brak `window.confirm` w `src/app`; dialog dostępny klawiaturą; danger-akcje czerwone i odseparowane.

### 0.3 — `<ToastProvider>` + `useToast()` (ujednolicony toast)  · M · UX #6
**Cel:** jeden system powiadomień zamiast inline-toastów per komponent; `aria-live`, auto-dismiss 3–5 s, brak kradzieży fokusu.
**Kroki:**
1. `src/components/ToastProvider.tsx` (context + portal, `role="status"`/`aria-live="polite"`, kolejka, auto-dismiss).
2. Zamontować w root `layout.tsx`.
3. Podmienić inline toast w `OrdersListClient` (client) i `alert()`-y informacyjne.
**Pliki:** root layout + `OrdersListClient`, miejsca z `alert("...sukces...")`.
**Akceptacja:** toast nie kradnie fokusu; znika sam; czytnik ekranu ogłasza treść; jeden wygląd wszędzie.

---

## FAZA 1 — Dostępność: domknięcie WCAG

### 1.1 — Skip-link „Przejdź do treści"  · S · a11y #2
**Kroki:** dodać `<a href="#main" class="skip-link">` na początku każdego shell-layoutu; `id="main"` na `<main>`; styl `.skip-link` w globals (widoczny tylko przy fokusie).
**Pliki:** `AdminSidebarLayout`, `DevSidebarLayout`, `PortalLayout`, `globals.css`.
**Akceptacja:** Tab z góry strony pokazuje link, Enter przeskakuje do treści.

### 1.2 — Stany ładowania ogłaszane  · S · a11y #3
**Kroki:** w `loading.tsx` (skeletony) dodać `role="status"` + `aria-busy="true"` + wizualnie ukryty tekst „Ładowanie…".
**Pliki:** wszystkie `*/loading.tsx` (admin/client) + `SkeletonLayouts.tsx`.
**Akceptacja:** czytnik ekranu mówi „Ładowanie" przy nawigacji.

### 1.3 — Recharts respektuje reduced-motion  · S · a11y #4
**Kroki:** hook `usePrefersReducedMotion()`; w `AdminDashboardCharts` i `ReportsDashboard` ustawić `isAnimationActive={!reduced}`.
**Pliki:** nowy hook + 2 pliki wykresów.
**Akceptacja:** przy włączonym reduced-motion wykresy renderują się bez animacji wejścia.

### 1.4 — Hierarchia nagłówków + heading audit  · S · a11y
**Kroki:** przegląd `h1→h6` per strona (część kart używa `<h3>`/`<h4>` bez `h1`/`h2` w kontekście). Ujednolicić.
**Akceptacja:** brak przeskoków poziomów; jeden `h1` na stronę.

---

## FAZA 2 — Czyszczenie i spójność design-systemu

### 2.1 — Sprzątanie `globals.css`  · M · DS #8
**Kroki:**
1. Usunąć zdublowane definicje `.btn` / `.btn-sm` / `.badge` (kaskada je rozwiązuje, ale to dług).
2. Usunąć martwe respozywne hacki `div[style*="gridTemplateColumns: ..."]` — **potwierdzono, że NIE działają** (React renderuje `grid-template-columns`, nie camelCase). Zastąpione już przez `.list-editor-grid` tam gdzie trzeba.
3. Przejrzeć `overflow-x:hidden` na `html,body` — może łamać `position:sticky`; rozważyć usunięcie lub przeniesienie na kontener.
**Pliki:** `globals.css`.
**Akceptacja:** brak duplikatów; build zielony; sticky navbar/sidebar działają; brak poziomego scrolla.

### 2.2 — Tokeny zamiast hardcode-hex  · M · DS #9 + perf #12
**Cel:** banery statusów zamówień i badge typów używają jasnych hexów (`#eff6ff`, `#fffbeb`, `#f3e8ff`, `#d97706`…) bez wariantów dark.
**Kroki:** zdefiniować semantyczne tokeny `--info-bg/--info-fg`, `--warn-bg/...`, `--success-bg/...`, `--exchange-*`, `--complaint-*` w `:root` i `[data-theme=dark]`; podmienić hexy.
**Pliki:** `globals.css` + `OrdersListClient` (×2), `AdminOrdersList`, badge typów zamówień/tickets.
**Akceptacja:** banery i badge czytelne w obu motywach (kontrast ≥4.5:1).

### 2.3 — Ekstrakcja powtarzalnych inline-stylów do klas  · L · DS #7
**Cel:** zredukować tysiące `style={{…}}`; spójność i mniejszy JS.
**Kandydaci (powtarzają się):** karta KPI (`.kpi-stat`), baner statusu (`.status-banner` + warianty), stepper zamówienia (`.order-stepper`), bąbelek czatu (`.chat-bubble`), nagłówek z ikoną+opisem (`.card-icon-head`).
**Podejście:** iteracyjnie, jedna grupa = jeden commit; zaczynać od najczęstszych.
**Akceptacja:** wizualnie bez zmian; mniej inline-stylów; build zielony.

---

## FAZA 3 — Wydajność

### 3.1 — `<img>` → `next/Image`  · M · perf #10
**Cel:** WebP/AVIF, lazy-load, brak CLS, mniej transferu (lint już ostrzega).
**Kroki:** zamienić `<img>` w: logo (sidebary/topbar), foto produktów (katalog, modale zamówień, wiersze), awatary, lightbox; ustawić `width/height` lub `fill` + `sizes`; skonfigurować `remotePatterns` (Supabase storage) w `next.config`.
**Pliki:** ~10 miejsc; `next.config.*`.
**Akceptacja:** brak `@next/next/no-img-element`; obrazy lazy; CLS < 0.1.

### 3.2 — Wirtualizacja długich tabel  · M · perf #11
**Cel:** płynny scroll przy 50+ wierszach (zamówienia, personel, użytkownicy).
**Kroki:** wprowadzić wirtualizację (np. `@tanstack/react-virtual`) na listach przekraczających próg; zachować dostępność tabeli (lub `role="grid"`).
**Pliki:** `AdminOrdersList`, `OrdersListClient`, `PersonnelList` (table mode), `UserManageClient`.
**Akceptacja:** stabilne FPS przy 500+ wierszach; brak utraty a11y.

---

## FAZA 4 — UX formularzy i interakcji

### 4.1 — Walidacja inline + focus na pierwsze błędne pole  · L · UX #13
**Cel:** zamiast jednego `errorMsg` u góry — błędy przy polach + auto-fokus (`focus-management`, `error-placement`).
**Kroki:** wzorzec stanu błędów per-pole (`Record<field, string>`); `aria-invalid` + `aria-describedby` na inputach; po submicie fokus na pierwszym błędnym; podsumowanie u góry z kotwicami (`error-summary`) dla długich formularzy.
**Pliki:** `NewOrderForm`, `NewTicketForm`, `EmployeeForm`, `BranchForm`, `SettingsClient`, `UserManageClient`, oba `CatalogClient`.
**Akceptacja:** błąd pokazany przy polu; pole oznaczone `aria-invalid`; fokus ląduje na pierwszym błędnym.

### 4.2 — Spójność przycisków filtrów  · S · UX #14
**Cel:** przycisk „Filtruj" w części filtrów nie wysyła nic (filtracja na `onChange`) — myli.
**Kroki:** zdecydować model (live-filter vs explicit) i ujednolicić; usunąć martwy przycisk albo podpiąć.
**Pliki:** `OrderFilters`, `AdminOrderFilters`, `TicketsFilterWrapper`, `AdminTicketFilters`, `PersonnelList`.
**Akceptacja:** zachowanie filtrów spójne i zgodne z etykietą przycisku.

---

## FAZA 5 — Dług techniczny (nie blokuje, ale rośnie)

### 5.1 — Typy `any` → konkretne  · M · #15
**Pliki (z lintu):** `catalog/actions.ts` (×4), realtime-payloady w czatach, filtry. Zamienić na typy Prisma/zod.

### 5.2 — `prefer-const`, nieużywane importy, `set-state-in-effect`  · S · #15
**Kroki:** przejść lint per-portal, naprawić ostrzeżenia. `set-state-in-effect` w layoutach — przepisać zamknięcie mobilnego menu na zdarzeniu nawigacji bez setState w efekcie (lub zaakceptować świadomie — wzorzec jest stabilny i nie blokuje builda).

### 5.3 — Lint jako bramka CI  · S
**Kroki:** po 5.1–5.2 włączyć `eslint` w pipeline (teraz błędy nie blokują builda). Zapobiega regresji.

---

## Kolejność rekomendowana

1. **FAZA 0** (0.1 → 0.2 → 0.3) — fundament, odblokowuje a11y/UX, usuwa natywne `confirm/alert`.
2. **FAZA 1** (1.1–1.4) — domknięcie WCAG, tanie i szybkie.
3. **FAZA 3.1** (`next/Image`) — wysoki zwrot wydajnościowy, niezależne.
4. **FAZA 2** (2.1 → 2.2 → 2.3) — porządek w DS; 2.2 wymagane do poprawnego dark-mode.
5. **FAZA 4** — UX formularzy.
6. **FAZA 5 + 3.2** — dług i wirtualizacja na końcu.

## Zasady wykonania
- Każdy punkt = osobny commit/PR; build (`npx next build`) zielony po każdym.
- Bez regresji wizualnej: zmiany DS sprawdzać w jasnym i ciemnym motywie, na 375 px i desktopie.
- Współdzielone elementy (hooki/komponenty z Fazy 0) wykorzystywać we wszystkich trzech portalach — zgodnie z zasadą „wspólne ustawienia dla wszystkich portali".
