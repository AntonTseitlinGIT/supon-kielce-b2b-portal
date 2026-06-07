"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatus, WzStatus, DeliveryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPON_MANAGER" && session.user.role !== "SUPON_ADMIN")) {
    return { success: false, error: "Brak uprawnień. Zaloguj się jako administrator." };
  }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    // Notify client users
    try {
      const clientUsers = await prisma.user.findMany({
        where: { clientId: order.clientId, isActive: true },
        select: { id: true }
      });

      if (clientUsers.length > 0) {
        const STATUS_LABELS: Record<string, string> = {
          IN_PROGRESS: "w realizacji",
          SENT: "wysłane",
          PARTIALLY_SENT: "częściowo wysłane",
          DELIVERED: "dostarczone",
          APPROVED: "zatwierdzone",
          CANCELLED: "anulowane",
          DRAFT: "szkic"
        };
        const statusLabel = STATUS_LABELS[status] || status;

        await prisma.notification.createMany({
          data: clientUsers.map(u => ({
            userId: u.id,
            title: `Zmiana statusu zamówienia ${order.orderNr}`,
            body: `Nowy status zamówienia: ${statusLabel}`,
            link: `/client/orders/${order.id}`
          }))
        });
      }
    } catch (nErr) {
      console.error("Failed to trigger order status notification:", nErr);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: "Błąd serwera przy zmianie statusu." };
  }
}

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function uploadWzPdf(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPON_MANAGER" && session.user.role !== "SUPON_ADMIN")) {
    return { success: false, error: "Brak uprawnień. Zaloguj się jako administrator." };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "Brak pliku." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads", "wz");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);
    return { success: true, pdfUrl: `/uploads/wz/${filename}` };
  } catch (error) {
    console.error("Failed to upload WZ PDF:", error);
    return { success: false, error: "Błąd zapisu pliku na serwerze." };
  }
}

export async function generateWz(
  orderId: string,
  carrier: string,
  trackingNr: string,
  recipient: string,
  items: { orderItemId: string; quantity: number }[],
  pdfUrl?: string
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPON_MANAGER" && session.user.role !== "SUPON_ADMIN")) {
    return { success: false, error: "Brak uprawnień. Zaloguj się jako administrator." };
  }

  if (items.length === 0 || items.every(i => i.quantity <= 0)) {
    return { success: false, error: "Musisz wybrać co najmniej jedną pozycję do wysyłki o ilości większej niż 0." };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return { success: false, error: "Zamówienie nie istnieje." };
    }

    // Generate unique WZ number WZ-YYYY-MM-XXX
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const wzCount = await prisma.wzDocument.count();
    const wzNr = `WZ-${currentYear}-${currentMonth}-${String(1000 + wzCount + 1).substring(1)}`;

    // Create delivery number DEL-XXXXX
    const delCount = await prisma.delivery.count();
    const deliveryNr = `DEL-${20000 + delCount + 1}`;

    const itemsMap = new Map(order.items.map(i => [i.id, i]));

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create Delivery
      const delivery = await tx.delivery.create({
        data: {
          deliveryNr,
          orderId,
          shippedAt: now,
          carrier,
          trackingNr,
          status: DeliveryStatus.IN_TRANSIT,
        }
      });

      // 2. Create WzDocument
      const wzDoc = await tx.wzDocument.create({
        data: {
          wzNr,
          date: now,
          orderId,
          deliveryId: delivery.id,
          clientId: order.clientId,
          branchId: order.branchId,
          recipient,
          carrier,
          trackingNr,
          status: WzStatus.IN_TRANSIT,
          pdfUrl,
          createdById: session.user.id,
        }
      });

      // 3. Process items
      for (const shipItem of items) {
        if (shipItem.quantity <= 0) continue;
        const dbItem = itemsMap.get(shipItem.orderItemId);
        if (!dbItem) continue;

        // Check overflow
        const maxShip = dbItem.quantity - dbItem.qtyDelivered;
        if (shipItem.quantity > maxShip) {
          throw new Error(`Przekroczono limit wysyłki dla produktu ${dbItem.productName}. Maksymalnie do wysłania: ${maxShip}.`);
        }

        // a. Create WzItem
        await tx.wzItem.create({
          data: {
            wzDocId: wzDoc.id,
            articleNr: dbItem.articleNr,
            name: dbItem.productName,
            size: dbItem.size,
            qty: shipItem.quantity,
          }
        });

        // b. Create DeliveryItem
        await tx.deliveryItem.create({
          data: {
            deliveryId: delivery.id,
            articleNr: dbItem.articleNr,
            productName: dbItem.productName,
            quantity: shipItem.quantity,
          }
        });

        // c. Update OrderItem quantities
        const updatedDelivered = dbItem.qtyDelivered + shipItem.quantity;
        const updatedSent = dbItem.qtySent + shipItem.quantity;
        await tx.orderItem.update({
          where: { id: shipItem.orderItemId },
          data: {
            qtyDelivered: updatedDelivered,
            qtySent: updatedSent
          }
        });

        // d. Create IssuedItem for employee
        if (dbItem.employeeId) {
          await tx.issuedItem.create({
            data: {
              employeeId: dbItem.employeeId,
              productId: dbItem.productId,
              articleNr: dbItem.articleNr,
              name: dbItem.productName,
              size: dbItem.size,
              issuedAt: now,
              status: "Wydane",
            }
          });

          // e. Create Employee History
          await tx.employeeHistory.create({
            data: {
              employeeId: dbItem.employeeId,
              description: `Wydano artykuł: ${dbItem.productName} (rozmiar ${dbItem.size}) w ramach zamówienia ${order.orderNr}`,
              createdById: session.user.id,
            }
          });
        }
      }

      // 4. Update Order status based on delivery metrics
      const currentItems = await tx.orderItem.findMany({
        where: { orderId }
      });
      const isFullySent = currentItems.every(i => (i.qtySent + i.qtyDelivered) >= i.quantity);

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: isFullySent ? OrderStatus.SENT : OrderStatus.PARTIALLY_SENT
        }
      });
    });

    // Notify client users about WZ document
    try {
      const clientUsers = await prisma.user.findMany({
        where: { clientId: order.clientId, isActive: true },
        select: { id: true }
      });

      if (clientUsers.length > 0) {
        await prisma.notification.createMany({
          data: clientUsers.map(u => ({
            userId: u.id,
            title: `Wystawiono dokument WZ ${wzNr}`,
            body: `Wysłano produkty dla zamówienia ${order.orderNr}`,
            link: `/client/documents`
          }))
        });
      }
    } catch (nErr) {
      console.error("Failed to trigger WZ notification:", nErr);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true, wzNr };
  } catch (error: any) {
    console.error("Failed to generate WZ:", error);
    return { success: false, error: error.message || "Błąd serwera przy generowaniu WZ." };
  }
}

