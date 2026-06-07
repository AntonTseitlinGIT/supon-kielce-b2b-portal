"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Building2, Shield, Plus, Edit2, 
  DollarSign, Check, AlertCircle, CheckCircle, 
  MapPin, Search, Package 
} from "lucide-react";
import { 
  updateClient, createClientBranch, updateClientBranch, 
  saveClientProductPrice 
} from "../actions";

interface ClientDetail {
  id: string;
  name: string;
  nip: string;
  address: string | null;
  logoUrl: string | null;
  isActive: boolean;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  _count?: {
    employees: number;
    orders: number;
  };
}

interface Product {
  id: string;
  articleNr: string;
  name: string;
  category: {
    id: string;
    name: string;
  };
}

interface ClientProductPrice {
  productId: string;
  customPrice: string; // string for input form handling
  isActive: boolean;
}

interface ClientDetailClientProps {
  client: ClientDetail;
  branches: Branch[];
  products: Product[];
  initialClientProducts: Record<string, ClientProductPrice>;
}

export default function ClientDetailClient({
  client,
  branches,
  products,
  initialClientProducts
}: ClientDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"details" | "branches" | "prices">("details");
  const [isPending, startTransition] = useTransition();

  // Alert message states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ================= TAB 1: CLIENT DETAILS STATE =================
  const [clientName, setClientName] = useState(client.name);
  const [clientNip, setClientNip] = useState(client.nip);
  const [clientAddress, setClientAddress] = useState(client.address || "");
  const [clientLogoUrl, setClientLogoUrl] = useState(client.logoUrl || "");
  const [clientIsActive, setClientIsActive] = useState(client.isActive);

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("id", client.id);
    formData.append("name", clientName);
    formData.append("nip", clientNip);
    formData.append("address", clientAddress);
    formData.append("logoUrl", clientLogoUrl);
    formData.append("isActive", clientIsActive.toString());

    startTransition(async () => {
      const result = await updateClient(null, formData);
      if (result.success) {
        setSuccessMsg(result.message || "Dane klienta zostały zaktualizowane.");
      } else {
        setErrorMsg(result.error || "Wystąpił błąd podczas aktualizacji.");
      }
    });
  };

  // ================= TAB 2: BRANCHES CRUD STATE =================
  const [branchMode, setBranchMode] = useState<"add" | "edit">("add");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchIsActive, setBranchIsActive] = useState(true);

  const handleEditBranchClick = (b: Branch) => {
    setBranchMode("edit");
    setSelectedBranchId(b.id);
    setBranchName(b.name);
    setBranchAddress(b.address);
    setBranchIsActive(b.isActive);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleResetBranchForm = () => {
    setBranchMode("add");
    setSelectedBranchId("");
    setBranchName("");
    setBranchAddress("");
    setBranchIsActive(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!branchName.trim()) {
      setErrorMsg("Nazwa oddziału jest wymagana.");
      return;
    }
    if (!branchAddress.trim()) {
      setErrorMsg("Adres oddziału jest wymagany.");
      return;
    }

    const formData = new FormData();
    formData.append("clientId", client.id);
    formData.append("name", branchName);
    formData.append("address", branchAddress);

    startTransition(async () => {
      let result;
      if (branchMode === "add") {
        result = await createClientBranch(null, formData);
      } else {
        formData.append("id", selectedBranchId);
        formData.append("isActive", branchIsActive.toString());
        result = await updateClientBranch(null, formData);
      }

      if (result.success) {
        setSuccessMsg(result.message || "Oddział zapisany pomyślnie.");
        handleResetBranchForm();
      } else {
        setErrorMsg(result.error || "Błąd zapisu oddziału.");
      }
    });
  };

  // ================= TAB 3: CUSTOM PRICING STATE =================
  const [priceSearch, setPriceSearch] = useState("");
  const [clientProducts, setClientProducts] = useState<Record<string, ClientProductPrice>>(initialClientProducts);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const handlePriceChange = (productId: string, val: string) => {
    setClientProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        customPrice: val
      }
    }));
  };

  const handleActiveToggle = (productId: string, val: boolean) => {
    setClientProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        isActive: val
      }
    }));
  };

  const handleSavePrice = async (productId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    setSavingProductId(productId);

    const cp = clientProducts[productId] || { customPrice: "", isActive: true };

    const result = await saveClientProductPrice(
      client.id,
      productId,
      cp.customPrice,
      cp.isActive
    );

    setSavingProductId(null);

    if (result.success) {
      setSuccessMsg(result.message || "Cena została zapisana!");
    } else {
      setErrorMsg(result.error || "Błąd podczas zapisu ceny.");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(priceSearch.toLowerCase()) ||
      p.articleNr.toLowerCase().includes(priceSearch.toLowerCase()) ||
      p.category.name.toLowerCase().includes(priceSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Navigation Breadcrumb */}
      <div>
        <Link href="/admin/clients" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", gap: "6px", marginBottom: "8px" }}>
          <ArrowLeft size={14} /> Powrót do listy klientów
        </Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          {client.name}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>
          NIP: <code>{client.nip}</code> — Szczegóły konfiguracji klienta B2B
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="card" style={{ padding: "6px", background: "var(--section-bg)", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => { setActiveTab("details"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`btn ${activeTab === "details" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, boxShadow: activeTab === "details" ? undefined : "none", border: activeTab === "details" ? undefined : "none", background: activeTab === "details" ? undefined : "transparent" }}
          >
            <Shield size={16} /> Dane Podstawowe
          </button>
          <button
            onClick={() => { setActiveTab("branches"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`btn ${activeTab === "branches" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, boxShadow: activeTab === "branches" ? undefined : "none", border: activeTab === "branches" ? undefined : "none", background: activeTab === "branches" ? undefined : "transparent" }}
          >
            <MapPin size={16} /> Oddziały dostaw ({branches.length})
          </button>
          <button
            onClick={() => { setActiveTab("prices"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`btn ${activeTab === "prices" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, boxShadow: activeTab === "prices" ? undefined : "none", border: activeTab === "prices" ? undefined : "none", background: activeTab === "prices" ? undefined : "transparent" }}
          >
            <DollarSign size={16} /> Cennik indywidualny ({products.length})
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div style={{ display: "flex", gap: "8px", background: "color-mix(in oklab, var(--err) 12%, var(--page-bg))", border: "1px solid var(--err)", padding: "12px 16px", borderRadius: "10px", color: "var(--err)", fontSize: "14px" }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ display: "flex", gap: "8px", background: "color-mix(in oklab, var(--ok) 12%, var(--page-bg))", border: "1px solid var(--ok)", padding: "12px 16px", borderRadius: "10px", color: "var(--ok)", fontSize: "14px" }}>
          <CheckCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "details" && (
        <div className="card" style={{ animation: "fadeIn 0.2s ease" }}>
          <div className="card-header">
            <h3 className="card-title" style={{ margin: 0 }}>Formularz edycji danych klienta</h3>
          </div>
          <div className="card-content">
            <form onSubmit={handleUpdateClient} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
              <div className="form-group">
                <label className="form-label form-required">Nazwa firmy</label>
                <input
                  type="text"
                  className="form-input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="form-group">
                <label className="form-label form-required">NIP</label>
                <input
                  type="text"
                  className="form-input"
                  value={clientNip}
                  onChange={(e) => setClientNip(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Adres siedziby</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Logo</label>
                <input
                  type="text"
                  className="form-input"
                  value={clientLogoUrl}
                  onChange={(e) => setClientLogoUrl(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="switch-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--line)" }}>
                <span className="form-label" style={{ margin: 0 }}>Klient aktywny</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={clientIsActive}
                    onChange={(e) => setClientIsActive(e.target.checked)}
                    disabled={isPending}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: "flex-start", minWidth: "150px" }}
                disabled={isPending}
              >
                {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "branches" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "24px", alignItems: "start", animation: "fadeIn 0.2s ease" }}>
          {/* Branches list */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ margin: 0 }}>Oddziały i miejsca dostaw</h3>
            </div>
            <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nazwa oddziału</th>
                    <th>Adres dostawy</th>
                    <th style={{ textAlign: "center" }}>Pracownicy</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "right" }}>Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                        Brak zdefiniowanych oddziałów dla tego klienta.
                      </td>
                    </tr>
                  ) : (
                    branches.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                        <td style={{ fontSize: "13px", color: "var(--muted)" }}>{b.address}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>
                          <span className="badge info" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                            {b._count?.employees ?? 0}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`badge ${b.isActive ? "ok" : "err"}`}>
                            {b.isActive ? "Aktywny" : "Nieaktywny"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEditBranchClick(b)}
                          >
                            Edytuj
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add/Edit branch form */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ margin: 0 }}>
                {branchMode === "add" ? "Dodaj oddział" : "Edytuj oddział"}
              </h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleBranchSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label form-required">Nazwa oddziału</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="np. Magazyn Główny"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label form-required">Adres dostawy</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Pełny adres dostawy dla tego oddziału..."
                    required
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                {branchMode === "edit" && (
                  <div className="switch-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--line)" }}>
                    <span className="form-label" style={{ margin: 0 }}>Oddział aktywny</span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={branchIsActive}
                        onChange={(e) => setBranchIsActive(e.target.checked)}
                        disabled={isPending}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  {branchMode === "edit" && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={handleResetBranchForm}
                      disabled={isPending}
                    >
                      Anuluj
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    disabled={isPending}
                  >
                    {isPending ? "Zapisywanie..." : branchMode === "add" ? "Dodaj" : "Zapisz"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === "prices" && (
        <div className="card" style={{ animation: "fadeIn 0.2s ease" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Indywidualny cennik kontraktowy</h3>
              <p style={{ color: "var(--muted)", fontSize: "13px", margin: "4px 0 0 0" }}>
                Ustaw ceny dedykowane dla towarów oraz zaznacz, które pozycje asortymentowe są aktywne dla tego klienta.
              </p>
            </div>
            
            <div style={{ position: "relative", width: "260px" }}>
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: "32px", height: "36px", fontSize: "13px" }}
                placeholder="Szukaj artykułu..."
                value={priceSearch}
                onChange={(e) => setPriceSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Artykuł</th>
                  <th>Kategoria ŚOI</th>
                  <th style={{ textAlign: "center", width: "160px" }}>Status asortymentu</th>
                  <th style={{ width: "240px" }}>Cena kontraktowa (PLN)</th>
                  <th style={{ textAlign: "right", width: "100px" }}>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                      Nie znaleziono produktów w bazie danych.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const cp = clientProducts[product.id] || { customPrice: "", isActive: false };
                    const isSaving = savingProductId === product.id;

                    return (
                      <tr key={product.id}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600 }}>{product.name}</span>
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>Art. nr: <code>{product.articleNr}</code></span>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: "var(--section-bg)", color: "var(--text)" }}>
                            {product.category.name}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={cp.isActive}
                                onChange={(e) => handleActiveToggle(product.id, e.target.checked)}
                                disabled={isSaving}
                              />
                              <span className="slider"></span>
                            </label>
                            <span style={{ fontSize: "13px", fontWeight: 500, width: "70px", textAlign: "left" }}>
                              {cp.isActive ? "Dostępny" : "Zablokowany"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: "13px" }}>
                              zł
                            </span>
                            <input
                              type="text"
                              className="form-input"
                              style={{ paddingLeft: "26px", height: "36px", fontSize: "13.5px" }}
                              placeholder="Domyślna cena..."
                              value={cp.customPrice}
                              onChange={(e) => handlePriceChange(product.id, e.target.value)}
                              disabled={isSaving}
                            />
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className={`btn ${isSaving ? "btn-secondary" : "btn-primary"} btn-sm`}
                            style={{ minWidth: "70px" }}
                            onClick={() => handleSavePrice(product.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? "..." : <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Check size={14} /> Zapisz</span>}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
