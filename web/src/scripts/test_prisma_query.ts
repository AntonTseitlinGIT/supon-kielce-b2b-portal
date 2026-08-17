import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";
import { OrderStatus } from "@prisma/client";

async function main() {
  console.log("=== RUNNING EXACT PRISMA QUERY FOR CLIENT ORDERS PAGE ===\n");

  const demoUser = await prisma.user.findFirst({
    where: { email: "demo" },
    include: { client: true },
  });

  if (!demoUser) {
    console.log("Demo user not found!");
    return;
  }

  console.log(`Demo User: ${demoUser.email} | ClientId: ${demoUser.clientId}`);

  const clientId = demoUser.clientId!;
  const status = "IN_PROGRESS";

  const where: any = {
    clientId,
    deletedAt: null,
  };

  if (status === "IN_PROGRESS") {
    where.status = { in: [OrderStatus.IN_PROGRESS, OrderStatus.PARTIALLY_SENT] };
  }

  console.log("WHERE FILTER:", JSON.stringify(where, null, 2));

  const [orders, count] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderNr: true,
        status: true,
        createdAt: true,
        clientRef: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  console.log(`\nFound ${count} total matching orders:`);
  orders.forEach(o => {
    console.log(`  - ${o.orderNr} | Status: ${o.status} | Ref: ${o.clientRef || "—"} | CreatedAt: ${o.createdAt.toISOString()}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
