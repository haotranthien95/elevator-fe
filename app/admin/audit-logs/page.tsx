"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatAdminRole } from "@/lib/admin-auth";
import { AccessNotice, useAdminPermissions } from "../components/admin-role-provider";

type AuditLogRecord = {
  id: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  resourceLabel?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
};

function formatLabel(value: string) {
  return value
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimestamp(value: string) {
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

function summarizeDetails(details?: Record<string, unknown> | null) {
  if (!details) {
    return "No extra context recorded.";
  }

  const entries = Object.entries(details).filter(([, value]) => value !== null && value !== undefined);
  if (entries.length === 0) {
    return "No extra context recorded.";
  }

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${formatLabel(key)}: ${String(value)}`)
    .join(" · ");
}

export default function AdminAuditLogsPage() {
  const { isAdmin } = useAdminPermissions();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    const loadLogs = async () => {
      setIsLoading(true);
      setFeedback(null);

      try {
        const params = new URLSearchParams();
        if (search.trim()) {
          params.set("search", search.trim());
        }
        if (actionFilter !== "all") {
          params.set("action", actionFilter);
        }
        if (resourceFilter !== "all") {
          params.set("resourceType", resourceFilter);
        }
        params.set("limit", "100");

        const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { message?: string; data?: AuditLogRecord[] }
          | null;

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load audit logs.");
        }

        setLogs(payload?.data ?? []);
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Unable to load audit logs.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadLogs();
  }, [actionFilter, isAdmin, resourceFilter, search]);

  const actionOptions = useMemo(
    () => Array.from(new Set(logs.map((item) => item.action))).sort(),
    [logs],
  );

  const resourceOptions = useMemo(
    () => Array.from(new Set(logs.map((item) => item.resourceType))).sort(),
    [logs],
  );

  const stats = useMemo(
    () => ({
      total: logs.length,
      reports: logs.filter((item) => item.resourceType === "maintenance-report").length,
      schedules: logs.filter((item) => item.resourceType === "schedule").length,
    }),
    [logs],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Phase 7A · audit logs
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Operational audit trail</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review who changed reports, schedules, users, and master data across the admin portal.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Events: {stats.total}
            </span>
            <Link
              href="/admin"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {!isAdmin ? (
        <AccessNotice
          title="Admin access required"
          message="Audit logs are restricted to admin users because they contain sensitive operational history."
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total events</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Report actions</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-700">{stats.reports}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Schedule actions</p>
              <p className="mt-2 text-3xl font-semibold text-sky-700">{stats.schedules}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search actor, action, resource, or details..."
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="all">All actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {formatLabel(action)}
                  </option>
                ))}
              </select>
              <select
                value={resourceFilter}
                onChange={(event) => setResourceFilter(event.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="all">All resources</option>
                {resourceOptions.map((resource) => (
                  <option key={resource} value={resource}>
                    {formatLabel(resource)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-3">
              {isLoading ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Loading audit history...
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No audit events matched the current filters yet.
                </div>
              ) : (
                logs.map((log) => (
                  <article key={log.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{formatLabel(log.action)}</p>
                          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                            {formatLabel(log.resourceType)}
                          </span>
                          {log.actorRole ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {formatAdminRole(log.actorRole)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {log.resourceLabel ?? log.resourceId ?? "Unknown resource"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{summarizeDetails(log.details)}</p>
                      </div>

                      <div className="text-sm text-slate-600 sm:text-right">
                        <p className="font-medium text-slate-900">{log.actorName ?? log.actorEmail ?? "System"}</p>
                        <p>{log.actorEmail ?? "Internal action"}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {formatTimestamp(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
