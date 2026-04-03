import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { LayoutDashboard, Wrench, Users, Building, FileText, Settings, ShieldAlert } from "lucide-react";
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
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  // { label: "Alerts", href: "/admin/alerts", icon: ShieldAlert },
  // { label: "Analytics", href: "/admin/analytics" },
  { label: "Work Orders", href: "/admin/reports", icon: Wrench },
  { label: "Buildings", href: "/admin/buildings", icon: Building },
  // { label: "Equipment", href: "/admin/equipment" },
  // { label: "Equipment Types", href: "/admin/equipment-types" },
  { label: "Technicians", href: "/admin/technicians", icon: Users },
  // { label: "Schedules", href: "/admin/schedules" },
  // { label: "Checklists", href: "/admin/checklists" },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Settings", href: "#", roles: ["admin"], icon: Settings },
  // { label: "Audit Logs", href: "/admin/audit-logs", roles: ["admin"] },
  // { label: "Users", href: "/admin/users", roles: ["admin"] },
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
            <div className="space-y-[2px]">
              {visibleNavItems.map((item) => {
                const Icon = (item as any).icon || FileText;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[0.875rem] font-medium text-on-surface-variant transition-all duration-200 ease-in-out hover:bg-surface-high hover:text-on-surface hover:shadow-[0_2px_8px_rgba(24,28,30,0.04)]"
                  >
                    <Icon className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-opacity" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <p className="mb-3 mt-8 px-3 text-[0.6875rem] font-bold uppercase tracking-[0.25em] text-on-surface-variant/70">
              Extensions
            </p>
            <div className="space-y-1">
              {upcomingModules.map((label) => (
                <div
                  key={label}
                  className="rounded-[12px] bg-surface-lowest/40 px-3 py-2.5 text-[0.875rem] text-on-surface-variant font-medium border border-outline-variant/10 shadow-[0_2px_8px_rgba(24,28,30,0.02)]"
                >
                  {label}
                </div>
              ))}
            </div>
          </nav>

          <div className="px-4 py-6">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-[12px] bg-gradient-to-b from-primary to-primary-container px-3 py-2.5 text-[0.875rem] font-medium text-white shadow-[0_12px_24px_rgba(0,64,223,0.15)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(0,64,223,0.25)] hover:from-[#1a55f0] hover:to-[#3b66ff]"
            >
              Public Dispatch
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="bg-background pt-6 pb-2 sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
            <div className="flex flex-col gap-3 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
                  Workspace
                </p>
                <h2 className="text-[2.25rem] font-semibold text-on-surface leading-tight tracking-tight mt-1 transition-all">
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
