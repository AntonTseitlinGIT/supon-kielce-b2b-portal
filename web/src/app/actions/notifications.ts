"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function fetchNotifications() {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Zaloguj się, aby pobrać powiadomienia." };
  }

  try {
    const items = await prisma.notification.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    return {
      success: true,
      notifications: items.map(i => ({
        id: i.id,
        title: i.title,
        body: i.body,
        link: i.link,
        isRead: i.isRead,
        createdAt: i.createdAt.toISOString()
      })),
      unreadCount
    };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Błąd podczas pobierania powiadomień." };
  }
}

export async function markNotificationAsRead(id: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji." };
  }

  try {
    await prisma.notification.updateMany({
      where: {
        id,
        userId: session.user.id
      },
      data: {
        isRead: true
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Błąd podczas aktualizacji powiadomienia." };
  }
}

export async function markAllNotificationsAsRead() {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji." };
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Błąd podczas aktualizacji powiadomień." };
  }
}

// Utility function to trigger a notification (can be called from other server actions)
export async function createInAppNotification(
  userId: string,
  title: string,
  body?: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        link
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return { success: false, error: error.message };
  }
}
