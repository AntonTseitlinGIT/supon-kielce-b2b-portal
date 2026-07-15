"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function createUser(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_ADMIN") {
    return { success: false, error: "Brak uprawnień. Tylko Administrator SUPON może tworzyć użytkowników." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const clientId = (formData.get("clientId") as string) || null;
  const branchId = (formData.get("branchId") as string) || null;

  if (!name?.trim()) return { success: false, error: "Imię i nazwisko jest wymagane." };
  if (!email?.trim()) return { success: false, error: "Login jest wymagany." };
  if (!z.string().min(3).safeParse(email.trim()).success) return { success: false, error: "Login musi mieć co najmniej 3 znaki." };
  if (!password || password.length < 6) return { success: false, error: "Hasło musi mieć co najmniej 6 znaków." };
  if (!role) return { success: false, error: "Rola użytkownika jest wymagana." };

  const validRoles = ["BRANCH_HEAD", "CLIENT_HEAD", "SUPON_ADMIN"];
  if (!validRoles.includes(role)) return { success: false, error: "Nieprawidłowa rola." };

  try {
    // If a branch is assigned, it must belong to the assigned client
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { clientId: true } });
      if (!branch || branch.clientId !== clientId) {
        return { success: false, error: "Wybrany oddział nie należy do wskazanego klienta." };
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) return { success: false, error: "Użytkownik o podanym adresie e-mail już istnieje." };

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role as any,
        clientId: clientId || null,
        branchId: branchId || null,
        isActive: true,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Użytkownik został pomyślnie utworzony!", userId: user.id };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: "Błąd bazy danych podczas tworzenia użytkownika." };
  }
}

export async function updateUser(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_ADMIN") {
    return { success: false, error: "Brak uprawnień. Tylko Administrator SUPON może edytować użytkowników." };
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const clientId = (formData.get("clientId") as string) || null;
  const branchId = (formData.get("branchId") as string) || null;
  const isActive = formData.get("isActive") === "true";

  if (!id) return { success: false, error: "Brak ID użytkownika." };
  if (!name?.trim()) return { success: false, error: "Imię i nazwisko jest wymagane." };
  if (!email?.trim()) return { success: false, error: "Login jest wymagany." };
  if (!z.string().min(3).safeParse(email.trim()).success) return { success: false, error: "Login musi mieć co najmniej 3 znaki." };

  const validRoles = ["BRANCH_HEAD", "CLIENT_HEAD", "SUPON_ADMIN"];
  if (!role || !validRoles.includes(role)) return { success: false, error: "Nieprawidłowa rola." };

  try {
    // If a branch is assigned, it must belong to the assigned client
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { clientId: true } });
      if (!branch || branch.clientId !== clientId) {
        return { success: false, error: "Wybrany oddział nie należy do wskazanego klienta." };
      }
    }

    const thisUser = await prisma.user.findUnique({ where: { id } });
    if (thisUser?.role === "SUPON_ADMIN" && (!isActive || role !== "SUPON_ADMIN")) {
      const adminCount = await prisma.user.count({ where: { role: "SUPON_ADMIN", isActive: true } });
      if (adminCount <= 1) {
        return { success: false, error: "Nie można zmienić lub dezaktywować ostatniego aktywnego Administratora SUPON." };
      }
    }

    const emailConflict = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), id: { not: id } } });
    if (emailConflict) return { success: false, error: "Inny użytkownik posiada już ten adres e-mail." };

    await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role as any,
        clientId: clientId || null,
        branchId: branchId || null,
        isActive,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Dane użytkownika zostały zaktualizowane!" };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return { success: false, error: "Błąd bazy danych podczas aktualizacji użytkownika." };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPON_ADMIN") {
    return { success: false, error: "Brak uprawnień." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Nowe hasło musi mieć co najmniej 6 znaków." };
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    revalidatePath("/admin/users");
    return { success: true, message: "Hasło zostało pomyślnie zresetowane." };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Błąd bazy danych podczas resetowania hasła." };
  }
}
