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
  const wzKeep = [
    "WZ-2026-06-DEMO1", "WZ-2026-07-DEMO2", "WZ/2026/08/042",
    "WZ/2026/07/901", "WZ/2026/08/088", "WZ/2026/08/112",
    "WZ/2026/08/201", "WZ/2026/08/202"
  ];
  const wzDeleted = await prisma.wzDocument.deleteMany({
    where: {
      clientId,
      wzNr: { notIn: wzKeep }
    }
  });
  console.log(`Deleted ${wzDeleted.count} custom WZ documents.`);

  // ─── 2. Clean up Orders ───
  const ordersKeep = [
    "Z-2026-DEMO01", "Z-2026-DEMO02", "Z-2026-DEMO03", "Z-2026-DEMO04",
    "Z-2026-DEMO05", "Z-2026-DEMO06", "Z-2026-DEMO07", "Z-2026-DEMO08",
    "Z-2026-DEMO09", "Z-2026-DEMO10", "Z-2026-DEMO11", "Z-2026-DEMO12"
  ];
  const ordersDeleted = await prisma.order.deleteMany({
    where: {
      clientId,
      orderNr: { notIn: ordersKeep }
    }
  });
  console.log(`Deleted ${ordersDeleted.count} custom orders.`);

  // ─── 3. Clean up Tickets ───
  const ticketsKeep = ["SRV-2026-DEMO1"];
  const ticketsDeleted = await prisma.ticket.deleteMany({
    where: {
      clientId,
      ticketNr: { notIn: ticketsKeep }
    }
  });
  console.log(`Deleted ${ticketsDeleted.count} custom support tickets.`);

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
  console.log(`Deleted ${notificationsDeleted.count} notifications.`);

  console.log("✨ Demo cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
