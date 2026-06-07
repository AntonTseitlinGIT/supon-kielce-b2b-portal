import { PrismaClient, Role, OrderStatus, Priority, EmployeeStatus, TicketStatus, TicketType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting comprehensive database seed...");

  // 1. App Settings
  await prisma.appSetting.deleteMany();
  await prisma.appSetting.createMany({
    data: [
      { key: "supon_company_name", value: "SUPON Kielce S.A." },
      { key: "supon_address", value: "ul. Sandomierska 105, 25-324 Kielce" },
      { key: "supon_nip", value: "9590001234" },
      { key: "supon_email", value: "biuro@suponkielce.pl" },
      { key: "supon_phone", value: "+48 41 123 45 67" },
    ]
  });

  // 2. Client
  let testClient = await prisma.client.findFirst({ where: { nip: "7770001234" } });
  if (!testClient) {
    testClient = await prisma.client.create({
      data: {
        name: "KGHM Polska Miedź S.A. — Kielce",
        nip: "7770001234",
        address: "ul. Przemysłowa 1, 25-001 Kielce",
      }
    });
  }

  // 3. Branches
  const b1 = await prisma.branch.upsert({
    where: { id: "branch-kielce-1" },
    update: {},
    create: {
      id: "branch-kielce-1",
      name: "Kielce — Zakład 1 • Magazyn",
      address: "ul. Przemysłowa 1, 25-001 Kielce",
      clientId: testClient.id,
    }
  });

  const b2 = await prisma.branch.upsert({
    where: { id: "branch-kielce-2" },
    update: {},
    create: {
      id: "branch-kielce-2",
      name: "Kielce — Zakład 2 • Portiernia",
      address: "ul. Fabryczna 12, 25-200 Kielce",
      clientId: testClient.id,
    }
  });

  // 4. Users
  const hash = (p: string) => bcrypt.hash(p, 12);
  const adminPass = await hash("admin1234");
  const clientPass = await hash("client1234");
  const branchPass = await hash("branch1234");

  const suponAdmin = await prisma.user.upsert({
    where: { email: "admin@suponkielce.pl" },
    update: {},
    create: {
      email: "admin@suponkielce.pl",
      name: "Admin SUPON",
      passwordHash: adminPass,
      role: Role.SUPON_ADMIN,
    }
  });

  const clientHead = await prisma.user.upsert({
    where: { email: "centralny@kghm-kielce.pl" },
    update: {},
    create: {
      email: "centralny@kghm-kielce.pl",
      name: "Anna Dyrektora",
      passwordHash: clientPass,
      role: Role.CLIENT_HEAD,
      clientId: testClient.id,
    }
  });

  const branchHead = await prisma.user.upsert({
    where: { email: "zaklad1@kghm-kielce.pl" },
    update: {},
    create: {
      email: "zaklad1@kghm-kielce.pl",
      name: "Piotr Kierownik",
      passwordHash: branchPass,
      role: Role.BRANCH_HEAD,
      clientId: testClient.id,
      branchId: b1.id,
    }
  });

  // 5. PPE Categories
  const catObuwie = await prisma.ppeCategory.upsert({
    where: { name: "Obuwie ochronne" }, update: {}, create: { name: "Obuwie ochronne", description: "Buty i trzewiki ochronne S1/S3" }
  });
  const catOdziez = await prisma.ppeCategory.upsert({
    where: { name: "Odzież ochronna" }, update: {}, create: { name: "Odzież ochronna", description: "Ubrania robocze i ochronne" }
  });
  const catRekawice = await prisma.ppeCategory.upsert({
    where: { name: "Rękawice" }, update: {}, create: { name: "Rękawice", description: "Rękawice robocze i ochronne" }
  });
  const catKaski = await prisma.ppeCategory.upsert({
    where: { name: "Ochrona głowy" }, update: {}, create: { name: "Ochrona głowy", description: "Kaski i hełmy ochronne" }
  });

  // 6. Products
  const productsList = [
    { articleNr: "MOT-TRS-001", name: "Spodnie Motion", categoryId: catOdziez.id, description: "Spodnie robocze z tkaniny bawełnianej", availableSizes: ["S", "M", "L", "XL", "XXL", "L (180–188)"] },
    { articleNr: "FR-JKT-220", name: "Kurtka FR (Trudnopalna)", categoryId: catOdziez.id, description: "Kurtka trudnopalna klasy FR", availableSizes: ["S", "M", "L", "XL", "XXL"] },
    { articleNr: "HIV-BLS-110", name: "Bluza Hi-Vis", categoryId: catOdziez.id, description: "Bluza ostrzegawcza ostrzegawcza", availableSizes: ["S", "M", "L", "XL"] },
    { articleNr: "BUT-002", name: "Buty ochronne S3", categoryId: catObuwie.id, description: "Trzewiki ochronne S3 SRC", availableSizes: ["39", "40", "41", "42", "43", "44", "45"] },
    { articleNr: "K-10", name: "Kask BHP", categoryId: catKaski.id, description: "Hełm ochronny BHP", availableSizes: ["Uniwersalny"] },
    { articleNr: "R-20", name: "Rękawice robocze Grip", categoryId: catRekawice.id, description: "Rękawice nitrylowe Grip", availableSizes: ["8 (S)", "9 (M)", "10 (L)", "11 (XL)"] }
  ];

  const products: any[] = [];
  for (const p of productsList) {
    const product = await prisma.product.upsert({
      where: { articleNr: p.articleNr },
      update: {},
      create: { ...p, photoUrls: [] }
    });
    products.push(product);

    await prisma.clientProduct.upsert({
      where: { clientId_productId: { clientId: testClient.id, productId: product.id } },
      update: {},
      create: { clientId: testClient.id, productId: product.id }
    });
  }

  // 7. Client limits
  await prisma.ppeLimit.upsert({
    where: { clientId_categoryId: { clientId: testClient.id, categoryId: catObuwie.id } },
    update: {},
    create: { clientId: testClient.id, categoryId: catObuwie.id, limitPerPeriod: 1, periodMonths: 12 }
  });
  await prisma.ppeLimit.upsert({
    where: { clientId_categoryId: { clientId: testClient.id, categoryId: catOdziez.id } },
    update: {},
    create: { clientId: testClient.id, categoryId: catOdziez.id, limitPerPeriod: 2, periodMonths: 12 }
  });

  // 8. Employees
  await prisma.employee.deleteMany();
  const employeesData = [
    { employeeNr: "NP-0001", name: "Jan Kowalski", jobTitle: "Operator (Produkcja)", sizes: { height: "180", chest: "104", waist: "92", shoes: "42", clothing: "L (180–188)" }, branchId: b1.id },
    { employeeNr: "NP-0002", name: "Anna Nowak", jobTitle: "Magazynier (Magazyn)", sizes: { height: "168", chest: "90", waist: "76", shoes: "39", clothing: "M" }, branchId: b1.id },
    { employeeNr: "NP-0015", name: "Piotr Wiśniewski", jobTitle: "Kierowca (Logistyka)", sizes: { height: "185", chest: "110", waist: "98", shoes: "44", clothing: "XL" }, branchId: b2.id },
    { employeeNr: "NP-0021", name: "Katarzyna Mazur", jobTitle: "Technik UR (Utrzymanie Ruchu)", sizes: { height: "172", chest: "96", waist: "82", shoes: "40", clothing: "M" }, branchId: b2.id }
  ];

  const dbEmployees: any[] = [];
  for (const emp of employeesData) {
    const dbEmp = await prisma.employee.create({
      data: {
        employeeNr: emp.employeeNr,
        name: emp.name,
        jobTitle: emp.jobTitle,
        sizes: emp.sizes,
        branchId: emp.branchId,
        status: EmployeeStatus.ACTIVE,
      }
    });
    dbEmployees.push(dbEmp);

    // Seed PpeLimitUsage
    await prisma.ppeLimitUsage.create({
      data: {
        employee: { connect: { id: dbEmp.id } },
        ppeLimit: { connect: { clientId_categoryId: { clientId: testClient.id, categoryId: catOdziez.id } } },
        usedQty: 1,
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-12-31")
      }
    });
  }

  // 9. Issued Items
  await prisma.issuedItem.deleteMany();
  await prisma.issuedItem.createMany({
    data: [
      {
        employeeId: dbEmployees[0].id,
        productId: products[0].id,
        articleNr: products[0].articleNr,
        name: products[0].name,
        size: "L (180–188)",
        issuedAt: new Date("2026-02-15"),
        status: "Wydane",
      },
      {
        employeeId: dbEmployees[1].id,
        productId: products[3].id,
        articleNr: products[3].articleNr,
        name: products[3].name,
        size: "39",
        issuedAt: new Date("2026-03-10"),
        status: "Wydane",
      }
    ]
  });

  // 10. Orders
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  const ordersData = [
    {
      orderNr: "Z-2025-1160",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.STANDARD,
      department: "Radom — Punkt",
      eta: new Date("2025-07-30"),
      clientRef: "MPK-2025-881",
      createdAt: new Date("2025-07-28"),
      items: [
        { product: products[0], size: "L (180–188)", quantity: 1, employee: dbEmployees[0] }
      ]
    },
    {
      orderNr: "Z-2025-1155",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.STANDARD,
      department: "Kielce — Zakład 2",
      eta: new Date("2025-07-31"),
      clientRef: "MPK-2025-879",
      createdAt: new Date("2025-07-29"),
      items: [
        { product: products[3], size: "42", quantity: 1, employee: dbEmployees[1] }
      ]
    },
    {
      orderNr: "Z-2025-1140",
      status: OrderStatus.SENT,
      priority: Priority.HIGH,
      department: "Warszawa — Biuro",
      eta: new Date("2025-08-03"),
      clientRef: "MPK-2025-840",
      createdAt: new Date("2025-08-01"),
      items: [
        { product: products[1], size: "M", quantity: 1, employee: dbEmployees[2] }
      ]
    }
  ];

  for (const data of ordersData) {
    const order = await prisma.order.create({
      data: {
        orderNr: data.orderNr,
        clientId: testClient.id,
        branchId: b1.id,
        status: data.status,
        priority: data.priority,
        eta: data.eta,
        address: testClient.address || "",
        department: data.department,
        clientRef: data.clientRef,
        createdById: clientHead.id,
        createdAt: data.createdAt,
      }
    });

    for (const item of data.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product.id,
          articleNr: item.product.articleNr,
          productName: item.product.name,
          size: item.size,
          quantity: item.quantity,
          employeeId: item.employee.id,
          employeeName: item.employee.name,
        }
      });
    }
  }

  // 11. Tickets/Support
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  const ticket = await prisma.ticket.create({
    data: {
      ticketNr: "ZGL-2026-0001",
      clientId: testClient.id,
      branchId: b1.id,
      status: TicketStatus.NEW,
      type: TicketType.EXCHANGE,
      createdById: clientHead.id,
      employeeName: "Jan Kowalski",
      itemName: "Spodnie Motion",
    }
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: clientHead.id,
      text: "Rozmiar L okazał się za ciasny dla pracownika Jan Kowalski. Prośba o wymianę na XL.",
    }
  });

  console.log("✅ Comprehensive Seeding Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
