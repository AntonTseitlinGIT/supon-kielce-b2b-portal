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

  const hash = (p: string) => bcrypt.hash(p, 12);

  // ─── SUPON Users ───
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

  // ─── Test Client (KGHM) ───
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

  await prisma.user.upsert({
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

  // ─── DEDICATED DEMO CLIENT ───
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

  const demoBranchSouth = await prisma.branch.upsert({
    where: { id: "branch-demo-south" },
    update: {},
    create: {
      id: "branch-demo-south",
      name: "Oddział Południe",
      address: "ul. Wzornicza 12, 26-600 Radom",
      clientId: demoClient.id,
    },
  });

  const demoClientHead = await prisma.user.upsert({
    where: { email: "demo@suponkielce.pl" },
    update: {},
    create: {
      email: "demo@suponkielce.pl",
      name: "Tomasz Dyrektor",
      passwordHash: await hash("demo1234"),
      role: Role.CLIENT_HEAD,
      clientId: demoClient.id,
    },
  });

  // Seed portal configurations for Demo Client (all modules enabled, custom limits)
  await prisma.clientConfig.upsert({
    where: { clientId: demoClient.id },
    update: {},
    create: {
      clientId: demoClient.id,
      modules: {
        orders: true,
        personnel: true,
        tickets: true,
        documents: true,
        branches: true,
        catalog: true,
        reports: true,
      },
      limits: {
        maxUsers: 25,
        maxBranches: 5,
      },
      updatedBy: suponAdmin.id,
    }
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

    // Add to test client assortment
    await prisma.clientProduct.upsert({
      where: { clientId_productId: { clientId: testClient.id, productId: product.id } },
      update: {},
      create: { clientId: testClient.id, productId: product.id },
    });

    // Add to demo client assortment
    await prisma.clientProduct.upsert({
      where: { clientId_productId: { clientId: demoClient.id, productId: product.id } },
      update: {},
      create: { clientId: demoClient.id, productId: product.id },
    });
  }

  // ─── Demo Contract Prices ───
  await prisma.clientProduct.update({
    where: { clientId_productId: { clientId: demoClient.id, productId: dbProducts["MOT-TRS-001"] } },
    data: { customPrice: 150.00 },
  });

  await prisma.clientProduct.update({
    where: { clientId_productId: { clientId: demoClient.id, productId: dbProducts["BUT-002"] } },
    data: { customPrice: 180.00 },
  });

  // ─── PPE Limits (Test Client) ───
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

  // ─── PPE Limits (Demo Client) ───
  await prisma.ppeLimit.upsert({
    where: { clientId_categoryId: { clientId: demoClient.id, categoryId: catObuwie.id } },
    update: {},
    create: { clientId: demoClient.id, categoryId: catObuwie.id, limitPerPeriod: 1, periodMonths: 12 },
  });

  await prisma.ppeLimit.upsert({
    where: { clientId_categoryId: { clientId: demoClient.id, categoryId: catOdziez.id } },
    update: {},
    create: { clientId: demoClient.id, categoryId: catOdziez.id, limitPerPeriod: 2, periodMonths: 12 },
  });

  // ─── Demo Client Employees ───
  const demoEmployee1 = await prisma.employee.upsert({
    where: { employeeNr_branchId: { employeeNr: "NP-1001", branchId: demoBranchNorth.id } },
    update: {},
    create: {
      employeeNr: "NP-1001",
      name: "Adam Kowalski",
      jobTitle: "Pracownik Produkcji",
      branchId: demoBranchNorth.id,
      address: "ul. Leśna 2, Kielce",
      sizes: { height: "180", chest: "100", waist: "90", shoes: "43", clothing: "L" },
      status: "ACTIVE",
    },
  });

  const demoEmployee2 = await prisma.employee.upsert({
    where: { employeeNr_branchId: { employeeNr: "NP-1002", branchId: demoBranchNorth.id } },
    update: {},
    create: {
      employeeNr: "NP-1002",
      name: "Ewa Nowak",
      jobTitle: "Kierownik Magazynu",
      branchId: demoBranchNorth.id,
      address: "ul. Polna 45, Kielce",
      sizes: { height: "168", chest: "90", waist: "75", shoes: "38", clothing: "M" },
      status: "ACTIVE",
    },
  });

  const demoEmployee3 = await prisma.employee.upsert({
    where: { employeeNr_branchId: { employeeNr: "NP-1003", branchId: demoBranchSouth.id } },
    update: {},
    create: {
      employeeNr: "NP-1003",
      name: "Piotr Zieliński",
      jobTitle: "Kierowca Wózkowy",
      branchId: demoBranchSouth.id,
      address: "ul. Radomska 10, Radom",
      sizes: { height: "175", chest: "98", waist: "86", shoes: "41", clothing: "M" },
      status: "ACTIVE",
    },
  });

  // ─── Demo Client Orders & WZ Documents ───
  // Order 1: Delivered
  const demoOrder1 = await prisma.order.upsert({
    where: { orderNr: "Z-2026-DEMO01" },
    update: {},
    create: {
      orderNr: "Z-2026-DEMO01",
      clientId: demoClient.id,
      branchId: demoBranchNorth.id,
      status: OrderStatus.DELIVERED,
      priority: Priority.STANDARD,
      address: "ul. Testowa 5, 25-001 Kielce",
      createdById: demoClientHead.id,
      items: {
        create: [
          { productId: dbProducts["MOT-TRS-001"], articleNr: "MOT-TRS-001", productName: "Spodnie Motion", size: "L", quantity: 2, qtyDelivered: 2, qtySent: 2, employeeId: demoEmployee1.id, employeeName: demoEmployee1.name },
          { productId: dbProducts["BUT-002"], articleNr: "BUT-002", productName: "Buty ochronne S3", size: "43", quantity: 1, qtyDelivered: 1, qtySent: 1, employeeId: demoEmployee1.id, employeeName: demoEmployee1.name }
        ]
      }
    }
  });

  await prisma.wzDocument.upsert({
    where: { wzNr: "WZ-2026-06-DEMO1" },
    update: {},
    create: {
      wzNr: "WZ-2026-06-DEMO1",
      date: new Date("2026-06-10"),
      orderId: demoOrder1.id,
      clientId: demoClient.id,
      branchId: demoBranchNorth.id,
      recipient: "Adam Kowalski",
      carrier: "DPD",
      trackingNr: "DPD9988776655",
      status: WzStatus.RECEIVED,
      createdById: suponAdmin.id,
      items: {
        create: [
          { articleNr: "MOT-TRS-001", name: "Spodnie Motion", size: "L", qty: 2 },
          { articleNr: "BUT-002", name: "Buty ochronne S3", size: "43", qty: 1 }
        ]
      }
    }
  });

  // Order 2: Sent
  const demoOrder2 = await prisma.order.upsert({
    where: { orderNr: "Z-2026-DEMO02" },
    update: {},
    create: {
      orderNr: "Z-2026-DEMO02",
      clientId: demoClient.id,
      branchId: demoBranchNorth.id,
      status: OrderStatus.SENT,
      priority: Priority.HIGH,
      address: "ul. Testowa 5, 25-001 Kielce",
      createdById: demoClientHead.id,
      items: {
        create: [
          { productId: dbProducts["FR-JKT-220"], articleNr: "FR-JKT-220", productName: "Kurtka FR (Trudnopalna)", size: "M", quantity: 1, qtyDelivered: 0, qtySent: 1, employeeId: demoEmployee2.id, employeeName: demoEmployee2.name }
        ]
      }
    }
  });

  await prisma.wzDocument.upsert({
    where: { wzNr: "WZ-2026-07-DEMO2" },
    update: {},
    create: {
      wzNr: "WZ-2026-07-DEMO2",
      date: new Date("2026-07-12"),
      orderId: demoOrder2.id,
      clientId: demoClient.id,
      branchId: demoBranchNorth.id,
      recipient: "Ewa Nowak",
      carrier: "DHL",
      trackingNr: "DHL2233445566",
      status: WzStatus.IN_TRANSIT,
      createdById: suponAdmin.id,
      items: {
        create: [
          { articleNr: "FR-JKT-220", name: "Kurtka FR (Trudnopalna)", size: "M", qty: 1 }
        ]
      }
    }
  });

  // Order 3: Draft
  await prisma.order.upsert({
    where: { orderNr: "Z-2026-DEMO03" },
    update: {},
    create: {
      orderNr: "Z-2026-DEMO03",
      clientId: demoClient.id,
      branchId: demoBranchNorth.id,
      status: OrderStatus.DRAFT,
      priority: Priority.STANDARD,
      address: "ul. Testowa 5, 25-001 Kielce",
      createdById: demoClientHead.id,
      items: {
        create: [
          { productId: dbProducts["R-20"], articleNr: "R-20", productName: "Rękawice robocze Grip", size: "9 (L)", quantity: 5, employeeId: demoEmployee1.id, employeeName: demoEmployee1.name }
        ]
      }
    }
  });

  // ─── Support Ticket ───
  const demoTicket = await prisma.ticket.upsert({
    where: { ticketNr: "SRV-2026-DEMO1" },
    update: {},
    create: {
      ticketNr: "SRV-2026-DEMO1",
      type: "EXCHANGE",
      status: "IN_PROGRESS",
      clientId: demoClient.id,
      branchId: demoBranchNorth.id,
      employeeId: demoEmployee1.id,
      employeeName: demoEmployee1.name,
      itemName: "Buty ochronne S3",
      productId: dbProducts["BUT-002"],
      size: "43",
      newSize: "44",
      createdById: demoClientHead.id,
      assignedToId: suponAdmin.id,
    }
  });

  await prisma.ticketMessage.deleteMany({ where: { ticketId: demoTicket.id } }).catch(() => null);
  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: demoTicket.id,
        senderId: demoClientHead.id,
        text: "Dzień dobry, otrzymaliśmy buty dla pracownika Adama Kowalskiego w rozmiarze 43, ale okazały się za ciasne. Czy możemy wymienić na rozmiar 44?",
        isFromSupon: false,
        createdAt: new Date("2026-07-13T10:00:00Z"),
      },
      {
        ticketId: demoTicket.id,
        senderId: suponAdmin.id,
        text: "Dzień dobry. Oczywiście, jest możliwość wymiany. Proszę o odesłanie butów na nasz adres magazynu. Po otrzymaniu paczki odeślemy rozmiar 44.",
        isFromSupon: true,
        createdAt: new Date("2026-07-13T14:30:00Z"),
      },
      {
        ticketId: demoTicket.id,
        senderId: demoClientHead.id,
        text: "Buty zostały dzisiaj wysłane kurierem. Dziękuję za pomoc.",
        isFromSupon: false,
        createdAt: new Date("2026-07-14T09:15:00Z"),
      }
    ]
  });

  console.log("✅ Seed complete!");
  console.log("\n🔑 Test accounts:");
  console.log("  SUPON Admin:   admin@suponkielce.pl    / admin1234");
  console.log("  Demo Head:     demo@suponkielce.pl     / demo1234");
  console.log("  Client Head:   centralny@kghm-kielce.pl / client1234");
  console.log("  Branch Head:   zaklad1@kghm-kielce.pl   / branch1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
