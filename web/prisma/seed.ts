import { PrismaClient, Role, OrderStatus, Priority, WzStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Feature Flags ───
  await prisma.featureFlag.createMany({
    data: [
      { key: "email_notifications", isEnabled: false, description: "Email notifications via Resend" },
      { key: "qr_labels", isEnabled: false, description: "QR code labels on tickets" },
      { key: "excel_export", isEnabled: true, description: "Excel export for reports" },
      { key: "pdf_export", isEnabled: true, description: "PDF generation" },
      { key: "notifications", isEnabled: true, description: "In-app notifications" },
      { key: "global_search", isEnabled: true, description: "Global search (Cmd+K)" },
    ],
    skipDuplicates: true,
  });

  // ─── App Settings ───
  await prisma.appSetting.createMany({
    data: [
      { key: "supon_company_name", value: "SUPON Kielce S.A." },
      { key: "supon_address", value: "ul. Sandomierska 105, 25-324 Kielce" },
      { key: "supon_nip", value: "9590001234" },
      { key: "supon_email", value: "biuro@suponkielce.pl" },
      { key: "supon_phone", value: "+48 41 123 45 67" },
    ],
    skipDuplicates: true,
  });

  // ─── SUPON Users ───
  const hash = (p: string) => bcrypt.hash(p, 12);

  const suponAdmin = await prisma.user.upsert({
    where: { email: "admin@suponkielce.pl" },
    update: {},
    create: {
      email: "admin@suponkielce.pl",
      name: "Admin SUPON",
      passwordHash: await hash("admin1234"),
      role: Role.SUPON_ADMIN,
    },
  });

  const suponManager = await prisma.user.upsert({
    where: { email: "manager@suponkielce.pl" },
    update: {},
    create: {
      email: "manager@suponkielce.pl",
      name: "Marek Kowalski",
      passwordHash: await hash("manager1234"),
      role: Role.SUPON_MANAGER,
    },
  });

  // ─── Test Client ───
  const testClient = await prisma.client.upsert({
    where: { nip: "7770001234" },
    update: {},
    create: {
      name: "KGHM Polska Miedź S.A. — Kielce",
      nip: "7770001234",
      address: "ul. Przemysłowa 1, 25-001 Kielce",
    },
  });

  // ─── Branches ───
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

  // ─── Client Users ───
  const clientHead = await prisma.user.upsert({
    where: { email: "centralny@kghm-kielce.pl" },
    update: {},
    create: {
      email: "centralny@kghm-kielce.pl",
      name: "Anna Dyrektora",
      passwordHash: await hash("client1234"),
      role: Role.CLIENT_HEAD,
      clientId: testClient.id,
    },
  });

  const branchHead = await prisma.user.upsert({
    where: { email: "zaklad1@kghm-kielce.pl" },
    update: {},
    create: {
      email: "zaklad1@kghm-kielce.pl",
      name: "Piotr Kierownik",
      passwordHash: await hash("branch1234"),
      role: Role.BRANCH_HEAD,
      clientId: testClient.id,
      branchId: branch1.id,
    },
  });

  // ─── PPE Categories ───
  const catObuwie = await prisma.ppeCategory.upsert({
    where: { name: "Obuwie ochronne" },
    update: {},
    create: { name: "Obuwie ochronne", description: "Buty i trzewiki ochronne S1/S3" },
  });

  const catOdziez = await prisma.ppeCategory.upsert({
    where: { name: "Odzież ochronna" },
    update: {},
    create: { name: "Odzież ochronna", description: "Ubrania robocze i ochronne" },
  });

  const catRekawice = await prisma.ppeCategory.upsert({
    where: { name: "Rękawice" },
    update: {},
    create: { name: "Rękawice", description: "Rękawice robocze i ochronne" },
  });

  const catKaski = await prisma.ppeCategory.upsert({
    where: { name: "Ochrona głowy" },
    update: {},
    create: { name: "Ochrona głowy", description: "Kaski i hełmy ochronne" },
  });

  // ─── Products ───
  const products = [
    {
      articleNr: "MOT-TRS-001",
      name: "Spodnie Motion",
      categoryId: catOdziez.id,
      description: "Spodnie robocze z tkaniny bawełnianej, wzmocnione kolana",
      availableSizes: ["S", "M", "L", "XL", "XXL", "XXXL", "48", "50", "52", "54", "56"],
    },
    {
      articleNr: "FR-JKT-220",
      name: "Kurtka FR (Trudnopalna)",
      categoryId: catOdziez.id,
      description: "Kurtka trudnopalna klasy FR, certyfikat EN ISO 11612",
      availableSizes: ["S", "M", "L", "XL", "XXL"],
    },
    {
      articleNr: "HIV-BLS-110",
      name: "Bluza Hi-Vis",
      categoryId: catOdziez.id,
      description: "Bluza ostrzegawcza klasy 2, EN ISO 20471",
      availableSizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
    },
    {
      articleNr: "BUT-002",
      name: "Buty ochronne S3",
      categoryId: catObuwie.id,
      description: "Trzewiki ochronne S3 SRC, stalowy nosek, podnosek i wkładka",
      availableSizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47"],
    },
    {
      articleNr: "K-10",
      name: "Kask BHP",
      categoryId: catKaski.id,
      description: "Hełm ochronny przemysłowy EN 397, regulowana opaska",
      availableSizes: ["Uniwersalny"],
    },
    {
      articleNr: "R-20",
      name: "Rękawice robocze Grip",
      categoryId: catRekawice.id,
      description: "Rękawice powlekane nitrylem, chwyt suchy i mokry",
      availableSizes: ["7 (S)", "8 (M)", "9 (L)", "10 (XL)", "11 (XXL)"],
    },
    {
      articleNr: "BHP-COM-050",
      name: "Kombinezon BHP",
      categoryId: catOdziez.id,
      description: "Kombinezon jednorazowy Tyvek, klasa 5/6",
      availableSizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
    },
    {
      articleNr: "SHO-LEA-333",
      name: "Trzewiki skórzane S3",
      categoryId: catObuwie.id,
      description: "Trzewiki ze skóry naturalnej, klasa S3 SRC HRO",
      availableSizes: ["39", "40", "41", "42", "43", "44", "45", "46"],
    },
  ];

  const dbProducts: Record<string, string> = {};
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { articleNr: p.articleNr },
      update: {},
      create: { ...p, photoUrls: [] },
    });
    dbProducts[p.articleNr] = product.id;

    // Add to client assortment
    await prisma.clientProduct.upsert({
      where: { clientId_productId: { clientId: testClient.id, productId: product.id } },
      update: {},
      create: { clientId: testClient.id, productId: product.id },
    });
  }

  // ─── PPE Limits ───
  await prisma.ppeLimit.upsert({
    where: { clientId_categoryId: { clientId: testClient.id, categoryId: catObuwie.id } },
    update: {},
    create: { clientId: testClient.id, categoryId: catObuwie.id, limitPerPeriod: 1, periodMonths: 12 },
  });

  await prisma.ppeLimit.upsert({
    where: { clientId_categoryId: { clientId: testClient.id, categoryId: catOdziez.id } },
    update: {},
    create: { clientId: testClient.id, categoryId: catOdziez.id, limitPerPeriod: 2, periodMonths: 12 },
  });

  await prisma.ppeLimit.upsert({
    where: { clientId_categoryId: { clientId: testClient.id, categoryId: catRekawice.id } },
    update: {},
    create: { clientId: testClient.id, categoryId: catRekawice.id, limitPerPeriod: 4, periodMonths: 12 },
  });

  // ─── Seed Orders & WZ Documents ───
  // Order 1
  const order1 = await prisma.order.upsert({
    where: { orderNr: "Z-2026-0001" },
    update: {},
    create: {
      orderNr: "Z-2026-0001",
      clientId: testClient.id,
      branchId: branch1.id,
      status: OrderStatus.DELIVERED,
      priority: Priority.STANDARD,
      address: "ul. Przemysłowa 1, 25-001 Kielce",
      createdById: branchHead.id,
      items: {
        create: [
          { productId: dbProducts["MOT-TRS-001"], articleNr: "MOT-TRS-001", productName: "Spodnie Motion", size: "L", quantity: 2, qtyDelivered: 2, qtySent: 2 },
          { productId: dbProducts["BUT-002"], articleNr: "BUT-002", productName: "Buty ochronne S3", size: "43", quantity: 1, qtyDelivered: 1, qtySent: 1 }
        ]
      }
    }
  });

  // WZ Document 1
  await prisma.wzDocument.upsert({
    where: { wzNr: "WZ-2026-05-001" },
    update: {},
    create: {
      wzNr: "WZ-2026-05-001",
      date: new Date("2026-05-20"),
      orderId: order1.id,
      clientId: testClient.id,
      branchId: branch1.id,
      recipient: "Jan Kowalski",
      carrier: "DPD",
      trackingNr: "12345678901",
      status: WzStatus.RECEIVED,
      createdById: suponManager.id,
      items: {
        create: [
          { articleNr: "MOT-TRS-001", name: "Spodnie Motion", size: "L", qty: 2 },
          { articleNr: "BUT-002", name: "Buty ochronne S3", size: "43", qty: 1 }
        ]
      }
    }
  });

  // Order 2
  const order2 = await prisma.order.upsert({
    where: { orderNr: "Z-2026-0002" },
    update: {},
    create: {
      orderNr: "Z-2026-0002",
      clientId: testClient.id,
      branchId: branch2.id,
      status: OrderStatus.SENT,
      priority: Priority.HIGH,
      address: "ul. Fabryczna 12, 25-200 Kielce",
      createdById: clientHead.id,
      items: {
        create: [
          { productId: dbProducts["FR-JKT-220"], articleNr: "FR-JKT-220", productName: "Kurtka FR (Trudnopalna)", size: "XL", quantity: 1, qtyDelivered: 0, qtySent: 1 }
        ]
      }
    }
  });

  // WZ Document 2
  await prisma.wzDocument.upsert({
    where: { wzNr: "WZ-2026-05-002" },
    update: {},
    create: {
      wzNr: "WZ-2026-05-002",
      date: new Date("2026-05-28"),
      orderId: order2.id,
      clientId: testClient.id,
      branchId: branch2.id,
      recipient: "Anna Dyrektora",
      carrier: "DHL",
      trackingNr: "DHL987654321",
      status: WzStatus.IN_TRANSIT,
      createdById: suponManager.id,
      items: {
        create: [
          { articleNr: "FR-JKT-220", name: "Kurtka FR (Trudnopalna)", size: "XL", qty: 1 }
        ]
      }
    }
  });

  console.log("✅ Seed complete!");
  console.log("\n🔑 Test accounts:");
  console.log("  SUPON Admin:   admin@suponkielce.pl   / admin1234");
  console.log("  SUPON Manager: manager@suponkielce.pl / manager1234");
  console.log("  Client Head:   centralny@kghm-kielce.pl / client1234");
  console.log("  Branch Head:   zaklad1@kghm-kielce.pl   / branch1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
