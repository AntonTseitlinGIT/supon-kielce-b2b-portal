import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";

type Params = Promise<{ orderNr: string }>;

interface PageProps {
  params: Params;
}

export default async function ClientOrderByNrRedirect(props: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { orderNr } = await props.params;

  const order = await prisma.order.findUnique({
    where: { orderNr },
    select: { id: true, clientId: true },
  });

  if (!order || order.clientId !== session.user.clientId) {
    notFound();
  }

  redirect(`/client/orders/${order.id}`);
}
