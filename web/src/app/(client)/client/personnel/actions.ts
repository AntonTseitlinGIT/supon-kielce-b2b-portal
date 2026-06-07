"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmployeeStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface EmployeeFormInput {
  employeeNr: string;
  name: string;
  jobTitle: string;
  branchId: string;
  address?: string;
  sizes: {
    height?: string;
    chest?: string;
    waist?: string;
    shoes?: string;
    clothing?: string;
  };
  status: EmployeeStatus;
  rfid: boolean;
  photoUrl?: string;
}

export async function createEmployee(input: EmployeeFormInput) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji. Zaloguj się ponownie." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;

  if (role !== "BRANCH_HEAD" && role !== "CLIENT_HEAD") {
    return { success: false, error: "Brak uprawnień." };
  }

  let finalBranchId = input.branchId;
  if (role === "BRANCH_HEAD") {
    finalBranchId = userBranchId!;
  }

  try {
    // Check branch validity
    const branch = await prisma.branch.findFirst({
      where: { id: finalBranchId, clientId: clientId! },
    });

    if (!branch) {
      return { success: false, error: "Nieprawidłowy oddział." };
    }

    // Check employee sequence uniqueness inside branch
    const existing = await prisma.employee.findUnique({
      where: {
        employeeNr_branchId: {
          employeeNr: input.employeeNr,
          branchId: finalBranchId,
        },
      },
    });

    if (existing) {
      return { success: false, error: `Pracownik z numerem ${input.employeeNr} już istnieje w tym oddziale.` };
    }

    const newEmp = await prisma.employee.create({
      data: {
        employeeNr: input.employeeNr,
        name: input.name,
        jobTitle: input.jobTitle,
        branchId: finalBranchId,
        address: input.address || null,
        sizes: input.sizes as any,
        status: input.status,
        rfid: input.rfid,
        photoUrl: input.photoUrl || null,
        // Start as compliant by default, or run check
        ppeCompliant: true, 
        history: {
          create: {
            description: "Utworzono kartę pracownika w systemie.",
            createdById: session.user.id,
          },
        },
      },
    });

    revalidatePath("/client/personnel");
    revalidatePath("/client/dashboard");

    return { success: true, employeeId: newEmp.id };
  } catch (error) {
    console.error("Failed to create employee:", error);
    return { success: false, error: "Wystąpił błąd podczas dodawania pracownika." };
  }
}

