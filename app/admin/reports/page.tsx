"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getStatusMeta, statusFilters, type WorkOrder, workOrders } from "../data";

function matchesQuery(order: WorkOrder, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [order.reportCode, order.building, order.liftNo, order.technician ?? "", order.issue ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function noteTone(kind: WorkOrder["notes"][number]["kind"]) {
  switch (kind) {
    case "dispatch":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "review":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "finance":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function AdminReportsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]["value"]>("all");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
      const matchesStatus = status === "all" ? true : order.status === status;
      return matchesStatus && matchesQuery(order, query);
    });
  }, [query, status]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Work order management
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Ticket list and review flow</h1>
            <p className="mt-1 text-sm text-slate-500">
              Search by report code, building, equipment, or technician and then drill into the job.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1.35fr_0.65fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search report code, building, technician..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as (typeof statusFilters)[number]["value"])
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
          >
            {statusFilters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredOrders.map((order) => {
          const meta = getStatusMeta(order.status);

          return (
            <article
              key={order.reportCode}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">{order.reportCode}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                      {order.priority}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {order.building} · {order.liftNo}
                  </p>
                </div>

                <div className="text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">Technician:</span>{" "}
                    {order.technician ?? "Unassigned"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Response:</span>{" "}
                    {order.responseTimeMinutes ? `${order.responseTimeMinutes} min` : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>
                  <span className="font-medium text-slate-900">Called person:</span>{" "}
                  {order.calledPerson ?? "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Team:</span> {order.team ?? "—"}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium text-slate-900">Issue:</span> {order.issue ?? "—"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  View quick detail
                </button>
                <Link
                  href={`/admin/reports/${order.reportCode}`}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Open detail page
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No work orders matched the current search and status filter.
        </div>
      ) : null}

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Quick detail
                </p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedOrder.reportCode}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Building", selectedOrder.building],
                  ["Lift No.", selectedOrder.liftNo],
                  ["Technician", selectedOrder.technician ?? "Unassigned"],
                  ["Status", getStatusMeta(selectedOrder.status).label],
                  ["Priority", selectedOrder.priority],
                  ["Response Time", selectedOrder.responseTimeMinutes ? `${selectedOrder.responseTimeMinutes} min` : "—"],
                  ["Arrival", selectedOrder.arrivalTime ?? "—"],
                  ["Completion", selectedOrder.completionTime ?? "—"],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Issue</h3>
                    <p className="mt-2 text-sm text-slate-700">{selectedOrder.issue ?? "No issue description."}</p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Root cause</h3>
                    <p className="mt-2 text-sm text-slate-700">{selectedOrder.rootCause ?? "Pending technical diagnosis."}</p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Action taken</h3>
                    <p className="mt-2 text-sm text-slate-700">{selectedOrder.actionTaken ?? "Work in progress."}</p>
                  </section>
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Parts / tests</h3>
                    <p className="mt-2 text-sm text-slate-700">
                      <span className="font-medium">Parts:</span> {selectedOrder.partsReplaced ?? "None recorded"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedOrder.pcbTests.length > 0 ? (
                        selectedOrder.pcbTests.map((test) => (
                          <span key={test} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {test}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No tests attached yet.</span>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Notes & activity</h3>
                    <div className="mt-3 space-y-2">
                      {selectedOrder.notes.map((note) => (
                        <div key={`${note.at}-${note.author}`} className={`rounded-2xl border p-3 text-sm ${noteTone(note.kind)}`}>
                          <p className="font-semibold">{note.author}</p>
                          <p className="text-xs opacity-75">{note.at}</p>
                          <p className="mt-1">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
