"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TicketType, TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface CreateTicketInput {
  type: TicketType;
  branchId: string;
  orderId?: string;
  employeeName?: string;
  itemName?: string;
  messageText: string;
  fileUrl?: string;
  fileName?: string;
  productId?: string;
  size?: string;
  newSize?: string;
  employeeId?: string;
}

export async function createTicket(input: CreateTicketInput) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji. Zaloguj się ponownie." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;

  if (role !== "BRANCH_HEAD" && role !== "CLIENT_HEAD") {
    return { success: false, error: "Brak uprawnień." };
  }

  let finalBranchId = input.branchId;
  if (role === "BRANCH_HEAD") {
    finalBranchId = userBranchId!;
  }

  if (!finalBranchId) {
    return { success: false, error: "Oddział jest wymagany." };
  }

  if (!input.messageText.trim()) {
    return { success: false, error: "Treść zgłoszenia (wiadomość) nie może być pusta." };
  }

  try {
    // Verify branch belongs to client
    const branch = await prisma.branch.findFirst({
      where: {
        id: finalBranchId,
        clientId: clientId!,
      },
    });

    if (!branch) {
      return { success: false, error: "Nieprawidłowy oddział." };
    }

    // Check order belongs to client/branch if provided
    if (input.orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: input.orderId,
          clientId: clientId!,
          ...(role === "BRANCH_HEAD" ? { branchId: userBranchId! } : {}),
        },
      });
      if (!order) {
        return { success: false, error: "Powiązane zamówienie nie należy do Twojego konta/oddziału." };
      }
    }

    // Generate ticket number: SRV-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const ticketCount = await prisma.ticket.count();
    const sequenceNum = 1000 + ticketCount + 1;
    const ticketNr = `SRV-${currentYear}-${sequenceNum}`;

    // Create ticket & initial message inside transaction
    const newTicket = await prisma.$transaction(async (tx) => {
      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          ticketNr,
          type: input.type,
          status: TicketStatus.NEW,
          clientId: clientId!,
          branchId: finalBranchId,
          orderId: input.orderId || null,
          employeeName: input.employeeName || null,
          itemName: input.itemName || null,
          productId: input.productId || null,
          size: input.size || null,
          newSize: input.newSize || null,
          employeeId: input.employeeId || null,
          createdById: session.user.id,
        },
      });

      // Create initial message
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: session.user.id,
          text: input.messageText,
          fileUrl: input.fileUrl || null,
          fileName: input.fileName || null,
          isFromSupon: false,
        },
      });

      return ticket;
    });

    // Trigger in-app notifications for SUPON Admins/Managers
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ["SUPON_MANAGER", "SUPON_ADMIN"] },
          isActive: true
        },
        select: { id: true }
      });

      if (admins.length > 0) {
        const clientInfo = await prisma.client.findUnique({
          where: { id: clientId! },
          select: { name: true }
        });
        const clientName = clientInfo?.name.split("—")[0].trim() || "Klient";

        const typeLabels: Record<string, string> = {
          COMPLAINT: "reklamacja",
          EXCHANGE: "wymiana",
          GENERAL: "ogólne"
        };
        const typeLabel = typeLabels[input.type] || input.type;

        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: `Nowe zgłoszenie ${newTicket.ticketNr} (${typeLabel})`,
            body: `Zgłoszone przez ${clientName}`,
            link: `/admin/tickets/${newTicket.id}`
          }))
        });
      }
    } catch (err) {
      console.error("Failed to generate ticket notification:", err);
    }

    revalidatePath("/client/tickets");
    revalidatePath("/client/dashboard");

    return { success: true, ticketId: newTicket.id, ticketNr: newTicket.ticketNr };
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return { success: false, error: "Błąd serwera. Nie udało się zapisać zgłoszenia." };
  }
}
