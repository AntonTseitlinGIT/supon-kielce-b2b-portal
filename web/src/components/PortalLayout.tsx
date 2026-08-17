"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut, Search, Menu, X,
  LayoutDashboard, ShoppingBag, MessageCircle, Building2, Package,
  BarChart2, UserCog, Settings, Users, FileText, Building, ChevronRight
} from "lucide-react";
import { Role } from "@prisma/client";
import { NavItem } from "@/config/navigation.config";
import NotificationBell from "./NotificationBell";
import GlobalSearchModal from "./GlobalSearchModal";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  "layout-dashboard": LayoutDashboard,
  "shopping-bag": ShoppingBag,
  "message-circle": MessageCircle,
  "building-2": Building2,
  "package": Package,
  "bar-chart-2": BarChart2,
  "user-cog": UserCog,
  "settings": Settings,
  "users": Users,
  "file-text": FileText,
  "building": Building,
};

const ROLE_LABELS: Record<Role, string> = {
  BRANCH_HEAD: "Kierownik Oddziału",
  CLIENT_HEAD: "Dyrektor Centrali",
  SUPON_ADMIN: "Administrator SUPON",
};

interface PortalLayoutProps {
  navItems: NavItem[];
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    branchName?: string | null;
    clientName?: string | null;
  };
  portalType: "client" | "admin" | "developer";
  children: React.ReactNode;
}

export default function PortalLayout({ navItems, user, portalType, children }: PortalLayoutProps) {
  const pathname = usePathname() || "";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const checkActive = (href: string) =>
    pathname === href || (href !== "/client/dashboard" && href !== "/admin/dashboard" && pathname.startsWith(href));

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const subtitleLabel = user.clientName || user.branchName || (portalType === "admin" ? "SUPON Kielce" : "Portal");

  return (
    <div className="admin-shell">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <Link href="/" className="sidebar-logo-link" aria-label="SUPON Kielce">
            <img src="/logo.png" alt="Logo" className="sidebar-logo" style={{ height: "24px" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="sidebar-brand-name">SUPON Kielce</span>
              <span style={{ fontSize: "10px", color: "rgba(248,250,252,0.45)", fontWeight: 600, letterSpacing: "0.5px" }}>
                {portalType === "admin" ? "PANEL ADMINA" : "PORTAL KLIENTA"}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="mobile-menu-close"
            style={{
              display: "none",
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav" aria-label="Nawigacja boczna">
          {navItems.map((item) => {
            const isActive = checkActive(item.href);
            const Icon = ICON_MAP[item.icon];
            return (
              <Link
                key={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                {Icon && <Icon size={18} style={{ flexShrink: 0 }} />}
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={14} style={{ opacity: 0.7 }} />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="sidebar-footer">
          <Link
            href={portalType === "admin" ? "/admin/profile" : "/client/profile"}
            className="sidebar-user"
            title={`Edytuj profil: ${user.name} (${roleLabel})`}
            style={{ textDecoration: "none" }}
          >
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{subtitleLabel}</span>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={`Wyloguj się (${user.email})`}
            aria-label="Wyloguj się"
            className="sidebar-logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Right Main Column */}
      <div className="admin-main">
        {/* Top Header Bar */}
        <header
          style={{
            height: "56px",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            background: "var(--card-bg, #ffffff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Otwórz меню"
            style={{
              display: "none",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text)",
              padding: "6px",
            }}
            className="mobile-hamburger-btn"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb / Title subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--muted)" }}>
            <span style={{ fontWeight: 600, color: "var(--text)" }}>
              {portalType === "admin" ? "Panel Administracyjny" : "Portal Klienta B2B"}
            </span>
            <span>/</span>
            <span>{subtitleLabel}</span>
          </div>

          {/* Header Action Items */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="nav-search-btn"
              title="Szukaj (⌘K)"
              style={{
                height: "36px",
                padding: "0 12px",
                borderRadius: "10px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--page-bg, #f8fafc)",
                border: "1px solid var(--line, #e2e8f0)",
                color: "var(--muted)",
                cursor: "pointer",
              }}
            >
              <Search size={14} />
              <span className="nav-search-text">Szukaj...</span>
              <kbd
                style={{
                  fontSize: "10px",
                  padding: "2px 5px",
                  borderRadius: "4px",
                  background: "var(--card-bg)",
                  border: "1px solid var(--line)",
                  fontFamily: "monospace",
                }}
              >
                ⌘K
              </kbd>
            </button>

            <NotificationBell userId={user.id} />
          </div>
        </header>

        {/* Page Body Content */}
        <main
          style={{
            flex: 1,
            padding: "24px",
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>

        {/* Footer */}
        <footer
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--line, #e2e8f0)",
            fontSize: "12px",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          © 2026 SUPON Kielce S.A. — Platforma Obsługi Klienta B2B
        </footer>
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        scope={portalType === "developer" ? "admin" : portalType}
      />
    </div>
  );
}
