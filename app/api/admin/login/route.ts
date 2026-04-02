import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_VALUE,
  PREVIEW_ADMIN_EMAIL,
  PREVIEW_ADMIN_PASSWORD,
  normalizeAdminRedirect,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; from?: string }
    | null;

  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (email !== PREVIEW_ADMIN_EMAIL || password !== PREVIEW_ADMIN_PASSWORD) {
    return NextResponse.json(
      { message: "Invalid login. Use the preview admin credentials shown on the page." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    success: true,
    redirectTo: normalizeAdminRedirect(body?.from),
  });

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: ADMIN_SESSION_VALUE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
