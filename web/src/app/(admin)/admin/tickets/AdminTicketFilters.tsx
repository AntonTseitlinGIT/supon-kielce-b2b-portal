"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useTransition } from "react";
import { Search, X } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
}

interface AdminTicketFiltersProps {
  clients: ClientOption[];
}

export default function AdminTicketFilters({ clients }: AdminTicketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showAdv, setShowAdv] = useState(false);

  const search = searchParams?.get("search") || "";
  const status = searchParams?.get("status") || "";
  const type = searchParams?.get("type") || "";
  const clientId = searchParams?.get("clientId") || "";

  // Local state for interactive filtering
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localType, setLocalType] = useState(type);
  const [localClientId, setLocalClientId] = useState(clientId);

  const applyFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("page");

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
    });

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleFilterClick = () => {
    applyFilters({
      search: localSearch,
      status: localStatus,
      type: localType,
      clientId: localClientId,
    });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("");
    setLocalType("");
    setLocalClientId("");
    startTransition(() => {
      router.push("");
    });
  };

  const hasActiveFilters = search || status || type || clientId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
      
      {/* Search Bar Row */}
      <div className="search-bar-row" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        
        <div className="search-wrapper" style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search 
            size={20} 
            style={{ 
              position: "absolute", 
              left: "16px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "var(--muted)", 
              pointerEvents: "none" 
            }} 
          />
          <input
            type="text"
            placeholder="Szukaj po numerze zgłoszenia, pracowniku lub towarze..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleFilterClick(); }}
            className="input"
            style={{ margin: 0, paddingLeft: "48px" }}
          />
        </div>

        <button
          onClick={handleFilterClick}
          className="btn btn-lg"
          type="button"
        >
          Filtruj
        </button>

        <button
          onClick={() => setShowAdv(!showAdv)}
          className="btn btn-secondary btn-lg"
          type="button"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
          Filtry
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="btn btn-secondary btn-sm"
            type="button"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="Wyczyść filtry"
          >
            <X size={16} /> Wyczyść
          </button>
        )}
      </div>

      {/* Advanced panel drawer */}
      {showAdv && (
        <div 
          className="advanced-filters-panel" 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "16px", 
            padding: "20px", 
            borderRadius: "16px", 
            background: "var(--section-bg)", 
            border: "1px solid var(--line)",
            animation: "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}
        >
          <div className="form-group">
            <label className="form-label">Klient</label>
            <select
              className="input"
              value={localClientId}
              onChange={(e) => setLocalClientId(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">Wszyscy klienci</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split("—")[0].trim()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="input"
              value={localStatus}
              onChange={(e) => setLocalStatus(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">Wszystkie</option>
              <option value="NEW">Nowe</option>
              <option value="IN_PROGRESS">W toku</option>
              <option value="RESOLVED">Rozwiązane</option>
              <option value="CLOSED">Zamknięte</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Typ zgłoszenia</label>
            <select
              className="input"
              value={localType}
              onChange={(e) => setLocalType(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">Wszystkie typy</option>
              <option value="COMPLAINT">Reklamacja</option>
              <option value="EXCHANGE">Wymiana</option>
              <option value="GENERAL">Ogólne / Inne</option>
            </select>
          </div>
        </div>
      )}

      {isPending && (
        <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="spinner-mini" style={{
            width: "12px",
            height: "12px",
            border: "2px solid var(--muted)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }}></span>
          Filtrowanie wyników...
        </div>
      )}
    </div>
  );
}
