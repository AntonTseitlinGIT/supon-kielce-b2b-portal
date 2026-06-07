import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ADMIN_NAV } from "@/config/navigation.config";
import PortalLayout from "@/components/PortalLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Double check admin/supon role permissions
  const role = session.user.role;
  if (role !== "SUPON_MANAGER" && role !== "SUPON_ADMIN") {
    redirect("/client/dashboard");
  }

  const filteredNav = ADMIN_NAV.filter((item) => item.roles.includes(role));

  return (
    <PortalLayout
      navItems={filteredNav}
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role,
        branchName: session.user.branchName,
        clientName: session.user.clientName,
      }}
      portalType="admin"
    >
      {children}
    </PortalLayout>
  );
}
