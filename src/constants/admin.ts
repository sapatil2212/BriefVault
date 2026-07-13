import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  BarChart3,
  FileText,
  ListChecks,
  HardDrive,
  CreditCard,
  HeartPulse,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation model for the Super Admin console. Data-only so the sidebar stays
 * presentational. `superAdminOnly` links are hidden from plain ADMINs. Adding a
 * future module (payments, marketplace) is a one-line change here.
 */
export type AdminNavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
  badge?: string;
};

export type AdminNavGroup = {
  title: string;
  links: AdminNavLink[];
};

export const ADMIN_BASE = "/admin";

export const adminNav: AdminNavGroup[] = [
  {
    title: "Overview",
    links: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "System Health", href: "/admin/health", icon: HeartPulse },
    ],
  },
  {
    title: "Tenancy",
    links: [
      { label: "Organizations", href: "/admin/organizations", icon: Building2 },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Pending Users", href: "/admin/pending-users", icon: UserCheck, superAdminOnly: true },
    ],
  },
  {
    title: "Sales",
    links: [
      { label: "Demo Enquiries", href: "/admin/demo-enquiries", icon: CalendarClock },
    ],
  },
  {
    title: "AI Engine",
    links: [
      { label: "AI Usage", href: "/admin/ai-usage", icon: BarChart3 },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Documents", href: "/admin/documents", icon: FileText },
      { label: "Queues", href: "/admin/queues", icon: ListChecks },
      { label: "Storage", href: "/admin/storage", icon: HardDrive },
    ],
  },
  {
    title: "Billing",
    links: [
      { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, superAdminOnly: true },
    ],
  },
];

/** Flattened links for the command palette. */
export const adminNavFlat: AdminNavLink[] = adminNav.flatMap((g) => g.links);
