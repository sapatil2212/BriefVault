/**
 * Country list for the signup form. India first (primary market), then a
 * common set. Kept as a plain array so it can be swapped for a fuller list or
 * an API-backed source later without touching the form.
 */
export const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "Ireland",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Malaysia",
  "Japan",
  "Other",
] as const;
