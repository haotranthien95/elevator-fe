import "server-only";

import { cookies } from "next/headers";
import {
  mapReportToWorkOrder,
  type AdminReportRecord,
  type WorkOrder,
  type WorkOrderStatus,
} from "@/app/admin/data";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

type AdminScheduleRecord = {
  id: string;
  title: string;
  maintenanceType: string;
  scheduledDate: string;
  status: string;
  priority: string;
  recurrenceRule?: string | null;
  building?: { id: string; name: string; code?: string | null } | null;
  equipment?: { id: string; equipmentCode: string; equipmentType: string } | null;
  assignedTechnician?: { id: string; name: string; team?: string | null } | null;
  linkedReport?: { id: string; reportCode: string | null; status: string } | null;
};

type AdminAuditLogRecord = {
  id: string;
  action: string;
  resourceType: string;
  resourceLabel?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  createdAt: string;
};

type AdminAnalyticsSummary = {
  range: {
    dateFrom: string;
    dateTo: string;
    granularity: 'daily' | 'weekly';
    limit: number;
    slaMinutes: number;
  };
  overview: {
    totalReports: number;
    openReports: number;
    reviewBacklog: number;
    invoiceReady: number;
    criticalOpen: number;
    dispatchNeeded: number;
    scheduledVisits: number;
    overdueSchedules: number;
    activeScheduleLoad: number;
    avgResponseMinutes: number | null;
    avgWorkDurationHours: number | null;
    slaMisses: number;
    responseSampleCount: number;
    slaComplianceRate: number | null;
    completionRate: number;
    slaMinutes: number;
  };
  trends: Array<{
    key: string;
    label: string;
    opened: number;
    reviewReady: number;
    closed: number;
    slaMisses: number;
    avgResponseMinutes: number | null;
    avgWorkDurationHours: number | null;
  }>;
  technicians: Array<{
    name: string;
    team: string;
    openJobs: number;
    completedJobs: number;
    scheduledVisits: number;
    overdueVisits: number;
    avgResponseMinutes: number | null;
    avgWorkDurationHours: number | null;
    utilization: string;
  }>;
  buildings: Array<{
    building: string;
    tickets: number;
    openTickets: number;
    criticalTickets: number;
    reviewBacklog: number;
    overdueSchedules: number;
    avgResponseMinutes: number | null;
    riskScore: number;
  }>;
  auditActions: Array<{
    action: string;
    count: number;
  }>;
};

type AdminAlertsSummary = {
  generatedAt: string;
  thresholds: {
    dueWithinHours: number;
    staleAfterHours: number;
    escalateAfterHours: number;
    limit: number;
  };
  overview: {
    dueSoonSchedules: number;
    overdueSchedules: number;
    escalatedSchedules: number;
    unassignedReports: number;
    criticalUnassignedReports: number;
    staleReviewReports: number;
    acknowledgedItems: number;
    attentionItems: number;
  };
  dueSoonSchedules: Array<{
    id: string;
    title: string;
    building: string;
    equipmentCode: string | null;
    technician: string | null;
    priority: string;
    scheduledDate: string;
    recurrenceRule: string | null;
    linkedReportCode: string | null;
    hoursUntil: number;
  }>;
  overdueEscalations: Array<{
    id: string;
    title: string;
    building: string;
    equipmentCode: string | null;
    technician: string | null;
    priority: string;
    scheduledDate: string;
    linkedReportCode: string | null;
    hoursPastDue: number;
    escalationLevel: 'warning' | 'critical';
  }>;
  dispatchAlerts: Array<{
    id: string;
    reportCode: string | null;
    reportLabel: string;
    building: string;
    equipmentCode: string | null;
    priority: string;
    status: string;
    submittedAt: string;
    hoursOpen: number;
  }>;
  staleReviews: Array<{
    id: string;
    reportCode: string | null;
    reportLabel: string;
    building: string;
    priority: string;
    status: string;
    owner: string;
    submittedAt: string;
    updatedAt: string;
    hoursWaiting: number;
  }>;
  activeAcknowledgements: Array<{
    id: string;
    alertType: string;
    resourceType: string;
    resourceId: string;
    resourceLabel: string | null;
    status: string;
    note: string | null;
    snoozedUntil: string | null;
    acknowledgedAt: string;
    actorName: string | null;
  }>;
};

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

export async function getAdminSchedulesServer(filters?: {
  status?: string | "all";
  activeOnly?: boolean;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return [] as AdminScheduleRecord[];
  }

  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters?.activeOnly) {
    params.set("activeOnly", "true");
  }

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/schedules/admin${params.toString() ? `?${params.toString()}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    return [] as AdminScheduleRecord[];
  }

  if (!response.ok) {
    throw new Error(`Failed to load schedules (${response.status})`);
  }

  const payload = (await response.json()) as { data?: AdminScheduleRecord[] };
  return payload.data ?? [];
}

export async function getAdminAuditLogsServer(filters?: {
  limit?: number;
  action?: string;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return [] as AdminAuditLogRecord[];
  }

  const params = new URLSearchParams();
  if (filters?.limit) {
    params.set("limit", String(filters.limit));
  }
  if (filters?.action?.trim()) {
    params.set("action", filters.action.trim());
  }

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/audit/admin${params.toString() ? `?${params.toString()}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 401 || response.status === 403) {
    return [] as AdminAuditLogRecord[];
  }

  if (!response.ok) {
    throw new Error(`Failed to load audit logs (${response.status})`);
  }

  const payload = (await response.json()) as { data?: AdminAuditLogRecord[] };
  return payload.data ?? [];
}

export async function getAdminAnalyticsSummaryServer(filters?: {
  dateFrom?: string;
  dateTo?: string;
  granularity?: 'daily' | 'weekly';
  limit?: number;
  slaMinutes?: number;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null as AdminAnalyticsSummary | null;
  }

  const params = new URLSearchParams();
  if (filters?.dateFrom?.trim()) {
    params.set('dateFrom', filters.dateFrom.trim());
  }
  if (filters?.dateTo?.trim()) {
    params.set('dateTo', filters.dateTo.trim());
  }
  if (filters?.granularity) {
    params.set('granularity', filters.granularity);
  }
  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }
  if (filters?.slaMinutes) {
    params.set('slaMinutes', String(filters.slaMinutes));
  }

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/analytics/admin/summary${params.toString() ? `?${params.toString()}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  if (response.status === 401 || response.status === 403) {
    return null as AdminAnalyticsSummary | null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load analytics summary (${response.status})`);
  }

  const payload = (await response.json()) as { data?: AdminAnalyticsSummary };
  return payload.data ?? null;
}

export async function getAdminAlertsSummaryServer(filters?: {
  dueWithinHours?: number;
  staleAfterHours?: number;
  escalateAfterHours?: number;
  limit?: number;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null as AdminAlertsSummary | null;
  }

  const params = new URLSearchParams();
  if (filters?.dueWithinHours) {
    params.set('dueWithinHours', String(filters.dueWithinHours));
  }
  if (filters?.staleAfterHours) {
    params.set('staleAfterHours', String(filters.staleAfterHours));
  }
  if (filters?.escalateAfterHours) {
    params.set('escalateAfterHours', String(filters.escalateAfterHours));
  }
  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }

  const response = await fetch(
    `${BACKEND_API_BASE_URL}/alerts/admin/summary${params.toString() ? `?${params.toString()}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  if (response.status === 401 || response.status === 403) {
    return null as AdminAlertsSummary | null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load alerts summary (${response.status})`);
  }

  const payload = (await response.json()) as { data?: AdminAlertsSummary };
  return payload.data ?? null;
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
