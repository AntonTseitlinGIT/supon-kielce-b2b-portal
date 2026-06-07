"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Search } from "lucide-react";
import { Role } from "@prisma/client";
import { NavItem } from "@/config/navigation.config";
import NotificationBell from "./NotificationBell";
import GlobalSearchModal from "./GlobalSearchModal";

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

export default function PortalLayout({
  navItems,
  user,
  portalType,
  children,
}: PortalLayoutProps) {
  const pathname = usePathname() || "";
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut listener for global search (Cmd+K / Ctrl+K)
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

  // Determine active item matching
  const checkActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(circle at top right, color-mix(in oklab, var(--accent) 8%, transparent), transparent 40%), var(--bg)" }}>
      
      {/* Horizontal Topbar Nav (app-nav from demo) */}
      <nav className="topbar" aria-label="Główna nawigacja">
        <div className="container">
          
          {/* Brand */}
          <Link href="/" className="brand" aria-label="SUPON Kielce">
            <img src="/logo.png" alt="" className="brand-logo" />
            <span className="brand-name">SUPON Kielce</span>
          </Link>
          
          {/* Horizontal Links */}
          <ul className="nav-list" role="list">
            {navItems.map((item) => {
              const isActive = checkActive(item.href);
              return (
                <li key={item.href}>
                  <Link 
                    className={`nav-link ${isActive ? "active" : ""}`} 
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User & Logout Action */}
          <div className="nav-actions">
            {/* Search mockup input button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              style={{
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "var(--nav-text)",
                opacity: 0.8,
                borderRadius: "var(--radius-sm)",
                padding: "0 10px 0 12px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                fontSize: "12px",
                cursor: "pointer",
                width: "140px",
                marginRight: "4px",
                transition: "all 0.2s"
              }}
              title="Szukaj (⌘K)"
              className="search-trigger-btn"
            >
              <Search size={13} style={{ marginRight: "6px", flexShrink: 0 }} />
              <span style={{ opacity: 0.6, fontSize: "11.5px" }}>Szukaj...</span>
              <kbd style={{ marginLeft: "auto", background: "rgba(255,255,255,0.12)", border: "none", padding: "1px 5px", borderRadius: "3px", fontSize: "9px", fontWeight: 700, opacity: 0.8 }}>⌘K</kbd>
            </button>

            <NotificationBell />
            
            <div style={{ display: "flex", flexDirection: "column", textAlign: "right", color: "var(--nav-text)", marginRight: "10px", opacity: 0.9, whiteSpace: "nowrap", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{user.name}</span>
              <span style={{ fontSize: "10px", opacity: 0.6 }}>
                {user.role === "BRANCH_HEAD" ? "Kierownik Oddziału" :
                 user.role === "CLIENT_HEAD" ? "Dyrektor Centrali" :
                 user.role === "SUPON_ADMIN" ? "Administrator SUPON" : "Menedżer SUPON"}
              </span>
            </div>
            
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })} 
              className="logout-link" 
              title="Wyloguj się"
              style={{ border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Wyloguj</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Main Canvas Area */}
      <main className="page-main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </main>

      {/* Footer (app-footer from demo) */}
      <footer className="page-footer" role="contentinfo">
        <div className="container">
          <small>© 2025 — SUPON Kielce — Portal Klienta</small>
        </div>
      </footer>

      {/* Global search modal dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        scope={portalType}
      />

    </div>
  );
}
