export function currency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value + "T00:00:00").getTime();
  if (Number.isNaN(d)) return null;
  return Math.round((d - Date.now()) / 86_400_000);
}

export const DECISION_LABEL: Record<string, string> = {
  KEEP: "Keep",
  KEEP_IF_USED: "Keep if used",
  VERIFY: "Verify",
  CONSOLIDATE: "Consolidate",
  CANCEL_AFTER_CONFIRMATION: "Cancel after confirmation",
};

export const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  needs_review: "Needs review",
  pending_cancellation: "Pending cancellation",
  cancelled: "Cancelled",
  on_leave: "On leave",
  former: "Former",
  suspended: "Suspended",
  removed: "Removed",
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export const ACCESS_LEVELS = [
  "Viewer",
  "Read Only",
  "Standard",
  "Manager",
  "Admin",
  "Owner",
] as const;

export const DECISIONS = [
  "KEEP",
  "KEEP_IF_USED",
  "VERIFY",
  "CONSOLIDATE",
  "CANCEL_AFTER_CONFIRMATION",
] as const;
