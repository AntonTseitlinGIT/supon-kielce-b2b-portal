import { prisma } from "./lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "demo" }
  });
  if (!user) {
    console.log("User not found!");
    return;
  }
  const isValid = await bcrypt.compare("demo1234", user.passwordHash);
  console.log("Password verification for user 'demo':", isValid);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
