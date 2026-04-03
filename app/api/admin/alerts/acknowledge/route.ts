import { NextResponse } from "next/server";
import { getAdminAuthorizationHeader, getBackendApiBaseUrl } from "@/lib/admin-api";

export async function POST(request: Request) {
  const authorization = await getAdminAuthorizationHeader();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  const response = await fetch(`${getBackendApiBaseUrl()}/alerts/admin/acknowledge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({ message: "Invalid backend response" }))) as unknown;
  return NextResponse.json(payload, { status: response.status });
}

export async function DELETE(request: Request) {
  const authorization = await getAdminAuthorizationHeader();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const alertType = searchParams.get("alertType");
  const resourceId = searchParams.get("resourceId");

  if (alertType) {
    params.set("alertType", alertType);
  }
  if (resourceId) {
    params.set("resourceId", resourceId);
  }

  const response = await fetch(
    `${getBackendApiBaseUrl()}/alerts/admin/acknowledge${params.toString() ? `?${params.toString()}` : ""}`,
    {
      method: "DELETE",
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => ({ message: "Invalid backend response" }))) as unknown;
  return NextResponse.json(payload, { status: response.status });
}
