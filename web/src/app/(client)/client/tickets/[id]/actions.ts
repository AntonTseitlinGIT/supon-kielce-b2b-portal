"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface SendMessageInput {
  ticketId: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
}

export async function sendTicketMessage(input: SendMessageInput) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji." };
  }

  const { id: userId, clientId } = session.user;

  try {
    // Verify ticket ownership
    const ticket = await prisma.ticket.findUnique({
      where: { id: input.ticketId },
    });

    if (!ticket || ticket.clientId !== clientId) {
      return { success: false, error: "Zgłoszenie nie zostało odnalezione lub nie należy do Twojego konta." };
    }

    if (ticket.status === "CLOSED") {
      return { success: false, error: "To zgłoszenie jest zamknięte. Nie można wysyłać nowych wiadomości." };
    }

    // Create message and touch ticket
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.ticketMessage.create({
        data: {
          ticketId: input.ticketId,
          senderId: userId,
          text: input.text,
          fileUrl: input.fileUrl || null,
          fileName: input.fileName || null,
          isFromSupon: false,
        },
        include: {
          sender: { select: { name: true, role: true } },
        },
      });

      // Update parent ticket's updatedAt timestamp
      await tx.ticket.update({
        where: { id: input.ticketId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    revalidatePath(`/client/tickets/${input.ticketId}`);
    return { success: true, message };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, error: "Błąd serwera. Nie udało się wysłać wiadomości." };
  }
}
