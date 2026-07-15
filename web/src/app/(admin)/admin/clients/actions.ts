"use server";

import { auth } from "@/lib/auth";
import { isSuponRole } from "@/config/permissions.config";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// CLIENT ACTIONS

export async function createClient(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak uprawnień. Tylko Administrator SUPON może dodawać klientów." };
  }

  const name = formData.get("name") as string;
  const nip = formData.get("nip") as string;
  const address = formData.get("address") as string;
  const logoUrl = formData.get("logoUrl") as string;
  const isActive = formData.get("isActive") !== "false"; // default to true

  if (!name || name.trim().length === 0) {
    return { success: false, error: "Nazwa klienta jest wymagana." };
  }
  if (!nip || nip.trim().length === 0) {
    return { success: false, error: "NIP jest wymagany." };
  }

  try {
    const existing = await prisma.client.findUnique({
      where: { nip: nip.trim() }
    });

    if (existing) {
      return { success: false, error: "Klient o podanym NIP już istnieje w systemie." };
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        nip: nip.trim(),
        address: address?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        isActive,
      }
    });

    revalidatePath("/admin/clients");
    return { success: true, message: "Klient został pomyślnie utworzony!", clientId: client.id };
  } catch (error: any) {
    console.error("Error creating client:", error);
    return { success: false, error: "Błąd bazy danych podczas tworzenia klienta." };
  }
}

export async function updateClient(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak uprawnień. Tylko Administrator SUPON może edytować klientów." };
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const nip = formData.get("nip") as string;
  const address = formData.get("address") as string;
  const logoUrl = formData.get("logoUrl") as string;
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    return { success: false, error: "Identyfikator klienta jest wymagany." };
  }
  if (!name || name.trim().length === 0) {
    return { success: false, error: "Nazwa klienta jest wymagana." };
  }
  if (!nip || nip.trim().length === 0) {
    return { success: false, error: "NIP jest wymagany." };
  }

  try {
    // Check NIP conflict
    const existingNip = await prisma.client.findFirst({
      where: {
        nip: nip.trim(),
        id: { not: id }
      }
    });

    if (existingNip) {
      return { success: false, error: "Inny klient posiada już ten numer NIP." };
    }

    await prisma.client.update({
      where: { id },
      data: {
        name: name.trim(),
        nip: nip.trim(),
        address: address?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        isActive,
      }
    });

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
    return { success: true, message: "Dane klienta zostały pomyślnie zaktualizowane!" };
  } catch (error: any) {
    console.error("Error updating client:", error);
    return { success: false, error: "Błąd bazy danych podczas aktualizacji klienta." };
  }
}

// CLIENT BRANCH ACTIONS

export async function createClientBranch(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak uprawnień." };
  }

  const clientId = formData.get("clientId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;

  if (!clientId) {
    return { success: false, error: "Brak identyfikatora klienta." };
  }
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
        isActive: true,
      }
    });

    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true, message: "Oddział został pomyślnie utworzony!" };
  } catch (error: any) {
    console.error("Error creating client branch:", error);
    return { success: false, error: "Błąd bazy danych przy tworzeniu oddziału." };
  }
}

export async function updateClientBranch(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak uprawnień." };
  }

  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    return { success: false, error: "Brak identyfikatora oddziału." };
  }
  if (!clientId) {
    return { success: false, error: "Brak identyfikatora klienta." };
  }
  if (!name || name.trim().length === 0) {
    return { success: false, error: "Nazwa oddziału jest wymagana." };
  }
  if (!address || address.trim().length === 0) {
    return { success: false, error: "Adres oddziału jest wymagany." };
  }

  try {
    await prisma.branch.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address.trim(),
        isActive,
      }
    });

    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true, message: "Oddział został pomyślnie zaktualizowany!" };
  } catch (error: any) {
    console.error("Error updating client branch:", error);
    return { success: false, error: "Błąd bazy danych przy aktualizacji oddziału." };
  }
}

// CLIENT PRODUCT CUSTOM PRICE ACTIONS

export async function saveClientProductPrice(
  clientId: string,
  productId: string,
  priceStr: string,
  isActive: boolean
) {
  const session = await auth();

  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak uprawnień." };
  }

  try {
    let customPriceDecimal = null;
    if (priceStr && priceStr.trim().length > 0) {
      const parsed = parseFloat(priceStr.replace(",", "."));
      if (isNaN(parsed) || parsed < 0) {
        return { success: false, error: "Nieprawidłowa wartość ceny." };
      }
      customPriceDecimal = parsed;
    }

    // Upsert client product
    await prisma.clientProduct.upsert({
      where: {
        clientId_productId: {
          clientId,
          productId,
        }
      },
      update: {
        customPrice: customPriceDecimal,
        isActive,
      },
      create: {
        clientId,
        productId,
        customPrice: customPriceDecimal,
        isActive,
      }
    });

    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true, message: "Cena indywidualna zaktualizowana!" };
  } catch (error: any) {
    console.error("Error updating client product price:", error);
    return { success: false, error: "Błąd zapisu ceny indywidualnej." };
  }
}

interface SaveConfigInput {
  modules: Record<string, boolean>;
  limits: { maxUsers: number; maxBranches: number };
}

export async function saveClientConfig(clientId: string, input: SaveConfigInput) {
  const session = await auth();
  if (!session?.user || !isSuponRole(session.user.role)) {
    return { error: "Brak uprawnień." };
  }

  // Validate modules — only known keys accepted
  const sanitizedModules: Record<string, boolean> = {};
  const knownKeys = new Set(["orders", "personnel", "tickets", "documents", "branches", "catalog", "reports"]);
  for (const [key, val] of Object.entries(input.modules)) {
    if (knownKeys.has(key) && typeof val === "boolean") {
      sanitizedModules[key] = val;
    }
  }

  // Validate limits
  const maxUsers = Math.max(1, Math.min(9999, Number(input.limits.maxUsers) || 50));
  const maxBranches = Math.max(1, Math.min(999, Number(input.limits.maxBranches) || 10));

  try {
    await prisma.clientConfig.upsert({
      where: { clientId },
      update: {
        modules: sanitizedModules,
        limits: { maxUsers, maxBranches },
        updatedBy: session.user.id,
      },
      create: {
        clientId,
        modules: sanitizedModules,
        limits: { maxUsers, maxBranches },
        updatedBy: session.user.id,
      },
    });

    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error saving client config:", error);
    return { error: "Błąd zapisu konfiguracji. Spróbuj ponownie." };
  }
}

export async function resetClientConfig(clientId: string) {
  const session = await auth();
  if (!session?.user || !isSuponRole(session.user.role)) {
    return { error: "Brak uprawnień." };
  }

  try {
    await prisma.clientConfig.delete({ where: { clientId } }).catch(() => null);
    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error resetting client config:", error);
    return { error: "Błąd resetowania. Spróbuj ponownie." };
  }
}
