"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccessNotice, useAdminPermissions } from "../../components/admin-role-provider";
import { getStatusMeta, type ActivityNote, type Priority, type WorkOrder, type WorkOrderStatus } from "../../data";

const statusOptions: Array<{ value: WorkOrderStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "submitted", label: "Submitted" },
  { value: "pc-review", label: "PC Review" },
  { value: "comm-review", label: "Commercial Review" },
  { value: "invoice-ready", label: "Invoice Ready" },
];

const priorityOptions: Priority[] = ["Low", "Medium", "High", "Critical"];
const noteKindOptions: ActivityNote["kind"][] = ["system", "dispatch", "review", "finance"];

type TechnicianOption = {
  id: string;
  name: string;
  team: string | null;
  specialty: string | null;
  isActive: boolean;
};

function noteTone(kind: ActivityNote["kind"]) {
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

async function parseActionResponse(response: Response) {
  const result = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) {
    throw new Error(result?.message ?? "Action failed. Please try again.");
  }

  return result;
}

export function ReportDetailClient({ workOrder }: { workOrder: WorkOrder }) {
  const router = useRouter();
  const { canManageOperations } = useAdminPermissions();
  const meta = getStatusMeta(workOrder.status);
  const [status, setStatus] = useState<WorkOrderStatus>(workOrder.status);
  const [statusAuthor, setStatusAuthor] = useState("Operations Team");
  const [statusNote, setStatusNote] = useState("");
  const [assignedTo, setAssignedTo] = useState(workOrder.technician ?? "");
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [priority, setPriority] = useState<Priority>(workOrder.priority);
  const [assignAuthor, setAssignAuthor] = useState("Dispatcher");
  const [assignNote, setAssignNote] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("Operations Team");
  const [noteKind, setNoteKind] = useState<ActivityNote["kind"]>("system");
  const [noteText, setNoteText] = useState("");
  const [busyAction, setBusyAction] = useState<"status" | "assign" | "note" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const assignmentOptions = useMemo(() => {
    const activeTechnicians = technicians.filter((item) => item.isActive);

    if (assignedTo && !activeTechnicians.some((item) => item.name === assignedTo)) {
      return [
        { id: `legacy-${assignedTo}`, name: assignedTo, team: "Legacy", specialty: null, isActive: true },
        ...activeTechnicians,
      ];
    }

    return activeTechnicians;
  }, [assignedTo, technicians]);

  useEffect(() => {
    async function loadTechnicians() {
      try {
        const response = await fetch("/api/admin/technicians?activeOnly=true", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { data?: TechnicianOption[] }
          | null;

        if (response.ok) {
          setTechnicians(payload?.data ?? []);
        }
      } catch {
        // Keep the current assignment value as fallback.
      }
    }

    void loadTechnicians();
  }, []);

  const summaryCards = useMemo(
    () => [
      ["Called Person", workOrder.calledPerson ?? "—"],
      ["Called Time", workOrder.calledTime ?? "—"],
      ["Arrival Time", workOrder.arrivalTime ?? "—"],
      ["Completion Time", workOrder.completionTime ?? "—"],
      ["Response Time", workOrder.responseTimeMinutes ? `${workOrder.responseTimeMinutes} min` : "—"],
      ["Work Duration", workOrder.workDurationHours ? `${workOrder.workDurationHours} hrs` : "—"],
      ["Team", workOrder.team ?? "—"],
      ["Engineer", workOrder.engineer ?? "—"],
    ],
    [workOrder],
  );

  const checklistResults = workOrder.checklistResults;

  const handleStatusSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageOperations) {
      setFeedback({
        type: "error",
        message: "Your role has read-only access for ticket actions.",
      });
      return;
    }

    setBusyAction("status");
    setFeedback(null);

    try {
      await parseActionResponse(
        await fetch(`/api/admin/work-orders/${encodeURIComponent(workOrder.reportCode)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            author: statusAuthor,
            note: statusNote,
          }),
        }),
      );

      setFeedback({ type: "success", message: "Ticket status updated successfully." });
      setStatusNote("");
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update status.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleAssignSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageOperations) {
      setFeedback({
        type: "error",
        message: "Your role has read-only access for ticket actions.",
      });
      return;
    }

    setBusyAction("assign");
    setFeedback(null);

    const selectedTechnician = assignmentOptions.find(
      (technician) => technician.name === assignedTo && !technician.id.startsWith("legacy-"),
    );

    try {
      await parseActionResponse(
        await fetch(`/api/admin/work-orders/${encodeURIComponent(workOrder.reportCode)}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignedTechnicianId: selectedTechnician?.id,
            assignedTo,
            priority,
            author: assignAuthor,
            note: assignNote,
          }),
        }),
      );

      setFeedback({ type: "success", message: "Assignment updated successfully." });
      setAssignNote("");
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to assign the ticket.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleNoteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageOperations) {
      setFeedback({
        type: "error",
        message: "Your role has read-only access for ticket actions.",
      });
      return;
    }

    setBusyAction("note");
    setFeedback(null);

    try {
      await parseActionResponse(
        await fetch(`/api/admin/work-orders/${encodeURIComponent(workOrder.reportCode)}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: noteAuthor,
            kind: noteKind,
            text: noteText,
          }),
        }),
      );

      setFeedback({ type: "success", message: "Internal note added successfully." });
      setNoteText("");
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to add note.",
      });
    } finally {
      setBusyAction(null);
    }
  };

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
              href="/admin/work-orders"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back to list
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([label, value], index) => (
          <div key={`${String(label)}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Checklist review</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Structured inspection results captured from the field submission.
                </p>
              </div>
              {checklistResults ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {checklistResults.checkedCount}/{checklistResults.totalCount} checked
                </span>
              ) : null}
            </div>

            {checklistResults ? (
              <div className="mt-4 space-y-4">
                {(checklistResults.templateName || checklistResults.equipmentType) && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    Template: {checklistResults.templateName ?? "Standard checklist"}
                    {checklistResults.equipmentType ? ` · ${checklistResults.equipmentType}` : ""}
                  </div>
                )}

                {checklistResults.categories.map((group, groupIndex) => (
                  <div key={`${group.category}-${groupIndex}`} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">{group.category}</p>
                    <div className="mt-3 space-y-2">
                      {group.items.map((item, itemIndex) => (
                        <div
                          key={`${item.label}-${itemIndex}`}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                            item.checked
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                            {item.checked ? "OK" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No structured checklist data has been attached to this report yet.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Ticket actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Update the workflow, assign the technician, and leave internal notes from this page.
            </p>

            {!canManageOperations ? (
              <div className="mt-4">
                <AccessNotice message="This account can review the work order history, but only dispatchers and admins can change status, assignments, or internal notes." />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <form onSubmit={handleStatusSubmit} className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Change status</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as WorkOrderStatus)}
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={statusAuthor}
                      onChange={(event) => setStatusAuthor(event.target.value)}
                      placeholder="Updated by"
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    />
                  </div>
                  <textarea
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    rows={3}
                    placeholder="Optional note for the status change"
                    className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={busyAction === "status"}
                    className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyAction === "status" ? "Saving..." : "Update status"}
                  </button>
                </form>

                <form onSubmit={handleAssignSubmit} className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Assign technician</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <select
                      value={assignedTo}
                      onChange={(event) => setAssignedTo(event.target.value)}
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                      required
                    >
                      <option value="">Select technician</option>
                      {assignmentOptions.map((technician) => (
                        <option key={technician.id} value={technician.name}>
                          {technician.name}
                          {technician.team ? ` · ${technician.team}` : ""}
                        </option>
                      ))}
                    </select>
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as Priority)}
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      value={assignAuthor}
                      onChange={(event) => setAssignAuthor(event.target.value)}
                      placeholder="Assigned by"
                      className="sm:col-span-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    />
                  </div>
                  <textarea
                    value={assignNote}
                    onChange={(event) => setAssignNote(event.target.value)}
                    rows={3}
                    placeholder="Optional dispatch note"
                    className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={busyAction === "assign"}
                    className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyAction === "assign" ? "Saving..." : "Save assignment"}
                  </button>
                </form>

                <form onSubmit={handleNoteSubmit} className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Add internal note</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={noteAuthor}
                      onChange={(event) => setNoteAuthor(event.target.value)}
                      placeholder="Author"
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                      required
                    />
                    <select
                      value={noteKind}
                      onChange={(event) => setNoteKind(event.target.value as ActivityNote["kind"])}
                      className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    >
                      {noteKindOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    rows={4}
                    placeholder="Write a note for the operations history..."
                    className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={busyAction === "note"}
                    className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyAction === "note" ? "Saving..." : "Add note"}
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">PCB tests performed</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {workOrder.pcbTests.length > 0 ? (
                workOrder.pcbTests.map((test, index) => (
                  <span key={`${test || "test"}-${index}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
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
              {workOrder.notes.map((note, index) => (
                <div key={`${note.at || "note"}-${note.author || "system"}-${index}`} className={`rounded-2xl border p-3 text-sm ${noteTone(note.kind)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{note.author}</p>
                    <span className="text-xs opacity-75">{note.at}</span>
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
