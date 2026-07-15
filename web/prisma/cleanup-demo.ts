import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Running B2B platform Demo client cleanup...");

  // Find the Demo client
  const demoClient = await prisma.client.findUnique({
    where: { nip: "1112223344" }
  });

  if (!demoClient) {
    console.log("⚠️ Demo client not found. Cleanup skipped.");
    return;
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
  console.log(`Deleted ${wzDeleted.count} custom WZ documents.`);

  // ─── 2. Clean up Orders ───
  // Note: deleting orders will automatically cascade-delete OrderItem rows due to schema setup
  const ordersKeep = ["Z-2026-DEMO01", "Z-2026-DEMO02", "Z-2026-DEMO03"];
  const ordersDeleted = await prisma.order.deleteMany({
    where: {
      clientId,
      orderNr: { notIn: ordersKeep }
    }
  });
  console.log(`Deleted ${ordersDeleted.count} custom orders.`);

  // ─── 3. Clean up Tickets ───
  // Note: deleting tickets cascades to TicketMessage and InternalNote
  const ticketsKeep = ["SRV-2026-DEMO1"];
  const ticketsDeleted = await prisma.ticket.deleteMany({
    where: {
      clientId,
      ticketNr: { notIn: ticketsKeep }
    }
  });
  console.log(`Deleted ${ticketsDeleted.count} custom support tickets.`);

  // ─── 4. Clean up notifications ───
  // Delete all notifications for the demo client's users
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
  console.log(`Deleted ${notificationsDeleted.count} notifications.`);

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

  console.log("✨ Demo cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
