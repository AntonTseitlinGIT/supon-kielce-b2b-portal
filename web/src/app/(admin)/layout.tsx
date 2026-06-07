import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ADMIN_NAV } from "@/config/navigation.config";
import AdminSidebarLayout from "@/components/AdminSidebarLayout";

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
  if (role !== "SUPON_ADMIN" && role !== "SUPON_DEV") {
    redirect("/client/dashboard");
  }

  const filteredNav = ADMIN_NAV.filter((item) => item.roles.includes(role));

  return (
    <AdminSidebarLayout
      navItems={filteredNav}
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </AdminSidebarLayout>
  );
}
