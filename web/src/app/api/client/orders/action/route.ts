import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, orderId, packageId } = body;

    if (!orderId) {
      return new NextResponse("Missing orderId", { status: 400 });
    }

    // Verify order belongs to user's client
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        deliveries: {
          include: { items: true }
        }
      }
    });

    if (!order || order.clientId !== session.user.clientId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (session.user.role === "BRANCH_HEAD" && order.branchId !== session.user.branchId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (action === "confirmPackage") {
      if (!packageId) {
        return new NextResponse("Missing packageId", { status: 400 });
      }

      // Find the delivery
      const delivery = order.deliveries.find(d => d.deliveryNr === packageId || d.id === packageId);
      if (!delivery) {
        return new NextResponse("Delivery not found", { status: 404 });
      }

      if (delivery.status === "DELIVERED") {
        return NextResponse.json({ success: true, message: "Package already delivered" });
      }

      await prisma.$transaction(async (tx) => {
        // Mark delivery as delivered
        await tx.delivery.update({
          where: { id: delivery.id },
          data: { status: "DELIVERED" }
        });

        // For each item in the delivery, update corresponding OrderItem's qtyDelivered & qtySent
        for (const pkgItem of delivery.items) {
          // Match the exact source line by id; fall back to articleNr only for legacy rows
          const orderItem = pkgItem.orderItemId
            ? order.items.find(item => item.id === pkgItem.orderItemId)
            : order.items.find(item => item.articleNr === pkgItem.articleNr);

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

        // Fetch updated items
        const allItems = await tx.orderItem.findMany({
          where: { orderId }
        });

        // Determine order status
        const totalQty = allItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalDelivered = allItems.reduce((sum, item) => sum + item.qtyDelivered, 0);

        let newOrderStatus = order.status;
        if (totalDelivered >= totalQty) {
          newOrderStatus = "DELIVERED";
        } else {
          newOrderStatus = "PARTIALLY_SENT";
        }

        await tx.order.update({
          where: { id: orderId },
          data: { status: newOrderStatus }
        });
      });

      return NextResponse.json({ success: true });
    }

    if (action === "confirmOrder") {
      await prisma.$transaction(async (tx) => {
        // Mark all deliveries as delivered
        await tx.delivery.updateMany({
          where: { orderId },
          data: { status: "DELIVERED" }
        });

        // Set qtyDelivered = quantity, qtySent = 0 for all items
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

        // Mark order as DELIVERED
        await tx.order.update({
          where: { id: orderId },
          data: { status: "DELIVERED" }
        });
      });

      return NextResponse.json({ success: true });
    }

    if (action === "approveOrder") {
      await prisma.$transaction(async (tx) => {
        // Mark all deliveries as delivered
        await tx.delivery.updateMany({
          where: { orderId },
          data: { status: "DELIVERED" }
        });

        // Mark all order items as fully delivered
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

        // Mark order as APPROVED
        await tx.order.update({
          where: { id: orderId },
          data: { status: "APPROVED" }
        });
      });

      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error: any) {
    console.error("Error performing order action:", error);
    return new NextResponse(error?.message || "Internal Error", { status: 500 });
  }
}
