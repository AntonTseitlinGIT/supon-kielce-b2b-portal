import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Building2, ChevronRight, CheckCircle2, XCircle, Users, ShoppingBag, GitBranch } from "lucide-react";
import { resolveModules } from "@/config/modules.config";
import { MODULES } from "@/config/modules.config";
import PageHeader from "@/components/PageHeader";

export default async function DevClientsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_DEV") redirect("/login");

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      config: true,
      _count: { select: { users: true, branches: true, orders: true } },
    },
  });

  const activeClients = clients.filter(c => c.isActive);
  const configuredClients = clients.filter(c => c.config !== null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        compact
        title="Konfiguracja klientów"
        subtitle="Zarządzanie modułami i limitami dla każdego klienta portalu"
      />

      {/* Summary row */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { icon: Building2, label: "Wszystkich klientów", value: clients.length, color: "#4f46e5" },
          { icon: CheckCircle2, label: "Aktywnych", value: activeClients.length, color: "#10b981" },
          { icon: GitBranch, label: "Skonfigurowanych", value: configuredClients.length, color: "#f59e0b" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", flex: "1", minWidth: "160px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Client list */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Lista klientów</h2>
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
                <th style={{ textAlign: "center" }}><Users size={13} /></th>
                <th style={{ textAlign: "center" }}><GitBranch size={13} /></th>
                <th style={{ textAlign: "center" }}><ShoppingBag size={13} /></th>
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
                      {client.address && (
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{client.address}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${client.isActive ? "badge-ok" : "badge-err"}`}>
                        {client.isActive ? "Aktywny" : "Nieaktywny"}
                      </span>
                      {!client.config && (
                        <div style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "4px" }}>brak konfiguracji</div>
                      )}
                    </td>
                    {MODULES.map(m => (
                      <td key={m.key} style={{ textAlign: "center" }}>
                        {modules[m.key]
                          ? <CheckCircle2 size={15} style={{ color: "var(--ok)" }} />
                          : <XCircle size={15} style={{ color: "var(--line)" }} />
                        }
                      </td>
                    ))}
                    <td style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>{client._count.users}</td>
                    <td style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>{client._count.branches}</td>
                    <td style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>{client._count.orders}</td>
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
              {clients.length === 0 && (
                <tr>
                  <td colSpan={MODULES.length + 6} style={{ textAlign: "center", color: "var(--muted)", padding: "40px" }}>
                    Brak klientów w systemie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
