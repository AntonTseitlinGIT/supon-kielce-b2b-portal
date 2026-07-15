import { Role } from "@prisma/client";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
  badge?: string;
  moduleKey?: string; // key in ClientConfig.modules — if set, item is hidden when module is disabled
}

export const CLIENT_NAV: NavItem[] = [
  {
    label: "Pulpit",
    href: "/client/dashboard",
    icon: "layout-dashboard",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
  },
  {
    label: "Zamówienia",
    href: "/client/orders",
    icon: "shopping-bag",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
    badge: "pending_orders",
    moduleKey: "orders",
  },
  {
    label: "Personel",
    href: "/client/personnel",
    icon: "users",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
    moduleKey: "personnel",
  },
  {
    label: "Zgłoszenia",
    href: "/client/tickets",
    icon: "message-circle",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
    badge: "active_tickets",
    moduleKey: "tickets",
  },
  {
    label: "Dokumenty WZ",
    href: "/client/documents",
    icon: "file-text",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
    moduleKey: "documents",
  },
  {
    label: "Oddziały i Adresy",
    href: "/client/branches",
    icon: "building",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
    moduleKey: "branches",
  },
  {
    label: "Katalog",
    href: "/client/catalog",
    icon: "package",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
    moduleKey: "catalog",
  },
  {
    label: "Raporty",
    href: "/client/reports",
    icon: "bar-chart-2",
    roles: ["CLIENT_HEAD"],
    moduleKey: "reports",
  },
];

export const ADMIN_NAV: NavItem[] = [
  {
    label: "Pulpit",
    href: "/admin/dashboard",
    icon: "layout-dashboard",
    roles: ["SUPON_ADMIN"],
  },
  {
    label: "Zamówienia",
    href: "/admin/orders",
    icon: "shopping-bag",
    roles: ["SUPON_ADMIN"],
    badge: "pending_orders",
  },
  {
    label: "Zgłoszenia",
    href: "/admin/tickets",
    icon: "message-circle",
    roles: ["SUPON_ADMIN"],
    badge: "open_tickets",
  },
  {
    label: "Klienci",
    href: "/admin/clients",
    icon: "building-2",
    roles: ["SUPON_ADMIN"],
  },
  {
    label: "Katalog",
    href: "/admin/catalog",
    icon: "package",
    roles: ["SUPON_ADMIN"],
  },
  {
    label: "Raporty",
    href: "/admin/reports",
    icon: "bar-chart-2",
    roles: ["SUPON_ADMIN"],
  },
  {
    label: "Użytkownicy",
    href: "/admin/users",
    icon: "user-cog",
    roles: ["SUPON_ADMIN"],
  },
  {
    label: "Ustawienia",
    href: "/admin/settings",
    icon: "settings",
    roles: ["SUPON_ADMIN"],
  },
];
