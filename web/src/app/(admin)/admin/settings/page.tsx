import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Ustawienia Systemowe | SUPON Kielce",
};

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admin access control
  if (session.user.role !== "SUPON_ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fetch settings & feature flags
  const [settings, featureFlags] = await Promise.all([
    prisma.appSetting.findMany({
      orderBy: { key: "asc" }
    }),
    prisma.featureFlag.findMany({
      orderBy: { key: "asc" }
    })
  ]);

  const serializedSettings = settings.map((s) => ({
    key: s.key,
    value: s.value,
  }));

  const serializedFeatureFlags = featureFlags.map((ff) => ({
    key: ff.key,
    isEnabled: ff.isEnabled,
    description: ff.description,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      
      {/* Page Header */}
      <header className="page-header" style={{ borderBottom: "1px solid var(--line)", background: "transparent", margin: "0 -24px 24px -24px", padding: "24px" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, margin: 0 }}>Ustawienia Portalu</h1>
            <p className="subtitle" style={{ fontSize: "15px", color: "var(--muted)", margin: "6px 0 0 0" }}>
              Zarządzanie globalnymi parametrami organizacji SUPON Kielce oraz konfiguracja przełączników funkcji (Feature Flags)
            </p>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: 0 }}>
        <SettingsClient 
          settings={serializedSettings} 
          featureFlags={serializedFeatureFlags} 
        />
      </div>

    </div>
  );
}
