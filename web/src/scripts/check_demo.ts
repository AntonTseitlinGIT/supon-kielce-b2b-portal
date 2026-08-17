import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";

async function main() {
  console.log("Checking Demo Client configuration & data...");

  const demoClient = await prisma.client.findFirst({
    where: { name: { contains: "Firma Prezentacyjna", mode: "insensitive" } },
    include: {
      config: true,
      users: true,
      branches: { include: { employees: true } },
      orders: true,
      tickets: true,
    },
  });

  if (!demoClient) {
    console.log("Demo client not found!");
    return;
  }

  console.log(`Demo Client ID: ${demoClient.id}, Name: ${demoClient.name}`);

  // Enable all modules for Demo Client in ClientConfig
  const allModules = {
    orders: true,
    personnel: true,
    tickets: true,
    documents: true,
    branches: true,
    catalog: true,
    reports: true,
  };

  const updatedConfig = await prisma.clientConfig.upsert({
    where: { clientId: demoClient.id },
    update: {
      modules: allModules,
    },
    create: {
      clientId: demoClient.id,
      modules: allModules,
    },
  });

  console.log("Updated Demo ClientConfig modules:", updatedConfig.modules);

  // Check demo user credentials & branches
  demoClient.users.forEach((u) => {
    console.log(`Demo User: ${u.email} | Role: ${u.role} | Name: ${u.name}`);
  });

  console.log(`Total Branches: ${demoClient.branches.length}`);
  console.log(`Total Orders: ${demoClient.orders.length}`);
  console.log(`Total Tickets: ${demoClient.tickets.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
