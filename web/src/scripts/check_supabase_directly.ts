import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
process.env.DATABASE_URL = dbUrl;

import { prisma } from "../lib/db";

async function main() {
  console.log("=== CHECKING SUPABASE DATABASE DIRECTLY ===\n");
  console.log("Database Host:", dbUrl.split("@")[1]?.split("/")[0] || dbUrl);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clientId: true,
      branchId: true,
      client: { select: { id: true, name: true, nip: true } }
    }
  });

  console.log(`\nFound ${users.length} Users in DB:`);
  users.forEach(u => {
    console.log(`  - User: ${u.email} | Name: "${u.name}" | Role: ${u.role} | ClientId: ${u.clientId} (${u.client?.name || "NONE"})`);
  });

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNr: true,
      status: true,
      clientId: true,
      branchId: true,
      createdAt: true,
      client: { select: { name: true, nip: true } }
    },
    orderBy: { orderNr: "asc" }
  });

  console.log(`\nFound ${orders.length} Orders in DB:`);
  orders.forEach(o => {
    console.log(`  - Order: ${o.orderNr} | Status: ${o.status} | ClientId: ${o.clientId} (${o.client?.name || "UNKNOWN"}) | BranchId: ${o.branchId}`);
  });

  const wzDocs = await prisma.wzDocument.findMany({
    select: {
      id: true,
      wzNr: true,
      clientId: true,
      branchId: true,
      status: true
    }
  });

  console.log(`\nFound ${wzDocs.length} WZ Documents in DB:`);
  wzDocs.forEach(w => {
    console.log(`  - WZ: ${w.wzNr} | Status: ${w.status} | ClientId: ${w.clientId}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
