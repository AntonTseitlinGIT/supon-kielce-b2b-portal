"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function closeTicket(ticketId: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji." };
  }

  const { clientId } = session.user;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || ticket.clientId !== clientId) {
      return { success: false, error: "Nie znaleziono zgłoszenia." };
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "CLOSED",
        updatedAt: new Date(),
      },
    });

    // Notify client users (optional)
    try {
      const clientUsers = await prisma.user.findMany({
        where: { clientId: ticket.clientId, isActive: true },
        select: { id: true },
      });
      
      if (clientUsers.length > 0) {
        await prisma.notification.createMany({
          data: clientUsers.map((u) => ({
            userId: u.id,
            title: `Zgłoszenie ${ticket.ticketNr} zostało zamknięte`,
            body: `Zgłoszenie zostało pomyślnie zamknięte.`,
            link: `/client/tickets/${ticket.id}`,
          })),
        });
      }
    } catch (nErr) {
      console.error(nErr);
    }

    revalidatePath(`/client/tickets/${ticketId}`);
    revalidatePath("/client/tickets");

    return { success: true };
  } catch (error) {
    console.error("Failed to close ticket:", error);
    return { success: false, error: "Wystąpił błąd przy zamykaniu zgłoszenia." };
  }
}
