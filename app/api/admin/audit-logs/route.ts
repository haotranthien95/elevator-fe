import { NextResponse } from "next/server";
import { getAdminAuthorizationHeader, getBackendApiBaseUrl } from "@/lib/admin-api";

export async function GET(request: Request) {
  const authorization = await getAdminAuthorizationHeader();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { search } = new URL(request.url);
  const response = await fetch(`${getBackendApiBaseUrl()}/audit/admin${search}`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({ message: "Invalid backend response" }))) as unknown;
  return NextResponse.json(payload, { status: response.status });
}
