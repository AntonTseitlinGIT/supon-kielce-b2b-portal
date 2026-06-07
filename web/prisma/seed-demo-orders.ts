import { PrismaClient, OrderStatus, Priority, DeliveryStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding demo orders with deliveries...");

  // --- find base entities ---
  const client = await prisma.client.findFirst({ where: { nip: "7770001234" } });
  if (!client) throw new Error("Client not found. Run npm run seed first.");

  const branch1 = await prisma.branch.findFirst({ where: { clientId: client.id, id: "branch-kielce-1" } })
    || await prisma.branch.findFirst({ where: { clientId: client.id } });
  if (!branch1) throw new Error("Branch not found.");

  const branch2 = await prisma.branch.findFirst({ where: { clientId: client.id, id: "branch-kielce-2" } })
    || branch1;

  const creator = await prisma.user.findFirst({ where: { email: "centralny@kghm-kielce.pl" } });
  if (!creator) throw new Error("Creator user not found.");

  const products = await prisma.product.findMany();
  if (products.length === 0) throw new Error("No products. Run npm run seed first.");

  const employees = await prisma.employee.findMany({ where: { branchId: branch1.id } });
  const emp1 = employees[0] ?? null;
  const emp2 = employees[1] ?? null;

  // helper shortcuts
  const p = (idx: number) => products[idx % products.length];

  // Orders to seed — keyed by orderNr so we can upsert safely
  const orders: Array<{
    orderNr: string;
    status: OrderStatus;
    priority: Priority;
    department: string;
    eta: Date;
    clientRef: string;
    createdAt: Date;
    branchId: string;
    comments?: string;
    items: Array<{ product: any; size: string; quantity: number; qtyDelivered: number; qtySent: number; employee?: any }>;
    deliveries?: Array<{
      deliveryNr: string;
      shippedAt: Date;
      carrier: string;
      trackingNr: string;
      status: DeliveryStatus;
      items: Array<{ articleNr: string; productName: string; quantity: number }>;
    }>;
  }> = [
    // ── 1. IN_PROGRESS – prosty, bez dostawy ──────────────────────────────
    {
      orderNr: "Z-2026-0001",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.STANDARD,
      department: "Kielce — Zakład 1",
      eta: new Date("2026-06-20"),
      clientRef: "MPK-2026-011",
      createdAt: new Date("2026-05-28"),
      branchId: branch1.id,
      items: [
        { product: p(0), size: "L (180–188)", quantity: 2, qtyDelivered: 0, qtySent: 0, employee: emp1 },
        { product: p(5), size: "9 (M)", quantity: 4, qtyDelivered: 0, qtySent: 0, employee: emp2 },
      ],
    },

    // ── 2. IN_PROGRESS – wysoki priorytet ─────────────────────────────────
    {
      orderNr: "Z-2026-0002",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      department: "Kielce — Zakład 2",
      eta: new Date("2026-06-15"),
      clientRef: "MPK-2026-012",
      createdAt: new Date("2026-05-29"),
      branchId: branch2.id,
      items: [
        { product: p(3), size: "43", quantity: 1, qtyDelivered: 0, qtySent: 0, employee: emp1 },
        { product: p(4), size: "Uniwersalny", quantity: 1, qtyDelivered: 0, qtySent: 0, employee: emp1 },
      ],
    },

    // ── 3. SENT – cała paczka w drodze (DHL) ──────────────────────────────
    {
      orderNr: "Z-2026-0003",
      status: OrderStatus.SENT,
      priority: Priority.STANDARD,
      department: "Kielce — Zakład 1",
      eta: new Date("2026-06-10"),
      clientRef: "MPK-2026-009",
      createdAt: new Date("2026-05-22"),
      branchId: branch1.id,
      items: [
        { product: p(1), size: "L", quantity: 1, qtyDelivered: 0, qtySent: 1, employee: emp1 },
        { product: p(2), size: "XL", quantity: 1, qtyDelivered: 0, qtySent: 1, employee: emp2 },
      ],
      deliveries: [
        {
          deliveryNr: "DEL-2026-0031",
          shippedAt: new Date("2026-05-29"),
          carrier: "DHL",
          trackingNr: "DHL3074291836492",
          status: DeliveryStatus.IN_TRANSIT,
          items: [
            { articleNr: p(1).articleNr, productName: p(1).name, quantity: 1 },
            { articleNr: p(2).articleNr, productName: p(2).name, quantity: 1 },
          ],
        },
      ],
    },

    // ── 4. PARTIALLY_SENT – pierwsza paczka dostarczona, druga w drodze ───
    {
      orderNr: "Z-2026-0004",
      status: OrderStatus.PARTIALLY_SENT,
      priority: Priority.HIGH,
      department: "Kielce — Zakład 2",
      eta: new Date("2026-06-08"),
      clientRef: "MPK-2026-007",
      createdAt: new Date("2026-05-18"),
      branchId: branch2.id,
      comments: "Zamówienie zbiorowe – dwie partie wysyłki",
      items: [
        { product: p(0), size: "M", quantity: 2, qtyDelivered: 1, qtySent: 1, employee: emp1 },
        { product: p(3), size: "42", quantity: 2, qtyDelivered: 0, qtySent: 1, employee: emp2 },
        { product: p(5), size: "10 (L)", quantity: 6, qtyDelivered: 3, qtySent: 3, employee: emp1 },
      ],
      deliveries: [
        {
          deliveryNr: "DEL-2026-0041",
          shippedAt: new Date("2026-05-23"),
          carrier: "DPD",
          trackingNr: "DPD09813740928374",
          status: DeliveryStatus.DELIVERED,
          items: [
            { articleNr: p(0).articleNr, productName: p(0).name, quantity: 1 },
            { articleNr: p(5).articleNr, productName: p(5).name, quantity: 3 },
          ],
        },
        {
          deliveryNr: "DEL-2026-0042",
          shippedAt: new Date("2026-05-29"),
          carrier: "DHL",
          trackingNr: "DHL8801234567891",
          status: DeliveryStatus.IN_TRANSIT,
          items: [
            { articleNr: p(3).articleNr, productName: p(3).name, quantity: 2 },
            { articleNr: p(5).articleNr, productName: p(5).name, quantity: 3 },
          ],
        },
      ],
    },

    // ── 5. PARTIALLY_SENT – obie paczki dostarczone, czekamy na resztę ────
    {
      orderNr: "Z-2026-0005",
      status: OrderStatus.PARTIALLY_SENT,
      priority: Priority.STANDARD,
      department: "Kielce — Zakład 1",
      eta: new Date("2026-06-12"),
      clientRef: "MPK-2026-008",
      createdAt: new Date("2026-05-20"),
      branchId: branch1.id,
      items: [
        { product: p(2), size: "L", quantity: 3, qtyDelivered: 1, qtySent: 0, employee: emp1 },
        { product: p(4), size: "Uniwersalny", quantity: 2, qtyDelivered: 0, qtySent: 0, employee: emp2 },
      ],
      deliveries: [
        {
          deliveryNr: "DEL-2026-0051",
          shippedAt: new Date("2026-05-26"),
          carrier: "InPost",
          trackingNr: "630000012345678901234567",
          status: DeliveryStatus.DELIVERED,
          items: [
            { articleNr: p(2).articleNr, productName: p(2).name, quantity: 1 },
          ],
        },
      ],
    },

    // ── 6. DELIVERED – całe zamówienie dostarczone, czeka na zatwierdzenie ─
    {
      orderNr: "Z-2026-0006",
      status: OrderStatus.DELIVERED,
      priority: Priority.CRITICAL,
      department: "Kielce — Zakład 2",
      eta: new Date("2026-06-02"),
      clientRef: "MPK-2026-005",
      createdAt: new Date("2026-05-10"),
      branchId: branch2.id,
      items: [
        { product: p(1), size: "XL", quantity: 1, qtyDelivered: 1, qtySent: 0, employee: emp1 },
        { product: p(3), size: "44", quantity: 1, qtyDelivered: 1, qtySent: 0, employee: emp2 },
        { product: p(4), size: "Uniwersalny", quantity: 2, qtyDelivered: 2, qtySent: 0, employee: emp1 },
      ],
      deliveries: [
        {
          deliveryNr: "DEL-2026-0061",
          shippedAt: new Date("2026-05-20"),
          carrier: "GLS",
          trackingNr: "GLS70040012345678",
          status: DeliveryStatus.DELIVERED,
          items: [
            { articleNr: p(1).articleNr, productName: p(1).name, quantity: 1 },
            { articleNr: p(3).articleNr, productName: p(3).name, quantity: 1 },
            { articleNr: p(4).articleNr, productName: p(4).name, quantity: 2 },
          ],
        },
      ],
    },

    // ── 7. APPROVED – zrealizowane ────────────────────────────────────────
    {
      orderNr: "Z-2026-0007",
      status: OrderStatus.APPROVED,
      priority: Priority.STANDARD,
      department: "Kielce — Zakład 1",
      eta: new Date("2026-05-28"),
      clientRef: "MPK-2026-002",
      createdAt: new Date("2026-04-20"),
      branchId: branch1.id,
      items: [
        { product: p(0), size: "L (180–188)", quantity: 2, qtyDelivered: 2, qtySent: 0, employee: emp1 },
        { product: p(5), size: "10 (L)", quantity: 6, qtyDelivered: 6, qtySent: 0, employee: emp1 },
      ],
      deliveries: [
        {
          deliveryNr: "DEL-2026-0071",
          shippedAt: new Date("2026-05-10"),
          carrier: "DPD",
          trackingNr: "DPD12288192918374",
          status: DeliveryStatus.DELIVERED,
          items: [
            { articleNr: p(0).articleNr, productName: p(0).name, quantity: 2 },
            { articleNr: p(5).articleNr, productName: p(5).name, quantity: 6 },
          ],
        },
      ],
    },

    // ── 8. APPROVED – duże zamówienie zbiorcze ────────────────────────────
    {
      orderNr: "Z-2026-0008",
      status: OrderStatus.APPROVED,
      priority: Priority.HIGH,
      department: "Kielce — Zakład 2",
      eta: new Date("2026-05-20"),
      clientRef: "MPK-2026-001",
      createdAt: new Date("2026-04-10"),
      branchId: branch2.id,
      items: [
        { product: p(3), size: "41", quantity: 3, qtyDelivered: 3, qtySent: 0, employee: emp2 },
        { product: p(2), size: "M", quantity: 2, qtyDelivered: 2, qtySent: 0, employee: emp2 },
        { product: p(4), size: "Uniwersalny", quantity: 3, qtyDelivered: 3, qtySent: 0, employee: emp1 },
      ],
      deliveries: [
        {
          deliveryNr: "DEL-2026-0081",
          shippedAt: new Date("2026-04-25"),
          carrier: "DHL",
          trackingNr: "DHL9123456789012",
          status: DeliveryStatus.DELIVERED,
          items: [
            { articleNr: p(3).articleNr, productName: p(3).name, quantity: 3 },
          ],
        },
        {
          deliveryNr: "DEL-2026-0082",
          shippedAt: new Date("2026-05-02"),
          carrier: "UPS",
          trackingNr: "1Z999AA10123456784",
          status: DeliveryStatus.DELIVERED,
          items: [
            { articleNr: p(2).articleNr, productName: p(2).name, quantity: 2 },
            { articleNr: p(4).articleNr, productName: p(4).name, quantity: 3 },
          ],
        },
      ],
    },
  ];

  // ── Wipe existing demo orders ─────────────────────────────────────────────
  const nrs = orders.map((o) => o.orderNr);
  const existing = await prisma.order.findMany({ where: { orderNr: { in: nrs } } });
  for (const o of existing) {
    // cascade: deliveries → deliveryItems, wzDocuments, orderItems auto-cascade via schema
    await prisma.delivery.deleteMany({ where: { orderId: o.id } });
    await prisma.wzDocument.deleteMany({ where: { orderId: o.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
    await prisma.order.delete({ where: { id: o.id } });
  }

  // ── Create fresh orders ───────────────────────────────────────────────────
  for (const data of orders) {
    const order = await prisma.order.create({
      data: {
        orderNr: data.orderNr,
        clientId: client.id,
        branchId: data.branchId,
        status: data.status,
        priority: data.priority,
        eta: data.eta,
        address: client.address || "ul. Przemysłowa 1, 25-001 Kielce",
        department: data.department,
        clientRef: data.clientRef,
        comments: data.comments ?? null,
        createdById: creator.id,
        createdAt: data.createdAt,
      },
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
          employeeId: item.employee?.id ?? null,
          employeeName: item.employee?.name ?? "Zamówienie zbiorcze",
        },
      });
    }

    if (data.deliveries) {
      for (const del of data.deliveries) {
        const delivery = await prisma.delivery.create({
          data: {
            deliveryNr: del.deliveryNr,
            orderId: order.id,
            shippedAt: del.shippedAt,
            carrier: del.carrier,
            trackingNr: del.trackingNr,
            status: del.status,
          },
        });

        for (const di of del.items) {
          await prisma.deliveryItem.create({
            data: {
              deliveryId: delivery.id,
              articleNr: di.articleNr,
              productName: di.productName,
              quantity: di.quantity,
            },
          });
        }
      }
    }

    const statusIcons: Record<string, string> = {
      IN_PROGRESS: "🕐",
      SENT: "🚚",
      PARTIALLY_SENT: "📦",
      DELIVERED: "✅",
      APPROVED: "🎉",
    };
    console.log(
      `  ${statusIcons[data.status] ?? "•"} ${data.orderNr} [${data.status}]` +
        (data.deliveries?.length ? ` — ${data.deliveries.length} paczka(i)` : "")
    );
  }

  console.log("\n✅ Demo orders seeded successfully!");
  console.log("   Zamówienia: Z-2026-0001 — Z-2026-0008");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
