import { prisma } from "@/lib/db";

interface NotifyUsersOptions {
  userIds: string[];
  title: string;
  body: string;
  link: string;
}

export async function notifyUsers({ userIds, title, body, link }: NotifyUsersOptions) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map(userId => ({ userId, title, body, link })),
  });
}

export async function notifyClientUsers(
  clientId: string,
  title: string,
  body: string,
  link: string
) {
  const users = await prisma.user.findMany({
    where: { clientId, isActive: true },
    select: { id: true },
  });
  await notifyUsers({ userIds: users.map(u => u.id), title, body, link });
}

export async function notifySuponUsers(title: string, body: string, link: string) {
  const users = await prisma.user.findMany({
    where: { role: "SUPON_ADMIN", isActive: true },
    select: { id: true },
  });
  await notifyUsers({ userIds: users.map(u => u.id), title, body, link });
}
