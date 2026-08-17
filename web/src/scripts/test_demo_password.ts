import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("=== TESTING PASSWORDS FOR DEMO USERS ===\n");

  const passwordsToTest = ["demo", "demo1234", "demo123", "123456", "admin123", "password", "supon123"];

  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "demo", mode: "insensitive" } },
        { name: { contains: "demo", mode: "insensitive" } },
      ],
    },
  });

  for (const user of demoUsers) {
    console.log(`User ID: ${user.id} | Email/Login: "${user.email}"`);
    let foundMatch = false;
    for (const pwd of passwordsToTest) {
      const match = await bcrypt.compare(pwd, user.passwordHash);
      if (match) {
        console.log(`  ✅ Password match found: "${pwd}"`);
        foundMatch = true;
      }
    }
    if (!foundMatch) {
      console.log(`  ❌ NONE of the test passwords matched for "${user.email}"!`);
    }
    console.log("------------------------------------------");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
