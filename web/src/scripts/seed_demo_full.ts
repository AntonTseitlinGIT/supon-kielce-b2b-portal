import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";
import { TicketStatus, TicketType, Priority, EmployeeStatus } from "@prisma/client";

async function main() {
  console.log("Seeding comprehensive Demo Data...");

  const demoClient = await prisma.client.findFirst({
    where: { name: { contains: "Firma Prezentacyjna", mode: "insensitive" } },
    include: {
      branches: true,
      users: true,
      orders: true,
    },
  });

  if (!demoClient || demoClient.branches.length === 0) {
    console.log("Demo client not found!");
    return;
  }

  const branchNorth = demoClient.branches.find(b => b.name.includes("Północ")) || demoClient.branches[0];
  const branchSouth = demoClient.branches.find(b => b.name.includes("Południe")) || demoClient.branches[1] || demoClient.branches[0];
  const demoUser = demoClient.users[0];

  // 1. Ensure employees exist for Demo branches
  const demoEmployees = [
    {
      employeeNr: "NP-0101",
      name: "Adam Nowak",
      jobTitle: "Spawacz TIG / MAG",
      address: branchNorth.address,
      branchId: branchNorth.id,
      status: EmployeeStatus.ACTIVE,
      rfid: true,
      sizes: { height: "182", chest: "104", waist: "92", shoes: "43", clothing: "L (52)" },
    },
    {
      employeeNr: "NP-0102",
      name: "Piotr Zieliński",
      jobTitle: "Operator Tokarki CNC",
      address: branchNorth.address,
      branchId: branchNorth.id,
      status: EmployeeStatus.ACTIVE,
      rfid: true,
      sizes: { height: "178", chest: "98", waist: "86", shoes: "42", clothing: "M (50)" },
    },
    {
      employeeNr: "NP-0103",
      name: "Krzysztof Maj",
      jobTitle: "Kierownik Zespołu Montażu",
      address: branchSouth.address,
      branchId: branchSouth.id,
      status: EmployeeStatus.ACTIVE,
      rfid: true,
      sizes: { height: "185", chest: "110", waist: "98", shoes: "44", clothing: "XL (54)" },
    },
    {
      employeeNr: "NP-0104",
      name: "Michał Lewandowski",
      jobTitle: "Elektryk Zakładowy",
      address: branchSouth.address,
      branchId: branchSouth.id,
      status: EmployeeStatus.ACTIVE,
      rfid: true,
      sizes: { height: "176", chest: "96", waist: "84", shoes: "41", clothing: "M (50)" },
    },
    {
      employeeNr: "NP-0105",
      name: "Grzegorz Kamiński",
      jobTitle: "Magazynier Wyrobów",
      address: branchNorth.address,
      branchId: branchNorth.id,
      status: EmployeeStatus.ACTIVE,
      rfid: false,
      sizes: { height: "180", chest: "102", waist: "90", shoes: "43", clothing: "L (52)" },
    },
  ];

  for (const emp of demoEmployees) {
    const existingEmp = await prisma.employee.findFirst({
      where: { employeeNr: emp.employeeNr, branchId: emp.branchId },
    });

    if (!existingEmp) {
      await prisma.employee.create({
        data: emp,
      });
      console.log(`Created demo employee: ${emp.name} (${emp.employeeNr})`);
    }
  }

  // 2. Ensure Tickets exist for Demo Client
  const demoTickets = [
    {
      ticketNr: "ZG-2026-001",
      type: TicketType.EXCHANGE,
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: demoUser.id,
      orderId: demoClient.orders[0]?.id || null,
      employeeName: "Adam Nowak",
      itemName: "Buty ochronne S3 (Rozmiar 44)",
      size: "44",
      newSize: "43",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      initialMsg: "Pracownik Adam Nowak otrzymał buty rozmiar 44, proszę o wymianę na rozmiar 43 zgodnie z zapotrzebowaniem BHP.",
    },
    {
      ticketNr: "ZG-2026-002",
      type: TicketType.COMPLAINT,
      status: TicketStatus.NEW,
      priority: Priority.STANDARD,
      clientId: demoClient.id,
      branchId: branchSouth.id,
      createdById: demoUser.id,
      orderId: demoClient.orders[1]?.id || null,
      employeeName: "Krzysztof Maj",
      itemName: "Rękawice spawalnicze koźlęce",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      initialMsg: "W partyjce 10 par rękawic spawalniczych w 2 parach stwierdzono rozpruty szew mankietu. Prosimy o wysyłkę zamienników.",
    },
    {
      ticketNr: "ZG-2026-003",
      type: TicketType.GENERAL,
      status: TicketStatus.RESOLVED,
      priority: Priority.STANDARD,
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: demoUser.id,
      itemName: "Maski spawalnicze Speedglas z nawiewem",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      initialMsg: "Prosimy o podanie przewidywanego terminu dostawy masek spawalniczych z nawiewem dla Oddziału Północ.",
    },
  ];

  for (const t of demoTickets) {
    const existingTicket = await prisma.ticket.findFirst({
      where: { ticketNr: t.ticketNr },
    });

    if (!existingTicket) {
      const createdTicket = await prisma.ticket.create({
        data: {
          ticketNr: t.ticketNr,
          type: t.type,
          status: t.status,
          clientId: t.clientId,
          branchId: t.branchId,
          createdById: t.createdById,
          orderId: t.orderId || null,
          employeeName: t.employeeName || null,
          itemName: t.itemName || null,
          size: t.size || null,
          newSize: t.newSize || null,
          createdAt: t.createdAt,
          messages: {
            create: [
              {
                text: t.initialMsg,
                senderId: t.createdById,
                createdAt: t.createdAt,
              },
            ],
          },
        },
      });
      console.log(`Created demo ticket: ${createdTicket.ticketNr}`);
    }
  }

  // 3. Ensure WZ Documents exist for Demo Client
  const firstOrderId = demoClient.orders[0]?.id || "";

  const wzDocs = [
    {
      wzNr: "WZ/2026/08/104",
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: demoUser.id,
      recipient: "Marek Janowski (Kierownik Magazynu)",
      carrier: "DPD",
      trackingNr: "000018274910293U",
      status: "IN_TRANSIT" as const,
      date: new Date(Date.now() - 12 * 60 * 60 * 1000),
      orderId: demoClient.orders[0]?.id || firstOrderId,
    },
    {
      wzNr: "WZ/2026/08/088",
      clientId: demoClient.id,
      branchId: branchSouth.id,
      createdById: demoUser.id,
      recipient: "Elżbieta Dąbrowska",
      carrier: "DHL Express",
      trackingNr: "2837491029481",
      status: "RECEIVED" as const,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      orderId: demoClient.orders[1]?.id || firstOrderId,
    },
    {
      wzNr: "WZ/2026/08/042",
      clientId: demoClient.id,
      branchId: branchNorth.id,
      createdById: demoUser.id,
      recipient: "Magazyn Główny Północ",
      carrier: "InPost Kurier",
      trackingNr: "62938471029384759",
      status: "RECEIVED" as const,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      orderId: demoClient.orders[2]?.id || firstOrderId,
    },
  ];

  for (const wz of wzDocs) {
    const existingWz = await prisma.wzDocument.findFirst({
      where: { wzNr: wz.wzNr },
    });

    if (!existingWz) {
      await prisma.wzDocument.create({
        data: wz,
      });
      console.log(`Created WZ Document: ${wz.wzNr}`);
    }
  }

  console.log("Full Demo Data seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
