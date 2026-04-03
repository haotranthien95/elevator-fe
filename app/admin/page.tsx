import Link from "next/link";
import { formatAdminRole } from "@/lib/admin-auth";
import {
  getAdminAlertsSummaryServer,
  getAdminAnalyticsSummaryServer,
  getAdminAuditLogsServer,
  getAdminSchedulesServer,
  getAdminWorkOrdersServer,
} from "@/lib/admin-server";
import {
  getBuildingReliabilitySummary,
  getDashboardStats,
  getStatusMeta,
  getTechnicianPerformanceSnapshot,
  getWorkloadTrend,
  moduleCards,
  technicianLoad,
} from "./data";

function formatInsightLabel(value: string) {
  return value
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const quickActions = [
  { label: "Open work orders", href: "/admin/reports" },
  { label: "Alerts", href: "/admin/alerts" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Manage buildings", href: "/admin/buildings" },
  { label: "Manage equipment", href: "/admin/equipment" },
  { label: "Plan schedules", href: "/admin/schedules" },
  { label: "Audit logs", href: "/admin/audit-logs" },
  { label: "Public form", href: "/" },
];

export default async function AdminDashboardPage() {
  const [allOrders, allSchedules, recentAuditEvents, analyticsSummary, alertsSummary] = await Promise.all([
    getAdminWorkOrdersServer({ limit: 50 }),
    getAdminSchedulesServer({ activeOnly: true }),
    getAdminAuditLogsServer({ limit: 5 }),
    getAdminAnalyticsSummaryServer({ granularity: "daily", limit: 6, slaMinutes: 60 }),
    getAdminAlertsSummaryServer({ dueWithinHours: 24, staleAfterHours: 24, escalateAfterHours: 48, limit: 4 }),
  ]);
  const stats = getDashboardStats(allOrders, allSchedules);
  const recentOrders = allOrders.slice(0, 5);
  const attentionOrders = allOrders.filter(
    (item) => item.priority === "Critical" || item.status === "pc-review" || item.status === "comm-review",
  );
  const overdueSchedules = allSchedules
    .filter((item) => item.status === "overdue")
    .sort((left, right) => new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime())
    .slice(0, 4);
  const buildingHotspots = getBuildingReliabilitySummary(allOrders, allSchedules).slice(0, 4);
  const technicianPerformance = getTechnicianPerformanceSnapshot(allOrders, allSchedules);
  const technicianLoadCards =
    technicianPerformance.length > 0
      ? technicianPerformance.slice(0, 4)
      : technicianLoad.map((tech) => ({
          ...tech,
          scheduledVisits: 0,
          completedJobs: 0,
          avgWorkDuration: null,
          avgResponseTime: null,
        }));
  const workloadTrend =
    analyticsSummary?.trends ??
    getWorkloadTrend(allOrders).map((point) => ({
      ...point,
      avgResponseMinutes: null,
      avgWorkDurationHours: null,
      slaMisses: 0,
    }));
  const upcomingSchedules = allSchedules
    .filter((item) => item.status === "scheduled")
    .sort((left, right) => new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Phase 7 rollout
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Operations now have live dispatch controls, role-based access, and an audit-ready admin portal.
            </h1>
            <p className="mt-2 text-sm text-emerald-50/90 sm:text-base">
              Review tickets, manage schedules and libraries, and trace key operational changes from the protected admin workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
        {[
          { label: "My Queue", value: stats.myQueue, helper: "tickets to act on" },
          { label: "Active Jobs", value: stats.activeJobs, helper: "field work in progress" },
          { label: "Need Dispatch", value: stats.needsDispatch, helper: "unassigned live tickets" },
          { label: "Pending Review", value: stats.pendingReview, helper: "PC / commercial" },
          { label: "Critical Queue", value: stats.criticalQueue, helper: "highest priority jobs" },
          { label: "Scheduled", value: stats.scheduled, helper: "upcoming visits" },
          { label: "Overdue", value: stats.overdue, helper: "past due visits" },
          { label: "Invoice Ready", value: stats.invoiceReady, helper: "commercially cleared" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent work orders</h2>
              <p className="text-sm text-slate-500">Fast overview of the latest field and review activities.</p>
            </div>
            <Link href="/admin/reports" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((item, index) => {
              const meta = getStatusMeta(item.status);
              return (
                <Link
                  key={`${item.reportCode || "report"}-${index}`}
                  href={`/admin/reports/${item.reportCode}`}
                  className="block rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-400 hover:bg-emerald-50/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.reportCode}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.building} · {item.liftNo} · {item.technician ?? "Unassigned"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">{item.issue}</p>
                    </div>

                    <div className="min-w-36 text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-900">Priority:</span> {item.priority}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Response:</span>{" "}
                        {item.responseTimeMinutes ? `${item.responseTimeMinutes} min` : "—"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Needs attention</h2>
            <p className="mt-1 text-sm text-slate-500">Prioritized items for dispatch and review teams.</p>

            <div className="mt-4 space-y-3">
              {attentionOrders.slice(0, 4).map((item, index) => {
                const meta = getStatusMeta(item.status);
                return (
                  <div key={`${item.reportCode || "attention"}-${index}`} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{item.reportCode}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.building}</p>
                    <p className="mt-2 text-sm text-slate-500">Priority: {item.priority}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {overdueSchedules.length > 0 ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-rose-900">Overdue schedules</h2>
                  <p className="mt-1 text-sm text-rose-700">
                    These PM visits have passed their planned time and need immediate attention.
                  </p>
                </div>
                <Link href="/admin/schedules?status=overdue" className="text-sm font-semibold text-rose-700 hover:text-rose-900">
                  Review all →
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {overdueSchedules.map((schedule) => (
                  <div key={schedule.id} className="rounded-2xl border border-rose-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{schedule.title}</p>
                        <p className="text-sm text-slate-600">{schedule.building?.name ?? "Unknown building"}</p>
                      </div>
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        Overdue
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(schedule.scheduledDate)).replace(",", " ·")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {schedule.assignedTechnician?.name ?? "Unassigned"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Operational insights</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-amber-900">Alert center</p>
                  <Link href="/admin/alerts" className="text-xs font-semibold text-amber-700 hover:text-amber-900">
                    Open alerts →
                  </Link>
                </div>
                <p className="mt-1 text-amber-800">
                  {alertsSummary?.overview.escalatedSchedules ?? 0} escalated visit(s), {alertsSummary?.overview.dueSoonSchedules ?? 0} due in the next {alertsSummary?.thresholds.dueWithinHours ?? 24} hours, and {alertsSummary?.overview.staleReviewReports ?? 0} stale review item(s) need follow-up.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Dispatch pressure</p>
                <p className="mt-1">{stats.needsDispatch} live ticket(s) still need assignment and {stats.criticalQueue} critical job(s) are currently open.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Review backlog</p>
                <p className="mt-1">{stats.pendingReview} ticket(s) are waiting for PC or commercial review, while {stats.invoiceReady} are ready for invoicing.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Service level</p>
                <p className="mt-1">
                  Avg response is {analyticsSummary?.overview.avgResponseMinutes ? `${analyticsSummary.overview.avgResponseMinutes} min` : "not available yet"}
                  {typeof analyticsSummary?.overview.slaMisses === "number"
                    ? ` with ${analyticsSummary.overview.slaMisses} ticket(s) above the ${analyticsSummary.overview.slaMinutes} min SLA.`
                    : "."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">Portfolio hotspots</p>
                  <Link href="/admin/analytics" className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">
                    Full analytics →
                  </Link>
                </div>
                <div className="mt-2 space-y-2">
                  {buildingHotspots.map((building) => (
                    <div key={building.building} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-900">{building.building}</span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Risk {building.riskScore}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {building.openTickets} open · {building.criticalTickets} critical · {building.overdueSchedules} overdue visit(s)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Recent workload trend</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {workloadTrend.length > 0 ? (
                    workloadTrend.map((point) => (
                      <div key={point.key} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{point.label}</p>
                        <p className="mt-1 text-sm text-slate-700">Opened: {point.opened}</p>
                        <p className="text-sm text-slate-500">Review ready: {point.reviewReady} · Closed: {point.closed}</p>
                        <p className="text-xs text-slate-500">
                          Avg response: {point.avgResponseMinutes ? `${point.avgResponseMinutes} min` : "—"} · SLA misses: {point.slaMisses}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 sm:col-span-3">
                      Not enough dated activity yet for a live workload trend snapshot.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Technician load</h2>
            <div className="mt-4 space-y-3">
              {technicianLoadCards.map((tech) => (
                <div key={tech.name} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{tech.name}</p>
                      <p className="text-sm text-slate-500">{tech.team}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-slate-900">{tech.utilization}</p>
                      <p className="text-slate-500">{tech.openJobs} open · {tech.scheduledVisits} scheduled</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Closed / reviewed: {tech.completedJobs}
                    {tech.avgWorkDuration ? ` · avg ${tech.avgWorkDuration} h on site` : ""}
                    {tech.avgResponseTime ? ` · ${tech.avgResponseTime} min response` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Upcoming schedules</h2>
                <p className="mt-1 text-sm text-slate-500">Next preventive maintenance visits lined up for the field team.</p>
              </div>
              <Link href="/admin/schedules" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                Manage →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingSchedules.length > 0 ? (
                upcomingSchedules.map((schedule) => (
                  <div key={schedule.id} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{schedule.title}</p>
                        <p className="text-sm text-slate-500">
                          {schedule.building?.name ?? "Unknown building"}
                          {schedule.equipment?.equipmentCode ? ` · ${schedule.equipment.equipmentCode}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        {schedule.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(schedule.scheduledDate)).replace(",", " ·")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {schedule.assignedTechnician?.name ?? "Unassigned"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                  No upcoming schedules yet. Start planning from the schedules module.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent audit activity</h2>
                <p className="mt-1 text-sm text-slate-500">Latest tracked operational changes from the new audit trail.</p>
              </div>
              <Link href="/admin/audit-logs" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                Open logs →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recentAuditEvents.length > 0 ? (
                recentAuditEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{formatInsightLabel(event.action)}</p>
                        <p className="text-sm text-slate-500">{event.resourceLabel ?? event.resourceType}</p>
                      </div>
                      {event.actorRole ? (
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          {formatAdminRole(event.actorRole)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{event.actorName ?? event.actorEmail ?? "System"}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(event.createdAt)).replace(",", " ·")}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                  No recent audit events are available for this session yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Master data foundation</h2>
          <p className="text-sm text-slate-500">
            Phase 1 keeps the core admin shell ready for the next CRUD modules.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{card.title}</h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {card.count}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
