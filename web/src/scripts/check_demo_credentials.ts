import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";

async function main() {
  console.log("=== CHECK ALL USERS IN DB ===\n");
  const users = await prisma.user.findMany({
    include: {
      client: true,
      branch: true,
    },
  });

  users.forEach((u) => {
    console.log(`User ID: ${u.id}`);
    console.log(`  Email/Username: "${u.email}"`);
    console.log(`  Name: "${u.name}"`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Client: ${u.client?.name} (ID: ${u.clientId})`);
    console.log(`  Branch: ${u.branch?.name} (ID: ${u.branchId})`);
    console.log("------------------------------------------");
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
