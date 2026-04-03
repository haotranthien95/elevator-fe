"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccessNotice, useAdminPermissions } from "../components/admin-role-provider";

type EquipmentTypeRecord = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string | null;
  isActive: boolean;
};

const initialForm = {
  name: "",
  code: "",
  description: "",
  category: "Vertical Transport",
  isActive: true,
};

export default function AdminEquipmentTypesPage() {
  const { isAdmin } = useAdminPermissions();
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeRecord[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadEquipmentTypes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/equipment-types", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; data?: EquipmentTypeRecord[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load equipment types.");
      }

      setEquipmentTypes(payload?.data ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load equipment types.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEquipmentTypes();
  }, []);

  const filteredTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return equipmentTypes;
    }

    return equipmentTypes.filter((item) => {
      return [item.name, item.code, item.category, item.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [equipmentTypes, search]);

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
        editingId ? `/api/admin/equipment-types/${editingId}` : "/api/admin/equipment-types",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save equipment type.");
      }

      setFeedback({
        type: "success",
        message: editingId
          ? "Equipment type updated successfully."
          : "Equipment type created successfully.",
      });
      resetForm();
      await loadEquipmentTypes();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save equipment type.",
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
              Master data · equipment types
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Equipment type library</h1>
            <p className="mt-1 text-sm text-slate-500">
              Standardize asset categories so reports and equipment records stay consistent.
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
        <AccessNotice message="Equipment types remain visible, but only admin users can manage the shared library." />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search type name, code, category..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
          />

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Loading equipment types...
              </div>
            ) : filteredTypes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No equipment types matched the current search.
              </div>
            ) : (
              filteredTypes.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        {item.code ? (
                          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                            {item.code}
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
                      <p className="mt-1 text-sm text-slate-600">{item.category ?? "Uncategorized"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.description ?? "No description added yet."}
                      </p>
                    </div>

                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            name: item.name,
                            code: item.code ?? "",
                            description: item.description ?? "",
                            category: item.category ?? "",
                            isActive: item.isActive,
                          });
                        }}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        Edit type
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
            {editingId ? "Edit equipment type" : "Add equipment type"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Maintain a shared taxonomy for lifts, escalators, and service assets.
          </p>

          {!isAdmin ? (
            <div className="mt-4">
              <AccessNotice message="Equipment type management is restricted to admin users." />
            </div>
          ) : (
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Type name"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                required
              />
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="Short code"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <input
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="Category"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
              className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active equipment type
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : editingId ? "Update type" : "Create type"}
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
