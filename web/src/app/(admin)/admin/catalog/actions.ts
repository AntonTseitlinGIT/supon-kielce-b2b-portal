"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createProduct(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPON_DEV") {
    return { success: false, error: "Brak uprawnień. Tylko Deweloper SUPON może dodawać towary." };
  }

  const name = formData.get("name") as string;
  const articleNr = formData.get("articleNr") as string;
  const categoryId = formData.get("categoryId") as string;
  const description = formData.get("description") as string;
  const availableSizesStr = formData.get("availableSizes") as string;
  const isActive = formData.get("isActive") !== "false";

  if (!name || name.trim().length === 0) {
    return { success: false, error: "Nazwa towaru jest wymagana." };
  }
  if (!articleNr || articleNr.trim().length === 0) {
    return { success: false, error: "Numer artykułu jest wymagany." };
  }
  if (!categoryId) {
    return { success: false, error: "Kategoria ŚOI jest wymagana." };
  }

  // Parse available sizes (comma separated)
  const availableSizes = availableSizesStr
    ? availableSizesStr.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
    : ["Uniwersalny"];

  try {
    const existing = await prisma.product.findUnique({
      where: { articleNr: articleNr.trim() }
    });

    if (existing) {
      return { success: false, error: "Artykuł o tym numerze już istnieje w katalogu." };
    }

    await prisma.product.create({
      data: {
        name: name.trim(),
        articleNr: articleNr.trim(),
        categoryId,
        description: description?.trim() || null,
        availableSizes,
        isActive,
        photoUrls: [],
      }
    });

    revalidatePath("/admin/catalog");
    return { success: true, message: "Towar został pomyślnie dodany do katalogu!" };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: "Błąd bazy danych przy dodawaniu towaru." };
  }
}

export async function updateProduct(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPON_DEV") {
    return { success: false, error: "Brak uprawnień. Tylko Deweloper SUPON może edytować towary." };
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const articleNr = formData.get("articleNr") as string;
  const categoryId = formData.get("categoryId") as string;
  const description = formData.get("description") as string;
  const availableSizesStr = formData.get("availableSizes") as string;
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    return { success: false, error: "Identyfikator towaru jest wymagany." };
  }
  if (!name || name.trim().length === 0) {
    return { success: false, error: "Nazwa towaru jest wymagana." };
  }
  if (!articleNr || articleNr.trim().length === 0) {
    return { success: false, error: "Numer artykułu jest wymagany." };
  }
  if (!categoryId) {
    return { success: false, error: "Kategoria ŚOI jest wymagana." };
  }

  const availableSizes = availableSizesStr
    ? availableSizesStr.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
    : ["Uniwersalny"];

  try {
    const existing = await prisma.product.findFirst({
      where: {
        articleNr: articleNr.trim(),
        id: { not: id }
      }
    });

    if (existing) {
      return { success: false, error: "Artykuł o tym numerze już istnieje w bazie danych." };
    }

    await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        articleNr: articleNr.trim(),
        categoryId,
        description: description?.trim() || null,
        availableSizes,
        isActive,
      }
    });

    revalidatePath("/admin/catalog");
    return { success: true, message: "Dane towaru zostały zaktualizowane!" };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { success: false, error: "Błąd bazy danych przy aktualizacji towaru." };
  }
}
