import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import PersonnelList from "./PersonnelList";

export default async function ClientPersonnelPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, clientId, branchId } = session.user;

  // 1. Where filter for employees
  const where: any = {};
  if (role === "BRANCH_HEAD") {
    where.branchId = branchId!;
  } else {
    where.branch = { clientId: clientId! };
  }

  // 2. Fetch employees and branches in parallel
  const [employees, branches] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        branch: { select: { name: true } },
      },
    }),
    role === "CLIENT_HEAD"
      ? prisma.branch.findMany({
          where: { clientId: clientId!, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // Format employees data for the list component
  const formattedEmployees = employees.map((emp) => ({
    id: emp.id,
    employeeNr: emp.employeeNr,
    name: emp.name,
    jobTitle: emp.jobTitle,
    branchId: emp.branchId,
    branchName: emp.branch.name,
    status: emp.status,
    ppeCompliant: emp.ppeCompliant,
    rfid: emp.rfid,
    photoUrl: emp.photoUrl,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Interactive Personnel List */}
      <PersonnelList
        initialEmployees={formattedEmployees}
        branches={branches}
        showBranchFilter={role === "CLIENT_HEAD"}
      />
    </div>
  );
}
