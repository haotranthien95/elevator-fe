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
    <div className="min-h-screen bg-background text-on-surface">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 bg-surface-low lg:flex lg:flex-col">
          <div className="px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              YECL Admin
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-on-surface tracking-tight">Maintenance Ops</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Command center backed by the NestJS maintenance-report APIs.
            </p>
          </div>

          <nav className="flex-1 px-4 py-5">
            <div className="space-y-[1px]">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface-variant transition hover:bg-surface-high hover:text-on-surface"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant/70">
              Extensions
            </p>
            <div className="space-y-1">
              {upcomingModules.map((label) => (
                <div
                  key={label}
                  className="rounded-xl bg-surface-lowest/50 px-3 py-2 text-sm text-on-surface-variant"
                >
                  {label}
                </div>
              ))}
            </div>
          </nav>

          <div className="px-4 py-6">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-primary to-primary-container px-3 py-2.5 text-sm font-medium text-white shadow-[0_4px_14px_rgba(0,64,223,0.25)] transition hover:shadow-[0_6px_20px_rgba(0,64,223,0.3)]"
            >
              Public Dispatch
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="bg-background pt-6 pb-2">
            <div className="flex flex-col gap-3 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Workspace
                </p>
                <h2 className="text-[2.25rem] font-semibold text-on-surface leading-tight tracking-tight mt-1">
                  Ops Dashboard
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm pb-1">
                {isAuthenticated ? (
                  <>
                    <span className="rounded-full bg-surface-high px-3 py-1 text-xs font-semibold tracking-wide text-on-surface">
                      {session?.name ?? session?.email ?? "Signed in"}
                    </span>
                    <span className="rounded-full bg-surface-high px-3 py-1 text-xs font-semibold tracking-wide text-on-surface">
                      {formatAdminRole(currentRole)}
                    </span>
                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/admin/login"
                    className="rounded-full bg-surface-high px-3 py-1 text-xs font-semibold tracking-wide text-on-surface transition hover:bg-surface-highest"
                  >
                    Login required
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <AdminRoleProvider role={currentRole}>{children}</AdminRoleProvider>
          </main>
        </div>
      </div>
    </div>
  );
}
