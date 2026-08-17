import dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.klbqxpaipkwaygxiroye:johvAr-zaqmo3-pikjiz@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

import { prisma } from "../lib/db";

async function main() {
  console.log("Auditing Demo Client Orders...");

  const demoClient = await prisma.client.findFirst({
    where: { name: { contains: "Firma Prezentacyjna", mode: "insensitive" } },
  });

  if (!demoClient) {
    console.log("Demo client not found!");
    return;
  }

  const orders = await prisma.order.findMany({
    where: { clientId: demoClient.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      branch: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, photoUrls: true, categoryId: true } },
        },
      },
      deliveries: {
        include: { items: true },
      },
      wzDocuments: true,
    },
  });

  console.log(`Found ${orders.length} orders for Demo client.\n`);

  orders.forEach((o, i) => {
    console.log(`--- Order #${i + 1}: ${o.orderNr} ---`);
    console.log(`  ID: ${o.id}`);
    console.log(`  Ref: ${o.clientRef || "—"}`);
    console.log(`  Status: ${o.status} | Priority: ${o.priority} | Type: ${o.orderType}`);
    console.log(`  Branch: ${o.branch?.name} | Dept: ${o.department || "—"}`);
    console.log(`  Address: ${o.address || "—"}`);
    console.log(`  Items (${o.items.length}):`);
    o.items.forEach((it) => {
      console.log(`    - [${it.articleNr}] ${it.productName} (Size: ${it.size}) x${it.quantity} (Sent: ${it.qtySent}, Deliv: ${it.qtyDelivered}) | Emp: ${it.employeeName || "—"} | Remarks: ${it.remarks || "—"}`);
    });
    console.log(`  Deliveries (${o.deliveries.length}):`);
    o.deliveries.forEach((d) => {
      console.log(`    - WZ: ${d.deliveryNr} | Carrier: ${d.carrier} | Tracking: ${d.trackingNr} | Status: ${d.status}`);
    });
    console.log(`  WZ Documents (${o.wzDocuments.length}):`);
    o.wzDocuments.forEach((w) => {
      console.log(`    - WZ: ${w.wzNr} | Recipient: ${w.recipient} | Carrier: ${w.carrier} | Tracking: ${w.trackingNr} | Status: ${w.status}`);
    });
    console.log("\n");
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
