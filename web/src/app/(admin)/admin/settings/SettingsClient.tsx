"use client";

import React, { useState, useTransition } from "react";
import { Settings, Shield, Power, AlertCircle, CheckCircle } from "lucide-react";
import { saveAppSettings, toggleFeatureFlag } from "./actions";

interface SettingItem {
  key: string;
  value: string;
}

interface FeatureFlagItem {
  key: string;
  isEnabled: boolean;
  description: string | null;
}

interface SettingsClientProps {
  settings: SettingItem[];
  featureFlags: FeatureFlagItem[];
}

export default function SettingsClient({ settings, featureFlags }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();

  // Settings state
  const findValue = (key: string) => settings.find((s) => s.key === key)?.value || "";
  
  const [companyName, setCompanyName] = useState(findValue("supon_company_name"));
  const [address, setAddress] = useState(findValue("supon_address"));
  const [nip, setNip] = useState(findValue("supon_nip"));
  const [email, setEmail] = useState(findValue("supon_email"));
  const [phone, setPhone] = useState(findValue("supon_phone"));

  // Feature Flags list local state for toggling
  const [flags, setFlags] = useState<FeatureFlagItem[]>(featureFlags);
  const [togglingFlagKey, setTogglingFlagKey] = useState<string | null>(null);

  // Alerts
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("supon_company_name", companyName);
    formData.append("supon_address", address);
    formData.append("supon_nip", nip);
    formData.append("supon_email", email);
    formData.append("supon_phone", phone);

    startTransition(async () => {
      const result = await saveAppSettings(null, formData);
      if (result.success) {
        setSuccessMsg(result.message || "Dane firmy zostały zapisane.");
      } else {
        setErrorMsg(result.error || "Wystąpił błąd zapisu.");
      }
    });
  };

  const handleFlagToggle = async (key: string, currentStatus: boolean) => {
    setErrorMsg("");
    setSuccessMsg("");
    setTogglingFlagKey(key);

    const nextStatus = !currentStatus;

    // Optimistically update status
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, isEnabled: nextStatus } : f))
    );

    const result = await toggleFeatureFlag(key, nextStatus);

    setTogglingFlagKey(null);

    if (result.success) {
      setSuccessMsg(result.message || "Zmieniono status flagi.");
    } else {
      // Revert status on failure
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, isEnabled: currentStatus } : f))
      );
      setErrorMsg(result.error || "Błąd zapisu statusu flagi.");
    }
  };

  // Human friendly feature flag labels
  const getFlagLabel = (key: string) => {
    switch (key) {
      case "email_notifications":
        return "Powiadomienia Email (Resend)";
      case "qr_labels":
        return "Etykiety Kodów QR";
      case "excel_export":
        return "Eksport Danych Excel (Raporty)";
      case "pdf_export":
        return "Generowanie Dokumentów PDF";
      case "notifications":
        return "Powiadomienia w aplikacji (Badge)";
      case "global_search":
        return "Globalna wyszukiwarka (Cmd+K)";
      default:
        return key;
    }
  };

  return (
    <div className="list-editor-grid">
      
      {/* Organisation info Form */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={20} className="muted" /> Dane organizacyjne SUPON
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

          <form onSubmit={handleSettingsSubmit} className="col-16">
            <div className="form-group">
              <label className="form-label form-required" htmlFor="set-company">Nazwa dostawcy (firmy)</label>
              <input
                id="set-company"
                type="text"
                className="form-input"
                required
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required" htmlFor="set-nip">NIP firmy</label>
              <input
                id="set-nip"
                type="text"
                inputMode="numeric"
                className="form-input"
                required
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required" htmlFor="set-address">Adres rejestrowy / Magazyn centralny</label>
              <textarea
                id="set-address"
                className="form-textarea"
                rows={3}
                required
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label form-required" htmlFor="set-email">E-mail do kontaktu</label>
                <input
                  id="set-email"
                  type="email"
                  className="form-input"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="form-group">
                <label className="form-label form-required" htmlFor="set-phone">Telefon infolinii</label>
                <input
                  id="set-phone"
                  type="tel"
                  className="form-input"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", minWidth: "150px", marginTop: "8px" }}
              disabled={isPending}
            >
              {isPending ? "Zapisywanie..." : "Zapisz dane"}
            </button>
          </form>
        </div>
      </div>

      {/* Feature Flags Panel */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={20} className="muted" /> Flagi funkcji i moduły (Feature Flags)
          </h3>
        </div>
        <div className="card-content col-16">
          {flags.map((flag) => {
            const isToggling = togglingFlagKey === flag.key;
            return (
              <div
                key={flag.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--line)",
                  background: flag.isEnabled 
                    ? "color-mix(in oklab, var(--accent) 3%, var(--page-bg))"
                    : "var(--page-bg)",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingRight: "10px" }}>
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Power size={14} style={{ color: flag.isEnabled ? "var(--ok)" : "var(--muted)" }} aria-hidden="true" />
                    {getFlagLabel(flag.key)}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {flag.description || "Brak opisu dla tej funkcji."}
                  </span>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={flag.isEnabled}
                    onChange={() => handleFlagToggle(flag.key, flag.isEnabled)}
                    disabled={isToggling}
                    aria-label={`${getFlagLabel(flag.key)} — ${flag.isEnabled ? "włączone" : "wyłączone"}`}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
