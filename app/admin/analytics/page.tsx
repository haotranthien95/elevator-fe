import Link from "next/link";
import { formatAdminRole } from "@/lib/admin-auth";
import {
  getAdminAnalyticsSummaryServer,
  getAdminAuditLogsServer,
  getAdminWorkOrdersServer,
} from "@/lib/admin-server";
import {
  getBuildingReliabilitySummary,
  getDashboardStats,
  getStatusBreakdown,
  getTechnicianPerformanceSnapshot,
  getWorkloadTrend,
} from "../data";

function buildPresetHref(
  granularity: "daily" | "weekly",
  limit: number,
  slaMinutes: number,
  dateFrom?: string,
  dateTo?: string,
) {
  const params = new URLSearchParams({
    granularity,
    limit: String(limit),
    slaMinutes: String(slaMinutes),
  });

  if (dateFrom) {
    params.set("dateFrom", dateFrom);
  }
  if (dateTo) {
    params.set("dateTo", dateTo);
  }

  return `/admin/analytics?${params.toString()}`;
}

function buildCustomRangeHref(input: {
  granularity: "daily" | "weekly";
  limit: number;
  slaMinutes: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return buildPresetHref(
    input.granularity,
    input.limit,
    input.slaMinutes,
    input.dateFrom,
    input.dateTo,
  );
}

function formatActionLabel(value: string) {
  return value
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRangeLabel(value?: string | null) {
  if (!value) {
    return "Live snapshot";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getRelativeDate(daysBack: number) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() - daysBack);
  return toIsoDate(nextDate);
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    dateFrom?: string;
    dateTo?: string;
    granularity?: string;
    limit?: string;
    slaMinutes?: string;
  }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const granularity = resolvedSearchParams.granularity === "weekly" ? "weekly" : "daily";
  const limit = Math.min(Math.max(Number(resolvedSearchParams.limit ?? "6") || 6, 1), 12);
  const slaMinutes =
    Math.min(Math.max(Number(resolvedSearchParams.slaMinutes ?? "60") || 60, 15), 240);
  const dateFrom = resolvedSearchParams.dateFrom?.trim() || undefined;
  const dateTo = resolvedSearchParams.dateTo?.trim() || undefined;

  const [orders, analyticsSummary, recentAuditEvents] = await Promise.all([
    getAdminWorkOrdersServer({ limit: 100 }),
    getAdminAnalyticsSummaryServer({
      granularity,
      limit,
      slaMinutes,
      dateFrom,
      dateTo,
    }),
    getAdminAuditLogsServer({ limit: 20 }),
  ]);

  const fallbackStats = getDashboardStats(orders);
  const overview = analyticsSummary?.overview;
  const stats = {
    myQueue: overview?.openReports ?? fallbackStats.myQueue,
    pendingReview: overview?.reviewBacklog ?? fallbackStats.pendingReview,
    overdue: overview?.overdueSchedules ?? fallbackStats.overdue,
    avgResponseTime: overview?.avgResponseMinutes ?? fallbackStats.avgResponseTime,
    avgWorkDuration: overview?.avgWorkDurationHours ?? fallbackStats.avgWorkDuration,
    slaMisses: overview?.slaMisses ?? 0,
    slaMinutes: overview?.slaMinutes ?? 60,
  };
  const statusBreakdown = getStatusBreakdown(orders);
  const technicianPerformance = analyticsSummary?.technicians ??
    getTechnicianPerformanceSnapshot(orders)
      .slice(0, 6)
      .map((tech) => ({
        ...tech,
        overdueVisits: 0,
        avgResponseMinutes: tech.avgResponseTime,
        avgWorkDurationHours: tech.avgWorkDuration,
      }));
  const buildingSummary = analyticsSummary?.buildings ??
    getBuildingReliabilitySummary(orders)
      .slice(0, 6)
      .map((building) => ({
        ...building,
        avgResponseMinutes: null,
      }));
  const workloadTrend =
    analyticsSummary?.trends ??
    getWorkloadTrend(orders).map((point) => ({
      ...point,
      slaMisses: 0,
      avgResponseMinutes: null,
      avgWorkDurationHours: null,
    }));
  const auditActionSummary = analyticsSummary?.auditActions?.length
    ? analyticsSummary.auditActions.map((item) => [item.action, item.count] as const)
    : Array.from(
        recentAuditEvents.reduce((map, event) => {
          map.set(event.action, (map.get(event.action) ?? 0) + 1);
          return map;
        }, new Map<string, number>()),
      )
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5);
  const rangeCaption = analyticsSummary
    ? `${formatRangeLabel(analyticsSummary.range.dateFrom)} → ${formatRangeLabel(analyticsSummary.range.dateTo)} · ${analyticsSummary.range.granularity} view · SLA ${analyticsSummary.range.slaMinutes} min`
    : "Live snapshot from the current operations dataset";
  const todayIso = toIsoDate(new Date());
  const presetLinks = [
    {
      label: "Daily snapshot",
      href: buildPresetHref("daily", 6, slaMinutes, dateFrom, dateTo),
      active: granularity === "daily" && limit === 6,
    },
    {
      label: "Weekly review",
      href: buildPresetHref("weekly", 6, slaMinutes, dateFrom, dateTo),
      active: granularity === "weekly" && limit === 6,
    },
    {
      label: "12-period trend",
      href: buildPresetHref(granularity, 12, slaMinutes, dateFrom, dateTo),
      active: limit === 12,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Phase 7C continuation
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Operational analytics and management reporting</h1>
            <p className="mt-2 text-sm text-emerald-50/90 sm:text-base">
              Live workload, technician, building-risk, and audit signals for weekly review and dispatch planning.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
              {rangeCaption}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/reports"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Open work orders
            </Link>
            <Link
              href="/admin/schedules"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Review schedules
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {presetLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    item.active
                      ? "bg-white text-slate-900"
                      : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-100">
              <Link
                href={buildPresetHref(granularity, limit, slaMinutes, getRelativeDate(7), todayIso)}
                className="rounded-full border border-white/20 px-3 py-1.5 transition hover:bg-white/10"
              >
                Last 7 days
              </Link>
              <Link
                href={buildPresetHref(granularity, limit, slaMinutes, getRelativeDate(30), todayIso)}
                className="rounded-full border border-white/20 px-3 py-1.5 transition hover:bg-white/10"
              >
                Last 30 days
              </Link>
              <Link
                href={buildPresetHref(granularity, limit, slaMinutes, getRelativeDate(90), todayIso)}
                className="rounded-full border border-white/20 px-3 py-1.5 transition hover:bg-white/10"
              >
                Last 90 days
              </Link>
              <Link
                href={buildPresetHref(granularity, limit, 90, dateFrom, dateTo)}
                className="rounded-full border border-white/20 px-3 py-1.5 transition hover:bg-white/10"
              >
                SLA 90 min
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
              Custom review range
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Start date",
                  value: dateFrom ?? getRelativeDate(30),
                  href: buildCustomRangeHref({
                    granularity,
                    limit,
                    slaMinutes,
                    dateFrom: getRelativeDate(30),
                    dateTo: dateTo ?? todayIso,
                  }),
                },
                {
                  label: "End date",
                  value: dateTo ?? todayIso,
                  href: buildCustomRangeHref({
                    granularity,
                    limit,
                    slaMinutes,
                    dateFrom: dateFrom ?? getRelativeDate(30),
                    dateTo: todayIso,
                  }),
                },
                {
                  label: "Granularity",
                  value: granularity,
                  href: buildPresetHref(granularity === "weekly" ? "daily" : "weekly", limit, slaMinutes, dateFrom, dateTo),
                },
                {
                  label: "Window size",
                  value: `${limit} period(s)`,
                  href: buildPresetHref(granularity, limit === 12 ? 6 : 12, slaMinutes, dateFrom, dateTo),
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 transition hover:bg-white/20"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100/80">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Open Queue", value: stats.myQueue, helper: "tickets still in motion" },
          { label: "Review Backlog", value: stats.pendingReview, helper: "PC / commercial pending" },
          { label: "Overdue PM", value: stats.overdue, helper: "past due schedule visits" },
          { label: "Avg Response", value: stats.avgResponseTime ? `${stats.avgResponseTime} min` : "—", helper: "from available job data" },
          { label: "SLA Misses", value: stats.slaMisses, helper: `over ${stats.slaMinutes} min response` },
          { label: "Avg Work", value: stats.avgWorkDuration ? `${stats.avgWorkDuration} h` : "—", helper: "mean on-site duration" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Weekly management review
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Decision-support snapshot</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use this pack to review completion health, SLA compliance, dispatch pressure, and risk concentration.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/reports"
              className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Review ticket pack
            </Link>
            <Link
              href={buildPresetHref("weekly", 6, slaMinutes, dateFrom, dateTo)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Weekly rollup
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SLA compliance</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {typeof overview?.slaComplianceRate === "number" ? `${overview.slaComplianceRate}%` : "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {overview?.responseSampleCount ?? 0} response sample(s) in range
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Completion rate</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {typeof overview?.completionRate === "number" ? `${overview.completionRate}%` : "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">invoice-ready against visible report volume</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dispatch pressure</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {overview?.dispatchNeeded ?? 0}
            </p>
            <p className="mt-1 text-sm text-slate-500">unassigned live ticket(s)</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Critical open</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {overview?.criticalOpen ?? 0}
            </p>
            <p className="mt-1 text-sm text-slate-500">highest-risk jobs in the queue</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-emerald-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Supervisor guidance</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• If SLA compliance drops below 85%, prioritize dispatch balancing and unresolved critical jobs.</li>
              <li>• If completion rate stays low while backlog is rising, review PC/commercial approval bottlenecks.</li>
              <li>• Use the building watchlist to focus the weekly operations call on the top risk sites first.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Review checklist</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>1. Confirm SLA trend direction and latest misses.</p>
              <p>2. Confirm dispatch pressure and critical open jobs.</p>
              <p>3. Review the highest-risk building and overloaded technician group.</p>
              <p>4. Export or print the supporting ticket pack for the weekly meeting.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Work order mix</h2>
              <p className="text-sm text-slate-500">Current live status distribution for operational review.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {orders.length} ticket(s)
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {statusBreakdown.length > 0 ? (
              statusBreakdown.map((item) => (
                <div key={item.status}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-900">{item.label}</span>
                    <span className="text-slate-500">{item.count} · {item.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(item.percentage, item.count > 0 ? 8 : 0)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No ticket mix is available yet.</p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recent workload trend</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {workloadTrend.length > 0 ? (
                workloadTrend.map((point) => (
                  <div key={point.key} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{point.label}</p>
                    <p className="mt-2 text-sm text-slate-700">Opened: {point.opened}</p>
                    <p className="text-sm text-slate-500">Review ready: {point.reviewReady} · Closed: {point.closed}</p>
                    <p className="text-sm text-slate-500">
                      Avg response: {point.avgResponseMinutes ? `${point.avgResponseMinutes} min` : "—"} · SLA misses: {point.slaMisses}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500 sm:col-span-3">
                  Not enough dated tickets are available yet for a trend chart.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Audit signal summary</h2>
            <p className="text-sm text-slate-500">Most frequent tracked changes from the new audit layer.</p>
          </div>

          <div className="mt-4 space-y-3">
            {auditActionSummary.length > 0 ? (
              auditActionSummary.map(([action, count]) => (
                <div key={action} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-900">{formatActionLabel(action)}</span>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">{count}</span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No audit activity has been captured yet.</p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Latest changes</h3>
            <div className="mt-3 space-y-3">
              {recentAuditEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{formatActionLabel(event.action)}</p>
                      <p className="text-sm text-slate-500">{event.resourceLabel ?? event.resourceType}</p>
                    </div>
                    {event.actorRole ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {formatAdminRole(event.actorRole)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Technician performance snapshot</h2>
            <p className="text-sm text-slate-500">Open workload, planned visits, and delivery indicators by technician.</p>
          </div>
          <Link href="/admin/reports" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
            Open ticket list →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {technicianPerformance.length > 0 ? (
            technicianPerformance.map((tech) => (
              <div key={tech.name} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{tech.name}</p>
                    <p className="text-sm text-slate-500">{tech.team}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {tech.utilization}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Open jobs:</span> {tech.openJobs}</p>
                  <p><span className="font-medium text-slate-900">Scheduled visits:</span> {tech.scheduledVisits}</p>
                  <p><span className="font-medium text-slate-900">Overdue visits:</span> {tech.overdueVisits}</p>
                  <p><span className="font-medium text-slate-900">Closed / reviewed:</span> {tech.completedJobs}</p>
                  <p><span className="font-medium text-slate-900">Avg work:</span> {tech.avgWorkDurationHours ? `${tech.avgWorkDurationHours} h` : "—"}</p>
                  <p><span className="font-medium text-slate-900">Avg response:</span> {tech.avgResponseMinutes ? `${tech.avgResponseMinutes} min` : "—"}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Technician analytics will appear here as assigned tickets and schedules accumulate.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Building reliability watchlist</h2>
            <p className="text-sm text-slate-500">Sites with the highest current service pressure and follow-up risk.</p>
          </div>
          <Link href="/admin/schedules?status=overdue" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
            Review overdue visits →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {buildingSummary.length > 0 ? (
            buildingSummary.map((building) => (
              <div key={building.building} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{building.building}</p>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    Risk {building.riskScore}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Tickets:</span> {building.tickets}</p>
                  <p><span className="font-medium text-slate-900">Open:</span> {building.openTickets}</p>
                  <p><span className="font-medium text-slate-900">Critical:</span> {building.criticalTickets}</p>
                  <p><span className="font-medium text-slate-900">Review backlog:</span> {building.reviewBacklog}</p>
                  <p><span className="font-medium text-slate-900">Overdue PM:</span> {building.overdueSchedules}</p>
                  <p><span className="font-medium text-slate-900">Avg response:</span> {building.avgResponseMinutes ? `${building.avgResponseMinutes} min` : "—"}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Building reliability signals will appear here once more live work orders are available.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/70 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Management export tips</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>• Use `Print summary` in `Work Orders` for a filter-specific review pack.</li>
          <li>• Export CSV from `Work Orders` to continue analysis in Excel or BI tooling.</li>
          <li>• Use this analytics screen during weekly dispatch review to spot overloaded teams and high-risk buildings.</li>
        </ul>
      </section>
    </div>
  );
}
