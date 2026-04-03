import { NextResponse } from "next/server";
import { getAdminAuthorizationHeader, getBackendApiBaseUrl } from "@/lib/admin-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await getAdminAuthorizationHeader();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const response = await fetch(`${getBackendApiBaseUrl()}/checklists/admin/${id}`, {
    headers: {
      Authorization: authorization,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({ message: "Invalid backend response" }))) as unknown;
  return NextResponse.json(payload, { status: response.status });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await getAdminAuthorizationHeader();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.text();
  const response = await fetch(`${getBackendApiBaseUrl()}/checklists/admin/${id}`, {
    method: "PATCH",
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await getAdminAuthorizationHeader();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const response = await fetch(`${getBackendApiBaseUrl()}/checklists/admin/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({ message: "Invalid backend response" }))) as unknown;
  return NextResponse.json(payload, { status: response.status });
}
