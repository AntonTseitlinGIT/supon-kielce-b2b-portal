import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewTicketForm from "./NewTicketForm";

export default async function ClientNewTicketPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, clientId, branchId } = session.user;

  // 1. Fetch authorized branches
  const branches = await prisma.branch.findMany({
    where: {
      clientId: clientId!,
      isActive: true,
      ...(role === "BRANCH_HEAD" ? { id: branchId! } : {}),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  // 2. Fetch orders to link to the ticket (including sizes information)
  const orders = await prisma.order.findMany({
    where: {
      clientId: clientId!,
      ...(role === "BRANCH_HEAD" ? { branchId: branchId! } : {}),
    },
    select: {
      id: true,
      orderNr: true,
      items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          articleNr: true,
          size: true,
          product: {
            select: {
              availableSizes: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch active employees
  const employees = await prisma.employee.findMany({
    where: {
      branch: { clientId: clientId! },
      status: "ACTIVE",
      deletedAt: null,
      ...(role === "BRANCH_HEAD" ? { branchId: branchId! } : {}),
    },
    select: {
      id: true,
      name: true,
      branchId: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="col-20">
      {/* Breadcrumbs */}
      <div>
        <Link href="/client/tickets" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: "8px" }}>
          <ArrowLeft size={16} style={{ marginRight: "6px" }} /> Powrót do zgłoszeń
        </Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", margin: 0 }}>
          Nowe zgłoszenie
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>
          Zgłoś reklamację towaru, chęć wymiany rozmiaru lub zapytanie ogólne
        </p>
      </div>

      {/* Form */}
      <NewTicketForm
        branches={branches}
        orders={orders as any}
        employees={employees}
        userRole={role}
        defaultBranchId={role === "BRANCH_HEAD" ? branchId! : undefined}
      />
    </div>
  );
}
