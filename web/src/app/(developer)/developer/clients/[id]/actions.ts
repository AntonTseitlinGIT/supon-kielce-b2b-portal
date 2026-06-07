"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { MODULES, DEFAULT_LIMITS } from "@/config/modules.config";

interface SaveConfigInput {
  modules: Record<string, boolean>;
  limits: { maxUsers: number; maxBranches: number };
}

export async function saveClientConfig(clientId: string, input: SaveConfigInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_DEV") {
    return { error: "Brak uprawnień." };
  }

  // Validate modules — only known keys accepted
  const knownKeys = new Set(MODULES.map(m => m.key));
  const sanitizedModules: Record<string, boolean> = {};
  for (const [key, val] of Object.entries(input.modules)) {
    if (knownKeys.has(key) && typeof val === "boolean") {
      sanitizedModules[key] = val;
    }
  }

  // Validate limits
  const maxUsers = Math.max(1, Math.min(9999, Number(input.limits.maxUsers) || DEFAULT_LIMITS.maxUsers));
  const maxBranches = Math.max(1, Math.min(999, Number(input.limits.maxBranches) || DEFAULT_LIMITS.maxBranches));

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

    revalidatePath(`/developer/clients/${clientId}`);
    revalidatePath("/developer/dashboard");
    return { success: true };
  } catch {
    return { error: "Błąd zapisu konfiguracji. Spróbuj ponownie." };
  }
}

export async function resetClientConfig(clientId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_DEV") {
    return { error: "Brak uprawnień." };
  }

  try {
    await prisma.clientConfig.delete({ where: { clientId } }).catch(() => null);
    revalidatePath(`/developer/clients/${clientId}`);
    revalidatePath("/developer/dashboard");
    return { success: true };
  } catch {
    return { error: "Błąd resetowania. Spróbuj ponownie." };
  }
}
