import Link from "next/link";
import { getAdminAlertsSummaryServer } from "@/lib/admin-server";
import { AlertActionButtons } from "./alert-actions";

type AlertSearchParams = {
  dueWithinHours?: string;
  staleAfterHours?: string;
  escalateAfterHours?: string;
  limit?: string;
};

function clampNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(parsed), min), max);
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replace(",", " ·");
}

function formatHours(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}h`;
}

function formatAlertTypeLabel(value: string) {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAlertHref(
  current: { dueWithinHours: number; staleAfterHours: number; escalateAfterHours: number; limit: number },
  updates: Partial<{ dueWithinHours: number; staleAfterHours: number; escalateAfterHours: number; limit: number }>,
) {
  const next = { ...current, ...updates };
  const params = new URLSearchParams({
    dueWithinHours: String(next.dueWithinHours),
    staleAfterHours: String(next.staleAfterHours),
    escalateAfterHours: String(next.escalateAfterHours),
    limit: String(next.limit),
  });

  return `/admin/alerts?${params.toString()}`;
}

export default async function AdminAlertsPage({
  searchParams,
}: {
  searchParams?: Promise<AlertSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const filters = {
    dueWithinHours: clampNumber(params.dueWithinHours, 24, 1, 168),
    staleAfterHours: clampNumber(params.staleAfterHours, 24, 1, 168),
    escalateAfterHours: clampNumber(params.escalateAfterHours, 48, 1, 336),
    limit: clampNumber(params.limit, 6, 1, 20),
  };

  const alertSummary = await getAdminAlertsSummaryServer(filters);
  const thresholds = alertSummary?.thresholds ?? filters;
  const overview = alertSummary?.overview ?? {
    dueSoonSchedules: 0,
    overdueSchedules: 0,
    escalatedSchedules: 0,
    unassignedReports: 0,
    criticalUnassignedReports: 0,
    staleReviewReports: 0,
    acknowledgedItems: 0,
    attentionItems: 0,
  };
  const activeAcknowledgements = alertSummary?.activeAcknowledgements ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-amber-900 via-orange-800 to-slate-900 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Alerting phase</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Operational alerts and escalation review</h1>
            <p className="mt-2 text-sm text-amber-50/90 sm:text-base">
              Review due-soon visits, escalated overdue PM items, dispatch gaps, and stale review tickets from one place.
            </p>
            <p className="mt-3 text-sm text-amber-100">
              Due soon within {thresholds.dueWithinHours}h · stale after {thresholds.staleAfterHours}h · escalate after {thresholds.escalateAfterHours}h
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "Due next 12h", href: buildAlertHref(filters, { dueWithinHours: 12 }) },
              { label: "Due next 24h", href: buildAlertHref(filters, { dueWithinHours: 24 }) },
              { label: "Escalate 72h+", href: buildAlertHref(filters, { escalateAfterHours: 72 }) },
              { label: "Reports review", href: "/admin/work-orders?status=pc-review" },
            ].map((item) => (
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
          { label: "Attention items", value: overview.attentionItems, helper: "combined alert workload" },
          { label: "Due soon", value: overview.dueSoonSchedules, helper: `within ${thresholds.dueWithinHours}h` },
          { label: "Overdue PM", value: overview.overdueSchedules, helper: "active visits past due" },
          { label: "Escalated", value: overview.escalatedSchedules, helper: `${thresholds.escalateAfterHours}h+ overdue` },
          { label: "Need dispatch", value: overview.unassignedReports, helper: "unassigned live tickets" },
          { label: "Stale review", value: overview.staleReviewReports, helper: `${thresholds.staleAfterHours}h+ waiting` },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
          </div>
        ))}
      </section>

      {overview.acknowledgedItems > 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {overview.acknowledgedItems} alert(s) are currently acknowledged or snoozed and hidden from the active queue.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Escalated overdue schedules</h2>
              <p className="text-sm text-slate-500">PM visits older than the escalation threshold should be reassigned or rescheduled now.</p>
            </div>
            <Link href="/admin/schedules?status=overdue" className="text-sm font-semibold text-rose-700 hover:text-rose-900">
              Review all →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {alertSummary?.overdueEscalations?.length ? (
              alertSummary.overdueEscalations.map((item) => (
                <div key={item.id} className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.building}{item.equipmentCode ? ` · ${item.equipmentCode}` : ""}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.escalationLevel === "critical" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.escalationLevel === "critical" ? "Critical" : "Warning"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Scheduled: {formatDateTime(item.scheduledDate)}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.technician ?? "Unassigned"} · {formatHours(item.hoursPastDue)} overdue</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <Link href="/admin/schedules?status=overdue" className="text-xs font-semibold text-rose-700 hover:text-rose-900">
                      Open schedule queue →
                    </Link>
                    <AlertActionButtons
                      alertType="overdue-escalation"
                      resourceType="schedule"
                      resourceId={item.id}
                      resourceLabel={item.title}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No overdue visits have crossed the escalation window yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Dispatch alerts</h2>
              <p className="text-sm text-slate-500">Unassigned live tickets should be owned before they age further.</p>
            </div>
            <Link href="/admin/work-orders" className="text-sm font-semibold text-amber-700 hover:text-amber-900">
              Open work orders →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {alertSummary?.dispatchAlerts?.length ? (
              alertSummary.dispatchAlerts.map((item) => (
                <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.reportLabel}</p>
                      <p className="text-sm text-slate-600">{item.building}{item.equipmentCode ? ` · ${item.equipmentCode}` : ""}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Status: {item.status}</p>
                  <p className="mt-1 text-sm text-slate-500">Open for {formatHours(item.hoursOpen)} · submitted {formatDateTime(item.submittedAt)}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    {item.reportCode ? (
                      <Link href={`/admin/work-orders/${item.reportCode}`} className="text-xs font-semibold text-amber-700 hover:text-amber-900">
                        Open ticket →
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">Awaiting report code</span>
                    )}
                    <AlertActionButtons
                      alertType="dispatch-alert"
                      resourceType="maintenance-report"
                      resourceId={item.id}
                      resourceLabel={item.reportLabel}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No unassigned dispatch items are currently above the alert threshold.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Due soon visits</h2>
              <p className="text-sm text-slate-500">Use this list for the next dispatch stand-up and technician prep.</p>
            </div>
            <Link href="/admin/schedules" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
              Schedules →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {alertSummary?.dueSoonSchedules?.length ? (
              alertSummary.dueSoonSchedules.map((item) => (
                <div key={item.id} className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.building}{item.equipmentCode ? ` · ${item.equipmentCode}` : ""}</p>
                  <p className="mt-2 text-sm text-slate-600">Scheduled: {formatDateTime(item.scheduledDate)}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.technician ?? "Unassigned"} · due in {formatHours(item.hoursUntil)}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <Link href="/admin/schedules" className="text-xs font-semibold text-sky-700 hover:text-sky-900">
                      Open schedule board →
                    </Link>
                    <AlertActionButtons
                      alertType="due-soon-schedule"
                      resourceType="schedule"
                      resourceId={item.id}
                      resourceLabel={item.title}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No active visits are due inside the current look-ahead window.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Stale review queue</h2>
              <p className="text-sm text-slate-500">Submitted and review-stage tickets that have waited too long should be cleared first.</p>
            </div>
            <Link href="/admin/work-orders?status=pc-review" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
              Review queue →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {alertSummary?.staleReviews?.length ? (
              alertSummary.staleReviews.map((item) => (
                <div key={item.id} className="rounded-2xl border border-violet-200 bg-violet-50/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.reportLabel}</p>
                      <p className="text-sm text-slate-600">{item.building}</p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Owner: {item.owner}</p>
                  <p className="mt-1 text-sm text-slate-500">Waiting {formatHours(item.hoursWaiting)} · updated {formatDateTime(item.updatedAt)}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    {item.reportCode ? (
                      <Link href={`/admin/work-orders/${item.reportCode}`} className="text-xs font-semibold text-violet-700 hover:text-violet-900">
                        Open report →
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">Awaiting report code</span>
                    )}
                    <AlertActionButtons
                      alertType="stale-review"
                      resourceType="maintenance-report"
                      resourceId={item.id}
                      resourceLabel={item.reportLabel}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No review items are currently older than the stale threshold.
              </p>
            )}
          </div>
        </section>
      </div>

      {activeAcknowledgements.length ? (
        <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Acknowledged & snoozed alerts</h2>
              <p className="text-sm text-slate-500">Restore any hidden item if it should return to the active alert queue.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {activeAcknowledgements.length} hidden item(s)
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {activeAcknowledgements.map((item) => (
              <div key={`${item.alertType}-${item.resourceId}`} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.resourceLabel ?? item.resourceId}</p>
                    <p className="text-sm text-slate-600">
                      {formatAlertTypeLabel(item.alertType)} · {item.actorName ?? "Operations team"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.status === "snoozed" && item.snoozedUntil
                        ? `Snoozed until ${formatDateTime(item.snoozedUntil)}`
                        : `Acknowledged ${formatDateTime(item.acknowledgedAt)}`}
                    </p>
                    {item.note ? <p className="mt-1 text-sm text-slate-500">Note: {item.note}</p> : null}
                  </div>
                  <AlertActionButtons
                    mode="restore"
                    alertType={item.alertType}
                    resourceType={item.resourceType}
                    resourceId={item.resourceId}
                    resourceLabel={item.resourceLabel}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recommended actions</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Reassign or reschedule any PM visit that has been overdue for more than {thresholds.escalateAfterHours} hours.</li>
          <li>• Clear the {overview.criticalUnassignedReports} critical unassigned report(s) before the next dispatch handoff.</li>
          <li>• Use the review queue to close out stale `submitted`, `pc-review`, and `comm-review` tickets faster.</li>
          <li>• This alert center now supports acknowledge and snooze actions while outbound email/SMS reminder hooks remain the next follow-up layer.</li>
        </ul>
      </section>
    </div>
  );
}
