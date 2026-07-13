"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardNav } from "@/constants/dashboard";
import logoImg from "@/assets/bv-logo.png";

/**
 * Left navigation. Responsive:
 * - Desktop (lg+): in-flow rail that collapses to icons (`collapsed`).
 * - Mobile: fixed off-canvas drawer toggled via `mobileOpen`.
 *
 * Labels stay in the DOM and are hidden with CSS at `lg` when collapsed, so the
 * mobile drawer always shows full labels regardless of the desktop state.
 */
export function DashboardSidebar({
  collapsed = false,
  mobileOpen = false,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const [isFreePlan, setIsFreePlan] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/subscription/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json?.data?.plan?.key === "FREE") {
          setIsFreePlan(true);
        }
      })
      .catch(() => {});
  }, []);

  const navGroups = React.useMemo(() => {
    if (!isFreePlan) return dashboardNav;
    return dashboardNav.map((group) => ({
      ...group,
      links: group.links.filter((l) => l.href !== "/dashboard/compare"),
    }));
  }, [isFreePlan]);

  return (
    <aside
      className={cn(
        "z-50 flex h-full shrink-0 flex-col bg-[#1e1b3a] text-slate-300 transition-all duration-200",
        // Mobile: fixed drawer that slides in/out.
        "fixed inset-y-0 left-0 w-64 lg:static",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // Desktop width follows the collapsed state.
        collapsed ? "lg:w-16" : "lg:w-60"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/10 px-4",
          collapsed ? "lg:justify-center lg:px-2" : "justify-start"
        )}
      >
        <Link href="/dashboard" className="flex items-center">
          <Image 
            src={logoImg} 
            alt="BriefVault" 
            width={180} 
            height={50}
            priority
            className={cn(
              "h-11 object-contain transition-all",
              collapsed ? "lg:w-10 lg:object-left" : "w-auto max-w-[170px]"
            )}
          />
        </Link>
      </div>

      {/* Navigation — extra top gap separates the menu from the brand.
          `no-scrollbar` keeps it scrollable on short viewports without ever
          showing a scrollbar. */}
      <nav className="no-scrollbar flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-4">
        {navGroups.map((group, i) => (
          <div key={group.title ?? i}>
            {group.title && (
              <p
                className={cn(
                  "px-2.5 pb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500",
                  collapsed && "lg:hidden"
                )}
              >
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.links.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      title={collapsed ? link.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors",
                        collapsed && "lg:justify-center",
                        active
                          ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className={cn("truncate", collapsed && "lg:hidden")}>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — desktop collapse toggle. */}
      <div className="hidden shrink-0 border-t border-white/10 p-2.5 lg:block">
        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
