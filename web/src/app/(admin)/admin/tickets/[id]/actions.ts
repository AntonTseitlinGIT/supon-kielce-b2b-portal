"use server";

import { auth } from "@/lib/auth";
import { isSuponRole } from "@/config/permissions.config";
import { prisma } from "@/lib/db";
import { TicketStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notifyClientUsers } from "@/lib/notifications";
import { nextSequence } from "@/lib/sequences";

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const session = await auth();
  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak autoryzacji." };
  }

  try {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() }
    });

    // Notify client users
    try {
      const STATUS_LABELS: Record<string, string> = {
        NEW: "nowe",
        IN_PROGRESS: "w realizacji",
        RESOLVED: "rozwiązane",
        CLOSED: "zamknięte"
      };
      await notifyClientUsers(
        ticket.clientId,
        `Zmiana statusu zgłoszenia ${ticket.ticketNr}`,
        `Nowy status zgłoszenia: ${STATUS_LABELS[status] ?? status}`,
        `/client/tickets/${ticket.id}`
      );
    } catch (nErr) {
      console.error("Failed to trigger ticket status notification:", nErr);
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");
    return { success: true };
  } catch (error) {
    console.error("Failed to update ticket status:", error);
    return { success: false, error: "Błąd serwera przy aktualizacji statusu." };
  }
}

interface SendMessageInput {
  ticketId: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  isInternal: boolean;
}

export async function sendAdminTicketMessage(input: SendMessageInput) {
  const session = await auth();
  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak autoryzacji." };
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: input.ticketId }
    });

    if (!ticket) {
      return { success: false, error: "Zgłoszenie nie istnieje." };
    }

    if (input.isInternal) {
      // Create Internal Note
      const note = await prisma.internalNote.create({
        data: {
          ticketId: input.ticketId,
          authorId: session.user.id,
          text: input.text,
        },
        include: {
          author: { select: { name: true, role: true } }
        }
      });

      // Update ticket updated time
      await prisma.ticket.update({
        where: { id: input.ticketId },
        data: { updatedAt: new Date() }
      });

      revalidatePath(`/admin/tickets/${input.ticketId}`);
      return { 
        success: true, 
        message: {
          id: note.id,
          senderId: note.authorId,
          text: note.text,
          fileUrl: null,
          fileName: null,
          isFromSupon: true,
          isInternal: true,
          createdAt: note.createdAt,
          sender: { name: note.author.name, role: note.author.role }
        }
      };
    } else {
      // Create regular public TicketMessage
      const msg = await prisma.ticketMessage.create({
        data: {
          ticketId: input.ticketId,
          senderId: session.user.id,
          text: input.text,
          fileUrl: input.fileUrl || null,
          fileName: input.fileName || null,
          isFromSupon: true,
        },
        include: {
          sender: { select: { name: true, role: true } }
        }
      });

      // Automatically advance ticket status to IN_PROGRESS if it was NEW
      if (ticket.status === "NEW") {
        await prisma.ticket.update({
          where: { id: input.ticketId },
          data: { status: "IN_PROGRESS", updatedAt: new Date() }
        });
      } else {
        await prisma.ticket.update({
          where: { id: input.ticketId },
          data: { updatedAt: new Date() }
        });
      }

      // Notify client users about support message reply
      try {
        const preview = input.text.length > 60 ? input.text.substring(0, 57) + "..." : input.text;
        await notifyClientUsers(
          ticket.clientId,
          `Nowa odpowiedź w zgłoszeniu ${ticket.ticketNr}`,
          preview,
          `/client/tickets/${ticket.id}`
        );
      } catch (nErr) {
        console.error("Failed to trigger ticket message notification:", nErr);
      }

      revalidatePath(`/admin/tickets/${input.ticketId}`);
      revalidatePath("/admin/tickets");
      return { 
        success: true, 
        message: {
          id: msg.id,
          senderId: msg.senderId,
          text: msg.text,
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          isFromSupon: true,
          isInternal: false,
          createdAt: msg.createdAt,
          sender: { name: msg.sender.name, role: msg.sender.role }
        }
      };
    }
  } catch (error) {
    console.error("Failed to send admin message:", error);
    return { success: false, error: "Błąd serwera przy wysyłaniu wiadomości." };
  }
}

