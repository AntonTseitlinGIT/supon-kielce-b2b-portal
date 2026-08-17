import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";
import { OrderStatus, Priority, OrderType } from "@prisma/client";

async function main() {
  console.log("Seeding additional IN_PROGRESS demo orders for Demo Client...");

  const demoClient = await prisma.client.findFirst({
    where: { name: { contains: "Firma Prezentacyjna", mode: "insensitive" } },
    include: {
      branches: true,
      users: true,
    },
  });

  if (!demoClient || demoClient.branches.length === 0) {
    console.log("Demo client not found!");
    return;
  }

  const branchNorth = demoClient.branches.find(b => b.name.includes("Północ")) || demoClient.branches[0];
  const branchSouth = demoClient.branches.find(b => b.name.includes("Południe")) || demoClient.branches[1] || demoClient.branches[0];
  const demoUser = demoClient.users[0];

  const products = await prisma.product.findMany({ take: 10 });
  const prodSpodnie = products.find(p => p.articleNr.includes("MOT")) || products[0];
  const prodButy = products.find(p => p.articleNr.includes("BUT")) || products[1] || products[0];
  const prodKurtka = products.find(p => p.articleNr.includes("FR")) || products[2] || products[0];
  const prodRekawice = products.find(p => p.articleNr.includes("R-20") || p.articleNr.includes("GLV")) || products[3] || products[0];
  const prodBluza = products.find(p => p.articleNr.includes("HIV")) || products[4] || products[0];

  const newOrdersData = [
    {
      orderNr: "Z-2026-DEMO08",
      clientRef: "PO/BHP/2026/088",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      orderType: OrderType.STANDARD,
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: demoUser.id,
      address: branchNorth.address,
      department: "Dział Montażu i Grawerowania",
      comments: "Zamówienie przyjęte do realizacji w magazynie głównym SUPON",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      items: [
        {
          productId: prodSpodnie.id,
          productName: prodSpodnie.name,
          articleNr: prodSpodnie.articleNr,
          size: "L (52)",
          quantity: 6,
          employeeName: "Adam Nowak",
          remarks: "Rozmiar zweryfikowany z kartą ŚOI",
        },
        {
          productId: prodButy.id,
          productName: prodButy.name,
          articleNr: prodButy.articleNr,
          size: "43",
          quantity: 3,
          employeeName: "Piotr Zieliński",
          remarks: "Obuwie spawalnicze wysokiej wytrzymałości",
        },
        {
          productId: prodKurtka.id,
          productName: prodKurtka.name,
          articleNr: prodKurtka.articleNr,
          size: "XL",
          quantity: 2,
          employeeName: "Grzegorz Kamiński",
          remarks: "Dla magazynu wyrobów gotowych",
        },
      ],
    },
    {
      orderNr: "Z-2026-DEMO09",
      clientRef: "ZAM/SUP/2026/104",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.STANDARD,
      orderType: OrderType.STANDARD,
      clientId: demoClient.id,
      branchId: branchSouth.id,
      createdById: demoUser.id,
      address: branchSouth.address,
      department: "Hala Obróbki Skrawaniem",
      comments: "Kompletowanie produktów w magazynie centralnym",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      items: [
        {
          productId: prodRekawice.id,
          productName: prodRekawice.name,
          articleNr: prodRekawice.articleNr,
          size: "10 (XL)",
          quantity: 50,
          employeeName: "Rozdzielnia BHP — Oddział Południe",
          remarks: "Wydanie pakietu kwartalnego",
        },
        {
          productId: prodBluza.id,
          productName: prodBluza.name,
          articleNr: prodBluza.articleNr,
          size: "L",
          quantity: 8,
          employeeName: "Krzysztof Maj",
          remarks: "Odzież odblaskowa ostrzegawcza Class 3",
        },
      ],
    },
    {
      orderNr: "Z-2026-DEMO10",
      clientRef: "PO/2026/08/902",
      status: OrderStatus.PARTIALLY_SENT,
      priority: Priority.HIGH,
      orderType: OrderType.STANDARD,
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: demoUser.id,
      address: branchNorth.address,
      department: "Magazyn Główny i Logistyka",
      comments: "I transza odebrana. II transza w drodze kurierem DPD.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      items: [
        {
          productId: prodButy.id,
          productName: prodButy.name,
          articleNr: prodButy.articleNr,
          size: "42",
          quantity: 10,
          qtySent: 5,
          qtyDelivered: 5,
          employeeName: "Michał Lewandowski",
          remarks: "Część 1 — dostarczono 5 par",
        },
        {
          productId: prodSpodnie.id,
          productName: prodSpodnie.name,
          articleNr: prodSpodnie.articleNr,
          size: "L",
          quantity: 10,
          qtySent: 5,
          qtyDelivered: 0,
          employeeName: "Adam Nowak",
          remarks: "Część 2 — paczka w drodze (DPD)",
        },
      ],
      deliveries: [
        {
          deliveryNr: "WZ/2026/08/201",
          carrier: "DPD",
          trackingNr: "000019283746501U",
          status: "DELIVERED" as const,
          shippedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
          recipient: "Marek Kierownik",
        },
        {
          deliveryNr: "WZ/2026/08/202",
          carrier: "DPD",
          trackingNr: "000019283746502U",
          status: "IN_TRANSIT" as const,
          shippedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          recipient: "Marek Kierownik",
        },
      ],
    },
    {
      orderNr: "Z-2026-DEMO11",
      clientRef: "PO/WYM/2026/015",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      orderType: OrderType.EXCHANGE,
      clientId: demoClient.id,
      branchId: branchSouth.id,
      createdById: demoUser.id,
      address: branchSouth.address,
      department: "Spawalnia TIG",
      comments: "Pilne zamówienie wymiany z tytułu zgłoszenia ZG-2026-001",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      items: [
        {
          productId: prodKurtka.id,
          productName: prodKurtka.name,
          articleNr: prodKurtka.articleNr,
          size: "L",
          quantity: 2,
          employeeName: "Michał Lewandowski",
          remarks: "Wymiana z rozmiaru XL na L",
        },
      ],
    },
    {
      orderNr: "Z-2026-DEMO12",
      clientRef: "ZAM/BHP/2026/301",
      status: OrderStatus.IN_PROGRESS,
      priority: Priority.STANDARD,
      orderType: OrderType.STANDARD,
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: demoUser.id,
      address: branchNorth.address,
      department: "Dział Utrzymania Ruchu",
      comments: "Pakiet ochronny na III kwartał 2026",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      items: [
        {
          productId: prodRekawice.id,
          productName: prodRekawice.name,
          articleNr: prodRekawice.articleNr,
          size: "9 (L)",
          quantity: 30,
          employeeName: "Dział Utrzymania Ruchu",
          remarks: "Wydanie zbiorcze",
        },
        {
          productId: prodBluza.id,
          productName: prodBluza.name,
          articleNr: prodBluza.articleNr,
          size: "M",
          quantity: 5,
          employeeName: "Robert Kowalczyk",
          remarks: "Rozmiar M",
        },
      ],
    },
  ];

  for (const oData of newOrdersData) {
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

      console.log(`Created IN_PROGRESS order ${created.orderNr}`);
    } else {
      console.log(`Order ${oData.orderNr} already exists.`);
    }
  }

  console.log("Seeding of IN_PROGRESS demo orders finished!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
