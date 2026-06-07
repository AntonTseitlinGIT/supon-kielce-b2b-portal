import { PrismaClient, OrderStatus, Priority } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creating test orders...");

  // Find client
  const client = await prisma.client.findFirst({
    where: { nip: "7770001234" }
  });
  if (!client) {
    console.error("Test client KGHM not found. Run npm run seed first.");
    return;
  }

  // Find branch
  const branch = await prisma.branch.findFirst({
    where: { clientId: client.id }
  });
  if (!branch) {
    console.error("Test branch not found.");
    return;
  }

  // Find user creator
  const creator = await prisma.user.findFirst({
    where: { email: "centralny@kghm-kielce.pl" }
  });
  if (!creator) {
    console.error("Creator user not found.");
    return;
  }

  // Find products
  const dbProducts = await prisma.product.findMany();
  if (dbProducts.length === 0) {
    console.error("No products found. Seed products first.");
    return;
  }

  // Find employee
  const employee = await prisma.employee.findFirst({
    where: { branchId: branch.id }
  });

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
        {
          product: dbProducts[0],
          size: "L",
          quantity: 1,
          qtyDelivered: 0,
          qtySent: 0,
        }
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
        {
          product: dbProducts[1] || dbProducts[0],
          size: "M",
          quantity: 1,
          qtyDelivered: 0,
          qtySent: 0,
        }
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
        {
          product: dbProducts[2] || dbProducts[0],
          size: "XL",
          quantity: 1,
          qtyDelivered: 0,
          qtySent: 1,
        }
      ]
    },
    {
      orderNr: "Z-2025-1135",
      status: OrderStatus.DELIVERED,
      priority: Priority.STANDARD,
      department: "Kielce — Zakład 3",
      eta: new Date("2025-08-04"),
      clientRef: "MPK-2025-835",
      createdAt: new Date("2025-08-02"),
      items: [
        {
          product: dbProducts[3] || dbProducts[0],
          size: "42",
          quantity: 1,
          qtyDelivered: 1,
          qtySent: 0,
        }
      ]
    },
    {
      orderNr: "Z-2025-1120",
      status: OrderStatus.APPROVED,
      priority: Priority.CRITICAL,
      department: "Katowice — Biuro",
      eta: new Date("2025-08-07"),
      clientRef: "MPK-2025-820",
      createdAt: new Date("2025-08-05"),
      items: [
        {
          product: dbProducts[4] || dbProducts[0],
          size: "L",
          quantity: 2,
          qtyDelivered: 2,
          qtySent: 0,
        }
      ]
    }
  ];

  for (const data of ordersData) {
    // Delete existing if any
    await prisma.order.deleteMany({
      where: { orderNr: data.orderNr }
    });

    const order = await prisma.order.create({
      data: {
        orderNr: data.orderNr,
        clientId: client.id,
        branchId: branch.id,
        status: data.status,
        priority: data.priority,
        eta: data.eta,
        address: client.address || "",
        department: data.department,
        clientRef: data.clientRef,
        createdById: creator.id,
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
          qtyDelivered: item.qtyDelivered,
          qtySent: item.qtySent,
          employeeId: employee?.id || null,
          employeeName: employee?.name || "Krzysztof J.",
        }
      });
    }
  }

  console.log("Successfully created test orders!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
