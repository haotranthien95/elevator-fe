"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BuildingRecord = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  equipment?: Array<{ id: string }>;
};

const initialForm = {
  name: "",
  code: "",
  address: "",
  contactName: "",
  contactPhone: "",
  isActive: true,
};

export default function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadBuildings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/buildings", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; data?: BuildingRecord[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load buildings.");
      }

      setBuildings(payload?.data ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load buildings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBuildings();
  }, []);

  const filteredBuildings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return buildings;
    }

    return buildings.filter((building) =>
      [building.name, building.code ?? "", building.address ?? "", building.contactName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [buildings, query]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(editingId ? `/api/admin/buildings/${editingId}` : "/api/admin/buildings", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save building.");
      }

      setFeedback({
        type: "success",
        message: editingId ? "Building updated successfully." : "Building created successfully.",
      });
      resetForm();
      await loadBuildings();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save building.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = buildings.filter((building) => building.isActive).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Master data · buildings
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Building portfolio</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage serviced sites, contact details, and active locations for dispatch operations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/equipment"
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Open equipment →
            </Link>
            <Link
              href="/admin"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total sites</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{buildings.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Active</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inactive</p>
          <p className="mt-2 text-3xl font-semibold text-slate-700">{buildings.length - activeCount}</p>
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All buildings</h2>
              <p className="text-sm text-slate-500">Search and review every active service location.</p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search building or contact..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 sm:max-w-xs"
            />
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Loading buildings...
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No buildings matched the current search.
              </div>
            ) : (
              filteredBuildings.map((building) => (
                <article key={building.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{building.name}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            building.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {building.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {building.code ?? "No code"} · {building.address ?? "Address pending"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {building.contactName ?? "No contact"} · {building.contactPhone ?? "No phone"}
                      </p>
                    </div>

                    <div className="text-right text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-900">Equipment:</span>{" "}
                        {building.equipment?.length ?? 0}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(building.id);
                          setForm({
                            name: building.name,
                            code: building.code ?? "",
                            address: building.address ?? "",
                            contactName: building.contactName ?? "",
                            contactPhone: building.contactPhone ?? "",
                            isActive: building.isActive,
                          });
                        }}
                        className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        Edit building
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit building" : "Add a new building"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep location and contact details up to date for dispatch and reporting.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Building name"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              required
            />
            <input
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="Building code"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              rows={3}
              placeholder="Address"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.contactName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactName: event.target.value }))
                }
                placeholder="Contact person"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
              <input
                value={form.contactPhone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactPhone: event.target.value }))
                }
                placeholder="Contact phone"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active service location
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : editingId ? "Update building" : "Create building"}
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
        </section>
      </div>
    </div>
  );
}
