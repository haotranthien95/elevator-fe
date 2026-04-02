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

export function getDashboardStats() {
  const responseTimes = workOrders
    .map((item) => item.responseTimeMinutes)
    .filter((value): value is number => value !== null);

  const workDurations = workOrders
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
    myQueue: workOrders.filter((item) => openStatuses.includes(item.status)).length,
    activeJobs: workOrders.filter((item) => item.status === "active").length,
    pendingReview: workOrders.filter(
      (item) => item.status === "pc-review" || item.status === "comm-review",
    ).length,
    scheduled: workOrders.filter((item) => item.status === "scheduled").length,
    avgResponseTime: Math.round(
      responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length,
    ),
    avgWorkDuration:
      Math.round(
        (workDurations.reduce((sum, value) => sum + value, 0) / workDurations.length) * 10,
      ) / 10,
  };
}
