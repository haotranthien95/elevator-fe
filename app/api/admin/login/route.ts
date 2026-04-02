import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, normalizeAdminRedirect } from "@/lib/admin-auth";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; from?: string }
    | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  let authResponse: Response;
  let result:
    | { message?: string; data?: { accessToken?: string } }
    | null = null;

  try {
    authResponse = await fetch(`${BACKEND_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
      cache: "no-store",
    });

    result = (await authResponse.json().catch(() => null)) as
      | { message?: string; data?: { accessToken?: string } }
      | null;
  } catch {
    return NextResponse.json(
      { message: "The auth service is unavailable right now. Please try again." },
      { status: 502 },
    );
  }

  if (!authResponse.ok) {
    return NextResponse.json(
      { message: result?.message ?? "Login failed. Please try again." },
      { status: authResponse.status },
    );
  }

  const accessToken = result?.data?.accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { message: "Backend login did not return a JWT token." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    success: true,
    redirectTo: normalizeAdminRedirect(body?.from),
  });

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: accessToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
