import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CLIENT_NAV } from "@/config/navigation.config";
import PortalLayout from "@/components/PortalLayout";
import { resolveModules } from "@/config/modules.config";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Double check client role permissions
  const role = session.user.role;
  if (role !== "BRANCH_HEAD" && role !== "CLIENT_HEAD") {
    redirect("/admin/dashboard");
  }

  // Load per-client module config and filter nav accordingly
  const clientId = session.user.clientId;
  const config = clientId
    ? await prisma.clientConfig.findUnique({ where: { clientId } })
    : null;
  const modules = resolveModules(config?.modules);

  const filteredNav = CLIENT_NAV
    .filter((item) => item.roles.includes(role))
    .filter((item) => !item.moduleKey || modules[item.moduleKey] !== false);

  return (
    <PortalLayout
      navItems={filteredNav}
      user={{
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role,
        branchName: session.user.branchName,
        clientName: session.user.clientName,
      }}
      portalType="client"
    >
      {children}
    </PortalLayout>
  );
}
