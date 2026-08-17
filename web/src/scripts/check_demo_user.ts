import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";

async function main() {
  console.log("Checking all Demo users and their assigned Client IDs...\n");

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "demo", mode: "insensitive" } },
        { name: { contains: "demo", mode: "insensitive" } },
      ],
    },
    include: {
      client: {
        include: {
          orders: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} demo-related users:`);
  users.forEach((u) => {
    console.log(`User: ID=${u.id} | Email=${u.email} | Name=${u.name} | Role=${u.role}`);
    console.log(`  Assigned Client ID: ${u.clientId || "NULL"}`);
    console.log(`  Client Name: ${u.client?.name || "NONE"}`);
    console.log(`  Client Total Orders: ${u.client?.orders.length || 0}`);
    console.log("-----------------------------------------");
  });

  console.log("\nChecking all Clients with name containing 'DEMO' or 'Firma':");
  const clients = await prisma.client.findMany({
    include: {
      orders: true,
      users: true,
    },
  });

  clients.forEach((c) => {
    console.log(`Client ID: ${c.id} | Name: ${c.name} | Nip: ${c.nip}`);
    console.log(`  Users (${c.users.length}): ${c.users.map((u) => u.email).join(", ")}`);
    console.log(`  Orders Count: ${c.orders.length}`);
    console.log("-----------------------------------------");
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