export async function forceMarkAsDelivered(orderId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPON_MANAGER" && session.user.role !== "SUPON_ADMIN")) {
    return { success: false, error: "Brak uprawnień. Zaloguj się jako administrator." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark all deliveries for this order as DELIVERED
      const pendingDeliveries = await tx.delivery.findMany({
        where: { orderId, status: "IN_TRANSIT" }
      });

      for (const delivery of pendingDeliveries) {
        await tx.delivery.update({
          where: { id: delivery.id },
          data: { status: "DELIVERED" }
        });

        // Fetch delivery items to update OrderItems
        const delItems = await tx.deliveryItem.findMany({
          where: { deliveryId: delivery.id }
        });

        // Update qtyDelivered and qtySent on corresponding OrderItems
        const orderItems = await tx.orderItem.findMany({
          where: { orderId }
        });

        for (const pkgItem of delItems) {
          const orderItem = orderItems.find(
            item => item.articleNr === pkgItem.articleNr
          );

          if (orderItem) {
            const newDelivered = orderItem.qtyDelivered + pkgItem.quantity;
            const newSent = Math.max(0, orderItem.qtySent - pkgItem.quantity);

            await tx.orderItem.update({
              where: { id: orderItem.id },
              data: {
                qtyDelivered: newDelivered,
                qtySent: newSent
              }
            });
          }
        }
      }

      // 2. Set the overall order status to DELIVERED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DELIVERED }
      });
    });

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark order as delivered:", error);
    return { success: false, error: error.message || "Błąd serwera przy oznaczaniu jako dostarczone." };
  }
}

export async function forceApproveOrder(orderId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPON_MANAGER" && session.user.role !== "SUPON_ADMIN")) {
    return { success: false, error: "Brak uprawnień. Zaloguj się jako administrator." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark all order items as fully delivered
      const orderItems = await tx.orderItem.findMany({
        where: { orderId }
      });

      for (const item of orderItems) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            qtyDelivered: item.quantity,
            qtySent: 0
          }
        });
      }

      // 2. Mark order as APPROVED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.APPROVED }
      });
    });

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to approve order:", error);
    return { success: false, error: error.message || "Błąd serwera przy zatwierdzaniu zamówienia." };
  }
}
