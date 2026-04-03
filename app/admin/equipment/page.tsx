"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccessNotice, useAdminPermissions } from "../components/admin-role-provider";

type BuildingOption = {
  id: string;
  name: string;
};

type EquipmentTypeOption = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  isActive: boolean;
};

type EquipmentRecord = {
  id: string;
  equipmentType: string;
  equipmentTypeInfo?: EquipmentTypeOption | null;
  equipmentCode: string;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  location: string | null;
  isActive: boolean;
  building: BuildingOption;
};

const initialForm = {
  buildingId: "",
  equipmentTypeId: "",
  equipmentType: "",
  equipmentCode: "",
  serialNumber: "",
  brand: "",
  model: "",
  location: "",
  isActive: true,
};

export default function AdminEquipmentPage() {
  const { isAdmin } = useAdminPermissions();
  const [equipment, setEquipment] = useState<EquipmentRecord[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<EquipmentTypeOption[]>([]);
  const [search, setSearch] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadBuildings = async () => {
    const response = await fetch("/api/admin/buildings", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { data?: Array<BuildingOption> }
      | null;

    setBuildings(payload?.data ?? []);
    setForm((current) => ({
      ...current,
      buildingId: current.buildingId || payload?.data?.[0]?.id || "",
    }));
  };

  const loadEquipmentTypes = async () => {
    const response = await fetch("/api/admin/equipment-types", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { data?: Array<EquipmentTypeOption> }
      | null;

    const nextTypes = payload?.data ?? [];
    const defaultType =
      nextTypes.find((item) => item.id === form.equipmentTypeId) ??
      nextTypes.find((item) => item.name === form.equipmentType) ??
      nextTypes.find((item) => item.isActive) ??
      nextTypes[0];

    setTypeOptions(nextTypes);
    setForm((current) => ({
      ...current,
      equipmentTypeId: current.equipmentTypeId || defaultType?.id || "",
      equipmentType: current.equipmentType || defaultType?.name || "",
    }));
  };

  const loadEquipment = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      if (buildingId) {
        params.set("buildingId", buildingId);
      }
      if (equipmentType.trim()) {
        params.set("equipmentType", equipmentType.trim());
      }

      const response = await fetch(`/api/admin/equipment?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; data?: EquipmentRecord[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load equipment.");
      }

      setEquipment(payload?.data ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load equipment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadBuildings(), loadEquipmentTypes()]);
  }, []);

  useEffect(() => {
    void loadEquipment();
  }, [search, buildingId, equipmentType]);

  const equipmentTypes = useMemo(() => {
    const managedTypes = typeOptions
      .filter((item) => item.isActive)
      .map((item) => item.name);

    if (managedTypes.length > 0) {
      return managedTypes;
    }

    return Array.from(new Set(equipment.map((item) => item.equipmentType))).sort();
  }, [equipment, typeOptions]);

  const resetForm = () => {
    setEditingId(null);
    const defaultType = typeOptions.find((item) => item.isActive) ?? typeOptions[0];

    setForm((current) => ({
      ...initialForm,
      buildingId: buildings[0]?.id ?? current.buildingId,
      equipmentTypeId: defaultType?.id ?? current.equipmentTypeId,
      equipmentType: defaultType?.name ?? current.equipmentType,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(editingId ? `/api/admin/equipment/${editingId}` : "/api/admin/equipment", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save equipment.");
      }

      setFeedback({
        type: "success",
        message: editingId ? "Equipment updated successfully." : "Equipment created successfully.",
      });
      resetForm();
      await loadEquipment();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save equipment.",
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
              Master data · equipment
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Equipment registry</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track each lift, escalator, and serviced asset by building, model, and current status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/buildings"
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Open buildings →
            </Link>
            <Link
              href="/admin/equipment-types"
              className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Equipment types →
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
        <AccessNotice message="Equipment records remain visible, but only admin users can create or edit them." />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search code, brand, model..."
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 lg:col-span-2"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <select
                value={buildingId}
                onChange={(event) => setBuildingId(event.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="">All buildings</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
              <select
                value={equipmentType}
                onChange={(event) => setEquipmentType(event.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="">All types</option>
                {equipmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Loading equipment registry...
              </div>
            ) : equipment.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No equipment matched the current filters.
              </div>
            ) : (
              equipment.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.equipmentCode}</p>
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          {item.equipmentType}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.building?.name ?? "Unknown building"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.brand ?? "Brand TBD"} · {item.model ?? "Model TBD"} · {item.location ?? "Location TBD"}
                      </p>
                    </div>

                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          const matchedType =
                            item.equipmentTypeInfo ??
                            typeOptions.find((type) => type.name === item.equipmentType) ??
                            null;

                          setForm({
                            buildingId: item.building?.id ?? buildings[0]?.id ?? "",
                            equipmentTypeId: matchedType?.id ?? "",
                            equipmentType: matchedType?.name ?? item.equipmentType,
                            equipmentCode: item.equipmentCode,
                            serialNumber: item.serialNumber ?? "",
                            brand: item.brand ?? "",
                            model: item.model ?? "",
                            location: item.location ?? "",
                            isActive: item.isActive,
                          });
                        }}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        Edit equipment
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
            {editingId ? "Edit equipment" : "Add equipment"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Register new assets and keep building-specific details current.
          </p>

          {!isAdmin ? (
            <div className="mt-4">
              <AccessNotice message="Equipment data can only be created or edited by admin users." />
            </div>
          ) : (
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <select
              value={form.buildingId}
              onChange={(event) => setForm((current) => ({ ...current, buildingId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              required
            >
              <option value="">Select building</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.equipmentTypeId}
                onChange={(event) => {
                  const selectedType = typeOptions.find((item) => item.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    equipmentTypeId: event.target.value,
                    equipmentType: selectedType?.name ?? "",
                  }));
                }}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                required
              >
                <option value="">Select equipment type</option>
                {typeOptions
                  .filter((item) => item.isActive)
                  .map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
              </select>
              <input
                value={form.equipmentCode}
                onChange={(event) => setForm((current) => ({ ...current, equipmentCode: event.target.value }))}
                placeholder="Equipment code"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.serialNumber}
                onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))}
                placeholder="Serial number"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
              <input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="Location"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.brand}
                onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                placeholder="Brand"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
              <input
                value={form.model}
                onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
                placeholder="Model"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active equipment
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : editingId ? "Update equipment" : "Create equipment"}
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
