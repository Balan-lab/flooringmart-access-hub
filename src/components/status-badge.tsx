import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DECISION_LABEL, STATUS_LABEL } from "@/lib/format";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/18 text-warning-foreground border-warning/40",
  danger: "bg-destructive/12 text-destructive border-destructive/25",
  info: "bg-info/12 text-info border-info/25",
};

const statusTone: Record<string, Tone> = {
  active: "success",
  completed: "success",
  needs_review: "warning",
  in_progress: "info",
  on_leave: "warning",
  pending_cancellation: "warning",
  suspended: "warning",
  not_started: "neutral",
  removed: "neutral",
  cancelled: "neutral",
  former: "danger",
};

const decisionTone: Record<string, Tone> = {
  KEEP: "success",
  KEEP_IF_USED: "info",
  VERIFY: "warning",
  CONSOLIDATE: "warning",
  CANCEL_AFTER_CONFIRMATION: "danger",
};

const levelTone: Record<string, Tone> = {
  Owner: "danger",
  Admin: "danger",
  Manager: "warning",
  Standard: "info",
  "Read Only": "neutral",
  Viewer: "neutral",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", toneClass[statusTone[value] ?? "neutral"], className)}
    >
      {STATUS_LABEL[value] ?? value}
    </Badge>
  );
}

export function DecisionBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", toneClass[decisionTone[value] ?? "neutral"])}>
      {DECISION_LABEL[value] ?? value}
    </Badge>
  );
}

export function LevelBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", toneClass[levelTone[value] ?? "neutral"])}>
      {value}
    </Badge>
  );
}
