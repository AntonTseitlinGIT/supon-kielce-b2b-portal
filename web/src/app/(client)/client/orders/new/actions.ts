"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Priority, OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface OrderItemInput {
  productId: string;
  size: string;
  quantity: number;
  employeeId?: string;
  remarks?: string;
}

interface CreateOrderInput {
  branchId: string;
  priority: Priority;
  address: string;
  department?: string;
  clientRef?: string;
  comments?: string;
  items: OrderItemInput[];
}

export async function createOrder(input: CreateOrderInput) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji. Zaloguj się ponownie." };
  }

  const { role, clientId, branchId: userBranchId } = session.user;

  // 1. Authorization checks
  if (role !== "BRANCH_HEAD" && role !== "CLIENT_HEAD") {
    return { success: false, error: "Brak uprawnień do składania zamówień." };
  }

  let finalBranchId = input.branchId;
  if (role === "BRANCH_HEAD") {
    // Branch heads can only place orders for their own branch
    finalBranchId = userBranchId!;
  }

  if (!finalBranchId) {
    return { success: false, error: "Oddział jest wymagany." };
  }

  if (input.items.length === 0) {
    return { success: false, error: "Zamówienie musi zawierać co najmniej jedną pozycję." };
  }

  try {
    // Verify branch belongs to client
    const branch = await prisma.branch.findFirst({
      where: {
        id: finalBranchId,
        clientId: clientId!,
      },
    });

    if (!branch) {
      return { success: false, error: "Nieprawidłowy oddział." };
    }

    // 2. Generate sequential order number Z-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const orderCount = await prisma.order.count();
    const sequenceNum = 1000 + orderCount + 1;
    const orderNr = `Z-${currentYear}-${sequenceNum}`;

    // 3. Set ETA (e.g. 7 calendar days from now)
    const eta = new Date();
    eta.setDate(eta.getDate() + 7);

    // 4. Resolve product names, article numbers, and category IDs to ensure integrity
    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        clientProducts: {
          some: {
            clientId: clientId!,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        articleNr: true,
        categoryId: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Resolve employees to check branch matching and get names
    const employeeIds = input.items
      .map((i) => i.employeeId)
      .filter((id): id is string => !!id);
      
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        branchId: finalBranchId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    // 5. Build order items data
    const orderItemsData: {
      productId: string;
      articleNr: string;
      productName: string;
      size: string;
      quantity: number;
      employeeId: string | null;
      employeeName: string | null;
      remarks: string | null;
    }[] = [];
    
    // Track limit usages to increment
    const limitIncrements: { limitId: string; employeeId: string; qty: number }[] = [];

    for (const item of input.items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        return { success: false, error: `Produkt o ID ${item.productId} nie znajduje się w Twoim asortymencie.` };
      }

      let employeeName: string | null = null;
      if (item.employeeId) {
        const dbEmp = employeeMap.get(item.employeeId);
        if (!dbEmp) {
          return { success: false, error: `Pracownik o ID ${item.employeeId} nie należy do wybranego oddziału.` };
        }
        employeeName = dbEmp.name;

        // Check if there's a limit configured for this product's category and client
        const limit = await prisma.ppeLimit.findUnique({
          where: {
            clientId_categoryId: {
              clientId: clientId!,
              categoryId: dbProd.categoryId,
            },
          },
        });

        if (limit) {
          // Find or create usage
          const now = new Date();
          const periodStart = new Date(now.getFullYear(), 0, 1); // standard Jan 1st
          const periodEnd = new Date(now.getFullYear(), 11, 31); // standard Dec 31st
          
          const usage = await prisma.ppeLimitUsage.findFirst({
            where: {
              employeeId: item.employeeId,
              ppeLimitId: limit.id,
            },
          });

          if (usage) {
            limitIncrements.push({ limitId: limit.id, employeeId: item.employeeId, qty: item.quantity });
          } else {
            // Will create a new usage record if it doesn't exist
            // (We will handle this creation transactionally below)
          }
        }
      }

      orderItemsData.push({
        productId: item.productId,
        articleNr: dbProd.articleNr,
        productName: dbProd.name,
        size: item.size,
        quantity: item.quantity,
        employeeId: item.employeeId || null,
        employeeName,
        remarks: item.remarks || null,
      });
    }

    // 6. Create Order and Items inside transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          orderNr,
          clientId: clientId!,
          branchId: finalBranchId,
          status: OrderStatus.IN_PROGRESS,
          priority: input.priority,
          eta,
          address: input.address,
          department: input.department || null,
          clientRef: input.clientRef || null,
          comments: input.comments || null,
          createdById: session.user.id,
          items: {
            create: orderItemsData,
          },
        },
      });

      // Update or create PPE Limit Usages
      for (const item of input.items) {
        if (!item.employeeId) continue;
        const dbProd = productMap.get(item.productId)!;
        
        const limit = await tx.ppeLimit.findUnique({
          where: {
            clientId_categoryId: {
              clientId: clientId!,
              categoryId: dbProd.categoryId,
            },
          },
        });

        if (limit) {
          const now = new Date();
          const periodStart = new Date(now.getFullYear(), 0, 1);
          const periodEnd = new Date(now.getFullYear(), 11, 31);

          const usage = await tx.ppeLimitUsage.findFirst({
            where: {
              employeeId: item.employeeId,
              ppeLimitId: limit.id,
            },
          });

          if (usage) {
            await tx.ppeLimitUsage.update({
              where: { id: usage.id },
              data: { usedQty: { increment: item.quantity } },
            });
          } else {
            await tx.ppeLimitUsage.create({
              data: {
                employeeId: item.employeeId,
                ppeLimitId: limit.id,
                usedQty: item.quantity,
                periodStart,
                periodEnd,
              },
            });
          }
        }
      }

      return order;
    });

    // 7. Trigger in-app notifications for SUPON Admins/Managers
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ["SUPON_MANAGER", "SUPON_ADMIN"] },
          isActive: true
        },
        select: { id: true }
      });

      if (admins.length > 0) {
        const clientInfo = await prisma.client.findUnique({
          where: { id: clientId! },
          select: { name: true }
        });
        const clientName = clientInfo?.name.split("—")[0].trim() || "Klient";

        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: `Nowe zamówienie ${newOrder.orderNr}`,
            body: `Złożone przez ${clientName}`,
            link: `/admin/orders/${newOrder.id}`
          }))
        });
      }
    } catch (err) {
      console.error("Failed to generate order notification:", err);
    }

    revalidatePath("/client/dashboard");
    revalidatePath("/client/orders");

    return { success: true, orderId: newOrder.id, orderNr: newOrder.orderNr };
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Błąd serwera. Spróbuj ponownie później." };
  }
}
