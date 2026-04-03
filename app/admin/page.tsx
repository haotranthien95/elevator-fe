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
  const _technicianLoadCards =
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
    <div className="space-y-12">
      <section className="rounded-[20px] bg-gradient-to-br from-primary to-primary-container p-6 sm:p-8 text-white shadow-[0_12px_32px_rgba(24,28,30,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
              Phase 7 rollout
            </p>
            <h1 className="mt-2 text-[2.75rem] font-semibold tracking-tight leading-none text-white">
              System Live
            </h1>
            <p className="mt-3 text-base text-white/90 font-medium">
              Review tickets, manage schedules and trace key operations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            {quickActions.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 backdrop-blur-md"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "My Queue", value: stats.myQueue, helper: "Tickets to act on" },
          { label: "Active Jobs", value: stats.activeJobs, helper: "Field work in progress" },
          { label: "Pending Review", value: stats.pendingReview, helper: "PC / Commercial review" },
          { label: "Critical Queue", value: stats.criticalQueue, helper: "Highest priority jobs" }
        ].map((card) => (
          <div key={card.label} className="rounded-2xl bg-surface-lowest p-6 shadow-[0_12px_32px_rgba(24,28,30,0.06)] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary"></div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
              {card.label}
            </p>
            <p className="mt-4 text-[2.75rem] font-semibold text-on-surface tracking-tight leading-none">{card.value}</p>
            <p className="mt-2 text-sm font-medium text-on-surface-variant/80">{card.helper}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr]">
        <section className="rounded-3xl bg-surface-lowest p-6 shadow-[0_12px_32px_rgba(24,28,30,0.06)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-[1.5rem] font-semibold tracking-tight text-on-surface">Recent work orders</h2>
            </div>
            <Link href="/admin/reports" className="text-sm font-bold text-primary hover:text-primary-container tracking-wide transition-colors">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders.map((item, index) => {
              const meta = getStatusMeta(item.status);
              return (
                <Link
                  key={`${item.reportCode || "report"}-${index}`}
                  href={`/admin/reports/${item.reportCode}`}
                  className="block rounded-2xl bg-surface-lowest p-6 transition-all hover:bg-surface-high border-l-[4px] border-primary shadow-[0_4px_12px_rgba(24,28,30,0.03)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-on-surface text-lg">{item.reportCode}</p>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.badgeClass.replace('border', '').replace('bg-white', 'bg-surface-lowest')}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-on-surface-variant">
                        {item.building} · {item.liftNo} · {item.technician ?? "Unassigned"}
                      </p>
                      <p className="mt-3 text-sm text-on-surface-variant max-w-2xl">{item.issue}</p>
                    </div>

                    <div className="min-w-36 text-sm text-on-surface-variant text-right flex flex-col gap-1 pt-2 sm:pt-0">
                      <p>
                        <span className="font-bold text-on-surface">Priority:</span> {item.priority}
                      </p>
                      <p>
                        <span className="font-bold text-on-surface">Response:</span>{" "}
                        {item.responseTimeMinutes ? `${item.responseTimeMinutes} min` : "—"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}