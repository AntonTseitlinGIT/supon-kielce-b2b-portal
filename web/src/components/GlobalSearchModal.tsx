"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { Search, FileText, User, ShoppingBag, MessageSquare, Building, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { globalSearch, SearchResult } from "@/app/actions/search";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: "client" | "admin";
}

export default function GlobalSearchModal({ isOpen, onClose, scope }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Handle keystroke searching with debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch(query, scope);
        if (res.success && res.results) {
          setResults(res.results);
          setActiveIndex(0);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, scope]);

  // Handle keyboard navigation inside search dialog
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      const filtered = getFilteredResults();
      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filtered[activeIndex];
        if (selected) {
          handleSelect(selected);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, activeIndex, activeTab]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeEl = resultsRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        const parent = resultsRef.current;
        const activeTop = activeEl.offsetTop;
        const activeBottom = activeTop + activeEl.offsetHeight;
        const parentTop = parent.scrollTop;
        const parentBottom = parentTop + parent.clientHeight;

        if (activeBottom > parentBottom) {
          parent.scrollTop = activeBottom - parent.clientHeight;
        } else if (activeTop < parentTop) {
          parent.scrollTop = activeTop;
        }
      }
    }
  }, [activeIndex]);

  const handleSelect = (item: SearchResult) => {
    onClose();
    router.push(item.url);
  };

  const getFilteredResults = () => {
    if (activeTab === "all") return results;
    return results.filter((r) => {
      if (activeTab === "orders" && r.category === "Zamówienia") return true;
      if (activeTab === "tickets" && r.category === "Zgłoszenia") return true;
      if (activeTab === "employees" && r.category === "Pracownicy") return true;
      if (activeTab === "clients" && r.category === "Klienci") return true;
      if (activeTab === "products" && r.category === "Katalog ŚOI") return true;
      return false;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Zamówienia":
        return <ShoppingBag size={16} />;
      case "Zgłoszenia":
        return <MessageSquare size={16} />;
      case "Pracownicy":
        return <User size={16} />;
      case "Klienci":
        return <Building size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const filtered = getFilteredResults();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(9, 13, 22, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "14vh",
        zIndex: 9999,
        animation: "fadeIn 0.15s ease-out"
      }}
      onClick={onClose}
    >
      {/* Search Container Dialog */}
      <div
        style={{
          width: "min(100% - 32px, 600px)",
          background: "var(--page-bg)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ position: "relative", borderBottom: "1px solid var(--line)" }}>
          <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}>
            <Search size={20} />
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Szukaj zamówień, zgłoszeń, asortymentu..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            style={{
              width: "100%",
              height: "56px",
              background: "transparent",
              border: "none",
              outline: "none",
              paddingLeft: "52px",
              paddingRight: "60px",
              fontSize: "16px",
              color: "var(--text)"
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); }}
              style={{
                position: "absolute",
                right: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "var(--section-bg)",
                border: "none",
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted)",
                cursor: "pointer"
              }}
            >
              WYCZYŚĆ
            </button>
          )}
        </div>

        {/* Tab Filters */}
        {results.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "10px 16px",
              borderBottom: "1px solid var(--line)",
              background: "var(--bg)",
              overflowX: "auto"
            }}
          >
            <button
              onClick={() => { setActiveTab("all"); setActiveIndex(0); }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: activeTab === "all" ? "var(--accent)" : "transparent",
                color: activeTab === "all" ? "#fff" : "var(--muted)"
              }}
            >
              Wszystko
            </button>
            
            {scope === "client" ? (
              <>
                <button
                  onClick={() => { setActiveTab("orders"); setActiveIndex(0); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "orders" ? "var(--accent)" : "transparent",
                    color: activeTab === "orders" ? "#fff" : "var(--muted)"
                  }}
                >
                  Zamówienia
                </button>
                <button
                  onClick={() => { setActiveTab("employees"); setActiveIndex(0); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "employees" ? "var(--accent)" : "transparent",
                    color: activeTab === "employees" ? "#fff" : "var(--muted)"
                  }}
                >
                  Pracownicy
                </button>
                <button
                  onClick={() => { setActiveTab("tickets"); setActiveIndex(0); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "tickets" ? "var(--accent)" : "transparent",
                    color: activeTab === "tickets" ? "#fff" : "var(--muted)"
                  }}
                >
                  Zgłoszenia
                </button>
                <button
                  onClick={() => { setActiveTab("products"); setActiveIndex(0); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "products" ? "var(--accent)" : "transparent",
                    color: activeTab === "products" ? "#fff" : "var(--muted)"
                  }}
                >
                  Katalog ŚOI
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setActiveTab("clients"); setActiveIndex(0); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "clients" ? "var(--accent)" : "transparent",
                    color: activeTab === "clients" ? "#fff" : "var(--muted)"
                  }}
                >
                  Klienci B2B
                </button>
                <button
                  onClick={() => { setActiveTab("orders"); setActiveIndex(0); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "orders" ? "var(--accent)" : "transparent",
                    color: activeTab === "orders" ? "#fff" : "var(--muted)"
                  }}
                >
                  Zamówienia
                </button>
                <button
                  onClick={() => { setActiveTab("tickets"); setActiveIndex(0); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "tickets" ? "var(--accent)" : "transparent",
                    color: activeTab === "tickets" ? "#fff" : "var(--muted)"
                  }}
                >
                  Zgłoszenia
                </button>
                <button
                  onClick={() => { setActiveTab("products"); setActiveIndex(0); }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "products" ? "var(--accent)" : "transparent",
                    color: activeTab === "products" ? "#fff" : "var(--muted)"
                  }}
                >
                  Katalog ŚOI
                </button>
              </>
            )}
          </div>
        )}

        {/* Results List */}
        <div
          ref={resultsRef}
          style={{
            maxHeight: "360px",
            overflowY: "auto",
            padding: "8px 0"
          }}
        >
          {isPending && query.length > 0 && results.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
              Wyszukiwanie...
            </div>
          ) : query.length < 2 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
              Wpisz co najmniej 2 znaki, aby rozpocząć szukanie.
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
              Brak wyników dopasowanych do zapytania.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={item.id + "-" + idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: "10px 18px",
                    cursor: "pointer",
                    background: isActive ? "var(--accent-light)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    transition: "background 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Item Icon */}
                    <div style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}>
                      {getCategoryIcon(item.category)}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600, fontSize: "13.5px", color: isActive ? "var(--accent-text)" : "var(--text)" }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {item.category} • {item.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Status badge or Action indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {item.statusLabel && (
                      <span className={`badge ${item.statusClass || ""}`} style={{ fontSize: "10.5px" }}>
                        {item.statusLabel}
                      </span>
                    )}
                    {isActive && (
                      <span style={{ display: "flex", color: "var(--accent)", animation: "fadeIn 0.2s" }}>
                        <CornerDownLeft size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            padding: "10px 18px",
            borderTop: "1px solid var(--line)",
            background: "var(--bg)",
            fontSize: "11px",
            color: "var(--muted)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", gap: "14px" }}>
            <span><kbd style={{ background: "var(--page-bg)", border: "1px solid var(--line)", padding: "1px 4px", borderRadius: "3px" }}>↑↓</kbd> Nawigacja</span>
            <span><kbd style={{ background: "var(--page-bg)", border: "1px solid var(--line)", padding: "1px 4px", borderRadius: "3px" }}>Enter</kbd> Wybór</span>
            <span><kbd style={{ background: "var(--page-bg)", border: "1px solid var(--line)", padding: "1px 4px", borderRadius: "3px" }}>ESC</kbd> Zamknij</span>
          </div>
          <span>SUPON Kielce B2B</span>
        </div>
      </div>
    </div>
  );
}
