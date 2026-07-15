import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        isActive: true,
      }
    });
    
    const demoUser = users.find(u => u.email === "demo");
    let passwordMatch = false;
    if (demoUser) {
      const dbUser = await prisma.user.findUnique({ where: { email: "demo" } });
      if (dbUser) {
        passwordMatch = await bcrypt.compare("demo1234", dbUser.passwordHash);
      }
    }

    return NextResponse.json({
      success: true,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      envType: process.env.NODE_ENV,
      users,
      demoPasswordMatch: passwordMatch,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
