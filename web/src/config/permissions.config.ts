import { Role } from "@prisma/client";

export type Permission =
  // Orders
  | "orders:read:own_branch"
  | "orders:read:all_client_branches"
  | "orders:read:all_clients"
  | "orders:create"
  | "orders:update_status"
  | "orders:cancel"
  // Personnel
  | "personnel:read:own_branch"
  | "personnel:read:all_client_branches"
  | "personnel:manage:own_branch"
  | "personnel:manage:all"
  // Tickets
  | "tickets:read:own_branch"
  | "tickets:create"
  | "tickets:reply:as_supon"
  | "tickets:assign"
  | "tickets:update_status"
  | "tickets:internal_notes"
  // Catalog
  | "catalog:read"
  | "catalog:manage"
  | "catalog:manage_client_assortment"
  // PPE Limits
  | "ppe_limits:read"
  | "ppe_limits:manage"
  // WZ Documents
  | "wz:read:own_branch"
  | "wz:read:all"
  | "wz:create"
  | "wz:generate_pdf"
  // Reports / Analytics
  | "reports:own_branch"
  | "reports:all_client_branches"
  | "reports:all_clients"
  // Client Management (SUPON only)
  | "clients:read"
  | "clients:manage"
  // User Management
  | "users:read:own_client"
  | "users:manage:own_client"
  | "users:manage:all"
  // Settings
  | "settings:read"
  | "settings:manage"
  | "feature_flags:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  BRANCH_HEAD: [
    "orders:read:own_branch",
    "orders:create",
    "personnel:read:own_branch",
    "personnel:manage:own_branch",
    "tickets:read:own_branch",
    "tickets:create",
    "catalog:read",
    "ppe_limits:read",
    "wz:read:own_branch",
    "reports:own_branch",
    "users:read:own_client",
  ],

  CLIENT_HEAD: [
    "orders:read:own_branch",
    "orders:read:all_client_branches",
    "orders:create",
    "personnel:read:own_branch",
    "personnel:read:all_client_branches",
    "personnel:manage:own_branch",
    "tickets:read:own_branch",
    "tickets:create",
    "catalog:read",
    "ppe_limits:read",
    "wz:read:own_branch",
    "wz:read:all",
    "reports:own_branch",
    "reports:all_client_branches",
    "users:read:own_client",
    "users:manage:own_client",
  ],

  SUPON_ADMIN: [
    "orders:read:own_branch",
    "orders:read:all_client_branches",
    "orders:read:all_clients",
    "orders:update_status",
    "orders:cancel",
    "personnel:read:own_branch",
    "personnel:read:all_client_branches",
    "personnel:manage:all",
    "tickets:read:own_branch",
    "tickets:reply:as_supon",
    "tickets:assign",
    "tickets:update_status",
    "tickets:internal_notes",
    "catalog:read",
    "catalog:manage_client_assortment",
    "ppe_limits:read",
    "ppe_limits:manage",
    "wz:read:own_branch",
    "wz:read:all",
    "wz:create",
    "wz:generate_pdf",
    "reports:own_branch",
    "reports:all_client_branches",
    "reports:all_clients",
    "clients:read",
    "clients:manage",
    "users:read:own_client",
    "users:manage:own_client",
    "settings:read",
  ],
  // SUPON_DEV inherits everything from SUPON_ADMIN plus system-level access
  SUPON_DEV: [
    "orders:read:own_branch",
    "orders:read:all_client_branches",
    "orders:read:all_clients",
    "orders:update_status",
    "orders:cancel",
    "personnel:read:own_branch",
    "personnel:read:all_client_branches",
    "personnel:manage:all",
    "tickets:read:own_branch",
    "tickets:reply:as_supon",
    "tickets:assign",
    "tickets:update_status",
    "tickets:internal_notes",
    "catalog:read",
    "catalog:manage",
    "catalog:manage_client_assortment",
    "ppe_limits:read",
    "ppe_limits:manage",
    "wz:read:own_branch",
    "wz:read:all",
    "wz:create",
    "wz:generate_pdf",
    "reports:own_branch",
    "reports:all_client_branches",
    "reports:all_clients",
    "clients:read",
    "clients:manage",
    "users:read:own_client",
    "users:manage:own_client",
    "users:manage:all",
    "settings:read",
    "settings:manage",
    "feature_flags:manage",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isClientRole(role: Role): boolean {
  return role === "BRANCH_HEAD" || role === "CLIENT_HEAD";
}

export function isSuponRole(role: Role): boolean {
  return role === "SUPON_ADMIN" || role === "SUPON_DEV";
}

export function getPortalPath(role: Role): string {
  if (role === "SUPON_DEV") return "/developer/dashboard";
  if (isSuponRole(role)) return "/admin/dashboard";
  return "/client/dashboard";
}
