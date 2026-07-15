import { isSuponRole } from "@/config/permissions.config";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";

type Params = Promise<{ orderNr: string }>;

interface PageProps {
  params: Params;
}

export default async function AdminOrderByNrRedirect(props: PageProps) {
  const session = await auth();
  if (!session?.user || (!isSuponRole(session.user.role))) {
    redirect("/login");
  }

  const { orderNr } = await props.params;

  const order = await prisma.order.findUnique({
    where: { orderNr },
    select: { id: true },
  });

  if (!order) {
    notFound();
  }

  redirect(`/admin/orders/${order.id}`);
}
