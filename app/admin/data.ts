export type WorkOrderStatus =
  | "pending"
  | "scheduled"
  | "active"
  | "submitted"
  | "pc-review"
  | "comm-review"
  | "invoice-ready";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export type ActivityNote = {
  at: string;
  author: string;
  kind: "system" | "dispatch" | "review" | "finance";
  text: string;
};

export type WorkOrder = {
  reportCode: string;
  building: string;
  liftNo: string;
  status: WorkOrderStatus;
  priority: Priority;
  calledPerson: string | null;
  calledTime: string | null;
  issue: string | null;
  technician: string | null;
  date: string | null;
  arrivalTime: string | null;
  completionTime: string | null;
  responseTimeMinutes: number | null;
  workDurationHours: number | null;
  rootCause: string | null;
  actionTaken: string | null;
  partsReplaced: string | null;
  pcbTests: string[];
  team: string | null;
  engineer: string | null;
  notes: ActivityNote[];
};

export type AdminReportRecord = {
  reportCode: string;
  status: WorkOrderStatus;
  priority?: Priority;
  assignedTo?: string | null;
  maintenanceType?: string | null;
  technicianName?: string | null;
  arrivalDateTime?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  findings?: string | null;
  workPerformed?: string | null;
  partsUsed?: Array<{ name: string; quantity: number }> | null;
  remarks?: string | null;
  internalNotes?: ActivityNote[] | null;
  building?: {
    id: string;
    name: string;
  } | null;
  equipment?: {
    id: string;
    equipmentCode: string;
    equipmentType: string;
  } | null;
};

const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const statusFilters = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "submitted", label: "Submitted" },
  { value: "pc-review", label: "PC Review" },
  { value: "comm-review", label: "Commercial Review" },
  { value: "invoice-ready", label: "Invoice Ready" },
] as const;

export const statusMeta: Record<
  WorkOrderStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    dotClass: "bg-amber-500",
  },
  scheduled: {
    label: "Scheduled",
    badgeClass: "bg-violet-100 text-violet-700 border border-violet-200",
    dotClass: "bg-violet-500",
  },
  active: {
    label: "Active",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    dotClass: "bg-sky-500",
  },
  submitted: {
    label: "Submitted",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    dotClass: "bg-slate-500",
  },
  "pc-review": {
    label: "PC Review",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    dotClass: "bg-indigo-500",
  },
  "comm-review": {
    label: "Commercial Review",
    badgeClass: "bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200",
    dotClass: "bg-fuchsia-500",
  },
  "invoice-ready": {
    label: "Invoice Ready",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dotClass: "bg-emerald-500",
  },
};

