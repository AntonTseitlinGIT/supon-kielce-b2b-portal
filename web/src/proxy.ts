import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isClientRole, isSuponRole, getPortalPath } from "@/config/permissions.config";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes — always accessible
  if (pathname === "/login" || pathname === "/") {
    // If already logged in, redirect to the correct portal
    if (session?.user) {
      return NextResponse.redirect(
        new URL(getPortalPath(session.user.role), req.url)
      );
    }
    return NextResponse.next();
  }

  // Protected — require login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  // Client portal — only client roles
  if (pathname.startsWith("/client") && !isClientRole(role)) {
    return NextResponse.redirect(new URL(getPortalPath(role), req.url));
  }

  // Admin portal — only SUPON roles (not SUPON_DEV — they have their own portal)
  if (pathname.startsWith("/admin") && (role === "BRANCH_HEAD" || role === "CLIENT_HEAD")) {
    return NextResponse.redirect(new URL("/client/dashboard", req.url));
  }

  // Developer portal — only SUPON_DEV
  if (pathname.startsWith("/developer") && role !== "SUPON_DEV") {
    return NextResponse.redirect(new URL(getPortalPath(role), req.url));
  }

  // Settings and Users pages in admin — only SUPON_DEV
  if (
    (pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/users")) &&
    role !== "SUPON_DEV"
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
