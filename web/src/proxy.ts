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
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // Admin portal — only SUPON roles
  if (pathname.startsWith("/admin") && !isSuponRole(role)) {
    return NextResponse.redirect(new URL("/client/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
