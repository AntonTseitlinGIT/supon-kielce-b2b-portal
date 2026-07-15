"use server";

import { auth } from "@/lib/auth";
import { isSuponRole } from "@/config/permissions.config";
import { prisma } from "@/lib/db";
import { OrderStatus, WzStatus, DeliveryStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notifyClientUsers, notifySuponUsers } from "@/lib/notifications";
import { nextSequence } from "@/lib/sequences";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await auth();
  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak uprawnień. Zaloguj się jako administrator." };
  }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    // Notify client users
    try {
      const STATUS_LABELS: Record<string, string> = {
        IN_PROGRESS: "w realizacji",
        SENT: "wysłane",
        PARTIALLY_SENT: "częściowo wysłane",
        DELIVERED: "dostarczone",
        APPROVED: "zatwierdzone",
        CANCELLED: "anulowane",
        DRAFT: "szkic"
      };
      await notifyClientUsers(
        order.clientId,
        `Zmiana statusu zamówienia ${order.orderNr}`,
        `Nowy status zamówienia: ${STATUS_LABELS[status] ?? status}`,
        `/client/orders/${order.id}`
      );
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

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase storage not configured");
  return createSupabaseClient(url, serviceKey);
}

export async function uploadWzPdf(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isSuponRole(session.user.role)) {
    return { success: false, error: "Brak uprawnień. Zaloguj się jako administrator." };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "Brak pliku." };
  }

  const ALLOWED_TYPES = ["application/pdf"];
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Niedozwolony typ pliku. Akceptowany jest tylko PDF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "Plik jest za duży. Maksymalny rozmiar to 10 MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf") {
    return { success: false, error: "Plik musi mieć rozszerzenie .pdf." };
  }

  try {
    const supabase = getStorageClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `wz/${Date.now()}-${safeName}`;

    const bytes = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from("wz-documents")
      .upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });

    if (error) throw error;

    // Store the storage path (not a public URL) — served via protected API route
    return { success: true, pdfUrl: `/api/wz/${storagePath}` };
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
  if (!session?.user || !isSuponRole(session.user.role)) {
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

    const now = new Date();
    const itemsMap = new Map(order.items.map(i => [i.id, i]));

    // All number generation + writes in one serializable transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      // Generate unique WZ number WZ-YYYY-MM-XXX from an atomic counter
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const wzSeq = await nextSequence(tx, "wz");
      // Zero-pad to 3 digits; grows to 4+ digits gracefully past 999 (no truncation/collision)
      const wzNr = `WZ-${currentYear}-${currentMonth}-${String(wzSeq).padStart(3, '0')}`;

      // Generate delivery number DEL-XXXXX from an atomic counter
      const delSeq = await nextSequence(tx, "delivery");
      const deliveryNr = `DEL-${20000 + delSeq}`;

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

        // Check overflow — can't ship more than what's neither already shipped nor delivered
        const maxShip = dbItem.quantity - dbItem.qtySent - dbItem.qtyDelivered;
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

        // b. Create DeliveryItem (linked to the exact OrderItem line for unambiguous delivery confirmation)
        await tx.deliveryItem.create({
          data: {
            deliveryId: delivery.id,
            orderItemId: dbItem.id,
            articleNr: dbItem.articleNr,
            productName: dbItem.productName,
            quantity: shipItem.quantity,
          }
        });

        // c. Update OrderItem quantities — only qtySent increases on ship; qtyDelivered increases on confirmed delivery
        await tx.orderItem.update({
          where: { id: shipItem.orderItemId },
          data: { qtySent: { increment: shipItem.quantity } }
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

      // 4. Update Order status: all shipped if qtySent covers full quantity for every item
      const currentItems = await tx.orderItem.findMany({ where: { orderId } });
      const isFullySent = currentItems.every(i => i.qtySent >= i.quantity);

      await tx.order.update({
        where: { id: orderId },
        data: { status: isFullySent ? OrderStatus.SENT : OrderStatus.PARTIALLY_SENT }
      });

      return wzNr;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // Notify client users about WZ document
    try {
      await notifyClientUsers(
        order.clientId,
        `Wystawiono dokument WZ`,
        `Wysłano produkty dla zamówienia ${order.orderNr}`,
        `/client/documents`
      );
    } catch (nErr) {
      console.error("Failed to trigger WZ notification:", nErr);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to generate WZ:", error);
    return { success: false, error: error.message || "Błąd serwera przy generowaniu WZ." };
  }
}

export async function forceMarkAsDelivered(orderId: string) {
  const session = await auth();
  if (!session?.user || !isSuponRole(session.user.role)) {
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
          // Match the exact source line by id; fall back to articleNr only for legacy rows
          const orderItem = pkgItem.orderItemId
            ? orderItems.find(item => item.id === pkgItem.orderItemId)
            : orderItems.find(item => item.articleNr === pkgItem.articleNr);

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
  if (!session?.user || !isSuponRole(session.user.role)) {
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
