"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccessNotice, useAdminPermissions } from "../components/admin-role-provider";

type TechnicianRecord = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  team: string | null;
  specialty: string | null;
  notes: string | null;
  isActive: boolean;
};

const initialForm = {
  name: "",
  phone: "",
  email: "",
  team: "",
  specialty: "",
  notes: "",
  isActive: true,
};

export default function AdminTechniciansPage() {
  const { isAdmin } = useAdminPermissions();
  const [technicians, setTechnicians] = useState<TechnicianRecord[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadTechnicians = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`/api/admin/technicians?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; data?: TechnicianRecord[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load technicians.");
      }

      setTechnicians(payload?.data ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load technicians.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTechnicians();
  }, [search]);

  const activeCount = useMemo(
    () => technicians.filter((item) => item.isActive).length,
    [technicians],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        editingId ? `/api/admin/technicians/${editingId}` : "/api/admin/technicians",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save technician.");
      }

      setFeedback({
        type: "success",
        message: editingId ? "Technician updated successfully." : "Technician created successfully.",
      });
      resetForm();
      await loadTechnicians();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save technician.",
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
              Master data · technicians
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Technician roster</h1>
            <p className="mt-1 text-sm text-slate-500">
              Maintain the active service team used for dispatch and report assignment.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Active technicians: {activeCount}
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

      {!isAdmin ? (
        <AccessNotice message="Technician profiles remain visible for dispatch review, but only admin users can modify the roster." />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, team, specialty, email..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
          />

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Loading technicians...
              </div>
            ) : technicians.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No technicians matched the current search.
              </div>
            ) : (
              technicians.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        {item.team ? (
                          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                            {item.team}
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.specialty ?? "General maintenance"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.phone ?? "Phone TBD"} · {item.email ?? "Email TBD"}
                      </p>
                    </div>

                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            name: item.name,
                            phone: item.phone ?? "",
                            email: item.email ?? "",
                            team: item.team ?? "",
                            specialty: item.specialty ?? "",
                            notes: item.notes ?? "",
                            isActive: item.isActive,
                          });
                        }}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        Edit technician
                      </button>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Read-only
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit technician" : "Add technician"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep dispatcher-ready contact data and specialties up to date.
          </p>

          {!isAdmin ? (
            <div className="mt-4">
              <AccessNotice message="Only admin users can add or update technician records." />
            </div>
          ) : (
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              required
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.team}
                onChange={(event) => setForm((current) => ({ ...current, team: event.target.value }))}
                placeholder="Team"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
              <input
                value={form.specialty}
                onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))}
                placeholder="Specialty"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Dispatch notes"
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active for assignment
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : editingId ? "Update technician" : "Create technician"}
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
