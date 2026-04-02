import "server-only";

import { cookies } from "next/headers";
import {
  mapReportToWorkOrder,
  type AdminReportRecord,
  type WorkOrder,
  type WorkOrderStatus,
} from "@/app/admin/data";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

const BACKEND_API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

export async function getAdminWorkOrdersServer(filters?: {
  status?: WorkOrderStatus | "all";
  limit?: number;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return [] as WorkOrder[];
  }

  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters?.limit) {
    params.set("limit", String(filters.limit));
  }

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/maintenance-reports${params.toString() ? `?${params.toString()}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    return [] as WorkOrder[];
  }

  if (!response.ok) {
    throw new Error(`Failed to load maintenance reports (${response.status})`);
  }

  const payload = (await response.json()) as { data?: AdminReportRecord[] };
  return payload.data?.map(mapReportToWorkOrder) ?? [];
}

export async function getAdminWorkOrderByCodeServer(reportCode: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/maintenance-reports/${encodeURIComponent(reportCode)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load maintenance report (${response.status})`);
  }

  const payload = (await response.json()) as { data?: AdminReportRecord };
  return payload.data ? mapReportToWorkOrder(payload.data) : null;
}
