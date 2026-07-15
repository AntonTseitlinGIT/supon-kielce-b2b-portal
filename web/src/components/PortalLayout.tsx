"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut, Search,
  LayoutDashboard, ShoppingBag, MessageCircle, Building2, Package,
  BarChart2, UserCog, Settings, Users, FileText, Building,
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
  portalType: "client" | "admin";
  children: React.ReactNode;
}

export default function PortalLayout({ navItems, user, portalType, children }: PortalLayoutProps) {
  const pathname = usePathname() || "";
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const checkActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const initials = user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <div className="portal-shell">

      <nav className="topbar" aria-label="Główna nawigacja">
        <div className="container">

          {/* Brand */}
          <Link href="/" className="brand" aria-label="SUPON Kielce">
            <img src="/logo.png" alt="" className="brand-logo" />
            <span className="brand-name">SUPON Kielce</span>
          </Link>

          {/* Nav links with icons */}
          <ul className="nav-list" role="list">
            {navItems.map((item) => {
              const isActive = checkActive(item.href);
              const Icon = ICON_MAP[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    className={`nav-link ${isActive ? "active" : ""}`}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {Icon && <Icon size={15} style={{ flexShrink: 0 }} />}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="nav-search-btn"
              title="Szukaj (⌘K)"
            >
              <Search size={13} className="nav-search-icon" />
              <span className="nav-search-text">Szukaj...</span>
              <kbd className="nav-search-kbd">⌘K</kbd>
            </button>

            <NotificationBell userId={user.id} />

            <div className="nav-avatar" title={`${user.name} · ${roleLabel}`}>
              {initials}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title={`Wyloguj się (${user.email})`}
              aria-label="Wyloguj się"
              className="nav-logout-btn"
            >
              <LogOut size={15} />
            </button>
          </div>

        </div>
      </nav>

      <main className="page-main">
        <div className="container page-main-inner">
          {children}
        </div>
      </main>

      <footer className="page-footer" role="contentinfo">
        <div className="container">
          <small>© 2025 — SUPON Kielce — Portal Klienta</small>
        </div>
      </footer>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        scope={portalType}
      />
    </div>
  );
}
