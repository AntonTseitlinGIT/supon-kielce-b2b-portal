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
  const where: any = { deletedAt: null };
  if (role === "BRANCH_HEAD") {
    where.branchId = branchId!;
  } else {
    where.branch = { clientId: clientId! };
  }

  // 2. Build where filter for deleted employees (same ownership scope)
  const deletedWhere: any = { deletedAt: { not: null } };
  if (role === "BRANCH_HEAD") {
    deletedWhere.branchId = branchId!;
  } else {
    deletedWhere.branch = { clientId: clientId! };
  }

  // 3. Fetch active employees, deleted employees, and branches in parallel
  const [employees, deletedEmployees, branches] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        branch: { select: { name: true } },
      },
    }),
    prisma.employee.findMany({
      where: deletedWhere,
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

  const formatEmp = (emp: typeof employees[number]) => ({
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
  });

  const formattedEmployees = employees.map(formatEmp);
  const formattedDeleted = deletedEmployees.map(formatEmp);

  return (
    <div className="col-20">

      {/* Interactive Personnel List */}
      <PersonnelList
        initialEmployees={formattedEmployees}
        deletedEmployees={formattedDeleted}
        branches={branches}
        showBranchFilter={role === "CLIENT_HEAD"}
      />
    </div>
  );
}
