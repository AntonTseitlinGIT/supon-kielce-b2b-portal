import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";

async function main() {
  console.log("Upgrading all Demo Client Orders to Full Platform Standards...");

  const demoClient = await prisma.client.findFirst({
    where: { name: { contains: "Firma Prezentacyjna", mode: "insensitive" } },
    include: { orders: { include: { items: true, deliveries: true } } },
  });

  if (!demoClient) {
    console.log("Demo client not found!");
    return;
  }

  // 1. Upgrade Z-2026-DEMO01
  const demo01 = demoClient.orders.find((o) => o.orderNr === "Z-2026-DEMO01");
  if (demo01) {
    await prisma.order.update({
      where: { id: demo01.id },
      data: {
        clientRef: "PO/2026/06/001",
        department: "Dział Utrzymania Ruchu",
      },
    });

    if (demo01.deliveries.length === 0) {
      await prisma.delivery.create({
        data: {
          orderId: demo01.id,
          deliveryNr: "WZ-2026-06-DEMO1",
          carrier: "DPD",
          trackingNr: "DPD9988776655",
          status: "DELIVERED",
          shippedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          items: {
            create: demo01.items.map((it) => ({
              articleNr: it.articleNr,
              productName: it.productName,
              quantity: it.quantity,
            })),
          },
        },
      });
      console.log("Upgraded Z-2026-DEMO01 with complete delivery history.");
    }
  }

  // 2. Upgrade Z-2026-DEMO02
  const demo02 = demoClient.orders.find((o) => o.orderNr === "Z-2026-DEMO02");
  if (demo02) {
    await prisma.order.update({
      where: { id: demo02.id },
      data: {
        clientRef: "PO/2026/07/042",
        department: "Spawalnia Główna",
      },
    });

    if (demo02.deliveries.length === 0) {
      await prisma.delivery.create({
        data: {
          orderId: demo02.id,
          deliveryNr: "WZ-2026-07-DEMO2",
          carrier: "DHL Express",
          trackingNr: "DHL2233445566",
          status: "IN_TRANSIT",
          shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          items: {
            create: demo02.items.map((it) => ({
              articleNr: it.articleNr,
              productName: it.productName,
              quantity: it.quantity,
            })),
          },
        },
      });
      console.log("Upgraded Z-2026-DEMO02 with complete delivery tracking.");
    }
  }

  // 3. Upgrade Z-2026-DEMO03
  const demo03 = demoClient.orders.find((o) => o.orderNr === "Z-2026-DEMO03");
  if (demo03) {
    await prisma.order.update({
      where: { id: demo03.id },
      data: {
        status: "IN_PROGRESS",
        clientRef: "PO/2026/08/015",
        department: "Dział Narzędziowni",
      },
    });
    console.log("Upgraded Z-2026-DEMO03 status to IN_PROGRESS and details.");
  }

  console.log("All Demo Client Orders upgraded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