export const workOrders: WorkOrder[] = [
  {
    reportCode: "CBS-202512-0020",
    building: "Pearl Condo Tower B",
    liftNo: "PL2",
    status: "invoice-ready",
    priority: "Medium",
    calledPerson: "Daw Su Mon",
    calledTime: "2025-12-19 13:00",
    issue: "Routine maintenance call - scheduled quarterly inspection.",
    technician: "Ko Htet Aung",
    date: "19/12/2025",
    arrivalTime: "13:45",
    completionTime: "16:00",
    responseTimeMinutes: 45,
    workDurationHours: 2.3,
    rootCause: "Scheduled maintenance - no faults found.",
    actionTaken:
      "Completed quarterly inspection checklist and preventive adjustments. All systems were within specification.",
    partsReplaced: "Door roller bearings (4x) - preventive replacement",
    pcbTests: ["Full system test", "Door timing test", "Safety test"],
    team: "Team A",
    engineer: "NMA / NLSS",
    notes: [
      {
        at: "19 Dec 2025 · 13:00",
        author: "SYSTEM",
        kind: "system",
        text: "CBS call received from Daw Su Mon and dispatched to Ko Htet Aung.",
      },
      {
        at: "19 Dec 2025 · 16:00",
        author: "NMA (PC Review)",
        kind: "review",
        text: "Approved: routine maintenance completed as scheduled.",
      },
      {
        at: "19 Dec 2025 · 17:30",
        author: "U Soe Win (Commercial)",
        kind: "finance",
        text: "Approved for invoicing under the standard quarterly service plan.",
      },
    ],
  },
  {
    reportCode: "CBS-202512-0025",
    building: "Myanmar Plaza",
    liftNo: "PL2",
    status: "comm-review",
    priority: "High",
    calledPerson: "Daw May Zin",
    calledTime: "2025-12-20 11:00",
    issue: "Car light flickering intermittently and emergency lighting not activating.",
    technician: "Mg Thiha",
    date: "20/12/2025",
    arrivalTime: "11:40",
    completionTime: "13:30",
    responseTimeMinutes: 40,
    workDurationHours: 1.8,
    rootCause: "LED driver board failure and degraded emergency battery pack.",
    actionTaken:
      "Replaced the LED driver board and installed a new emergency battery pack. Completed emergency light retest successfully.",
    partsReplaced: "LED driver board (1x), emergency battery pack (1x)",
    pcbTests: ["Emergency light test", "Battery test"],
    team: "Team B",
    engineer: "NMA / NLSS",
    notes: [
      {
        at: "20 Dec 2025 · 11:05",
        author: "Dispatch",
        kind: "dispatch",
        text: "Marked high priority because the issue impacts emergency readiness.",
      },
      {
        at: "20 Dec 2025 · 13:35",
        author: "Mg Thiha",
        kind: "system",
        text: "Repair completed and submitted for commercial review.",
      },
    ],
  },
  {
    reportCode: "CBS-202512-0028",
    building: "Junction Square",
    liftNo: "PL1",
    status: "comm-review",
    priority: "High",
    calledPerson: "U Hla Myint",
    calledTime: "2025-12-21 09:00",
    issue: "Speed governor rope tension issue and overdue safety test.",
    technician: "Ko Aung Mya Oo",
    date: "21/12/2025",
    arrivalTime: "09:48",
    completionTime: "13:00",
    responseTimeMinutes: 48,
    workDurationHours: 3.2,
    rootCause: "Governor rope tension below minimum specification.",
    actionTaken:
      "Adjusted governor rope tension, replaced worn sheave bearing, and completed a full safety validation run.",
    partsReplaced: "Governor sheave bearing (1x), rope tensioner spring (1x)",
    pcbTests: ["Governor test", "Over-speed test", "Safety gear test"],
    team: "Team A",
    engineer: "KZT / AMO",
    notes: [
      {
        at: "21 Dec 2025 · 10:15",
        author: "Ko Aung Mya Oo",
        kind: "system",
        text: "SLA risk flagged due to safety-critical components under tension.",
      },
      {
        at: "21 Dec 2025 · 14:05",
        author: "PC Review",
        kind: "review",
        text: "Technical review completed; waiting for commercial confirmation.",
      },
    ],
  },
  {
    reportCode: "CBS-202512-0032",
    building: "Star City Tower A",
    liftNo: "PL2",
    status: "pc-review",
    priority: "Medium",
    calledPerson: "Ko Min Thu",
    calledTime: "2025-12-22 10:00",
    issue: "Emergency phone not working and intercom system offline.",
    technician: "Ko Zaw Min",
    date: "22/12/2025",
    arrivalTime: "10:35",
    completionTime: "12:00",
    responseTimeMinutes: 35,
    workDurationHours: 1.4,
    rootCause: "Intercom PCB board failure due to water damage.",
    actionTaken:
      "Replaced intercom PCB, rewired affected terminals, and tested emergency calling with monitoring center.",
    partsReplaced: "Intercom PCB board (1x)",
    pcbTests: ["Intercom test", "Emergency call test"],
    team: "Team B",
    engineer: "NMA / NLSS",
    notes: [
      {
        at: "22 Dec 2025 · 12:05",
        author: "Ko Zaw Min",
        kind: "system",
        text: "Submitted for technical review with all tests attached.",
      },
    ],
  },
  {
    reportCode: "CBS-202512-0035",
    building: "Vantage Tower - 31",
    liftNo: "PL1",
    status: "pc-review",
    priority: "High",
    calledPerson: "Daw Thin Thin",
    calledTime: "2025-12-23 14:00",
    issue: "Leveling issue on floors 15-20; car stops 2cm above floor level.",
    technician: "Mg Win Ko",
    date: "23/12/2025",
    arrivalTime: "14:55",
    completionTime: "17:30",
    responseTimeMinutes: 55,
    workDurationHours: 2.6,
    rootCause: "Inductor plate gap out of specification on floors 15-20.",
    actionTaken:
      "Adjusted inductor plate gaps to spec, recalibrated floor positioning, and completed a full ride test.",
    partsReplaced: "None - adjustment only",
    pcbTests: ["Inductor test", "Floor level accuracy", "Door zone detection"],
    team: "Team A",
    engineer: "THTZ / NLT",
    notes: [
      {
        at: "23 Dec 2025 · 15:00",
        author: "Dispatch",
        kind: "dispatch",
        text: "Escalated for same-day completion because the lift serves upper residential floors.",
      },
      {
        at: "23 Dec 2025 · 17:30",
        author: "Mg Win Ko",
        kind: "system",
        text: "Submitted photos and recalibration checklist for PC approval.",
      },
    ],
  },
  {
    reportCode: "CBS-202512-0042",
    building: "City Mall Yangon",
    liftNo: "PL3",
    status: "active",
    priority: "Critical",
    calledPerson: "U Thet Naing",
    calledTime: "2025-12-25 06:00",
    issue: "Main passenger elevator stuck between floors 3 and 4. No passengers trapped.",
    technician: "Ko Aung Mya Oo",
    date: "25/12/2025",
    arrivalTime: "06:45",
    completionTime: null,
    responseTimeMinutes: 45,
    workDurationHours: null,
    rootCause: null,
    actionTaken: "On-site investigation ongoing. Motor controller diagnostics in progress.",
    partsReplaced: null,
    pcbTests: ["Brake release inspection", "Drive fault readout"],
    team: "Rapid Response",
    engineer: "AMO",
    notes: [
      {
        at: "25 Dec 2025 · 06:10",
        author: "Dispatch",
        kind: "dispatch",
        text: "Critical dispatch opened and nearest response team assigned immediately.",
      },
      {
        at: "25 Dec 2025 · 09:30",
        author: "Ko Aung Mya Oo",
        kind: "system",
        text: "Controller fault logs collected; spare inverter requested from warehouse.",
      },
    ],
  },
  {
    reportCode: "CBS-202512-0048",
    building: "Myanmar Plaza",
    liftNo: "ESC1",
    status: "active",
    priority: "High",
    calledPerson: "Daw Aye Mon",
    calledTime: "2025-12-25 07:15",
    issue: "Escalator stopped during morning rush hour after emergency stop activation.",
    technician: "Ko Htet Aung",
    date: "01/04/2026",
    arrivalTime: "21:58",
    completionTime: null,
    responseTimeMinutes: 45,
    workDurationHours: null,
    rootCause: null,
    actionTaken: "Lock-out and safety barrier set. Mechanical inspection in progress.",
    partsReplaced: null,
    pcbTests: ["Emergency stop circuit check"],
    team: "Team A",
    engineer: "NLT",
    notes: [
      {
        at: "01 Apr 2026 · 22:10",
        author: "Operations",
        kind: "dispatch",
        text: "Customer requested progress update every 30 minutes until reopening.",
      },
    ],
  },
  {
    reportCode: "SCH-202601-07-01",
    building: "YKK Golden Hill Tower",
    liftNo: "PL1",
    status: "scheduled",
    priority: "Low",
    calledPerson: null,
    calledTime: null,
    issue: "Preventive maintenance window scheduled for the week-1 visit.",
    technician: null,
    date: "07/01/2026",
    arrivalTime: null,
    completionTime: null,
    responseTimeMinutes: null,
    workDurationHours: null,
    rootCause: null,
    actionTaken: "Awaiting dispatch confirmation and technician assignment.",
    partsReplaced: null,
    pcbTests: [],
    team: "Team A",
    engineer: "THTZ / NLT",
    notes: [
      {
        at: "05 Jan 2026 · 08:00",
        author: "Scheduler",
        kind: "system",
        text: "Preventive maintenance job created from the recurring January schedule.",
      },
    ],
  },
];

