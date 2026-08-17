import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";

async function main() {
  console.log("=== FULL DATABASE AUDIT ===\n");

  const clients = await prisma.client.findMany({
    include: {
      users: { select: { id: true, email: true, name: true, role: true } },
      orders: { select: { id: true, orderNr: true, status: true, clientRef: true, department: true, createdAt: true } },
    },
  });

  console.log(`Total Clients in DB: ${clients.length}\n`);

  clients.forEach((c) => {
    console.log(`CLIENT: ${c.name} (ID: ${c.id})`);
    console.log(`  Users (${c.users.length}):`);
    c.users.forEach(u => console.log(`    - Login/Email: "${u.email}" | Name: "${u.name}" | Role: ${u.role}`));
    console.log(`  Orders (${c.orders.length}):`);
    c.orders.forEach(o => console.log(`    - ${o.orderNr} | Status: ${o.status} | Ref: ${o.clientRef || "—"} | Dept: ${o.department || "—"}`));
    console.log("--------------------------------------------------\n");
  });

  const orphanedOrders = await prisma.order.findMany({
    where: { clientId: { notIn: clients.map(c => c.id) } },
  });
  console.log(`Orphaned orders without client: ${orphanedOrders.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
