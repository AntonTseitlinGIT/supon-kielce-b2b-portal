"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Priority, OrderStatus, Prisma } from "@prisma/client";
import { notifySuponUsers } from "@/lib/notifications";
import { nextSequence } from "@/lib/sequences";
import { createOrderSchema, firstError } from "@/lib/schemas";
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

  // 2. Validate payload shape/constraints at the boundary
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed.error) };
  }
  input = parsed.data;

  let finalBranchId = input.branchId;
  if (role === "BRANCH_HEAD") {
    // Branch heads can only place orders for their own branch
    finalBranchId = userBranchId!;
  }

  if (!finalBranchId) {
    return { success: false, error: "Oddział jest wymagany." };
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
        deletedAt: null,
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
    
    // Batch-load all PPE limits for categories in this order (avoids N+1)
    const categoryIds = [...new Set(
      input.items
        .map(i => productMap.get(i.productId)?.categoryId)
        .filter((id): id is string => !!id)
    )];

    const ppeLimits = await prisma.ppeLimit.findMany({
      where: { clientId: clientId!, categoryId: { in: categoryIds } },
    });
    const ppeLimitMap = new Map(ppeLimits.map(l => [l.categoryId, l]));

    // Batch-load existing PPE usages for all employee+limit combos (avoids N+1)
    const employeeIdsWithLimits = input.items
      .filter(i => i.employeeId && ppeLimitMap.has(productMap.get(i.productId)?.categoryId ?? ""))
      .map(i => i.employeeId!);

    const limitIds = ppeLimits.map(l => l.id);
    const existingUsages = await prisma.ppeLimitUsage.findMany({
      where: {
        employeeId: { in: employeeIdsWithLimits },
        ppeLimitId: { in: limitIds },
      },
    });
    const usageMap = new Map(existingUsages.map(u => [`${u.employeeId}:${u.ppeLimitId}`, u]));

    // Running tally of quantities requested within THIS order per employee+limit,
    // so multiple line-items for the same employee+category accumulate against the limit.
    const pendingUsage = new Map<string, number>();

    for (const item of input.items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        return { success: false, error: "Wybrany produkt nie należy do Twojego asortymentu." };
      }

      let employeeName: string | null = null;
      if (item.employeeId) {
        const dbEmp = employeeMap.get(item.employeeId);
        if (!dbEmp) {
          return { success: false, error: "Wybrany pracownik nie należy do wskazanego oddziału." };
        }
        employeeName = dbEmp.name;

        // Check PPE limit — block if exceeded (DB usage + quantities already requested in this order)
        const limit = ppeLimitMap.get(dbProd.categoryId);
        if (limit) {
          const usageKey = `${item.employeeId}:${limit.id}`;
          const dbUsed = usageMap.get(usageKey)?.usedQty ?? 0;
          const pending = pendingUsage.get(usageKey) ?? 0;
          const currentUsed = dbUsed + pending;
          if (currentUsed + item.quantity > limit.limitPerPeriod) {
            const remaining = Math.max(0, limit.limitPerPeriod - currentUsed);
            return {
              success: false,
              error: `Pracownik ${employeeName} przekroczył limit PPE dla tej kategorii. Pozostały limit: ${remaining} szt.`,
            };
          }
          pendingUsage.set(usageKey, pending + item.quantity);
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
      // Generate order number from an atomic counter (no count()-based races/gaps)
      const currentYear = new Date().getFullYear();
      const seq = await nextSequence(tx, "order");
      const orderNr = `Z-${currentYear}-${1000 + seq}`;

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

      // Update or create PPE Limit Usages (uses pre-fetched maps — no N+1)
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), 0, 1);
      const periodEnd = new Date(now.getFullYear(), 11, 31);

      for (const item of input.items) {
        if (!item.employeeId) continue;
        const dbProd = productMap.get(item.productId)!;
        const limit = ppeLimitMap.get(dbProd.categoryId);
        if (!limit) continue;

        const usageKey = `${item.employeeId}:${limit.id}`;
        const usage = usageMap.get(usageKey);

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

      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // 7. Trigger in-app notifications for SUPON Admins/Managers
    try {
      const clientInfo = await prisma.client.findUnique({
        where: { id: clientId! },
        select: { name: true, nip: true }
      });
      if (clientInfo?.nip !== "1112223344") {
        const clientName = clientInfo?.name.split("—")[0].trim() ?? "Klient";
        await notifySuponUsers(
          `Nowe zamówienie ${newOrder.orderNr}`,
          `Złożone przez ${clientName}`,
          `/admin/orders/${newOrder.id}`
        );
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
