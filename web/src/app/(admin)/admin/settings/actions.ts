"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveAppSettings(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPON_ADMIN") {
    return { success: false, error: "Brak uprawnień. Tylko Administrator SUPON może zmieniać ustawienia." };
  }

  const companyName = formData.get("supon_company_name") as string;
  const address = formData.get("supon_address") as string;
  const nip = formData.get("supon_nip") as string;
  const email = formData.get("supon_email") as string;
  const phone = formData.get("supon_phone") as string;

  try {
    const updates = [
      { key: "supon_company_name", value: companyName || "" },
      { key: "supon_address", value: address || "" },
      { key: "supon_nip", value: nip || "" },
      { key: "supon_email", value: email || "" },
      { key: "supon_phone", value: phone || "" },
    ];

    await Promise.all(
      updates.map((item) =>
        prisma.appSetting.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: { key: item.key, value: item.value },
        })
      )
    );

    revalidatePath("/admin/settings");
    return { success: true, message: "Dane firmy zostały pomyślnie zaktualizowane!" };
  } catch (error: any) {
    console.error("Error saving app settings:", error);
    return { success: false, error: "Błąd bazy danych podczas zapisu ustawień." };
  }
}

export async function toggleFeatureFlag(key: string, isEnabled: boolean) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPON_ADMIN") {
    return { success: false, error: "Brak uprawnień." };
  }

  try {
    await prisma.featureFlag.update({
      where: { key },
      data: { isEnabled },
    });

    revalidatePath("/admin/settings");
    return { success: true, message: `Flaga ${key} została zaktualizowana!` };
  } catch (error: any) {
    console.error(`Error toggling feature flag ${key}:`, error);
    return { success: false, error: "Błąd bazy danych podczas aktualizacji flagi." };
  }
}
