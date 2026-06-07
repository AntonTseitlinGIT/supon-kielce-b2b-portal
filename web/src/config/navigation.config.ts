import { Role } from "@prisma/client";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // icon name
  roles: Role[];
  badge?: string; // optional badge key for dynamic counts
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
  },
  {
    label: "Personel",
    href: "/client/personnel",
    icon: "users",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
  },
  {
    label: "Zgłoszenia",
    href: "/client/tickets",
    icon: "message-circle",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
    badge: "active_tickets",
  },
  {
    label: "Dokumenty WZ",
    href: "/client/documents",
    icon: "file-text",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
  },
  {
    label: "Oddziały i Adresy",
    href: "/client/branches",
    icon: "building",
    roles: ["BRANCH_HEAD", "CLIENT_HEAD"],
  },
];

export const ADMIN_NAV: NavItem[] = [
  {
    label: "Pulpit",
    href: "/admin/dashboard",
    icon: "layout-dashboard",
    roles: ["SUPON_MANAGER", "SUPON_ADMIN"],
  },
  {
    label: "Zamówienia",
    href: "/admin/orders",
    icon: "shopping-bag",
    roles: ["SUPON_MANAGER", "SUPON_ADMIN"],
    badge: "pending_orders",
  },
  {
    label: "Zgłoszenia",
    href: "/admin/tickets",
    icon: "message-circle",
    roles: ["SUPON_MANAGER", "SUPON_ADMIN"],
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
    label: "Ustawienia",
    href: "/admin/settings",
    icon: "settings",
    roles: ["SUPON_ADMIN"],
  },
];
