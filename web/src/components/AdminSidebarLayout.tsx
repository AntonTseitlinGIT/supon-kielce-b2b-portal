"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut, Search, Moon, Sun,
  LayoutDashboard, ShoppingBag, MessageCircle, Building2, Package,
  BarChart2, UserCog, Settings, Users, FileText, Building,
} from "lucide-react";
import { Role } from "@prisma/client";
import { NavItem } from "@/config/navigation.config";
import NotificationBell from "./NotificationBell";
import GlobalSearchModal from "./GlobalSearchModal";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
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
  SUPON_DEV: "Deweloper systemu",
};

interface AdminSidebarLayoutProps {
  navItems: NavItem[];
  user: {
    name: string;
    email: string;
    role: Role;
  };
  children: React.ReactNode;
}

export default function AdminSidebarLayout({ navItems, user, children }: AdminSidebarLayoutProps) {
  const pathname = usePathname() || "";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

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
    <div className="admin-shell">

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar" aria-label="Nawigacja">

        <div className="sidebar-brand">
          <Link href="/admin/dashboard" className="sidebar-logo-link">
            <img src="/logo.png" alt="" className="sidebar-logo" style={{ height: 22, width: "auto", maxWidth: "none", flexShrink: 0 }} />
            <span className="sidebar-brand-name">SUPON Kielce</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = checkActive(item.href);
            const Icon = ICON_MAP[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {Icon && <Icon size={16} />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" title={`${user.name} · ${roleLabel}`}>
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{roleLabel}</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="sidebar-logout"
            title={`Wyloguj się (${user.email})`}
            aria-label="Wyloguj się"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="admin-main">

        {/* Thin top bar */}
        <header className="admin-topbar">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="admin-search-btn"
            title="Szukaj (⌘K)"
          >
            <Search size={13} />
            <span>Szukaj...</span>
            <kbd>⌘K</kbd>
          </button>
          <div className="admin-topbar-actions">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
              aria-label="Przełącz motyw"
              className="topbar-icon-btn"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>

      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        scope="admin"
      />
    </div>
  );
}
