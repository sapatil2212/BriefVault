/**
 * Brand color constants for consistent theming across the application.
 * Use these instead of inline gradient classes for maintainability.
 */

export const brandColors = {
  // Primary brand color (static violet)
  primary: "bg-violet-600 hover:bg-violet-700",
  primaryText: "text-white",
  
  // Button variants
  primaryButton: "bg-violet-600 text-white hover:bg-violet-700 transition",
  primaryButtonDisabled: "bg-violet-600 text-white opacity-60",
  
  // Icon/badge backgrounds
  primaryBadge: "bg-violet-500 text-white",
  primaryBadgeLight: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  
  // Borders and accents
  primaryBorder: "border-violet-500",
  primaryRing: "ring-violet-500/40",
  primaryShadow: "shadow-violet-900/40",
  
  // Active states
  activeNav: "bg-violet-600 text-white shadow-md shadow-violet-900/40",
  
  // Hover states
  hoverBg: "hover:bg-violet-600",
} as const;

/**
 * Utility function to get primary button classes
 */
export function getPrimaryButtonClasses(disabled = false) {
  return disabled
    ? `rounded-lg px-4 py-2.5 text-[13px] font-semibold ${brandColors.primaryButtonDisabled}`
    : `rounded-lg px-4 py-2.5 text-[13px] font-semibold ${brandColors.primaryButton}`;
}
