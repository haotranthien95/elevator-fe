import Link from "next/link";
import { getAdminWorkOrdersServer } from "@/lib/admin-server";
import { getDashboardStats, getStatusMeta, moduleCards, technicianLoad } from "./data";

const quickActions = [
  { label: "Open work orders", href: "/admin/reports" },
  { label: "Manage buildings", href: "/admin/buildings" },
  { label: "Manage equipment", href: "/admin/equipment" },
  { label: "Public form", href: "/" },
];

export default async function AdminDashboardPage() {
  const allOrders = await getAdminWorkOrdersServer({ limit: 50 });
  const stats = getDashboardStats(allOrders);
  const recentOrders = allOrders.slice(0, 5);
  const attentionOrders = allOrders.filter(
    (item) => item.priority === "Critical" || item.status === "pc-review" || item.status === "comm-review",
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Phase 4 rollout
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Admin dashboard, ticket actions, and master-data modules are now live.
            </h1>
            <p className="mt-2 text-sm text-emerald-50/90 sm:text-base">
              Operations can now review tickets, update assignments, and maintain the building and
              equipment portfolio from the protected admin area.
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "My Queue", value: stats.myQueue, helper: "tickets to act on" },
          { label: "Active Jobs", value: stats.activeJobs, helper: "field work in progress" },
          { label: "Pending Review", value: stats.pendingReview, helper: "PC / commercial" },
          { label: "Scheduled", value: stats.scheduled, helper: "upcoming visits" },
          { label: "Avg Response", value: `${stats.avgResponseTime} min`, helper: "SLA readiness" },
          { label: "Avg Duration", value: `${stats.avgWorkDuration} hrs`, helper: "completion time" },
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

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Technician load</h2>
            <div className="mt-4 space-y-3">
              {technicianLoad.map((tech) => (
                <div key={tech.name} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{tech.name}</p>
                      <p className="text-sm text-slate-500">{tech.team}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-slate-900">{tech.utilization}</p>
                      <p className="text-slate-500">{tech.openJobs} open jobs</p>
                    </div>
                  </div>
                </div>
              ))}
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
