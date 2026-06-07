import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Users, Shield, User, Building2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const ROLE_LABELS: Record<string, string> = {
  BRANCH_HEAD: "Kierownik Oddziału",
  CLIENT_HEAD: "Dyrektor Centrali",
  SUPON_ADMIN: "Administrator SUPON",
  SUPON_DEV: "Deweloper systemu",
};

const ROLE_BADGE: Record<string, string> = {
  BRANCH_HEAD: "badge-pending",
  CLIENT_HEAD: "badge-warn",
  SUPON_ADMIN: "badge-ok",
  SUPON_DEV: "badge-info",
};

export default async function DevUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_DEV") redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      client: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  const byRole = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const suponUsers = users.filter(u => u.role.startsWith("SUPON"));
  const clientUsers = users.filter(u => !u.role.startsWith("SUPON"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        compact
        title="Użytkownicy systemu"
        subtitle="Wszyscy użytkownicy portalu — wszystkich klientów i ról"
      />

      {/* Stats by role */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div key={role} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "24px", fontWeight: 800 }}>{byRole[role] ?? 0}</div>
            <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "3px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* SUPON team */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Shield size={15} style={{ color: "var(--accent)" }} />
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Zespół SUPON</h2>
          <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto" }}>{suponUsers.length} użytkowników</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Imię i Nazwisko</th>
                <th>Email</th>
                <th>Rola</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {suponUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: "var(--muted)", fontSize: "13px" }}>{u.email}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role] ?? "badge-pending"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? "badge-ok" : "badge-err"}`}>
                      {u.isActive ? "Aktywny" : "Nieaktywny"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client users */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={15} style={{ color: "var(--accent)" }} />
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Użytkownicy klientów</h2>
          <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto" }}>{clientUsers.length} użytkowników</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Imię i Nazwisko</th>
                <th>Email</th>
                <th>Rola</th>
                <th>Klient</th>
                <th>Oddział</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clientUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: "var(--muted)", fontSize: "13px" }}>{u.email}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role] ?? "badge-pending"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px" }}>{u.client?.name?.split("—")[0].trim() ?? "—"}</td>
                  <td style={{ fontSize: "13px", color: "var(--muted)" }}>{u.branch?.name?.split("—")[0].trim() ?? "—"}</td>
                  <td>
                    <span className={`badge ${u.isActive ? "badge-ok" : "badge-err"}`}>
                      {u.isActive ? "Aktywny" : "Nieaktywny"}
                    </span>
                  </td>
                </tr>
              ))}
              {clientUsers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: "32px" }}>
                    Brak użytkowników klientów
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
