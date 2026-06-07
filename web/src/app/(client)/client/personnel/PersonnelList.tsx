"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Grid, List, Download, Plus, Upload, X, Loader2, FileSpreadsheet } from "lucide-react";
import { bulkCreateEmployees } from "./actions";
import PageHeader from "@/components/PageHeader";
import * as XLSX from "xlsx";

interface EmployeeItem {
  id: string;
  employeeNr: string;
  name: string;
  jobTitle: string;
  branchId: string;
  branchName: string;
  status: "ACTIVE" | "INACTIVE";
  photoUrl: string | null;
}

interface PersonnelListProps {
  initialEmployees: EmployeeItem[];
  branches: { id: string; name: string }[];
  showBranchFilter: boolean;
}

export default function PersonnelList({
  initialEmployees,
  branches,
  showBranchFilter,
 }: PersonnelListProps) {
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [isPending, startTransition] = useTransition();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importBranchId, setImportBranchId] = useState(branches[0]?.id || "");
  const [csvText, setCsvText] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  // Export settings states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv_semicolon" | "csv_comma" | "json" | "excel">("excel");
  const [exportScope, setExportScope] = useState<"filtered" | "all" | "custom">("filtered");
  const [exportStatusFilter, setExportStatusFilter] = useState("ACTIVE");
  const [exportBranchFilter, setExportBranchFilter] = useState("");

  const handleCSVImport = () => {
    setImportError("");
    setImportSuccess("");

    if (!importBranchId && showBranchFilter) {
      setImportError("Proszę wybrać oddział docelowy.");
      return;
    }

    if (!csvText.trim()) {
      setImportError("Wklej zawartość CSV lub załaduj plik.");
      return;
    }

    const lines = csvText.split("\n");
    const parsedList: any[] = [];

    // Skip header row if it exists
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes("numer") || firstLine.includes("imię") || firstLine.includes("stanowisko")) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by semicolon first (Polish Excel default), then comma, then tab
      let cols = line.split(";");
      if (cols.length < 3) cols = line.split(",");
      if (cols.length < 3) cols = line.split("\t");

      if (cols.length < 3) continue;

      const employeeNr = cols[0]?.trim();
      const name = cols[1]?.trim();
      const jobTitle = cols[2]?.trim();

      if (!employeeNr || !name || !jobTitle) continue;

      parsedList.push({
        employeeNr,
        name,
        jobTitle,
        height: cols[3]?.trim() || undefined,
        chest: cols[4]?.trim() || undefined,
        waist: cols[5]?.trim() || undefined,
        clothing: cols[6]?.trim() || undefined,
        shoes: cols[7]?.trim() || undefined,
      });
    }

    if (parsedList.length === 0) {
      setImportError("Nie znaleziono prawidłowych wierszy do zaimportowania.");
      return;
    }

    startTransition(async () => {
      const res = await bulkCreateEmployees(importBranchId, parsedList);
      if (res.success) {
        setImportSuccess(`Zaimportowano pomyślnie ${res.createdCount} pracowników. Pominięto ${res.skippedCount} istniejących.`);
        setCsvText("");
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccess("");
          window.location.reload(); // Reload to refresh server component details
        }, 2000);
      } else {
        setImportError(res.error || "Wystąpił błąd podczas importowania.");
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  // Filtering logic
  const filteredEmployees = initialEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeNr.toLowerCase().includes(search.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(search.toLowerCase());

    const matchesBranch = !branchFilter || emp.branchId === branchFilter;
    const matchesStatus = !statusFilter || emp.status === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Client-side CSV export
  const handleExport = () => {
    let targetList = [...initialEmployees];

    if (exportScope === "filtered") {
      targetList = [...filteredEmployees];
    } else if (exportScope === "custom") {
      targetList = initialEmployees.filter((emp) => {
        const matchesBranch = !exportBranchFilter || emp.branchId === exportBranchFilter;
        const matchesStatus = !exportStatusFilter || emp.status === exportStatusFilter;
        return matchesBranch && matchesStatus;
      });
    }

    if (targetList.length === 0) {
      alert("Brak pracowników spełniających kryteria eksportu.");
      return;
    }

    let fileContent = "";
    let fileType = "";
    let fileExtension = "";

    if (exportFormat === "excel") {
      const data = targetList.map((emp) => ({
        "Numer pracownika": emp.employeeNr,
        "Imię i nazwisko": emp.name,
        "Stanowisko": emp.jobTitle,
        "Oddział": emp.branchName,
        "Status": emp.status === "ACTIVE" ? "Aktywny" : "Nieaktywny"
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pracownicy");
      
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `pracownicy_supon_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportModalOpen(false);
      return;
    }

    if (exportFormat === "json") {
      fileContent = JSON.stringify(targetList.map(emp => ({
        employeeNr: emp.employeeNr,
        name: emp.name,
        jobTitle: emp.jobTitle,
        branchName: emp.branchName,
        status: emp.status === "ACTIVE" ? "Aktywny" : "Nieaktywny"
      })), null, 2);
      fileType = "application/json;charset=utf-8;";
      fileExtension = "json";
    } else {
      const separator = exportFormat === "csv_semicolon" ? ";" : ",";
      const headers = [
        "Numer pracownika",
        "Imię i nazwisko",
        "Stanowisko",
        "Oddział",
        "Status"
      ];
      
      const rows = targetList.map((emp) => [
        emp.employeeNr,
        emp.name,
        emp.jobTitle,
        emp.branchName,
        emp.status === "ACTIVE" ? "Aktywny" : "Nieaktywny"
      ]);

      const csvContent = [headers, ...rows].map((row) => row.join(separator)).join("\n");
      // Add UTF-8 BOM
      fileContent = "\uFEFF" + csvContent;
      fileType = "text/csv;charset=utf-8;";
      fileExtension = "csv";
    }

    const blob = new Blob([fileContent], { type: fileType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pracownicy_supon_${new Date().toISOString().split("T")[0]}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  // Toggle for filters drawer
  const [showAdv, setShowAdv] = useState(false);

  // Clear filters handler
  const handleClear = () => {
    setSearch("");
    setBranchFilter("");
    setStatusFilter("ACTIVE");
  };

  const hasActiveFilters = search || branchFilter || statusFilter !== "ACTIVE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      <PageHeader compact title="Personel" subtitle="Zarządzaj kartami pracowników, ich rozmiarami oraz przydziałami odzieży roboczej">
        <Link href="/client/personnel/new" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} /> Dodaj pracownika
        </Link>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="btn btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
          title="Masowy import pracowników"
        >
          <Upload size={16} /> Import
        </button>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="btn btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
          title="Eksportuj pracowników"
        >
          <Download size={16} /> Eksport
        </button>
      </PageHeader>

      {/* Search & Filters row (aligned with orders style) */}
      <div className="filters-bar-row" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
        
        {/* Search field */}
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
            placeholder="Szukaj po nazwisku, stanowisku lub numerze..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: "48px",
              padding: "0 16px 0 48px",
              borderRadius: "14px",
              border: "1px solid var(--line)",
              background: "var(--page-bg)",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.2s ease"
            }}
          />
        </div>

        <button 
          className="btn" 
          type="button"
          style={{ height: "48px", padding: "0 28px", background: "var(--accent)", color: "#fff", fontWeight: 700 }}
        >
          Filtruj
        </button>

        <button 
          onClick={() => setShowAdv(!showAdv)}
          className="btn btn-secondary" 
          type="button"
          style={{ 
            height: "48px", 
            padding: "0 20px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            borderColor: "var(--line)", 
            color: "var(--text)" 
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
          Filtry
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="btn btn-secondary"
            style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", gap: "6px" }}
            title="Wyczyść filtry"
          >
            <X size={16} /> Wyczyść
          </button>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setViewMode("grid")}
            className={`btn btn-secondary ${viewMode === "grid" ? "active" : ""}`}
            style={{ padding: "0 12px", height: "48px" }}
            title="Widok siatki"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`btn btn-secondary ${viewMode === "table" ? "active" : ""}`}
            style={{ padding: "0 12px", height: "48px" }}
            title="Widok tabeli"
          >
            <List size={16} />
          </button>
        </div>

      </div>

      {/* Advanced filters drawer */}
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
          {/* Status filter */}
          <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "100%", height: "40px", margin: 0 }}
            >
              <option value="">Wszyscy pracownicy</option>
              <option value="ACTIVE">Tylko aktywni</option>
              <option value="INACTIVE">Nieaktywni</option>
            </select>
          </div>

          {/* Branch filter if head office */}
          {showBranchFilter && (
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>Oddział</label>
              <select
                className="input"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
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

      {/* Grid Mode */}
      {viewMode === "grid" && (
        <>
          {filteredEmployees.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--line)" }}>
              <Search size={48} style={{ margin: "0 auto 16px", color: "var(--muted)", opacity: 0.5 }} />
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}>Brak wyników</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>Nie znaleziono pracowników spełniających wybrane kryteria.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {filteredEmployees.map((emp) => {
                const initials = emp.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <div key={emp.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      
                      {/* Avatar */}
                      <div style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "50%",
                        background: "var(--accent-light)",
                        color: "var(--accent)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: "18px",
                        overflow: "hidden"
                      }}>
                        {emp.photoUrl ? (
                          <img src={emp.photoUrl} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          initials
                        )}
                      </div>

                      {/* Info details */}
                      <div>
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{emp.name}</h4>
                        <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace", display: "block", marginTop: "2px" }}>
                          ID: {emp.employeeNr}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "var(--muted)" }}>Stanowisko:</span>
                        <strong style={{ color: "var(--text)" }}>{emp.jobTitle}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "var(--muted)" }}>Oddział:</span>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>{emp.branchName}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", borderTop: "1px solid var(--line)", paddingTop: "12px", alignItems: "center" }}>
                      {/* Status Active/Inactive */}
                      {emp.status === "INACTIVE" && (
                        <span className="badge badge-neutral" style={{ fontSize: "11px" }}>Nieaktywny</span>
                      )}
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                      <Link href={`/client/personnel/${emp.id}`} className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                        Karta pracownika
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Table Mode */}
      {viewMode === "table" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {filteredEmployees.length === 0 ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>Brak wyników</h3>
              <p>Nie znaleziono pracowników spełniających wybrane kryteria.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nr ewidencyjny</th>
                    <th>Imię i nazwisko</th>
                    <th>Stanowisko</th>
                    <th>Oddział</th>
                    <th>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{emp.employeeNr}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "var(--accent-light)",
                            color: "var(--accent)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                            fontSize: "11px",
                            overflow: "hidden"
                          }}>
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              emp.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                            )}
                          </div>
                          <span style={{ fontWeight: 600 }}>{emp.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{emp.jobTitle}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{emp.branchName}</td>
                      <td>
                        <span className={`badge ${emp.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "11px" }}>
                          {emp.status === "ACTIVE" ? "Aktywny" : "Nieaktywny"}
                        </span>
                      </td>
                      <td>
                        <Link href={`/client/personnel/${emp.id}`} className="btn btn-secondary btn-sm" style={{ padding: "4px 8px" }}>
                          Karta
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isImportModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "grid",
          placeItems: "center",
          padding: "20px"
        }}>
          <div className="card" style={{
            width: "100%",
            maxWidth: "600px",
            background: "var(--page-bg)",
            border: "1px solid var(--line)",
            padding: "24px",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            animation: "scaleUp 0.15s ease-out"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileSpreadsheet style={{ color: "var(--accent)" }} size={22} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Masowy import pracowników</h3>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError("");
                  setImportSuccess("");
                }} 
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {importError && (
              <div className="badge badge-danger" style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <X size={16} />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="badge badge-success" style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <Loader2 className="animate-spin" size={16} />
                <span>{importSuccess}</span>
              </div>
            )}

            {/* Guide */}
            <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: "1.4" }}>
              Wklej wiersze CSV (oddzielone średnikami lub przecinkami) lub załaduj plik <strong>.csv</strong>. Pierwszy wiersz (nagłówkowy) zostanie automatycznie zignorowany, jeśli zawiera słowa kluczowe.
              <pre style={{ background: "var(--section-bg)", padding: "8px", borderRadius: "8px", fontFamily: "monospace", fontSize: "11px", marginTop: "6px", overflowX: "auto" }}>
                Numer;Imię i nazwisko;Stanowisko;Wzrost;Klatka;Pas;Rozmiar odzieży;Rozmiar obuwia
              </pre>
            </div>

            {/* Branch selector if CLIENT_HEAD */}
            {showBranchFilter && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label form-required" style={{ fontSize: "13px" }}>Wybierz oddział docelowy</label>
                <select 
                  className="form-select" 
                  value={importBranchId} 
                  onChange={(e) => setImportBranchId(e.target.value)}
                  style={{ height: "38px" }}
                >
                  <option value="">Wybierz oddział...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* File upload */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label className="btn btn-secondary" style={{ cursor: "pointer", display: "inline-flex", gap: "8px", height: "38px", alignItems: "center", padding: "0 14px", fontSize: "13px" }}>
                <Upload size={14} />
                Załaduj plik CSV
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  onChange={handleFileChange} 
                  style={{ display: "none" }} 
                />
              </label>
              {csvText && <span style={{ fontSize: "12px", color: "var(--muted)" }}>Wczytano zawartość pliku</span>}
            </div>

            {/* CSV Textarea */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: "13px" }}>Dane CSV</label>
              <textarea
                className="form-textarea"
                rows={6}
                placeholder="NP-010;Kamil Ślimak;Magazynier;180;100;90;L;43"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                style={{ fontSize: "12px", fontFamily: "monospace" }}
                disabled={isPending}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "14px", marginTop: "4px" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError("");
                  setImportSuccess("");
                }}
                disabled={isPending}
              >
                Anuluj
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleCSVImport}
                disabled={isPending}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {isPending ? <Loader2 className="animate-spin" size={14} /> : <FileSpreadsheet size={14} />}
                {isPending ? "Importowanie..." : "Importuj pracowników"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isExportModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "grid",
          placeItems: "center",
          padding: "20px"
        }}>
          <div className="card" style={{
            width: "100%",
            maxWidth: "500px",
            background: "var(--page-bg)",
            border: "1px solid var(--line)",
            padding: "24px",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            animation: "scaleUp 0.15s ease-out"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Download style={{ color: "var(--accent)" }} size={22} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Eksport pracowników</h3>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)} 
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 1. Format selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>Format pliku</label>
              <select 
                className="form-select" 
                value={exportFormat} 
                onChange={(e) => setExportFormat(e.target.value as any)}
                style={{ height: "38px" }}
              >
                <option value="excel">Excel (Arkusz .xlsx) [Zalecane]</option>
                <option value="csv_semicolon">CSV (Polski standard Excel - średnik ;)</option>
                <option value="csv_comma">CSV (Standardowy - przecinek ,)</option>
                <option value="json">JSON (Plik strukturalny)</option>
              </select>
            </div>

            {/* 2. Scope selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>Zakres eksportu</label>
              <select 
                className="form-select" 
                value={exportScope} 
                onChange={(e) => setExportScope(e.target.value as any)}
                style={{ height: "38px" }}
              >
                <option value="filtered">Tylko obecnie przefiltrowani ({filteredEmployees.length})</option>
                <option value="all">Wszyscy pracownicy ({initialEmployees.length})</option>
                <option value="custom">Niestandardowe filtry eksportu</option>
              </select>
            </div>

            {/* 3. Conditional Custom Filters inside Export Modal */}
            {exportScope === "custom" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--section-bg)", padding: "14px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                {showBranchFilter && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: "12px" }}>Oddział</label>
                    <select 
                      className="form-select" 
                      value={exportBranchFilter} 
                      onChange={(e) => setExportBranchFilter(e.target.value)}
                      style={{ height: "36px", background: "var(--page-bg)" }}
                    >
                      <option value="">Wszystkie oddziały</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "12px" }}>Status</label>
                  <select 
                    className="form-select" 
                    value={exportStatusFilter} 
                    onChange={(e) => setExportStatusFilter(e.target.value)}
                    style={{ height: "36px", background: "var(--page-bg)" }}
                  >
                    <option value="">Wszyscy pracownicy</option>
                    <option value="ACTIVE">Tylko aktywni</option>
                    <option value="INACTIVE">Nieaktywni</option>
                  </select>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "14px", marginTop: "4px" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsExportModalOpen(false)}
              >
                Anuluj
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleExport}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={14} />
                Eksportuj plik
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