export async function updateEmployee(id: string, input: EmployeeFormInput) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji. Zaloguj się ponownie." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;

  if (role !== "BRANCH_HEAD" && role !== "CLIENT_HEAD") {
    return { success: false, error: "Brak uprawnień." };
  }

  try {
    // Find employee and verify ownership
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!employee || employee.branch.clientId !== clientId) {
      return { success: false, error: "Nie znaleziono pracownika." };
    }

    if (role === "BRANCH_HEAD" && employee.branchId !== userBranchId) {
      return { success: false, error: "Brak uprawnień do edycji pracownika w tym oddziale." };
    }

    let finalBranchId = input.branchId;
    if (role === "BRANCH_HEAD") {
      finalBranchId = userBranchId!;
    }

    // Verify branch belongs to client
    const targetBranch = await prisma.branch.findFirst({
      where: { id: finalBranchId, clientId: clientId },
    });

    if (!targetBranch) {
      return { success: false, error: "Nieprawidłowy oddział docelowy." };
    }

    // Build log description
    const changes: string[] = [];
    if (employee.name !== input.name) changes.push(`nazwisko (${employee.name} -> ${input.name})`);
    if (employee.jobTitle !== input.jobTitle) changes.push(`stanowisko (${employee.jobTitle} -> ${input.jobTitle})`);
    if (employee.status !== input.status) changes.push(`status (${employee.status} -> ${input.status})`);
    if (employee.rfid !== input.rfid) changes.push(`kartę RFID (${employee.rfid ? "Włączona" : "Wyłączona"} -> ${input.rfid ? "Włączona" : "Wyłączona"})`);
    if (employee.branchId !== finalBranchId) changes.push(`oddział`);
    
    // Check sizes diff
    const oldSizes = (employee.sizes as Record<string, string>) || {};
    const newSizes = input.sizes as Record<string, string>;
    const sizeKeys: (keyof typeof oldSizes)[] = ["height", "chest", "waist", "shoes", "clothing"];
    const sizeChanges = sizeKeys.some(key => oldSizes[key] !== newSizes[key]);
    if (sizeChanges) changes.push("profil rozmiarowy");

    const description = changes.length > 0
      ? `Zaktualizowano dane pracownika: ${changes.join(", ")}.`
      : "Zapisano dane bez zmian.";

    await prisma.employee.update({
      where: { id },
      data: {
        employeeNr: input.employeeNr,
        name: input.name,
        jobTitle: input.jobTitle,
        branchId: finalBranchId,
        address: input.address || null,
        sizes: input.sizes as any,
        status: input.status,
        rfid: input.rfid,
        photoUrl: input.photoUrl !== undefined ? input.photoUrl : employee.photoUrl,
        history: {
          create: {
            description,
            createdById: session.user.id,
          },
        },
      },
    });

    revalidatePath("/client/personnel");
    revalidatePath(`/client/personnel/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update employee:", error);
    return { success: false, error: "Wystąpił błąd podczas zapisywania zmian." };
  }
}

export async function deleteEmployee(id: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji. Zaloguj się ponownie." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;

  if (role !== "BRANCH_HEAD" && role !== "CLIENT_HEAD") {
    return { success: false, error: "Brak uprawnień." };
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!employee || employee.branch.clientId !== clientId) {
      return { success: false, error: "Nie znaleziono pracownika." };
    }

    if (role === "BRANCH_HEAD" && employee.branchId !== userBranchId) {
      return { success: false, error: "Brak uprawnień do usunięcia pracownika z tego oddziału." };
    }

    // Set employeeId to null in OrderItem records to prevent foreign key violations
    await prisma.orderItem.updateMany({
      where: { employeeId: id },
      data: { employeeId: null },
    });

    // Delete the employee (cascading relations like history, issued items, etc. are handled by DB schema)
    await prisma.employee.delete({
      where: { id },
    });

    revalidatePath("/client/personnel");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return { success: false, error: "Wystąpił błąd podczas usuwania pracownika." };
  }
}

interface BulkEmployeeInput {
  employeeNr: string;
  name: string;
  jobTitle: string;
  height?: string;
  chest?: string;
  waist?: string;
  clothing?: string;
  shoes?: string;
}

export async function bulkCreateEmployees(targetBranchId: string, list: BulkEmployeeInput[]) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji. Zaloguj się ponownie." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;

  if (role !== "BRANCH_HEAD" && role !== "CLIENT_HEAD") {
    return { success: false, error: "Brak uprawnień." };
  }

  let finalBranchId = targetBranchId;
  if (role === "BRANCH_HEAD") {
    finalBranchId = userBranchId!;
  }

  if (!finalBranchId) {
    return { success: false, error: "Wybierz oddział docelowy." };
  }

  try {
    // Check branch ownership
    const branch = await prisma.branch.findFirst({
      where: { id: finalBranchId, clientId: clientId! },
    });

    if (!branch) {
      return { success: false, error: "Nieprawidłowy oddział." };
    }

    let createdCount = 0;
    let skippedCount = 0;

    // Process sequentially or using transaction. Sequentially is fine for moderately sized lists.
    for (const item of list) {
      if (!item.employeeNr || !item.name || !item.jobTitle) {
        skippedCount++;
        continue;
      }

      // Check if employeeNr already exists in the same branch
      const existing = await prisma.employee.findUnique({
        where: {
          employeeNr_branchId: {
            employeeNr: item.employeeNr,
            branchId: finalBranchId,
          },
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.employee.create({
        data: {
          employeeNr: item.employeeNr,
          name: item.name,
          jobTitle: item.jobTitle,
          branchId: finalBranchId,
          sizes: {
            height: item.height || undefined,
            chest: item.chest || undefined,
            waist: item.waist || undefined,
            clothing: item.clothing || undefined,
            shoes: item.shoes || undefined,
          } as any,
          status: "ACTIVE",
          rfid: false,
          ppeCompliant: true,
          history: {
            create: {
              description: "Dodano pracownika za pomocą masowego importu.",
              createdById: session.user.id,
            },
          },
        },
      });

      createdCount++;
    }

    revalidatePath("/client/personnel");

    return {
      success: true,
      createdCount,
      skippedCount,
    };
  } catch (error) {
    console.error("Failed bulk import of employees:", error);
    return { success: false, error: "Wystąpił błąd podczas masowego dodawania pracowników." };
  }
}

