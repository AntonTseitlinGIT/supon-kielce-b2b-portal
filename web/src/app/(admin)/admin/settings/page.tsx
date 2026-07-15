import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SettingsClient from "./SettingsClient";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Ustawienia Systemowe | SUPON Kielce",
};

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

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
      
      <PageHeader title="Ustawienia Portalu" subtitle="Zarządzanie globalnymi parametrami organizacji SUPON Kielce oraz konfiguracja przełączników funkcji (Feature Flags)" />

      <div className="container" style={{ padding: 0 }}>
        <SettingsClient 
          settings={serializedSettings} 
          featureFlags={serializedFeatureFlags} 
        />
      </div>

    </div>
  );
}
