"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createBranch(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || session.user.role !== "CLIENT_HEAD") {
    return { success: false, error: "Brak uprawnień do wykonania tej operacji." };
  }

  const clientId = session.user.clientId;
  if (!clientId) {
    return { success: false, error: "Błąd uwierzytelniania: brak clientId." };
  }

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;

  if (!name || name.trim().length === 0) {
    return { success: false, error: "Nazwa oddziału jest wymagana." };
  }
  if (!address || address.trim().length === 0) {
    return { success: false, error: "Adres oddziału jest wymagany." };
  }

  try {
    await prisma.branch.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        clientId,
      },
    });

    revalidatePath("/client/branches");
    return { success: true, message: "Oddział został pomyślnie dodany!" };
  } catch (error: any) {
    console.error("Error creating branch:", error);
    return { success: false, error: "Wystąpił błąd bazy danych podczas tworzenia oddziału." };
  }
}

export async function updateBranch(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || session.user.role !== "CLIENT_HEAD") {
    return { success: false, error: "Brak uprawnień do wykonania tej operacji." };
  }

  const clientId = session.user.clientId;
  if (!clientId) {
    return { success: false, error: "Błąd uwierzytelniania: brak clientId." };
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    return { success: false, error: "Identyfikator oddziału jest wymagany." };
  }
  if (!name || name.trim().length === 0) {
    return { success: false, error: "Nazwa oddziału jest wymagana." };
  }
  if (!address || address.trim().length === 0) {
    return { success: false, error: "Adres oddziału jest wymagany." };
  }

  try {
    // Verify branch belongs to client
    const existing = await prisma.branch.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return { success: false, error: "Nie znaleziono wybranego oddziału." };
    }

    await prisma.branch.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address.trim(),
        isActive,
      },
    });

    revalidatePath("/client/branches");
    return { success: true, message: "Oddział został pomyślnie zaktualizowany!" };
  } catch (error: any) {
    console.error("Error updating branch:", error);
    return { success: false, error: "Wystąpił błąd bazy danych podczas aktualizacji oddziału." };
  }
}

export async function createDeliveryAddress(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak uprawnień." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;
  if (role !== "CLIENT_HEAD" && role !== "BRANCH_HEAD") {
    return { success: false, error: "Brak uprawnień." };
  }

  const branchId = formData.get("branchId") as string;
  const address = formData.get("address") as string;

  if (!branchId) {
    return { success: false, error: "Oddział jest wymagany." };
  }
  if (!address || address.trim().length === 0) {
    return { success: false, error: "Adres jest wymagany." };
  }

  if (role === "BRANCH_HEAD" && branchId !== userBranchId) {
    return { success: false, error: "Brak uprawnień do tego oddziału." };
  }

  try {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clientId: clientId! }
    });
    if (!branch) {
      return { success: false, error: "Nieprawidłowy oddział." };
    }

    await prisma.deliveryAddress.create({
      data: {
        branchId,
        address: address.trim(),
        isActive: true
      }
    });

    revalidatePath("/client/branches");
    return { success: true, message: "Adres dostawy został dodany!" };
  } catch (error) {
    console.error("Error creating delivery address:", error);
    return { success: false, error: "Błąd serwera." };
  }
}

export async function updateDeliveryAddress(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak uprawnień." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;
  if (role !== "CLIENT_HEAD" && role !== "BRANCH_HEAD") {
    return { success: false, error: "Brak uprawnień." };
  }

  const id = formData.get("id") as string;
  const address = formData.get("address") as string;
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    return { success: false, error: "Identyfikator adresu jest wymagany." };
  }
  if (!address || address.trim().length === 0) {
    return { success: false, error: "Adres jest wymagany." };
  }

  try {
    const existing = await prisma.deliveryAddress.findUnique({
      where: { id },
      include: { branch: true }
    });

    if (!existing || existing.branch.clientId !== clientId) {
      return { success: false, error: "Nie znaleziono adresu." };
    }

    if (role === "BRANCH_HEAD" && existing.branchId !== userBranchId) {
      return { success: false, error: "Brak uprawnień do tego oddziału." };
    }

    await prisma.deliveryAddress.update({
      where: { id },
      data: {
        address: address.trim(),
        isActive
      }
    });

    revalidatePath("/client/branches");
    return { success: true, message: "Adres dostawy został zaktualizowany!" };
  } catch (error) {
    console.error("Error updating delivery address:", error);
    return { success: false, error: "Błąd serwera." };
  }
}

export async function deleteDeliveryAddress(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak uprawnień." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;
  if (role !== "CLIENT_HEAD" && role !== "BRANCH_HEAD") {
    return { success: false, error: "Brak uprawnień." };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "Identyfikator adresu jest wymagany." };
  }

  try {
    const existing = await prisma.deliveryAddress.findUnique({
      where: { id },
      include: { branch: true }
    });

    if (!existing || existing.branch.clientId !== clientId) {
      return { success: false, error: "Nie znaleziono adresu." };
    }

    if (role === "BRANCH_HEAD" && existing.branchId !== userBranchId) {
      return { success: false, error: "Brak uprawnień do tego oddziału." };
    }

    await prisma.deliveryAddress.delete({
      where: { id }
    });

    revalidatePath("/client/branches");
    return { success: true, message: "Adres dostawy został usunięty!" };
  } catch (error) {
    console.error("Error deleting delivery address:", error);
    return { success: false, error: "Błąd serwera." };
  }
}

