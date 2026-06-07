import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import UserManageClient from "./UserManageClient";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Użytkownicy systemu | SUPON Kielce",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPON_DEV") redirect("/admin/dashboard");

  const [users, clients, branches] = await Promise.all([
    prisma.user.findMany({
      include: {
        client: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      <PageHeader title="Użytkownicy systemu" subtitle="Zarządzaj kontami użytkowników, rolami i dostępami do portalu" />

      <div className="container" style={{ padding: 0 }}>
        <UserManageClient
          users={users as any}
          clients={clients}
          branches={branches}
        />
      </div>
    </div>
  );
}
