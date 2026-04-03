"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, ShieldAlert, Wrench, Building, Users, Settings } from "lucide-react";

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

interface SidebarNavProps {
  isAuthenticated: boolean;
  currentRole: string;
}

export function SidebarNav({ isAuthenticated, currentRole }: SidebarNavProps) {
  const pathname = usePathname();

  const visibleNavItems = isAuthenticated
    ? navItems.filter((item) => !item.roles || item.roles.includes(currentRole))
    : [
        { label: "Admin Login", href: "/admin/login", icon: Users },
        { label: "Public Form", href: "/", icon: FileText },
      ];

  return (
    <div className="space-y-[6px]">
      {visibleNavItems.map((item) => {
        const Icon = item.icon || FileText;
        const isActive = item.href === "/admin" 
          ? pathname === "/admin" 
          : pathname?.startsWith(item.href) && item.href !== "#";
          
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[0.875rem] font-bold transition-all duration-200 ease-in-out hover:shadow-[0_2px_8px_rgba(0,64,223,0.08)] hover:-translate-y-[1px] ${
              isActive
                ? "bg-white text-primary shadow-[0_4px_12px_rgba(0,64,223,0.08)] border border-primary/10"
                : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface border border-transparent"
            }`}
          >
            <Icon className={`h-[18px] w-[18px] transition-all duration-200 ${isActive ? 'text-primary' : 'opacity-60 group-hover:opacity-100 group-hover:text-primary group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className="tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
