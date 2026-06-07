import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPortalPath } from "@/config/permissions.config";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect(getPortalPath(session.user.role));
  }
  redirect("/login");
}
