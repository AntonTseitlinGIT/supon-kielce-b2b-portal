import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";
import { OrderStatus, Priority, OrderType } from "@prisma/client";

async function main() {
  console.log("Seeding rich new orders for KGHM Polska Miedź S.A. and DEMO clients...");

  const kghmClient = await prisma.client.findFirst({
    where: { name: { contains: "KGHM", mode: "insensitive" } },
    include: { branches: true, users: true },
  });

  if (!kghmClient || kghmClient.branches.length === 0) {
    console.log("KGHM client not found!");
    return;
  }

  const branch1 = kghmClient.branches[0];
  const branch2 = kghmClient.branches[1] || kghmClient.branches[0];
  const user = kghmClient.users[0];

  const products = await prisma.product.findMany({ take: 10 });
  const prodSpodnie = products.find(p => p.articleNr.includes("MOT")) || products[0];
  const prodButy = products.find(p => p.articleNr.includes("BUT")) || products[1] || products[0];
  const prodKurtka = products.find(p => p.articleNr.includes("FR")) || products[2] || products[0];
  const prodRekawice = products.find(p => p.articleNr.includes("R-20") || p.articleNr.includes("GLV")) || products[3] || products[0];
  const prodBluza = products.find(p => p.articleNr.includes("HIV")) || products[4] || products[0];

  const kghmNewOrders = [
    {
      orderNr: "Z-2026-0010",
      clientRef: "MPK-2026-901",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      orderType: OrderType.STANDARD,
      clientId: kghmClient.id,
      branchId: branch1.id,
      createdById: user.id,
      address: branch1.address,
      department: "Zakład 1 — Dział Głównego Mechanika",
      comments: "Kompletowanie odzieży roboczej w magazynie SUPON Kielce",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      items: [
        {
          productId: prodSpodnie.id,
          productName: prodSpodnie.name,
          articleNr: prodSpodnie.articleNr,
          size: "L (52)",
          quantity: 8,
          employeeName: "Piotr Kierownik",
          remarks: "Dla zespołu utrzymania ruchu",
        },
        {
          productId: prodButy.id,
          productName: prodButy.name,
          articleNr: prodButy.articleNr,
          size: "43",
          quantity: 4,
          employeeName: "Marek Janowski",
          remarks: "Obuwie ochronne S3",
        },
      ],
    },
    {
      orderNr: "Z-2026-0011",
      clientRef: "MPK-2026-902",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      orderType: OrderType.EXCHANGE,
      clientId: kghmClient.id,
      branchId: branch2.id,
      createdById: user.id,
      address: branch2.address,
      department: "Zakład 2 — Oddział Wydobywczy",
      comments: "Pilne zamówienie wymiany rozmarowej",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      items: [
        {
          productId: prodKurtka.id,
          productName: prodKurtka.name,
          articleNr: prodKurtka.articleNr,
          size: "XL",
          quantity: 2,
          employeeName: "Jan Wiśniewski",
          remarks: "Wymiana z rozmiaru L na XL",
        },
      ],
    },
    {
      orderNr: "Z-2026-0012",
      clientRef: "MPK-2026-903",
      status: OrderStatus.PARTIALLY_SENT,
      priority: Priority.HIGH,
      orderType: OrderType.STANDARD,
      clientId: kghmClient.id,
      branchId: branch1.id,
      createdById: user.id,
      address: branch1.address,
      department: "Zakład 1 — Wydział Spawalniczy",
      comments: "I transza wysłana курьером DPD. II transza w pakowaniu.",
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      items: [
        {
          productId: prodRekawice.id,
          productName: prodRekawice.name,
          articleNr: prodRekawice.articleNr,
          size: "10 (XL)",
          quantity: 40,
          qtySent: 20,
          qtyDelivered: 20,
          employeeName: "Magazyn Wydziałowy",
          remarks: "Transza 1 dostarczona",
        },
        {
          productId: prodBluza.id,
          productName: prodBluza.name,
          articleNr: prodBluza.articleNr,
          size: "L",
          quantity: 10,
          qtySent: 5,
          qtyDelivered: 0,
          employeeName: "Ekipa Spawalnicza",
          remarks: "Transza 2 w drodze (DPD)",
        },
      ],
      deliveries: [
        {
          deliveryNr: "WZ/KGHM/2026/01",
          carrier: "DPD",
          trackingNr: "000019283746901U",
          status: "DELIVERED" as const,
          shippedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
          recipient: "Piotr Kierownik",
        },
        {
          deliveryNr: "WZ/KGHM/2026/02",
          carrier: "DPD",
          trackingNr: "000019283746902U",
          status: "IN_TRANSIT" as const,
          shippedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          recipient: "Piotr Kierownik",
        },
      ],
    },
    {
      orderNr: "Z-2026-0013",
      clientRef: "MPK-2026-904",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.STANDARD,
      orderType: OrderType.STANDARD,
      clientId: kghmClient.id,
      branchId: branch2.id,
      createdById: user.id,
      address: branch2.address,
      department: "Zakład 2 — Dział Przydziałów ŚOI",
      comments: "Kwartalne przydziały dla pracowników",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: [
        {
          productId: prodSpodnie.id,
          productName: prodSpodnie.name,
          articleNr: prodSpodnie.articleNr,
          size: "50",
          quantity: 12,
          employeeName: "Brygada B",
          remarks: "Wydanie zbiorcze",
        },
        {
          productId: prodButy.id,
          productName: prodButy.name,
          articleNr: prodButy.articleNr,
          size: "44",
          quantity: 6,
          employeeName: "Tomasz Zieliński",
          remarks: "Karta ŚOI 00412",
        },
      ],
    },
    {
      orderNr: "Z-2026-0014",
      clientRef: "MPK-2026-905",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.STANDARD,
      orderType: OrderType.STANDARD,
      clientId: kghmClient.id,
      branchId: branch1.id,
      createdById: user.id,
      address: branch1.address,
      department: "Zakład 1 — Magazyn Narzędziowy",
      comments: "Zamówienie uzupełniające stan magazynowy",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      items: [
        {
          productId: prodRekawice.id,
          productName: prodRekawice.name,
          articleNr: prodRekawice.articleNr,
          size: "9 (L)",
          quantity: 25,
          employeeName: "Magazyn Główny KGHM",
          remarks: "Uzupełnienie stanu",
        },
      ],
    },
  ];

  for (const oData of kghmNewOrders) {
    const existing = await prisma.order.findFirst({
      where: { orderNr: oData.orderNr },
    });

    if (!existing) {
      const created = await prisma.order.create({
        data: {
          orderNr: oData.orderNr,
          clientRef: oData.clientRef,
          status: oData.status,
          priority: oData.priority,
          orderType: oData.orderType,
          clientId: oData.clientId,
          branchId: oData.branchId,
          createdById: oData.createdById,
          address: oData.address,
          department: oData.department,
          comments: oData.comments,
          createdAt: oData.createdAt,
          items: {
            create: oData.items.map(it => ({
              productId: it.productId,
              productName: it.productName,
              articleNr: it.articleNr,
              size: it.size,
              quantity: it.quantity,
              qtySent: (it as any).qtySent || 0,
              qtyDelivered: (it as any).qtyDelivered || 0,
              employeeName: it.employeeName,
              remarks: it.remarks,
            })),
          },
        },
      });

      if (oData.deliveries) {
        for (const del of oData.deliveries) {
          const createdDel = await prisma.delivery.create({
            data: {
              orderId: created.id,
              deliveryNr: del.deliveryNr,
              carrier: del.carrier,
              trackingNr: del.trackingNr,
              status: del.status,
              shippedAt: del.shippedAt,
              items: {
                create: oData.items.map(it => ({
                  articleNr: it.articleNr,
                  productName: it.productName,
                  quantity: Math.ceil(it.quantity / 2),
                })),
              },
            },
          });

          await prisma.wzDocument.create({
            data: {
              wzNr: del.deliveryNr,
              orderId: created.id,
              deliveryId: createdDel.id,
              clientId: oData.clientId,
              branchId: oData.branchId,
              createdById: oData.createdById,
              recipient: del.recipient,
              carrier: del.carrier,
              trackingNr: del.trackingNr,
              status: del.status === "DELIVERED" ? "RECEIVED" : "IN_TRANSIT",
              date: del.shippedAt,
            },
          });
        }
      }

      console.log(`Created IN_PROGRESS order ${created.orderNr} for KGHM`);
    }
  }

  console.log("KGHM Order seeding finished!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
