import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Building2, Users, Settings2, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { MODULES, resolveModules } from "@/config/modules.config";
import PageHeader from "@/components/PageHeader";

export default async function DevDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_DEV") redirect("/login");

  const [clients, totalUsers, totalOrders] = await Promise.all([
    prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        config: true,
        _count: { select: { users: true, branches: true, orders: true } },
      },
    }),
    prisma.user.count(),
    prisma.order.count(),
  ]);

  const activeClients = clients.filter(c => c.isActive);
  const configuredClients = clients.filter(c => c.config !== null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        compact
        title="Developer Dashboard"
        subtitle="Przegląd systemu — klienci, moduły, konfiguracja portalu"
      />

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Klientów", value: clients.length, sub: `${activeClients.length} aktywnych`, icon: Building2, color: "#4f46e5" },
          { label: "Skonfigurowanych", value: configuredClients.length, sub: `z ${clients.length} klientów`, icon: Settings2, color: "#10b981" },
          { label: "Użytkowników", value: totalUsers, sub: "wszystkich ról", icon: Users, color: "#f59e0b" },
          { label: "Zamówień", value: totalOrders, sub: "łącznie w systemie", icon: CheckCircle2, color: "#3b82f6" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: "20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>{label}</div>
              <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "2px" }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Client list */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Konfiguracja modułów — wszyscy klienci</h2>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{clients.length} rekordów</span>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Klient</th>
                <th>Status</th>
                {MODULES.map(m => (
                  <th key={m.key} style={{ textAlign: "center", fontSize: "11px" }}>{m.label}</th>
                ))}
                <th>Użytkownicy</th>
                <th>Oddziały</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const modules = resolveModules(client.config?.modules);
                return (
                  <tr key={client.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{client.name.split("—")[0].trim()}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>NIP: {client.nip}</div>
                    </td>
                    <td>
                      <span className={`badge ${client.isActive ? "badge-ok" : "badge-err"}`}>
                        {client.isActive ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    {MODULES.map(m => (
                      <td key={m.key} style={{ textAlign: "center" }}>
                        {modules[m.key]
                          ? <CheckCircle2 size={16} style={{ color: "var(--ok)" }} />
                          : <XCircle size={16} style={{ color: "var(--line)" }} />
                        }
                      </td>
                    ))}
                    <td style={{ color: "var(--muted)", fontSize: "13px" }}>{client._count.users}</td>
                    <td style={{ color: "var(--muted)", fontSize: "13px" }}>{client._count.branches}</td>
                    <td>
                      <Link
                        href={`/developer/clients/${client.id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        Konfiguruj <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
