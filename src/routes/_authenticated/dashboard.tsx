import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CreditCard,
  KeyRound,
  ShieldAlert,
  TrendingDown,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DecisionBadge, LevelBadge, StatusBadge } from "@/components/status-badge";
import { currency, daysUntil, formatDate } from "@/lib/format";
import {
  byId,
  useAccessRecords,
  useChangeLog,
  useEmployees,
  useSystems,
  useWorkflows,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FlooringMart Access & Subscription Manager" },
      {
        name: "description",
        content:
          "Live overview of FlooringMart employees, software subscriptions, spend and access items needing review.",
      },
      { property: "og:title", content: "Dashboard — FlooringMart Access Manager" },
      {
        property: "og:description",
        content: "Employees, subscriptions, spend and review items at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="shadow-panel">
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const employees = useEmployees();
  const systems = useSystems();
  const access = useAccessRecords();
  const workflows = useWorkflows();
  const log = useChangeLog();

  const employeeMap = byId(employees.data);
  const systemMap = byId(systems.data);

  const activeEmployees = (employees.data ?? []).filter((e) => e.status === "active");
  const activeSystems = (systems.data ?? []).filter(
    (s) => s.status === "active" || s.status === "needs_review",
  );
  const monthly = activeSystems.reduce((sum, s) => sum + Number(s.monthly_cost ?? 0), 0);
  const annual = activeSystems.reduce(
    (sum, s) => sum + Number(s.annual_cost ?? Number(s.monthly_cost ?? 0) * 12),
    0,
  );
  const needsReview = (systems.data ?? []).filter(
    (s) => s.status === "needs_review" || s.decision === "VERIFY",
  );
  const renewals = (systems.data ?? [])
    .filter((s) => {
      const d = daysUntil(s.renewal_date);
      return d !== null && d >= 0 && d <= 60;
    })
    .sort((a, b) => (a.renewal_date ?? "").localeCompare(b.renewal_date ?? ""));

  const activeAccess = (access.data ?? []).filter((a) => a.status === "active");
  const risky = activeAccess.filter((a) => {
    const emp = employeeMap.get(a.employee_id);
    const privileged = ["Admin", "Owner"].includes(a.access_level);
    return emp?.status === "former" || (!a.mfa_enabled && privileged);
  });
  const orphaned = activeAccess.filter(
    (a) => employeeMap.get(a.employee_id)?.status === "former",
  );
  const openWorkflows = (workflows.data ?? []).filter((w) => w.status !== "completed");
  const unusedSeats = activeSystems.reduce(
    (sum, s) => sum + Math.max(0, (s.paid_seats ?? 0) - (s.active_users ?? 0)),
    0,
  );

  return (
    <AppShell
      title="Dashboard"
      description="Subscriptions, access and open workflows across FlooringMart."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Active employees"
          value={String(activeEmployees.length)}
          hint={`${(employees.data ?? []).length} people on record`}
          icon={Users}
        />
        <Kpi
          label="Active systems"
          value={String(activeSystems.length)}
          hint={`${unusedSeats} paid seats unused`}
          icon={CreditCard}
        />
        <Kpi
          label="Known monthly spend"
          value={currency(monthly)}
          hint={`${currency(annual)} per year`}
          icon={TrendingDown}
        />
        <Kpi
          label="Active access grants"
          value={String(activeAccess.length)}
          hint={`${openWorkflows.length} open workflows`}
          icon={KeyRound}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <ShieldAlert className="size-4 text-destructive" /> Access risks
            </CardTitle>
            <CardDescription>
              Former employees still holding access, and privileged accounts without MFA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {risky.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No outstanding access risks.
              </p>
            ) : (
              risky.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {employeeMap.get(a.employee_id)?.full_name ?? "Unknown"} —{" "}
                      {systemMap.get(a.system_id)?.name ?? "Unknown system"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employeeMap.get(a.employee_id)?.status === "former"
                        ? "Former employee with active access"
                        : "Privileged account without MFA"}
                    </p>
                  </div>
                  <LevelBadge value={a.access_level} />
                </div>
              ))
            )}
            {orphaned.length > 0 ? (
              <Link to="/access" className="block pt-1 text-sm text-primary hover:underline">
                Review all access →
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <AlertTriangle className="size-4 text-warning-foreground" /> Subscriptions needing
              review
            </CardTitle>
            <CardDescription>Flagged for verification, consolidation or cancellation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {needsReview.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nothing flagged.</p>
            ) : (
              needsReview.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.category ?? "Uncategorised"} · {currency(Number(s.monthly_cost ?? 0))}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={s.status} />
                    <DecisionBadge value={s.decision} />
                  </div>
                </div>
              ))
            )}
            <Link to="/systems" className="block pt-1 text-sm text-primary hover:underline">
              Open systems &amp; subscriptions →
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle className="font-display text-base">Renewals in the next 60 days</CardTitle>
            <CardDescription>Decide before the card gets charged.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {renewals.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No renewals in the next 60 days.
              </p>
            ) : (
              renewals.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(s.renewal_date)}</p>
                  </div>
                  <Badge variant="outline">{daysUntil(s.renewal_date)} days</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle className="font-display text-base">Recent access changes</CardTitle>
            <CardDescription>Every grant, change and removal is logged.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(log.data ?? []).slice(0, 8).map((c) => (
              <div key={c.id} className="rounded-md border px-3 py-2">
                <p className="text-sm">
                  <span className="font-medium">{c.action}</span> ·{" "}
                  {employeeMap.get(c.employee_id ?? "")?.full_name ?? "—"} —{" "}
                  {systemMap.get(c.system_id ?? "")?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(c.change_date)}
                  {c.completed_by ? ` · by ${c.completed_by}` : ""}
                </p>
              </div>
            ))}
            <Link to="/access-log" className="block pt-1 text-sm text-primary hover:underline">
              Open the full change log →
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
