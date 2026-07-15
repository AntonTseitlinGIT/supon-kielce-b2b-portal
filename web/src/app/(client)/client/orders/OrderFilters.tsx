"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useTransition } from "react";
import { Search, X } from "lucide-react";

interface BranchOption {
  id: string;
  name: string;
}

interface OrderFiltersProps {
  branches?: BranchOption[];
  showBranchFilter: boolean;
}

export default function OrderFilters({
  branches = [],
  showBranchFilter,
}: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showAdv, setShowAdv] = useState(false);

  // Read search params
  const searchVal = searchParams?.get("search") || "";
  const statusVal = searchParams?.has("status") ? (searchParams.get("status") || "") : "IN_PROGRESS";
  const priorityVal = searchParams?.get("priority") || "";
  const branchIdVal = searchParams?.get("branchId") || "";
  const dateFromVal = searchParams?.get("dateFrom") || "";
  const dateToVal = searchParams?.get("dateTo") || "";

  // Local state for immediate typing
  const [localSearch, setLocalSearch] = useState(searchVal);
  const [localPriority, setLocalPriority] = useState(priorityVal);
  const [localBranchId, setLocalBranchId] = useState(branchIdVal);
  const [localDateFrom, setLocalDateFrom] = useState(dateFromVal);
  const [localDateTo, setLocalDateTo] = useState(dateToVal);

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
      priority: localPriority,
      branchId: localBranchId,
      dateFrom: localDateFrom,
      dateTo: localDateTo,
    });
  };

  const handleChipClick = (status: string) => {
    applyFilters({ status });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalPriority("");
    setLocalBranchId("");
    setLocalDateFrom("");
    setLocalDateTo("");
    startTransition(() => {
      router.push("");
    });
  };

  const hasActiveFilters = searchVal || statusVal || priorityVal || branchIdVal || dateFromVal || dateToVal;

  return (
    <div className="orders-controls" style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
      
      {/* 1. Status chips */}
      <div className="status-chips" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
        {[
          { label: "W realizacji",       value: "IN_PROGRESS", accent: "var(--accent)" },
          { label: "Wysłane / W drodze", value: "SENT",        accent: "var(--accent)" },
          { label: "Dostarczone",         value: "DELIVERED",   accent: "var(--ok)" },
          { label: "Zrealizowane",        value: "APPROVED",    accent: "var(--accent)" },
          { label: "Wszystkie",           value: "ALL",         accent: "var(--muted)" },
        ].map((chip) => {
          const isActive = statusVal === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleChipClick(chip.value)}
              className={`chip-filter ${isActive ? "active" : ""}`}
              style={isActive ? {
                background: chip.accent,
                borderColor: chip.accent,
                boxShadow: `0 4px 12px color-mix(in oklab, ${chip.accent} 25%, transparent)`,
              } : undefined}
            >
              {chip.label}
            </button>
          );
        })}
      </div>



      {/* 2. Main Search Bar Row */}
      <div className="search-bar-row" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <div className="search-wrapper" style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search
            size={20}
            className="search-icon"
            aria-hidden="true"
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
            type="search"
            placeholder="Szukaj po numerze zamówienia, produkcie lub pracowniku..."
            aria-label="Szukaj zamówień"
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
          className="btn btn-secondary btn-lg row-8"
          type="button"
          aria-expanded={showAdv}
          aria-controls="order-adv-filters"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
          Filtry
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="btn btn-secondary btn-sm row-6"
            title="Wyczyść filtry"
          >
            <X size={16} /> Wyczyść
          </button>
        )}
      </div>

      {/* 3. Advanced filters dropdown panel */}
      {showAdv && (
        <div
          id="order-adv-filters"
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
          <div className="form-group col-6">
            <label htmlFor="cof-from" style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>Data od</label>
            <input
              id="cof-from"
              className="input"
              type="date"
              value={localDateFrom}
              onChange={(e) => setLocalDateFrom(e.target.value)}
              style={{ width: "100%", height: "40px", margin: 0 }}
            />
          </div>
          <div className="form-group col-6">
            <label htmlFor="cof-to" style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>Data do</label>
            <input
              id="cof-to"
              className="input"
              type="date"
              value={localDateTo}
              onChange={(e) => setLocalDateTo(e.target.value)}
              style={{ width: "100%", height: "40px", margin: 0 }}
            />
          </div>

          <div className="form-group col-6">
            <label htmlFor="cof-priority" style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>Priorytet</label>
            <select
              id="cof-priority"
              className="input"
              value={localPriority}
              onChange={(e) => setLocalPriority(e.target.value)}
              style={{ width: "100%", height: "40px", margin: 0 }}
            >
              <option value="">Wszystkie priorytety</option>
              <option value="STANDARD">Standardowy</option>
              <option value="HIGH">Wysoki</option>
              <option value="CRITICAL">Krytyczny</option>
            </select>
          </div>

          {showBranchFilter && branches.length > 0 && (
            <div className="form-group col-6">
              <label htmlFor="cof-branch" style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>Zakład / Dział</label>
              <select
                id="cof-branch"
                className="input"
                value={localBranchId}
                onChange={(e) => setLocalBranchId(e.target.value)}
                style={{ width: "100%", height: "40px", margin: 0 }}
              >
                <option value="">Wszystkie oddziały</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
