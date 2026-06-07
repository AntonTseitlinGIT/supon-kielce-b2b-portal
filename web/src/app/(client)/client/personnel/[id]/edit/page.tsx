import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EmployeeForm from "@/app/(client)/client/personnel/EmployeeForm";

type Params = Promise<{ id: string }>;

interface PageProps {
  params: Params;
}

export default async function ClientEditEmployeePage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;
  const { role, clientId, branchId } = session.user;

  // 1. Fetch employee
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      branch: true,
    },
  });

  // Verify access control
  if (!employee || employee.branch.clientId !== clientId) {
    notFound();
  }

  if (role === "BRANCH_HEAD" && employee.branchId !== branchId) {
    redirect("/client/personnel");
  }

  // 2. Fetch branches
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

  // Format initial employee data for the form
  const formattedEmployee = {
    id: employee.id,
    employeeNr: employee.employeeNr,
    name: employee.name,
    jobTitle: employee.jobTitle,
    branchId: employee.branchId,
    address: employee.address,
    status: employee.status,
    rfid: employee.rfid,
    photoUrl: employee.photoUrl,
    sizes: (employee.sizes as any) || {},
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Breadcrumbs */}
      <div>
        <Link href={`/client/personnel/${employee.id}`} className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: "8px" }}>
          <ArrowLeft size={16} style={{ marginRight: "6px" }} /> Powrót do pracownika
        </Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", margin: 0 }}>
          Edytuj pracownika
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Zaktualizuj profil rozmiarów i dane kontaktowe dla {employee.name}
        </p>
      </div>

      {/* Form */}
      <EmployeeForm
        branches={branches}
        initialData={formattedEmployee}
        userRole={role}
      />
    </div>
  );
}
