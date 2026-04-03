"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccessNotice, useAdminPermissions } from "../components/admin-role-provider";

type ScheduleStatus = "scheduled" | "completed" | "overdue" | "cancelled";
type SchedulePriority = "Low" | "Medium" | "High" | "Critical";

type BuildingOption = {
  id: string;
  name: string;
  code?: string | null;
};

type EquipmentOption = {
  id: string;
  equipmentType: string;
  equipmentCode: string;
};

type TechnicianOption = {
  id: string;
  name: string;
  team: string | null;
  specialty: string | null;
  isActive: boolean;
};

type ScheduleRecord = {
  id: string;
  title: string;
  maintenanceType: string;
  scheduledDate: string;
  status: ScheduleStatus;
  priority: SchedulePriority;
  recurrenceRule: string | null;
  notes: string | null;
  isActive: boolean;
  building: BuildingOption | null;
  equipment: EquipmentOption | null;
  assignedTechnician: Omit<TechnicianOption, "isActive"> | null;
  linkedReport: {
    id: string;
    reportCode: string | null;
    status: string;
  } | null;
};

const statusOptions: ScheduleStatus[] = ["scheduled", "completed", "overdue", "cancelled"];
const priorityOptions: SchedulePriority[] = ["Low", "Medium", "High", "Critical"];
const recurrenceOptions = ["One-time", "Weekly", "Monthly", "Quarterly"] as const;

function formatOptionLabel(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toDateTimeLocal(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (input: number) => input.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatScheduleDate(value: string) {
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

function getOverdueLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Past due";
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `Past due by ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }

  return `Past due by ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
}

function getDefaultScheduleDate() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return toDateTimeLocal(next);
}

function getStatusBadgeClass(status: ScheduleStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "overdue":
      return "bg-rose-100 text-rose-700";
    case "cancelled":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-sky-100 text-sky-700";
  }
}

const initialForm = {
  buildingId: "",
  equipmentId: "",
  assignedTechnicianId: "",
  title: "Monthly PM Visit",
  maintenanceType: "Preventive Maintenance",
  scheduledDate: getDefaultScheduleDate(),
  status: "scheduled" as ScheduleStatus,
  priority: "Medium" as SchedulePriority,
  recurrenceRule: "Monthly",
  linkedReportCode: "",
  notes: "",
  isActive: true,
};