export const moduleCards = [
  {
    title: "Buildings",
    count: 12,
    description: "Portfolio locations ready for filtering, permission scoping, and reporting.",
  },
  {
    title: "Equipment",
    count: 48,
    description: "Lift and escalator assets mapped to buildings and maintenance history.",
  },
  {
    title: "Equipment Types",
    count: 4,
    description: "Elevator, escalator, dumbwaiter, and freight lift templates prepared.",
  },
  {
    title: "Checklists",
    count: 9,
    description: "Reusable inspection templates by equipment type and service program.",
  },
  {
    title: "Technicians",
    count: 6,
    description: "Dispatch-ready technicians with team and specialization context.",
  },
  {
    title: "Schedules",
    count: 14,
    description: "Upcoming preventive visits and recurring service windows to action.",
  },
] as const;

export const technicianLoad = [
  { name: "Ko Aung Mya Oo", openJobs: 2, utilization: "82%", team: "Rapid Response" },
  { name: "Ko Htet Aung", openJobs: 1, utilization: "74%", team: "Team A" },
  { name: "Mg Thiha", openJobs: 1, utilization: "68%", team: "Team B" },
  { name: "Ko Zaw Min", openJobs: 1, utilization: "61%", team: "Team B" },
] as const;

export function getStatusMeta(status: WorkOrderStatus) {
  return statusMeta[status];
}

export function getWorkOrderByCode(reportCode: string) {
  return workOrders.find((item) => item.reportCode === reportCode);
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTimeLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatNoteTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replace(",", " ·");
}

function calculateDurationHours(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return diffHours > 0 ? Math.round(diffHours * 10) / 10 : null;
}

