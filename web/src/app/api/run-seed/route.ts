import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const hash = (p: string) => bcrypt.hash(p, 12);

  try {
    // 1. SUPON Admin
    const suponAdmin = await prisma.user.upsert({
      where: { email: "admin" },
      update: {},
      create: {
        email: "admin",
        name: "Admin SUPON",
        passwordHash: await hash("admin1234"),
        role: Role.SUPON_ADMIN,
      },
    });

    // 2. KGHM Client
    const testClient = await prisma.client.upsert({
      where: { nip: "7770001234" },
      update: {},
      create: {
        name: "KGHM Polska Miedź S.A. — Kielce",
        nip: "7770001234",
        address: "ul. Przemysłowa 1, 25-001 Kielce",
      },
    });

    const branch1 = await prisma.branch.upsert({
      where: { id: "branch-kielce-1" },
      update: {},
      create: {
        id: "branch-kielce-1",
        name: "Zakład 1 — Kielce",
        address: "ul. Przemysłowa 1, 25-001 Kielce",
        clientId: testClient.id,
      },
    });

    const branch2 = await prisma.branch.upsert({
      where: { id: "branch-kielce-2" },
      update: {},
      create: {
        id: "branch-kielce-2",
        name: "Zakład 2 — Kielce",
        address: "ul. Fabryczna 12, 25-200 Kielce",
        clientId: testClient.id,
      },
    });

    await prisma.user.upsert({
      where: { email: "centralny" },
      update: {},
      create: {
        email: "centralny",
        name: "Anna Dyrektora",
        passwordHash: await hash("client1234"),
        role: Role.CLIENT_HEAD,
        clientId: testClient.id,
      },
    });

    await prisma.user.upsert({
      where: { email: "zaklad1" },
      update: {},
      create: {
        email: "zaklad1",
        name: "Piotr Kierownik",
        passwordHash: await hash("branch1234"),
        role: Role.BRANCH_HEAD,
        clientId: testClient.id,
        branchId: branch1.id,
      },
    });

    // 3. Demo Client
    const demoClient = await prisma.client.upsert({
      where: { nip: "1112223344" },
      update: {},
      create: {
        name: "DEMO — Firma Prezentacyjna Sp. z o.o.",
        nip: "1112223344",
        address: "ul. Wzorcowa 15, 25-001 Kielce",
      },
    });

    const demoBranchNorth = await prisma.branch.upsert({
      where: { id: "branch-demo-north" },
      update: {},
      create: {
        id: "branch-demo-north",
        name: "Oddział Północ",
        address: "ul. Testowa 5, 25-001 Kielce",
        clientId: demoClient.id,
      },
    });

    await prisma.branch.upsert({
      where: { id: "branch-demo-south" },
      update: {},
      create: {
        id: "branch-demo-south",
        name: "Oddział Południe",
        address: "ul. Wzornicza 12, 26-600 Radom",
        clientId: demoClient.id,
      },
    });

    await prisma.user.upsert({
      where: { email: "demo" },
      update: {},
      create: {
        email: "demo",
        name: "Tomasz Dyrektor",
        passwordHash: await hash("demo1234"),
        role: Role.CLIENT_HEAD,
        clientId: demoClient.id,
      },
    });

    await prisma.user.upsert({
      where: { email: "demo-oddzial" },
      update: {},
      create: {
        email: "demo-oddzial",
        name: "Marek Kierownik",
        passwordHash: await hash("demo1234"),
        role: Role.BRANCH_HEAD,
        clientId: demoClient.id,
        branchId: demoBranchNorth.id,
      },
    });

    return NextResponse.json({ success: true, message: "Production database successfully seeded with logins!" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
