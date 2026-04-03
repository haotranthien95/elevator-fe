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
      <section className="rounded-[24px] bg-gradient-to-br from-primary to-primary-container p-6 sm:p-10 text-white shadow-[0_12px_32px_rgba(0,64,223,0.15)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_24px_48px_rgba(0,64,223,0.2)]">
        <div className="absolute inset-0 bg-white/5 opacity-50 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/Noise_texture.png')] mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.25em] text-white/80">
              Phase 7 rollout
            </p>
            <h1 className="mt-3 text-[2.75rem] font-bold tracking-tight leading-[1.1] text-white Drop-shadow-md">
              System Live
            </h1>
            <p className="mt-4 text-[0.875rem] text-white/90 font-medium leading-relaxed max-w-xl">
              Review tickets, manage schedules and trace key operations across all geographic regions from the protected admin workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-5">
            {quickActions.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[12px] bg-white/10 px-5 py-2.5 text-[0.875rem] font-medium text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)] backdrop-blur-md border border-white/10"
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
          <div key={card.label} className="group rounded-[16px] bg-surface-lowest p-6 shadow-[0_8px_24px_rgba(24,28,30,0.04)] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(24,28,30,0.08)]">
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary scale-y-75 opacity-70 transition-all group-hover:scale-y-100 group-hover:opacity-100 rounded-r-sm"></div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
              {card.label}
            </p>
            <p className="mt-4 text-[2.75rem] font-bold text-on-surface tracking-tight leading-none group-hover:text-primary transition-colors duration-300">{card.value}</p>
            <p className="mt-3 text-[0.875rem] font-medium text-on-surface-variant/80">{card.helper}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr]">
        <section className="rounded-[20px] bg-surface-lowest p-6 shadow-[0_12px_32px_rgba(24,28,30,0.05)] border border-outline-variant/10">
          <div className="mb-6 flex items-center justify-between pb-2 border-b border-surface-high">
            <div>
              <h2 className="text-[1.5rem] font-bold tracking-tight text-on-surface">Recent work orders</h2>
            </div>
            <Link href="/admin/reports" className="text-[0.875rem] font-bold text-primary hover:text-primary-container tracking-wide transition-colors">
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
                  className="group block rounded-[16px] bg-surface-lowest p-6 transition-all duration-300 hover:bg-surface-high border-l-[4px] border-primary/50 hover:border-primary shadow-[0_4px_12px_rgba(24,28,30,0.03)] hover:shadow-[0_12px_24px_rgba(24,28,30,0.06)] hover:-translate-y-0.5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-bold text-on-surface text-[1.125rem] group-hover:text-primary transition-colors duration-200">{item.reportCode}</p>
                        <span className={`rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.05em] shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${meta.badgeClass.replace('border', '').replace('bg-white', '')}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-2 text-[0.875rem] font-medium text-on-surface-variant flex items-center gap-2">
                        <span>{item.building}</span>
                        <span className="h-1 w-1 rounded-full bg-on-surface-variant/40"></span>
                        <span>{item.liftNo}</span>
                        <span className="h-1 w-1 rounded-full bg-on-surface-variant/40"></span>
                        <span>{item.technician ?? "Unassigned"}</span>
                      </p>
                      <p className="mt-3 text-[0.875rem] text-on-surface-variant max-w-2xl leading-relaxed">{item.issue}</p>
                    </div>

                    <div className="min-w-36 text-[0.875rem] text-on-surface-variant text-right flex flex-col gap-2 pt-3 sm:pt-1">
                      <p className="flex justify-between sm:block border-b border-surface-high sm:border-0 pb-2 sm:pb-0">
                        <span className="font-bold text-on-surface sm:mr-2">Priority</span>
                        <span className="font-medium bg-surface-low px-2 py-0.5 rounded-[4px] sm:bg-transparent sm:p-0 group-hover:bg-surface-lowest transition-colors">{item.priority}</span>
                      </p>
                      <p className="flex justify-between sm:block">
                        <span className="font-bold text-on-surface sm:mr-2">Response</span>
                        <span className="font-medium text-on-surface-variant/80">{item.responseTimeMinutes ? `${item.responseTimeMinutes} min` : "—"}</span>
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