export default function AdminSchedulesPage() {
  const { canManageOperations } = useAdminPermissions();
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ScheduleStatus>("all");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/schedules?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; data?: ScheduleRecord[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load schedules.");
      }

      setSchedules(payload?.data ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load schedules.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [buildingsResponse, techniciansResponse] = await Promise.all([
        fetch("/api/admin/buildings", { cache: "no-store" }),
        fetch("/api/admin/technicians?activeOnly=true", { cache: "no-store" }),
      ]);

      const buildingsPayload = (await buildingsResponse.json().catch(() => null)) as
        | { data?: BuildingOption[] }
        | null;
      const techniciansPayload = (await techniciansResponse.json().catch(() => null)) as
        | { data?: TechnicianOption[] }
        | null;

      const nextBuildings = buildingsPayload?.data ?? [];
      setBuildings(nextBuildings);
      setTechnicians(techniciansPayload?.data ?? []);
      setForm((current) => ({
        ...current,
        buildingId: current.buildingId || nextBuildings[0]?.id || "",
      }));
    } catch {
      setFeedback({
        type: "error",
        message: "Unable to load schedule lookups.",
      });
    }
  };

  const loadEquipment = async (buildingId: string) => {
    if (!buildingId) {
      setEquipmentOptions([]);
      setForm((current) => ({ ...current, equipmentId: "" }));
      return;
    }

    try {
      const params = new URLSearchParams({ buildingId });
      const response = await fetch(`/api/admin/equipment?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: EquipmentOption[] }
        | null;

      const nextEquipment = payload?.data ?? [];
      setEquipmentOptions(nextEquipment);
      setForm((current) => ({
        ...current,
        equipmentId: nextEquipment.some((item) => item.id === current.equipmentId)
          ? current.equipmentId
          : "",
      }));
    } catch {
      setEquipmentOptions([]);
    }
  };

  useEffect(() => {
    void loadLookups();
  }, []);

  useEffect(() => {
    void loadSchedules();
  }, [search, statusFilter]);

  useEffect(() => {
    void loadEquipment(form.buildingId);
  }, [form.buildingId]);

  const activeCount = useMemo(
    () => schedules.filter((item) => item.isActive).length,
    [schedules],
  );

  const upcomingCount = useMemo(
    () =>
      schedules.filter(
        (item) => item.status === "scheduled" && new Date(item.scheduledDate).getTime() >= Date.now(),
      ).length,
    [schedules],
  );

  const overdueCount = useMemo(
    () => schedules.filter((item) => item.status === "overdue").length,
    [schedules],
  );

  const prioritizedSchedules = useMemo(
    () =>
      [...schedules].sort((left, right) => {
        const leftPriority = left.status === "overdue" ? 0 : 1;
        const rightPriority = right.status === "overdue" ? 0 : 1;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime();
      }),
    [schedules],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      buildingId: buildings[0]?.id ?? "",
      scheduledDate: getDefaultScheduleDate(),
    });
  };

  const handleQuickStatusUpdate = async (
    schedule: ScheduleRecord,
    nextStatus: ScheduleStatus,
  ) => {
    if (!canManageOperations) {
      setFeedback({
        type: "error",
        message: "Your role has read-only access for schedule actions.",
      });
      return;
    }

    setBusyAction(`${nextStatus}-${schedule.id}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(result?.message ?? "Unable to update schedule status.");
      }

      setFeedback({
        type: "success",
        message: `Schedule marked as ${formatOptionLabel(nextStatus)}.`,
      });

      if (editingId === schedule.id) {
        setForm((current) => ({ ...current, status: nextStatus }));
      }

      await loadSchedules();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update schedule status.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async (schedule: ScheduleRecord) => {
    if (!canManageOperations) {
      setFeedback({
        type: "error",
        message: "Your role has read-only access for schedule actions.",
      });
      return;
    }

    if (!window.confirm(`Delete schedule "${schedule.title}"? This action cannot be undone.`)) {
      return;
    }

    setBusyAction(`delete-${schedule.id}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: "DELETE",
      });

      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(result?.message ?? "Unable to delete schedule.");
      }

      setFeedback({
        type: "success",
        message: "Schedule deleted successfully.",
      });

      if (editingId === schedule.id) {
        resetForm();
      }

      await loadSchedules();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete schedule.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageOperations) {
      setFeedback({
        type: "error",
        message: "Your role has read-only access for schedule actions.",
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const payload = {
        ...form,
        equipmentId: form.equipmentId || undefined,
        assignedTechnicianId: form.assignedTechnicianId || undefined,
        recurrenceRule: form.recurrenceRule || undefined,
        linkedReportCode: form.linkedReportCode.trim(),
        notes: form.notes.trim() || undefined,
      };

      const response = await fetch(
        editingId ? `/api/admin/schedules/${editingId}` : "/api/admin/schedules",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(result?.message ?? "Unable to save schedule.");
      }

      setFeedback({
        type: "success",
        message: editingId ? "Schedule updated successfully." : "Schedule created successfully.",
      });
      resetForm();
      await loadSchedules();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save schedule.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Operations planning · schedules
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Preventive maintenance schedules</h1>
            <p className="mt-1 text-sm text-slate-500">
              Plan upcoming service visits and assign the right technician before tickets go live.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Active schedules: {activeCount}
            </span>
            <span className="rounded-xl bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              Upcoming: {upcomingCount}
            </span>
            <span className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
              Overdue: {overdueCount}
            </span>
            <Link
              href="/admin/reports"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Open work orders →
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

      {!canManageOperations ? (
        <AccessNotice message="This account can review schedules, but only dispatchers and admins can create, edit, complete, or delete them." />
      ) : null}

      {overdueCount > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span className="font-semibold text-rose-900">Attention:</span> {overdueCount} schedule{overdueCount === 1 ? " is" : "s are"} overdue and should be completed, rescheduled, or reassigned.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, building, technician..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | ScheduleStatus)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatOptionLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Loading schedules...
              </div>
            ) : schedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No schedules matched the current filters.
              </div>
            ) : (
              prioritizedSchedules.map((item) => (
                <article key={item.id} className={`rounded-2xl border p-4 ${item.status === "overdue" ? "border-rose-200 bg-rose-50/60" : "border-slate-200"}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                          {formatOptionLabel(item.status)}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.building?.name ?? "Unknown building"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.equipment?.equipmentCode ?? "Any equipment"} · {item.assignedTechnician?.name ?? "Unassigned"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {formatScheduleDate(item.scheduledDate)}
                        {item.recurrenceRule ? ` · ${item.recurrenceRule}` : ""}
                      </p>
                      {item.status === "overdue" ? (
                        <p className="mt-1 text-sm font-semibold text-rose-700">
                          {getOverdueLabel(item.scheduledDate)}
                        </p>
                      ) : null}
                      {item.linkedReport?.reportCode ? (
                        <p className="mt-1 text-sm text-emerald-700">
                          Linked report: <Link href={`/admin/reports/${item.linkedReport.reportCode}`} className="font-semibold hover:underline">{item.linkedReport.reportCode}</Link>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {canManageOperations ? (
                        <>
                          {item.status !== "completed" ? (
                            <button
                              type="button"
                              onClick={() => void handleQuickStatusUpdate(item, "completed")}
                              disabled={busyAction === `completed-${item.id}` || busyAction === `delete-${item.id}`}
                              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {busyAction === `completed-${item.id}` ? "Saving..." : "Mark complete"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id);
                              setForm({
                                buildingId: item.building?.id ?? "",
                                equipmentId: item.equipment?.id ?? "",
                                assignedTechnicianId: item.assignedTechnician?.id ?? "",
                                title: item.title,
                                maintenanceType: item.maintenanceType,
                                scheduledDate: toDateTimeLocal(item.scheduledDate),
                                status: item.status,
                                priority: item.priority,
                                recurrenceRule: item.recurrenceRule ?? "One-time",
                                linkedReportCode: item.linkedReport?.reportCode ?? "",
                                notes: item.notes ?? "",
                                isActive: item.isActive,
                              });
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                          >
                            Edit schedule
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            disabled={busyAction === `delete-${item.id}`}
                            className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {busyAction === `delete-${item.id}` ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Read-only
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit schedule" : "Create schedule"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Set up PM visits with building, equipment, and technician assignment in one place.
          </p>

          {!canManageOperations ? (
            <div className="mt-4">
              <AccessNotice message="Schedule planning is limited to dispatcher and admin roles. This view remains available for review only." />
            </div>
          ) : (
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.buildingId}
                onChange={(event) => setForm((current) => ({ ...current, buildingId: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                required
              >
                <option value="">Select building</option>
                {buildings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={form.equipmentId}
                onChange={(event) => setForm((current) => ({ ...current, equipmentId: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="">All / not specified</option>
                {equipmentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.equipmentCode} · {item.equipmentType}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Schedule title"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              required
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.maintenanceType}
                onChange={(event) => setForm((current) => ({ ...current, maintenanceType: event.target.value }))}
                placeholder="Maintenance type"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                required
              />

              <input
                type="datetime-local"
                value={form.scheduledDate}
                onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.assignedTechnicianId}
                onChange={(event) => setForm((current) => ({ ...current, assignedTechnicianId: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="">Unassigned</option>
                {technicians.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}{item.team ? ` · ${item.team}` : ""}
                  </option>
                ))}
              </select>

              <select
                value={form.recurrenceRule}
                onChange={(event) => setForm((current) => ({ ...current, recurrenceRule: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                {recurrenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as SchedulePriority }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ScheduleStatus }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatOptionLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={form.linkedReportCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  linkedReportCode: event.target.value.toUpperCase(),
                }))
              }
              placeholder="Linked report code (optional)"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Planning notes"
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active schedule
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : editingId ? "Update schedule" : "Create schedule"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
          )}
        </section>
      </div>
    </div>
  );
}
