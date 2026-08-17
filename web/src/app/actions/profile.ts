"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateUserProfile(input: UpdateProfileInput) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Brak autoryzacji. Zaloguj się ponownie." };
    }

    const userId = session.user.id;
    const { name, email, currentPassword, newPassword } = input;

    // 1. Validation
    if (!name || name.trim().length < 2) {
      return { success: false, error: "Imię i nazwisko musi mieć co najmniej 2 znaki." };
    }

    if (!email || !email.includes("@") && email.trim().length < 3) {
      return { success: false, error: "Wprowadź poprawny adres e-mail lub login." };
    }

    // 2. Fetch existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: "Użytkownik nie istnieje w bazie." };
    }

    // 3. Check duplicate email if changed
    if (email.toLowerCase().trim() !== existingUser.email.toLowerCase().trim()) {
      const emailOccupied = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id: userId },
        },
      });

      if (emailOccupied) {
        return { success: false, error: "Ten adres email / login jest już zajęty przez innego użytkownika." };
      }
    }

    // 4. Password update check if requested
    let newPasswordHash: string | undefined = undefined;

    if (newPassword && newPassword.trim().length > 0) {
      if (!currentPassword) {
        return { success: false, error: "Wprowadź aktualne hasło, aby ustalić nowe." };
      }

      if (newPassword.trim().length < 6) {
        return { success: false, error: "Nowe hasło musi mieć co najmniej 6 znaków." };
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.passwordHash
      );

      if (!isCurrentPasswordValid) {
        return { success: false, error: "Podane aktualne hasło jest nieprawidłowe." };
      }

      newPasswordHash = await bcrypt.hash(newPassword.trim(), 12);
    }

    // 5. Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
      },
    });

    revalidatePath("/client/profile");
    revalidatePath("/admin/profile");
    revalidatePath("/client/dashboard");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error?.message || "Wystąpił błąd podczas zapisu profilu." };
  }
}
