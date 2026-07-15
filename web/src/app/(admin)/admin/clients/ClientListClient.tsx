"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Building2, AlertCircle, CheckCircle, ExternalLink, Shield } from "lucide-react";
import { createClient } from "./actions";

interface ClientData {
  id: string;
  name: string;
  nip: string;
  address: string | null;
  isActive: boolean;
  _count: {
    branches: number;
    clientProducts: number;
  };
}

interface ClientListClientProps {
  clients: ClientData[];
}

export default function ClientListClient({ clients }: ClientListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [nip, setNip] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nip.includes(searchQuery)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Nazwa klienta jest wymagana.");
      return;
    }
    if (!nip.trim()) {
      setErrorMsg("NIP jest wymagany.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("nip", nip);
    formData.append("address", address);
    formData.append("logoUrl", logoUrl);
    formData.append("isActive", isActive.toString());

    startTransition(async () => {
      const result = await createClient(null, formData);
      if (result.success) {
        setSuccessMsg(result.message || "Klient został utworzony!");
        setName("");
        setNip("");
        setAddress("");
        setLogoUrl("");
        
        // Redirect to new client detail page
        if (result.clientId) {
          router.push(`/admin/clients/${result.clientId}`);
        }
      } else {
        setErrorMsg(result.error || "Wystąpił błąd.");
      }
    });
  };

  return (
    <div className="list-editor-grid">
      
      {/* Client List */}
      <div className="card">
        <div className="card-header" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={20} className="muted" /> Lista zarejestrowanych klientów ({filteredClients.length})
          </h3>
          <div style={{ position: "relative", width: "240px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }} aria-hidden="true">
              <Search size={16} />
            </span>
            <input
              type="search"
              className="form-input"
              style={{ paddingLeft: "32px", height: "36px", fontSize: "13px" }}
              placeholder="Szukaj po nazwie lub NIP..."
              aria-label="Szukaj klientów"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa firmy</th>
                <th>NIP</th>
                <th>Adres</th>
                <th style={{ textAlign: "center" }}>Oddziały</th>
                <th style={{ textAlign: "center" }}>Produkty</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    Brak klientów spełniających kryteria wyszukiwania.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} style={{ transition: "background 0.2s" }}>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/admin/clients/${client.id}`} style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "6px" }}>
                        {client.name}
                      </Link>
                    </td>
                    <td><code>{client.nip}</code></td>
                    <td style={{ color: "var(--muted)", fontSize: "13px" }} title={client.address || ""}>
                      {client.address ? (client.address.length > 28 ? client.address.substring(0, 26) + "..." : client.address) : "—"}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>
                      <span className="badge info" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                        {client._count.branches}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>
                      <span className="badge ok" style={{ background: "color-mix(in oklab, var(--ok) 15%, var(--page-bg))", color: "var(--ok)" }}>
                        {client._count.clientProducts}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${client.isActive ? "ok" : "err"}`}>
                        {client.isActive ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/admin/clients/${client.id}`} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", gap: "4px" }}>
                        Zarządzaj <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Card Form */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} style={{ color: "var(--accent)" }} /> Nowy Klient
          </h3>
        </div>
        <div className="card-content">
          {errorMsg && (
            <div role="alert" style={{ display: "flex", gap: "8px", background: "color-mix(in oklab, var(--err) 12%, var(--page-bg))", border: "1px solid var(--err)", padding: "10px 14px", borderRadius: "10px", color: "var(--err)", marginBottom: "16px", fontSize: "13px" }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div role="status" aria-live="polite" style={{ display: "flex", gap: "8px", background: "color-mix(in oklab, var(--ok) 12%, var(--page-bg))", border: "1px solid var(--ok)", padding: "10px 14px", borderRadius: "10px", color: "var(--ok)", marginBottom: "16px", fontSize: "13px" }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label form-required" htmlFor="cl-name">Nazwa firmy</label>
              <input
                id="cl-name"
                type="text"
                className="form-input"
                placeholder="np. KGHM Polska Miedź S.A."
                required
                autoComplete="organization"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required" htmlFor="cl-nip">NIP</label>
              <input
                id="cl-nip"
                type="text"
                inputMode="numeric"
                className="form-input"
                placeholder="np. 6570000000"
                required
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cl-address">Adres rejestrowy</label>
              <textarea
                id="cl-address"
                className="form-textarea"
                rows={3}
                placeholder="ul. Główna 12, 25-001 Kielce"
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cl-logo">URL Logo (opcjonalnie)</label>
              <input
                id="cl-logo"
                type="url"
                className="form-input"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="switch-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--line)" }}>
              <span className="form-label" style={{ margin: 0 }} id="cl-active-label">Firma aktywna</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isPending}
                  aria-labelledby="cl-active-label"
                />
                <span className="slider"></span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "8px" }}
              disabled={isPending}
            >
              {isPending ? "Tworzenie..." : "Dodaj klienta"}
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}
