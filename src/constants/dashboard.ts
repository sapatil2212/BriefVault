import {
  LayoutDashboard,
  Upload,
  FileText,
  FileType2,
  Bookmark,

  Search,
  ClipboardList,
  GitCompare,
  Folder,
  Trash2,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

// Note: KPIs, category slices, trend series, and document tables are
// now sourced live from `/api/dashboard/stats`. Only the navigation model below
// is static configuration.

/**
 * Navigation model for the dashboard sidebar.
 * Kept as data so the shell stays presentation-only and testable.
 */
export type SidebarLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type SidebarGroup = {
  title?: string;
  links: SidebarLink[];
};

export const dashboardNav: SidebarGroup[] = [
  {
    links: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Upload Document", href: "/dashboard/upload", icon: Upload },
      { label: "My Documents", href: "/dashboard/documents", icon: FileText },
      { label: "Summaries", href: "/dashboard/summaries", icon: FileType2 },
      { label: "Reports", href: "/dashboard/reports", icon: ClipboardList },
      { label: "Compare", href: "/dashboard/compare", icon: GitCompare },
      { label: "Saved Insights", href: "/dashboard/insights", icon: Bookmark },

      { label: "Legal Research", href: "/dashboard/research", icon: Search },
    ],
  },
  {
    title: "Workspace",
    links: [
      { label: "Folders", href: "/dashboard/folders", icon: Folder },
      { label: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
      { label: "Trash", href: "/dashboard/trash", icon: Trash2 },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

