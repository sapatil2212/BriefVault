"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNav } from "@/constants/admin";
import logoImg from "@/assets/bv-logo.png";

/**
 * Super Admin navigation rail. Mirrors the main dashboard sidebar's responsive
 * behavior (collapsible desktop rail + mobile drawer) but with a distinct
 * "operations center" identity and role-gated links.
 */
export function AdminSidebar({
  isSuperAdmin,
  collapsed = false,
  mobileOpen = false,
  onNavigate,
  onToggleCollapse,
}: {
  isSuperAdmin: boolean;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "z-50 flex h-full shrink-0 flex-col bg-[#0f1729] text-slate-300 transition-all duration-200",
        "fixed inset-y-0 left-0 w-64 lg:static",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/10 px-4",
          collapsed ? "lg:justify-center lg:px-2" : "justify-start"
        )}
      >
        <Link href="/admin" className="flex items-center">
          <Image 
            src={logoImg} 
            alt="BriefVault Admin" 
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

      <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-4">
        {adminNav.map((group) => {
          const links = group.links.filter((l) => !l.superAdminOnly || isSuperAdmin);
          if (links.length === 0) return null;
          return (
            <div key={group.title}>
              <p className={cn("px-2.5 pb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500", collapsed && "lg:hidden")}>
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {links.map((link) => {
                  const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
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
                            ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-900/40"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className={cn("truncate", collapsed && "lg:hidden")}>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

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
