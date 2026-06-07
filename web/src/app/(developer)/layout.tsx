import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DEVELOPER_NAV } from "@/config/navigation.config";
import DevSidebarLayout from "@/components/DevSidebarLayout";

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPON_DEV") {
    redirect("/admin/dashboard");
  }

  return (
    <DevSidebarLayout
      navItems={DEVELOPER_NAV}
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </DevSidebarLayout>
  );
}
