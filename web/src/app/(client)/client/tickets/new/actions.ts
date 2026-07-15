"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TicketType, TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { nextSequence } from "@/lib/sequences";
import { createTicketSchema, firstError } from "@/lib/schemas";

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

  // Validate payload shape/constraints at the boundary
  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed.error) };
  }
  input = parsed.data;

  let finalBranchId = input.branchId;
  if (role === "BRANCH_HEAD") {
    finalBranchId = userBranchId!;
  }

  if (!finalBranchId) {
    return { success: false, error: "Oddział jest wymagany." };
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

    const currentYear = new Date().getFullYear();

    // Create ticket & initial message inside transaction
    const newTicket = await prisma.$transaction(async (tx) => {
      // Generate ticket number SRV-YYYY-XXXX from an atomic counter
      const seq = await nextSequence(tx, "ticket");
      const ticketNr = `SRV-${currentYear}-${1000 + seq}`;

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
          role: "SUPON_ADMIN",
          isActive: true
        },
        select: { id: true }
      });

      if (admins.length > 0) {
        const clientInfo = await prisma.client.findUnique({
          where: { id: clientId! },
          select: { name: true, nip: true }
        });

        if (clientInfo?.nip !== "1112223344") {
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
