"use client";

import React, { useState, useTransition } from "react";
import { CheckCircle2, RotateCcw, Save, ShoppingBag, Users, MessageCircle, FileText, Building, Package, BarChart2 } from "lucide-react";
import { MODULES, ClientModules, ClientLimits } from "@/config/modules.config";
import { saveClientConfig, resetClientConfig } from "./actions";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  "shopping-bag": ShoppingBag,
  "users": Users,
  "message-circle": MessageCircle,
  "file-text": FileText,
  "building": Building,
  "package": Package,
  "bar-chart-2": BarChart2,
};

interface Props {
  clientId: string;
  clientName: string;
  initialModules: ClientModules;
  initialLimits: ClientLimits;
  lastUpdatedAt?: string | null;
  lastUpdatedBy?: string | null;
}

export default function ClientConfigForm({
  clientId, clientName, initialModules, initialLimits, lastUpdatedAt, lastUpdatedBy,
}: Props) {
  const [modules, setModules] = useState<ClientModules>({ ...initialModules });
  const [limits, setLimits] = useState<ClientLimits>({ ...initialLimits });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleModule = (key: string, optional: boolean | undefined) => {
    if (!optional) return; // core modules cannot be disabled
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
    setMsg(null);
  };

  const handleSave = () => {
    setMsg(null);
    startTransition(async () => {
      const res = await saveClientConfig(clientId, { modules, limits });
      setMsg(res.success
        ? { type: "ok", text: "Konfiguracja zapisana." }
        : { type: "err", text: res.error ?? "Błąd." }
      );
    });
  };

  const handleReset = () => {
    if (!confirm(`Zresetować konfigurację klienta "${clientName}" do wartości domyślnych?`)) return;
    startTransition(async () => {
      const res = await resetClientConfig(clientId);
      if (res.success) {
        window.location.reload();
      } else {
        setMsg({ type: "err", text: res.error ?? "Błąd." });
      }
    });
  };

  const enabledCount = MODULES.filter(m => modules[m.key]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Modules */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Moduły portalu klienta</h2>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--muted)" }}>
              Włącz lub wyłącz sekcje widoczne dla użytkowników tego klienta
            </p>
          </div>
          <span className="badge badge-info" style={{ fontSize: "12px" }}>
            {enabledCount} / {MODULES.length} aktywnych
          </span>
        </div>

        <div style={{ padding: "8px 0" }}>
          {MODULES.map((mod) => {
            const Icon = ICON_MAP[mod.icon];
            const isOn = modules[mod.key];
            const isCore = !mod.optional;
            return (
              <div
                key={mod.key}
                style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--line)",
                  opacity: isCore ? 0.75 : 1,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0,
                  background: isOn ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--section-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {Icon && <Icon size={17} style={{ color: isOn ? "var(--accent)" : "var(--muted)" }} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {mod.label}
                    {isCore && (
                      <span className="badge" style={{ fontSize: "10px", background: "var(--section-bg)", color: "var(--muted)" }}>
                        rdzeń
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "2px" }}>{mod.description}</div>
                </div>

                {/* Toggle */}
                <label className={`toggle-switch${isCore ? " toggle-disabled" : ""}`} title={isCore ? "Ten moduł jest wymagany i nie może być wyłączony" : undefined}>
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={isOn}
                    onChange={() => toggleModule(mod.key, mod.optional)}
                    disabled={isCore || isPending}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-label">{isOn ? "Włączony" : "Wyłączony"}</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Limits */}
      <div className="card" style={{ padding: "20px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700 }}>Limity operacyjne</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "480px" }}>
          <div className="form-group">
            <label className="form-label">Maks. użytkowników</label>
            <input
              type="number" min={1} max={9999}
              className="input"
              value={limits.maxUsers}
              onChange={e => setLimits(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
              disabled={isPending}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Maks. oddziałów</label>
            <input
              type="number" min={1} max={999}
              className="input"
              value={limits.maxBranches}
              onChange={e => setLimits(prev => ({ ...prev, maxBranches: Number(e.target.value) }))}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Actions + meta */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={isPending}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Save size={15} />
          {isPending ? "Zapisywanie..." : "Zapisz konfigurację"}
        </button>

        <button
          onClick={handleReset}
          className="btn btn-ghost btn-sm"
          disabled={isPending}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--err)" }}
        >
          <RotateCcw size={13} />
          Resetuj do domyślnych
        </button>

        {msg && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "13px", fontWeight: 500,
            color: msg.type === "ok" ? "var(--ok)" : "var(--err)",
          }}>
            {msg.type === "ok" && <CheckCircle2 size={14} />}
            {msg.text}
          </div>
        )}

        {lastUpdatedAt && (
          <span style={{ marginLeft: "auto", fontSize: "11.5px", color: "var(--muted)" }}>
            Ostatnia zmiana: {new Date(lastUpdatedAt).toLocaleString("pl-PL")}
            {lastUpdatedBy && ` · ${lastUpdatedBy}`}
          </span>
        )}
      </div>
    </div>
  );
}
