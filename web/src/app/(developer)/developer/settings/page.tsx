import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Flag, Settings2, CheckCircle2, XCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default async function DevSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_DEV") redirect("/login");

  const [featureFlags, appSettings] = await Promise.all([
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
    prisma.appSetting.findMany({ orderBy: { key: "asc" } }),
  ]);

  const enabledFlags = featureFlags.filter(f => f.isEnabled).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        compact
        title="Ustawienia systemu"
        subtitle="Flagi funkcji i globalna konfiguracja portalu"
      />

      {/* Feature Flags */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Flag size={15} style={{ color: "var(--accent)" }} />
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Flagi funkcji (Feature Flags)</h2>
          <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto" }}>
            {enabledFlags}/{featureFlags.length} włączonych
          </span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Klucz</th>
                <th>Opis</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {featureFlags.map(flag => (
                <tr key={flag.key}>
                  <td>
                    <code style={{ fontSize: "12.5px", background: "var(--section-bg)", padding: "2px 6px", borderRadius: "4px", color: "var(--accent)" }}>
                      {flag.key}
                    </code>
                  </td>
                  <td style={{ fontSize: "13px", color: "var(--muted)" }}>{flag.description ?? "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    {flag.isEnabled
                      ? <CheckCircle2 size={16} style={{ color: "var(--ok)" }} />
                      : <XCircle size={16} style={{ color: "var(--line)" }} />
                    }
                  </td>
                </tr>
              ))}
              {featureFlags.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>Brak flag</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* App Settings */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Settings2 size={15} style={{ color: "var(--accent)" }} />
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Ustawienia aplikacji</h2>
          <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto" }}>{appSettings.length} wartości</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Klucz</th>
                <th>Wartość</th>
              </tr>
            </thead>
            <tbody>
              {appSettings.map(setting => (
                <tr key={setting.key}>
                  <td>
                    <code style={{ fontSize: "12.5px", background: "var(--section-bg)", padding: "2px 6px", borderRadius: "4px", color: "var(--accent)" }}>
                      {setting.key}
                    </code>
                  </td>
                  <td style={{ fontSize: "13px" }}>{setting.value}</td>
                </tr>
              ))}
              {appSettings.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>Brak ustawień</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
