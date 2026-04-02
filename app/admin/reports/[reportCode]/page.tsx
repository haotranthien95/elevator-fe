import Link from "next/link";
import { notFound } from "next/navigation";
import { getStatusMeta, getWorkOrderByCode } from "../../data";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportCode: string }>;
}) {
  const { reportCode } = await params;
  const workOrder = getWorkOrderByCode(decodeURIComponent(reportCode));

  if (!workOrder) {
    notFound();
  }

  const meta = getStatusMeta(workOrder.status);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Work order detail
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
              {workOrder.reportCode}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {workOrder.building} · {workOrder.liftNo} · {workOrder.technician ?? "Unassigned"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${meta.badgeClass}`}>
              {meta.label}
            </span>
            <span className="rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">
              {workOrder.priority}
            </span>
            <Link
              href="/admin/reports"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back to list
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Called Person", workOrder.calledPerson ?? "—"],
          ["Called Time", workOrder.calledTime ?? "—"],
          ["Arrival Time", workOrder.arrivalTime ?? "—"],
          ["Completion Time", workOrder.completionTime ?? "—"],
          ["Response Time", workOrder.responseTimeMinutes ? `${workOrder.responseTimeMinutes} min` : "—"],
          ["Work Duration", workOrder.workDurationHours ? `${workOrder.workDurationHours} hrs` : "—"],
          ["Team", workOrder.team ?? "—"],
          ["Engineer", workOrder.engineer ?? "—"],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Issue description</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{workOrder.issue ?? "No issue description provided."}</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Technical findings</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">Root cause</p>
                <p className="mt-1">{workOrder.rootCause ?? "Pending technical review."}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Action taken</p>
                <p className="mt-1">{workOrder.actionTaken ?? "Work in progress."}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Parts replaced</p>
                <p className="mt-1">{workOrder.partsReplaced ?? "No parts recorded."}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">PCB tests performed</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {workOrder.pcbTests.length > 0 ? (
                workOrder.pcbTests.map((test) => (
                  <span key={test} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {test}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">No test results attached yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Notes & activity</h2>
            <div className="mt-4 space-y-3">
              {workOrder.notes.map((note) => (
                <div key={`${note.at}-${note.author}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{note.author}</p>
                    <span className="text-xs text-slate-500">{note.at}</span>
                  </div>
                  <p className="mt-2">{note.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
