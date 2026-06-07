"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut, Search, Moon, Sun, Terminal,
  LayoutDashboard, Building2, UserCog, Settings,
} from "lucide-react";
import { Role } from "@prisma/client";
import { NavItem } from "@/config/navigation.config";
import GlobalSearchModal from "./GlobalSearchModal";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  "user-cog": UserCog,
  "settings": Settings,
};

interface DevSidebarLayoutProps {
  navItems: NavItem[];
  user: { name: string; email: string; role: Role };
  children: React.ReactNode;
}

export default function DevSidebarLayout({ navItems, user, children }: DevSidebarLayoutProps) {
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

  return (
    <div className="admin-shell">

      {/* ── Dev Sidebar ── */}
      <aside className="admin-sidebar dev-sidebar" aria-label="Nawigacja dewelopera">

        <div className="sidebar-brand">
          <Link href="/developer/dashboard" className="sidebar-logo-link">
            <div className="dev-logo-icon" aria-hidden="true">
              <Terminal size={16} />
            </div>
            <span className="sidebar-brand-name">Dev Portal</span>
          </Link>
          <span className="dev-badge">SYSTEM</span>
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

        {/* Separator with link to admin portal */}
        <div className="sidebar-portal-link">
          <Link href="/admin/dashboard" className="sidebar-link" style={{ fontSize: "12px", opacity: 0.6 }}>
            <Building2 size={14} />
            <span>Portal administracyjny</span>
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user" title={`${user.name} · Deweloper systemu`}>
            <div className="sidebar-avatar dev-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">Deweloper systemu</span>
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
