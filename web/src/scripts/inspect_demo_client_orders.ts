import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";

async function main() {
  console.log("=== INSPECT ALL ORDERS FOR DEMO CLIENT ===\n");
  const demoClient = await prisma.client.findFirst({
    where: { name: { contains: "DEMO", mode: "insensitive" } },
    include: {
      orders: {
        include: {
          items: true,
          deliveries: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!demoClient) {
    console.log("DEMO client not found!");
    return;
  }

  console.log(`DEMO Client Name: ${demoClient.name} (ID: ${demoClient.id})`);
  console.log(`Total Orders: ${demoClient.orders.length}\n`);

  demoClient.orders.forEach((o, i) => {
    console.log(`Order #${i + 1}: ${o.orderNr} | Status: ${o.status} | DeletedAt: ${o.deletedAt}`);
    console.log(`  ClientRef: ${o.clientRef || "—"} | Department: ${o.department || "—"}`);
    console.log(`  Created: ${o.createdAt.toISOString()} | BranchId: ${o.branchId}`);
    console.log(`  Items (${o.items.length}): ${o.items.map(it => `${it.productName} (${it.quantity} szt.)`).join(", ")}`);
    console.log("------------------------------------------");
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
