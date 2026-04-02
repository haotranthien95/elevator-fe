import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  DEFAULT_ADMIN_REDIRECT,
  hasValidAdminSession,
} from "./lib/admin-auth";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = hasValidAdminSession(sessionValue);
  const isLoginRoute = pathname === "/admin/login";

  if (!isAuthenticated && !isLoginRoute) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginRoute) {
    const dashboardUrl = new URL(DEFAULT_ADMIN_REDIRECT, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
