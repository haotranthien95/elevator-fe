import { NextResponse } from "next/server";
import { getAdminAuthorizationHeader, getBackendApiBaseUrl } from "@/lib/admin-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reportCode: string }> },
) {
  const authorization = await getAdminAuthorizationHeader();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { reportCode } = await context.params;
  const response = await fetch(
    `${getBackendApiBaseUrl()}/maintenance-reports/${encodeURIComponent(reportCode)}`,
    {
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => ({ message: "Invalid backend response" }))) as unknown;
  return NextResponse.json(payload, { status: response.status });
}