export async function approveTicketAndGenerateOrder(ticketId: string) {
  const session = await auth();
  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak autoryzacji." };
  }

  try {
    // 1. Fetch ticket details
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        client: true,
        branch: true,
        product: true,
      }
    });

    if (!ticket) {
      return { success: false, error: "Zgłoszenie nie istnieje." };
    }

    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      return { success: false, error: "Zgłoszenie jest już rozwiązane lub zamknięte." };
    }

    if (ticket.type !== "EXCHANGE" && ticket.type !== "COMPLAINT") {
      return { success: false, error: "Tylko zgłoszenia wymiany lub reklamacji mogą generować zamówienia." };
    }

    if (!ticket.productId) {
      return { success: false, error: "Zgłoszenie nie ma powiązanego produktu." };
    }

    // Required size must be present: newSize for EXCHANGE, original size for COMPLAINT
    const targetSize = ticket.type === "EXCHANGE" ? ticket.newSize : ticket.size;
    if (!targetSize) {
      return {
        success: false,
        error: ticket.type === "EXCHANGE"
          ? "Zgłoszenie wymiany nie ma określonego nowego rozmiaru."
          : "Zgłoszenie reklamacyjne nie ma określonego rozmiaru.",
      };
    }

    // 2. Generate order number + perform all writes in one serializable transaction
    const prefix = ticket.type === "EXCHANGE" ? "WYM" : "REK";
    const result = await prisma.$transaction(async (tx) => {
      const currentYear = new Date().getFullYear();
      const seq = await nextSequence(tx, "order");
      const orderNr = `${prefix}-${currentYear}-${1000 + seq}`;

      // Create new Order
      const order = await tx.order.create({
        data: {
          orderNr,
          clientId: ticket.clientId,
          branchId: ticket.branchId,
          status: "IN_PROGRESS",
          priority: "STANDARD",
          address: ticket.branch.address,
          orderType: ticket.type === "EXCHANGE" ? "EXCHANGE" : "COMPLAINT",
          ticketId: ticket.id,
          createdById: session.user.id,
        }
      });
      // Create order item
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: ticket.productId!,
          articleNr: ticket.product?.articleNr || "",
          productName: ticket.product?.name || "",
          size: targetSize,
          quantity: 1,
          employeeId: ticket.employeeId || null,
          employeeName: ticket.employeeName || null,
          remarks: ticket.type === "EXCHANGE"
            ? `Wymiana rozmiaru z ${ticket.size} na ${ticket.newSize}`
            : `Wymiana reklamacyjna (Zgłoszenie: ${ticket.ticketNr})`
        }
      });

      // Update ticket status
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: "RESOLVED",
          updatedAt: new Date()
        }
      });

      // Create a system message in the chat
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: session.user.id,
          text: `Zgłoszenie zostało zatwierdzone przez menedżera. Wygenerowano zamówienie powiązane o numerze: ${orderNr}.`,
          isFromSupon: true,
        }
      });

      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const orderNr = result.orderNr;

    // Notify client users about ticket resolution
    try {
      await notifyClientUsers(
        ticket.clientId,
        `Zatwierdzono zgłoszenie ${ticket.ticketNr}`,
        `Wygenerowano nowe zamówienie ${orderNr}`,
        `/client/tickets/${ticket.id}`
      );
    } catch (nErr) {
      console.error("Failed to send resolution notifications:", nErr);
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");
    revalidatePath("/client/tickets");
    revalidatePath("/client/orders");
    revalidatePath("/admin/orders");

    return { success: true, orderNr };
  } catch (error) {
    console.error("Failed to approve ticket & generate order:", error);
    return { success: false, error: "Błąd serwera podczas zatwierdzania zgłoszenia." };
  }
}

