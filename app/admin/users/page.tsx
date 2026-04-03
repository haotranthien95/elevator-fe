"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccessNotice, useAdminPermissions } from "../components/admin-role-provider";

type UserRecord = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "dispatcher" | "viewer";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const roleOptions: Array<UserRecord["role"]> = ["admin", "dispatcher", "viewer"];

const initialForm = {
  email: "",
  password: "",
  name: "",
  role: "viewer" as UserRecord["role"],
  isActive: true,
};

const formatRole = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function AdminUsersPage() {
  const { isAdmin } = useAdminPermissions();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; data?: UserRecord[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to load users.");
      }

      setUsers(payload?.data ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load users.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    void loadUsers();
  }, [isAdmin, search]);

  const counts = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((item) => item.isActive).length,
    };
  }, [users]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      if (!editingId && !form.password.trim()) {
        throw new Error("Password is required when creating a user.");
      }

      const response = await fetch(editingId ? `/api/admin/users/${editingId}` : "/api/admin/users", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password || undefined,
          name: form.name,
          role: form.role,
          isActive: form.isActive,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save user.");
      }

      setFeedback({
        type: "success",
        message: editingId ? "User updated successfully." : "User created successfully.",
      });
      resetForm();
      await loadUsers();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save user.",
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
              Phase 6 · users & access
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Admin users</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage who can access the operations portal and what level of permission they have.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Active users: {counts.active}/{counts.total}
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
          message="User management is restricted to admin users only. Please switch to an admin account to create or edit portal users."
        />
      ) : null}

      {isAdmin ? (
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, or role..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
          />

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No users matched the current search.
              </div>
            ) : (
              users.map((user) => (
                <article key={user.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          {formatRole(user.role)}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(user.id);
                        setForm({
                          email: user.email,
                          password: "",
                          name: user.name,
                          role: user.role,
                          isActive: user.isActive,
                        });
                      }}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      Edit user
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit user" : "Add user"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create portal users with role-based access for operations, dispatch, or viewing.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              required
            />

            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              required
            />

            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder={editingId ? "Leave blank to keep current password" : "Password"}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              required={!editingId}
            />

            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRecord["role"] }))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {formatRole(role)}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              User is active for portal access
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : editingId ? "Update user" : "Create user"}
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
      ) : null}
    </div>
  );
}
