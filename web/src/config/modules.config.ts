export interface ModuleDef {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  icon: string;
  /** If false, this module is core and cannot be disabled */
  optional?: boolean;
}

export interface ClientModules {
  orders: boolean;
  personnel: boolean;
  tickets: boolean;
  documents: boolean;
  branches: boolean;
  catalog: boolean;
  reports: boolean;
  [key: string]: boolean;
}

export interface ClientLimits {
  maxUsers: number;
  maxBranches: number;
}

export const DEFAULT_MODULES: ClientModules = {
  orders: true,
  personnel: true,
  tickets: true,
  documents: true,
  branches: true,
  catalog: false,
  reports: false,
};

export const DEFAULT_LIMITS: ClientLimits = {
  maxUsers: 50,
  maxBranches: 10,
};

export const MODULES: ModuleDef[] = [
  {
    key: "orders",
    label: "Zamówienia",
    description: "Składanie i śledzenie zamówień odzieży roboczej i ŚOI",
    defaultEnabled: true,
    icon: "shopping-bag",
    optional: false,
  },
  {
    key: "personnel",
    label: "Personel",
    description: "Zarządzanie kartami pracowników, rozmiarami i przydziałami odzieży",
    defaultEnabled: true,
    icon: "users",
    optional: true,
  },
  {
    key: "tickets",
    label: "Zgłoszenia i Reklamacje",
    description: "Reklamacje, prośby o wymianę i wiadomości do opiekuna",
    defaultEnabled: true,
    icon: "message-circle",
    optional: true,
  },
  {
    key: "documents",
    label: "Dokumenty WZ",
    description: "Pobieranie dokumentów wydania zewnętrznego dla zrealizowanych dostaw",
    defaultEnabled: true,
    icon: "file-text",
    optional: true,
  },
  {
    key: "branches",
    label: "Oddziały i Adresy",
    description: "Zarządzanie oddziałami firmy i adresami dostaw",
    defaultEnabled: true,
    icon: "building",
    optional: true,
  },
  {
    key: "catalog",
    label: "Katalog produktów",
    description: "Przeglądanie katalogu ŚOI i odzieży roboczej uzgodnionych dla klienta",
    defaultEnabled: false,
    icon: "package",
    optional: true,
  },
  {
    key: "reports",
    label: "Raporty i Analizy",
    description: "Statystyki finansowe, statusy zamówień i zużycie asortymentu",
    defaultEnabled: false,
    icon: "bar-chart-2",
    optional: true,
  },
];

export function resolveModules(raw: unknown): ClientModules {
  const base = { ...DEFAULT_MODULES };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const key of Object.keys(base)) {
      const val = (raw as Record<string, unknown>)[key];
      if (typeof val === "boolean") base[key] = val;
    }
  }
  return base;
}

export function resolveLimits(raw: unknown): ClientLimits {
  const base = { ...DEFAULT_LIMITS };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    if (typeof r.maxUsers === "number") base.maxUsers = r.maxUsers;
    if (typeof r.maxBranches === "number") base.maxBranches = r.maxBranches;
  }
  return base;
}