function normalizeReportCode(report: AdminReportRecord) {
  const existing = report.reportCode?.trim();
  if (existing) {
    return existing;
  }

  const buildingSlug = (report.building?.name ?? "building")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18)
    .toUpperCase();
  const timestamp = (report.submittedAt ?? report.arrivalDateTime ?? new Date().toISOString())
    .replace(/[^0-9]/g, "")
    .slice(0, 12);

  return `LEGACY-${buildingSlug || "REPORT"}-${timestamp || "000000000000"}`;
}

export function mapReportToWorkOrder(report: AdminReportRecord): WorkOrder {
  return {
    reportCode: normalizeReportCode(report),
    building: report.building?.name ?? "Unknown building",
    liftNo: report.equipment?.equipmentCode ?? report.equipment?.equipmentType ?? "—",
    status: report.status,
    priority: report.priority ?? "Medium",
    calledPerson: null,
    calledTime: report.submittedAt ?? null,
    issue: report.findings ?? report.remarks ?? report.maintenanceType ?? null,
    technician: report.assignedTo ?? report.technicianName ?? null,
    date: formatDateLabel(report.submittedAt ?? report.arrivalDateTime),
    arrivalTime: formatTimeLabel(report.arrivalDateTime),
    completionTime:
      report.status === "submitted" ||
      report.status === "pc-review" ||
      report.status === "comm-review" ||
      report.status === "invoice-ready"
        ? formatTimeLabel(report.updatedAt)
        : null,
    responseTimeMinutes: null,
    workDurationHours: calculateDurationHours(report.arrivalDateTime, report.updatedAt),
    rootCause: report.findings ?? null,
    actionTaken: report.workPerformed ?? report.maintenanceType ?? null,
    partsReplaced:
      report.partsUsed?.length
        ? report.partsUsed.map((part) => `${part.name} (${part.quantity})`).join(", ")
        : null,
    pcbTests: [],
    team: null,
    engineer: null,
    notes:
      report.internalNotes?.map((note) => ({
        at: formatNoteTimestamp(note.at),
        author: note.author?.trim() || "System",
        kind: note.kind ?? "system",
        text: note.text?.trim() || "No details provided.",
      })) ?? [],
  };
}

export async function getAdminWorkOrders(filters?: {
  status?: (typeof statusFilters)[number]["value"];
  limit?: number;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters?.limit) {
      params.set("limit", String(filters.limit));
    }

    const response = await fetch(
      `${ADMIN_API_BASE_URL}/api/admin/reports${params.toString() ? `?${params.toString()}` : ""}`,
      { cache: "no-store" },
    );

    if (response.status === 401) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Failed to load maintenance reports (${response.status})`);
    }

    const payload = (await response.json()) as { data?: AdminReportRecord[] };
    return payload.data?.map(mapReportToWorkOrder) ?? [];
  } catch (error) {
    console.error("Falling back to seeded work orders", error);
    return workOrders;
  }
}

export async function getAdminWorkOrderByCode(reportCode: string) {
  try {
    const response = await fetch(
      `${ADMIN_API_BASE_URL}/api/admin/reports/${encodeURIComponent(reportCode)}`,
      { cache: "no-store" },
    );

    if (response.status === 401) {
      return null;
    }

    if (response.status === 404) {
      return getWorkOrderByCode(reportCode) ?? null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load maintenance report (${response.status})`);
    }

    const payload = (await response.json()) as { data?: AdminReportRecord };
    return payload.data ? mapReportToWorkOrder(payload.data) : null;
  } catch (error) {
    console.error(`Falling back to seeded work order for ${reportCode}`, error);
    return getWorkOrderByCode(reportCode) ?? null;
  }
}

export function getDashboardStats(source: WorkOrder[] = workOrders) {
  const responseTimes = source
    .map((item) => item.responseTimeMinutes)
    .filter((value): value is number => value !== null);

  const workDurations = source
    .map((item) => item.workDurationHours)
    .filter((value): value is number => value !== null);

  const openStatuses: WorkOrderStatus[] = [
    "pending",
    "active",
    "submitted",
    "pc-review",
    "comm-review",
  ];

  return {
    myQueue: source.filter((item) => openStatuses.includes(item.status)).length,
    activeJobs: source.filter((item) => item.status === "active").length,
    pendingReview: source.filter(
      (item) => item.status === "pc-review" || item.status === "comm-review",
    ).length,
    scheduled: source.filter((item) => item.status === "scheduled").length,
    avgResponseTime: responseTimes.length
      ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
      : 0,
    avgWorkDuration: workDurations.length
      ? Math.round(
          (workDurations.reduce((sum, value) => sum + value, 0) / workDurations.length) * 10,
        ) / 10
      : 0,
  };
}
