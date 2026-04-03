import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  decodeAdminSession,
  formatAdminRole,
  hasValidAdminSession,
} from "@/lib/admin-auth";
import { AdminRoleProvider } from "./components/admin-role-provider";
import { LogoutButton } from "./components/logout-button";

export const metadata: Metadata = {
  title: "Admin Portal | Maintenance Service Report",
  description: "Operations dashboard for maintenance tickets, dispatch, and review flow.",
};

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Alerts", href: "/admin/alerts" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Work Orders", href: "/admin/reports" },
  { label: "Buildings", href: "/admin/buildings" },
  { label: "Equipment", href: "/admin/equipment" },
  { label: "Equipment Types", href: "/admin/equipment-types" },
  { label: "Technicians", href: "/admin/technicians" },
  { label: "Schedules", href: "/admin/schedules" },
  { label: "Checklists", href: "/admin/checklists" },
  { label: "Audit Logs", href: "/admin/audit-logs", roles: ["admin"] },
  { label: "Users", href: "/admin/users", roles: ["admin"] },
];

const upcomingModules = ["Automated reminders"];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = hasValidAdminSession(sessionValue);
  const session = decodeAdminSession(sessionValue);
  const currentRole = session?.role ?? "viewer";
  const visibleNavItems = isAuthenticated
    ? navItems.filter((item) => !item.roles || item.roles.includes(currentRole))
    : [
        { label: "Admin Login", href: "/admin/login" },
        { label: "Public Form", href: "/" },
      ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              YECL Admin
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Maintenance Ops Portal</h1>
            <p className="mt-2 text-sm text-slate-300">
              JWT-secured operations shell backed by the NestJS maintenance-report APIs.
            </p>
          </div>

          <nav className="flex-1 px-4 py-5">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Live routes
            </p>
            <div className="space-y-2">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-500 hover:bg-slate-800"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Next modules
            </p>
            <div className="space-y-2">
              {upcomingModules.map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-dashed border-slate-700 px-3 py-2 text-sm text-slate-300"
                >
                  {label}
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-slate-800 px-4 py-4">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Open public form
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Internal operations
                </p>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  Ticket monitoring, review, and dispatch workspace
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                  JWT secured
                </span>
                {isAuthenticated ? (
                  <>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      {session?.name ?? session?.email ?? "Signed in"}
                    </span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">
                      Role: {formatAdminRole(currentRole)}
                    </span>
                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/admin/login"
                    className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Login required
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <AdminRoleProvider role={currentRole}>{children}</AdminRoleProvider>
          </main>
        </div>
      </div>
    </div>
  );
}
