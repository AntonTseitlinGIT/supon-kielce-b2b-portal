import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { OrderStatus, Priority, OrderType } from "@prisma/client";
import { prisma } from "../lib/db";

async function main() {
  console.log("Checking existing orders...");

  // 1. Update any existing DRAFT orders to IN_PROGRESS so no DRAFT orders remain
  const updatedDrafts = await prisma.order.updateMany({
    where: { status: "DRAFT" },
    data: { status: OrderStatus.IN_PROGRESS },
  });
  console.log(`Updated ${updatedDrafts.count} DRAFT orders to IN_PROGRESS.`);

  // 2. Fetch clients & branches
  const demoClient = await prisma.client.findFirst({
    where: { name: { contains: "Firma Prezentacyjna", mode: "insensitive" } },
    include: { branches: true, users: true },
  });

  if (!demoClient || demoClient.branches.length === 0) {
    console.log("Demo client or branches not found.");
    return;
  }

  console.log(`Found client ${demoClient.name} with ${demoClient.branches.length} branches.`);

  const branchNorth = demoClient.branches.find(b => b.name.includes("Północ")) || demoClient.branches[0];
  const branchSouth = demoClient.branches.find(b => b.name.includes("Południe")) || demoClient.branches[1] || demoClient.branches[0];
  const branchCentral = demoClient.branches.find(b => b.name.includes("Centrala")) || demoClient.branches[2] || demoClient.branches[0];

  const creatorUser = demoClient.users[0];

  // Fetch catalog products
  const products = await prisma.product.findMany({ take: 10 });
  if (products.length === 0) {
    console.log("No catalog products found!");
    return;
  }

  console.log(`Found ${products.length} products to create realistic demo orders.`);

  // Define 5 realistic new demo orders with full item details and delivery logistics
  const newOrders = [
    {
      orderNr: "Z-2026-DEMO03",
      clientRef: "PO/2026/08/012",
      status: OrderStatus.SENT,
      priority: Priority.HIGH,
      orderType: OrderType.STANDARD,
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: creatorUser.id,
      address: branchNorth.address,
      department: "Dział Utrzymania Ruchu",
      eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
      items: [
        {
          productId: products[0].id,
          productName: products[0].name,
          articleNr: products[0].articleNr,
          size: "L (52)",
          quantity: 5,
          qtySent: 5,
          qtyDelivered: 0,
          employeeName: "Adam Nowak",
          remarks: "Wysyłka priorytetowa",
        },
        {
          productId: products[1]?.id || products[0].id,
          productName: products[1]?.name || products[0].name,
          articleNr: products[1]?.articleNr || products[0].articleNr,
          size: "43",
          quantity: 3,
          qtySent: 3,
          qtyDelivered: 0,
          employeeName: "Piotr Zieliński",
          remarks: "Rozmiar sprawdzenie BHP",
        },
      ],
      deliveries: [
        {
          deliveryNr: "WZ/2026/08/104",
          carrier: "DPD",
          trackingNr: "000018274910293U",
          status: "IN_TRANSIT",
          shippedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          items: [
            { articleNr: products[0].articleNr, productName: products[0].name, quantity: 5 },
            { articleNr: products[1]?.articleNr || products[0].articleNr, productName: products[1]?.name || products[0].name, quantity: 3 },
          ],
        },
      ],
    },
    {
      orderNr: "Z-2026-DEMO04",
      clientRef: "ZAM/BHP/992",
      status: OrderStatus.PARTIALLY_SENT,
      priority: Priority.STANDARD,
      orderType: OrderType.STANDARD,
      clientId: demoClient.id,
      branchId: branchSouth.id,
      createdById: creatorUser.id,
      address: branchSouth.address,
      recipient: "Elżbieta Dąbrowska",
      department: "Dział Produkcji Śrub",
      eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: [
        {
          productId: products[2]?.id || products[0].id,
          productName: products[2]?.name || products[0].name,
          articleNr: products[2]?.articleNr || products[0].articleNr,
          size: "XL",
          quantity: 10,
          qtySent: 5,
          qtyDelivered: 5,
          employeeName: "Krzysztof Maj",
          remarks: "I transza odebrana",
        },
        {
          productId: products[3]?.id || products[0].id,
          productName: products[3]?.name || products[0].name,
          articleNr: products[3]?.articleNr || products[0].articleNr,
          size: "42",
          quantity: 4,
          qtySent: 2,
          qtyDelivered: 0,
          employeeName: "Michał Lewandowski",
          remarks: "Druga paczka w drodze",
        },
      ],
      deliveries: [
        {
          deliveryNr: "WZ/2026/08/088",
          carrier: "DHL Express",
          trackingNr: "2837491029481",
          status: "DELIVERED",
          shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          items: [
            { articleNr: products[2]?.articleNr || products[0].articleNr, productName: products[2]?.name || products[0].name, quantity: 5 },
          ],
        },
        {
          deliveryNr: "WZ/2026/08/112",
          carrier: "DHL Express",
          trackingNr: "2837491029499",
          status: "IN_TRANSIT",
          shippedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          items: [
            { articleNr: products[3]?.articleNr || products[0].articleNr, productName: products[3]?.name || products[0].name, quantity: 2 },
          ],
        },
      ],
    },
    {
      orderNr: "Z-2026-DEMO05",
      clientRef: "WYM/2026/011",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      orderType: OrderType.EXCHANGE,
      clientId: demoClient.id,
      branchId: branchCentral.id,
      createdById: creatorUser.id,
      address: branchCentral.address,
      recipient: "Tomasz Wójcik",
      department: "Główny Warsztat",
      eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      items: [
        {
          productId: products[0].id,
          productName: products[0].name,
          articleNr: products[0].articleNr,
          size: "M (50)",
          quantity: 2,
          qtySent: 0,
          qtyDelivered: 0,
          employeeName: "Robert Kowalczyk",
          remarks: "Wymiana rozmiaru z L na M",
        },
      ],
      deliveries: [],
    },
    {
      orderNr: "Z-2026-DEMO06",
      clientRef: "PO/DEL/2026/44",
      status: OrderStatus.DELIVERED,
      priority: Priority.STANDARD,
      orderType: OrderType.STANDARD,
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: creatorUser.id,
      address: branchNorth.address,
      recipient: "Magazyn Główny Północ",
      department: "Magazyn Wyrobów Gotowych",
      eta: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      items: [
        {
          productId: products[1]?.id || products[0].id,
          productName: products[1]?.name || products[0].name,
          articleNr: products[1]?.articleNr || products[0].articleNr,
          size: "44",
          quantity: 8,
          qtySent: 8,
          qtyDelivered: 8,
          employeeName: "Grzegorz Kamiński",
          remarks: "Odebrane przez magazyn",
        },
      ],
      deliveries: [
        {
          deliveryNr: "WZ/2026/08/042",
          carrier: "InPost Kurier",
          trackingNr: "62938471029384759",
          status: "DELIVERED",
          shippedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          items: [
            { articleNr: products[1]?.articleNr || products[0].articleNr, productName: products[1]?.name || products[0].name, quantity: 8 },
          ],
        },
      ],
    },
    {
      orderNr: "Z-2026-DEMO07",
      clientRef: "APPROVED/2026/099",
      status: OrderStatus.APPROVED,
      priority: Priority.STANDARD,
      orderType: OrderType.STANDARD,
      clientId: demoClient.id,
      branchId: branchSouth.id,
      createdById: creatorUser.id,
      address: branchSouth.address,
      recipient: "Monika Szymańska",
      department: "Administracja B2B",
      eta: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      items: [
        {
          productId: products[0].id,
          productName: products[0].name,
          articleNr: products[0].articleNr,
          size: "XL",
          quantity: 12,
          qtySent: 12,
          qtyDelivered: 12,
          employeeName: "Zbiorcze dla działu",
          remarks: "Zamówienie zrealizowane i rozliczone",
        },
      ],
      deliveries: [
        {
          deliveryNr: "WZ/2026/07/901",
          carrier: "DPD",
          trackingNr: "000017263849102U",
          status: "DELIVERED",
          shippedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
          items: [
            { articleNr: products[0].articleNr, productName: products[0].name, quantity: 12 },
          ],
        },
      ],
    },
  ];

  for (const oData of newOrders) {
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
          eta: oData.eta,
          createdAt: oData.createdAt,
          items: {
            create: oData.items,
          },
        },
      });

      console.log(`Created order ${created.orderNr}`);

      for (const del of oData.deliveries) {
        const createdDel = await prisma.delivery.create({
          data: {
            orderId: created.id,
            deliveryNr: del.deliveryNr,
            carrier: del.carrier,
            trackingNr: del.trackingNr,
            status: del.status as any,
            shippedAt: del.shippedAt,
            items: {
              create: del.items,
            },
          },
        });

        await prisma.wzDocument.create({
          data: {
            wzNr: del.deliveryNr,
            orderId: created.id,
            clientId: oData.clientId,
            branchId: oData.branchId,
            createdById: oData.createdById,
            recipient: oData.recipient || "Magazyn Główny",
            carrier: del.carrier,
            trackingNr: del.trackingNr,
            status: del.status === "DELIVERED" ? "RECEIVED" : "IN_TRANSIT",
            date: del.shippedAt,
          },
        });

        console.log(`Created delivery & WZ ${createdDel.deliveryNr} for ${created.orderNr}`);
      }
    } else {
      console.log(`Order ${oData.orderNr} already exists.`);
    }
  }

  const allOrdersCount = await prisma.order.count({
    where: { clientId: demoClient.id },
  });
  console.log(`Total orders for demo client now: ${allOrdersCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
