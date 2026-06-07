import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Building2, Users, ShoppingBag } from "lucide-react";
import { resolveModules, resolveLimits } from "@/config/modules.config";
import ClientConfigForm from "./ClientConfigForm";
import PageHeader from "@/components/PageHeader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DevClientConfigPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_DEV") redirect("/login");

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      config: true,
      _count: { select: { users: true, branches: true, orders: true } },
    },
  });

  if (!client) notFound();

  const modules = resolveModules(client.config?.modules);
  const limits = resolveLimits(client.config?.limits);

  // Resolve who last updated config
  let updatedByName: string | null = null;
  if (client.config?.updatedBy) {
    const updater = await prisma.user.findUnique({
      where: { id: client.config.updatedBy },
      select: { name: true },
    });
    updatedByName = updater?.name ?? null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <Link href="/developer/dashboard" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px", paddingLeft: 0 }}>
          <ArrowLeft size={14} /> Powrót do przeglądu
        </Link>
        <PageHeader
          compact
          title={client.name.split("—")[0].trim()}
          subtitle={`NIP: ${client.nip}${client.address ? ` · ${client.address}` : ""}`}
        />
      </div>

      {/* Client stats */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { icon: Users, label: "Użytkownicy", value: client._count.users },
          { icon: Building2, label: "Oddziały", value: client._count.branches },
          { icon: ShoppingBag, label: "Zamówienia", value: client._count.orders },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>{value}</span>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{label}</span>
          </div>
        ))}
        <div className="card" style={{ padding: "12px 18px" }}>
          <span className={`badge ${client.isActive ? "badge-ok" : "badge-err"}`}>
            {client.isActive ? "Klient aktywny" : "Klient nieaktywny"}
          </span>
        </div>
      </div>

      {/* Config form */}
      <ClientConfigForm
        clientId={client.id}
        clientName={client.name}
        initialModules={modules}
        initialLimits={limits}
        lastUpdatedAt={client.config?.updatedAt?.toISOString() ?? null}
        lastUpdatedBy={updatedByName}
      />
    </div>
  );
}
