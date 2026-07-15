import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  // Simple header authentication
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const demoClient = await prisma.client.findUnique({
      where: { nip: "1112223344" }
    });

    if (!demoClient) {
      return NextResponse.json({ message: "Demo client not found. Cleanup skipped." });
    }

    const clientId = demoClient.id;

    // ─── 1. Clean up WZ Documents ───
    const wzKeep = ["WZ-2026-06-DEMO1", "WZ-2026-07-DEMO2"];
    const wzDeleted = await prisma.wzDocument.deleteMany({
      where: {
        clientId,
        wzNr: { notIn: wzKeep }
      }
    });

    // ─── 2. Clean up Orders ───
    const ordersKeep = ["Z-2026-DEMO01", "Z-2026-DEMO02", "Z-2026-DEMO03"];
    const ordersDeleted = await prisma.order.deleteMany({
      where: {
        clientId,
        orderNr: { notIn: ordersKeep }
      }
    });

    // ─── 3. Clean up Tickets ───
    const ticketsKeep = ["SRV-2026-DEMO1"];
    const ticketsDeleted = await prisma.ticket.deleteMany({
      where: {
        clientId,
        ticketNr: { notIn: ticketsKeep }
      }
    });

    // ─── 4. Clean up notifications ───
    const demoUsers = await prisma.user.findMany({
      where: { clientId },
      select: { id: true }
    });
    const demoUserIds = demoUsers.map(u => u.id);
    const notificationsDeleted = await prisma.notification.deleteMany({
      where: {
        userId: { in: demoUserIds }
      }
    });

    // ─── 5. Reset seeded order states to their defaults ───
    await prisma.order.update({
      where: { orderNr: "Z-2026-DEMO01" },
      data: { status: "DELIVERED" }
    }).catch(() => null);

    await prisma.order.update({
      where: { orderNr: "Z-2026-DEMO02" },
      data: { status: "SENT" }
    }).catch(() => null);

    await prisma.order.update({
      where: { orderNr: "Z-2026-DEMO03" },
      data: { status: "DRAFT" }
    }).catch(() => null);

    await prisma.ticket.update({
      where: { ticketNr: "SRV-2026-DEMO1" },
      data: { status: "IN_PROGRESS" }
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Demo cleanup completed successfully!",
      deleted: {
        wzDocuments: wzDeleted.count,
        orders: ordersDeleted.count,
        tickets: ticketsDeleted.count,
        notifications: notificationsDeleted.count
      }
    });
  } catch (error: any) {
    console.error("Cron demo cleanup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
