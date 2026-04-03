"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AccessNotice, useAdminPermissions } from "../components/admin-role-provider";

type EquipmentTypeRecord = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  isActive: boolean;
};

type ChecklistCategoryRecord = {
  category: string;
  items: string[];
};

type ChecklistTemplateRecord = {
  id: string;
  name: string;
  description: string | null;
  categories: ChecklistCategoryRecord[];
  isActive: boolean;
  equipmentType: {
    id: string;
    name: string;
    code?: string | null;
    category?: string | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type ChecklistGroupInput = {
  id: string;
  category: string;
  itemsText: string;
};

const createLocalId = () => Math.random().toString(36).slice(2, 10);

const createEmptyGroup = (
  category = "",
  items: string[] = [],
): ChecklistGroupInput => ({
  id: createLocalId(),
  category,
  itemsText: items.join("\n"),
});

const createInitialForm = (equipmentTypeId = "") => ({
  equipmentTypeId,
  name: "",
  description: "",
  isActive: true,
  groups: [createEmptyGroup("General")],
});

export default function AdminChecklistsPage() {
  const { isAdmin } = useAdminPermissions();
  const [templates, setTemplates] = useState<ChecklistTemplateRecord[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeRecord[]>([]);
  const [search, setSearch] = useState("");
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState("all");
  const [form, setForm] = useState(createInitialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const loadTemplates = async () => {
    const response = await fetch("/api/admin/checklists", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; data?: ChecklistTemplateRecord[] }
      | null;

    if (!response.ok) {
      throw new Error(payload?.message ?? "Unable to load checklist templates.");
    }

    setTemplates(payload?.data ?? []);
  };

  const loadEquipmentTypes = async () => {
    const response = await fetch("/api/admin/equipment-types", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; data?: EquipmentTypeRecord[] }
      | null;

    if (!response.ok) {
      throw new Error(payload?.message ?? "Unable to load equipment types.");
    }

    const nextTypes = payload?.data ?? [];
    setEquipmentTypes(nextTypes);
    setForm((current) => {
      if (current.equipmentTypeId) {
        return current;
      }

      const defaultTypeId = nextTypes.find((item) => item.isActive)?.id ?? nextTypes[0]?.id ?? "";
      return { ...current, equipmentTypeId: defaultTypeId };
    });
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadTemplates(), loadEquipmentTypes()]);
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Unable to load checklist data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, []);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesType =
        equipmentTypeFilter === "all" || template.equipmentType?.id === equipmentTypeFilter;

      if (!matchesType) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        template.name,
        template.description,
        template.equipmentType?.name,
        ...template.categories.map((group) => group.category),
        ...template.categories.flatMap((group) => group.items),
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [equipmentTypeFilter, search, templates]);

  const resetForm = () => {
    setEditingId(null);
    setFeedback(null);
    setForm(createInitialForm(equipmentTypes.find((item) => item.isActive)?.id ?? equipmentTypes[0]?.id ?? ""));
  };

  const updateGroup = (groupId: string, key: "category" | "itemsText", value: string) => {
    setForm((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, [key]: value } : group,
      ),
    }));
  };

  const addGroup = () => {
    setForm((current) => ({
      ...current,
      groups: [...current.groups, createEmptyGroup()],
    }));
  };

  const removeGroup = (groupId: string) => {
    setForm((current) => ({
      ...current,
      groups:
        current.groups.length === 1
          ? current.groups
          : current.groups.filter((group) => group.id !== groupId),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      if (!form.equipmentTypeId) {
        throw new Error("Please select an equipment type.");
      }

      const categories = form.groups
        .map((group) => ({
          category: group.category.trim(),
          items: group.itemsText
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        }))
        .filter((group) => group.category && group.items.length > 0);

      if (categories.length === 0) {
        throw new Error("Please add at least one checklist category with one or more items.");
      }

      const response = await fetch(
        editingId ? `/api/admin/checklists/${editingId}` : "/api/admin/checklists",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentTypeId: form.equipmentTypeId,
            name: form.name.trim() || undefined,
            description: form.description.trim() || undefined,
            isActive: form.isActive,
            categories,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save checklist template.");
      }

      setFeedback({
        type: "success",
        message: editingId
          ? "Checklist template updated successfully."
          : "Checklist template created successfully.",
      });
      resetForm();
      await loadTemplates();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save checklist template.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: ChecklistTemplateRecord) => {
    const confirmed = window.confirm(`Delete checklist template \"${template.name}\"?`);
    if (!confirmed) {
      return;
    }

    setBusyDeleteId(template.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/checklists/${template.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to delete checklist template.");
      }

      setFeedback({ type: "success", message: "Checklist template deleted successfully." });
      if (editingId === template.id) {
        resetForm();
      }
      await loadTemplates();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete checklist template.",
      });
    } finally {
      setBusyDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Phase 5C · checklist templates
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Checklist template manager</h1>
            <p className="mt-1 text-sm text-slate-500">
              Configure equipment-type inspection steps so the public maintenance form can stay standardized.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/schedules"
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Open schedules →
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
        <AccessNotice message="Checklist templates remain visible for review, but only admin users can create, update, or delete them." />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search template, equipment type, or checklist item..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
            <select
              value={equipmentTypeFilter}
              onChange={(event) => setEquipmentTypeFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            >
              <option value="all">All equipment types</option>
              {equipmentTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Loading checklist templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No checklist templates matched the current filters.
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const totalItems = template.categories.reduce(
                  (sum, group) => sum + group.items.length,
                  0,
                );

                return (
                  <article key={template.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{template.name}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              template.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {template.equipmentType?.name ?? "Unknown equipment type"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {template.description ?? "No description added yet."}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                          {template.categories.length} categories · {totalItems} items
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(template.id);
                                setForm({
                                  equipmentTypeId: template.equipmentType?.id ?? "",
                                  name: template.name,
                                  description: template.description ?? "",
                                  isActive: template.isActive,
                                  groups:
                                    template.categories.length > 0
                                      ? template.categories.map((group) =>
                                          createEmptyGroup(group.category, group.items),
                                        )
                                      : [createEmptyGroup("General")],
                                });
                              }}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={busyDeleteId === template.id}
                              onClick={() => void handleDelete(template)}
                              className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyDeleteId === template.id ? "Deleting..." : "Delete"}
                            </button>
                          </>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Read-only
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit checklist template" : "Create checklist template"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            One category per section, with one checklist item per line.
          </p>

          {!isAdmin ? (
            <div className="mt-4">
              <AccessNotice message="Checklist template management is restricted to admin users." />
            </div>
          ) : (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <select
              value={form.equipmentTypeId}
              onChange={(event) => setForm((current) => ({ ...current, equipmentTypeId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              required
            >
              <option value="">Select equipment type</option>
              {equipmentTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Template name (optional)"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description (optional)"
              className="min-h-[90px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Template is active and available for new inspections
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Checklist categories</h3>
                <button
                  type="button"
                  onClick={addGroup}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  + Add category
                </button>
              </div>

              {form.groups.map((group, index) => (
                <div key={group.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Category {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeGroup(group.id)}
                      disabled={form.groups.length === 1}
                      className="text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    value={group.category}
                    onChange={(event) => updateGroup(group.id, "category", event.target.value)}
                    placeholder="Category name"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  />

                  <textarea
                    value={group.itemsText}
                    onChange={(event) => updateGroup(group.id, "itemsText", event.target.value)}
                    placeholder={"One inspection item per line\nExample: Door interlock\nEmergency light"}
                    className="mt-3 min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isSaving ? "Saving..." : editingId ? "Update template" : "Create template"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </form>
          )}
        </section>
      </div>
    </div>
  );
}
