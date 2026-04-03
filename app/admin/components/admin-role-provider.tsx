"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { normalizeAdminRole, type AdminRole } from "@/lib/admin-auth";

const AdminRoleContext = createContext<AdminRole>("viewer");

export function AdminRoleProvider({
  role,
  children,
}: {
  role?: string | null;
  children: ReactNode;
}) {
  const normalizedRole = normalizeAdminRole(role);

  return <AdminRoleContext.Provider value={normalizedRole}>{children}</AdminRoleContext.Provider>;
}

export function useAdminRole() {
  return useContext(AdminRoleContext);
}

export function useAdminPermissions() {
  const role = useAdminRole();

  return useMemo(
    () => ({
      role,
      isAdmin: role === "admin",
      canManageOperations: role === "admin" || role === "dispatcher",
      isViewer: role === "viewer",
    }),
    [role],
  );
}

export function AccessNotice({
  title = "Read-only access",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-semibold text-amber-900">{title}</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
