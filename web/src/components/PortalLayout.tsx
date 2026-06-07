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
  SUPON_DEV: "Deweloper systemu",
};

interface PortalLayoutProps {
  navItems: NavItem[];
  user: {
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(circle at top right, color-mix(in oklab, var(--accent) 8%, transparent), transparent 40%), var(--bg)" }}>

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
              className="search-trigger-btn"
              title="Szukaj (⌘K)"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.07)",
                color: "var(--nav-text)",
                borderRadius: "8px",
                padding: "0 10px 0 12px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                fontSize: "12px",
                cursor: "pointer",
                width: "140px",
                transition: "all 0.2s",
                opacity: 0.8,
              }}
            >
              <Search size={13} style={{ marginRight: "6px", flexShrink: 0 }} />
              <span style={{ opacity: 0.7, fontSize: "11.5px" }}>Szukaj...</span>
              <kbd style={{ marginLeft: "auto", background: "rgba(255,255,255,0.12)", border: "none", padding: "1px 5px", borderRadius: "3px", fontSize: "9px", fontWeight: 700 }}>⌘K</kbd>
            </button>

            <NotificationBell />

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
              aria-label="Przełącz motyw"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                width: "32px", height: "32px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--nav-text)", cursor: "pointer",
                transition: "all 0.2s", flexShrink: 0, opacity: 0.8,
              }}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* User avatar */}
            <div
              title={`${user.name} · ${roleLabel}`}
              style={{
                width: "32px", height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, #a5b4fc))",
                border: "2px solid rgba(255,255,255,0.2)",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 800, flexShrink: 0,
                cursor: "default", letterSpacing: "0.03em", userSelect: "none",
              }}
            >
              {initials}
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title={`Wyloguj się (${user.email})`}
              aria-label="Wyloguj się"
              style={{
                background: "color-mix(in oklab, var(--err) 15%, transparent)",
                border: "1px solid color-mix(in oklab, var(--err) 28%, transparent)",
                borderRadius: "8px",
                width: "32px", height: "32px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fca5a5", cursor: "pointer",
                transition: "all 0.2s", flexShrink: 0,
              }}
            >
              <LogOut size={15} />
            </button>
          </div>

        </div>
      </nav>

      <main className="page-main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
