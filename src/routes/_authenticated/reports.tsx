import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { DecisionBadge, LevelBadge, StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { byId, useAccessRecords, useChangeLog, useEmployees, useSystems, type AccessRecord, type ChangeLog, type System } from "@/lib/data";
import { currency, daysUntil, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({ head: () => ({ meta: [
  { title: "Reports — FlooringMart Access Manager" }, { name: "description", content: "Operational reports for access, subscription spend, renewals, review decisions and access changes." },
  { property: "og:title", content: "Reports — FlooringMart" }, { property: "og:description", content: "Access, subscription, renewal and audit reports." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: ReportsPage });

function ReportsPage() {
  const employees = useEmployees(); const systems = useSystems(); const access = useAccessRecords(); const log = useChangeLog(); const employeeMap = byId(employees.data); const systemMap = byId(systems.data);
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const activeAccess = (access.data ?? []).filter((a) => a.status === "active");
  const formerAccess = activeAccess.filter((a) => employeeMap.get(a.employee_id)?.status === "former");
  const adminAccess = activeAccess.filter((a) => a.access_level === "Admin" || a.access_level === "Owner");
  const reviewedSystems = (systems.data ?? []).filter((s) => s.status === "needs_review" || s.decision !== "KEEP");
  const renewals = (systems.data ?? []).filter((s) => s.renewal_date).sort((a, b) => (a.renewal_date ?? "").localeCompare(b.renewal_date ?? ""));
  const filteredLog = (log.data ?? []).filter((row) => (!from || row.change_date >= from) && (!to || row.change_date <= to));
  const accessColumns: Column<AccessRecord>[] = [
    { key: "employee", header: "Employee", sortValue: (r) => employeeMap.get(r.employee_id)?.full_name ?? "", cell: (r) => employeeMap.get(r.employee_id)?.full_name ?? "—" }, { key: "system", header: "System", sortValue: (r) => systemMap.get(r.system_id)?.name ?? "", cell: (r) => systemMap.get(r.system_id)?.name ?? "—" },
    { key: "level", header: "Level", sortValue: (r) => r.access_level, cell: (r) => <LevelBadge value={r.access_level} /> }, { key: "mfa", header: "MFA", cell: (r) => r.mfa_enabled ? "Enabled" : "Not recorded" }, { key: "review", header: "Last review", sortValue: (r) => r.last_review_date ?? "", cell: (r) => formatDate(r.last_review_date) },
  ];
  const systemColumns: Column<System>[] = [
    { key: "name", header: "System", sortValue: (r) => r.name, cell: (r) => <span className="font-medium">{r.name}</span> }, { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} /> }, { key: "decision", header: "Decision", cell: (r) => <DecisionBadge value={r.decision} /> },
    { key: "monthly", header: "Monthly", sortValue: (r) => Number(r.monthly_cost ?? 0), cell: (r) => currency(Number(r.monthly_cost ?? 0)) }, { key: "annual", header: "Annual", sortValue: (r) => Number(r.annual_cost ?? 0), cell: (r) => currency(Number(r.annual_cost ?? 0)) }, { key: "renewal", header: "Renewal", sortValue: (r) => r.renewal_date ?? "", cell: (r) => <div><p>{formatDate(r.renewal_date)}</p>{r.renewal_date ? <p className="text-xs text-muted-foreground">{daysUntil(r.renewal_date)} days</p> : null}</div> },
  ];
  const logColumns: Column<ChangeLog>[] = [{ key: "date", header: "Date", sortValue: (r) => r.change_date, cell: (r) => formatDate(r.change_date) }, { key: "employee", header: "Employee", cell: (r) => employeeMap.get(r.employee_id ?? "")?.full_name ?? "—" }, { key: "system", header: "System", cell: (r) => systemMap.get(r.system_id ?? "")?.name ?? "—" }, { key: "action", header: "Action", cell: (r) => r.action }, { key: "change", header: "Change", cell: (r) => `${r.old_access ?? "—"} → ${r.new_access ?? "—"}` }, { key: "ticket", header: "Ticket", cell: (r) => r.ticket_reference ?? "—" }];
  return <AppShell title="Reports" description="Current access, subscription costs, renewals, review items and historical changes.">
    <Tabs defaultValue="current"><TabsList className="mb-4 max-w-full justify-start overflow-x-auto"><TabsTrigger value="current">Current access</TabsTrigger><TabsTrigger value="former">Former employee access</TabsTrigger><TabsTrigger value="admin">Admin / owner</TabsTrigger><TabsTrigger value="spend">Costs & renewals</TabsTrigger><TabsTrigger value="review">Review items</TabsTrigger><TabsTrigger value="changes">Access changes</TabsTrigger></TabsList>
      <TabsContent value="current"><DataTable rows={activeAccess} columns={accessColumns} rowKey={(r) => r.id} searchable={(r) => [employeeMap.get(r.employee_id)?.full_name, systemMap.get(r.system_id)?.name, r.access_level].join(" ")} searchPlaceholder="Search current access…" /></TabsContent>
      <TabsContent value="former"><DataTable rows={formerAccess} columns={accessColumns} rowKey={(r) => r.id} searchable={(r) => [employeeMap.get(r.employee_id)?.full_name, systemMap.get(r.system_id)?.name].join(" ")} emptyMessage="No former employees have active access." /></TabsContent>
      <TabsContent value="admin"><DataTable rows={adminAccess} columns={accessColumns} rowKey={(r) => r.id} searchable={(r) => [employeeMap.get(r.employee_id)?.full_name, systemMap.get(r.system_id)?.name].join(" ")} emptyMessage="No active Admin or Owner access." /></TabsContent>
      <TabsContent value="spend"><DataTable rows={renewals} columns={systemColumns} rowKey={(r) => r.id} searchable={(r) => [r.name, r.vendor, r.category].join(" ")} searchPlaceholder="Search costs and renewals…" /></TabsContent>
      <TabsContent value="review"><DataTable rows={reviewedSystems} columns={systemColumns} rowKey={(r) => r.id} searchable={(r) => [r.name, r.vendor, r.decision, r.status].join(" ")} searchPlaceholder="Search review items…" /></TabsContent>
      <TabsContent value="changes"><div className="mb-4 flex flex-wrap gap-3"><div className="space-y-1"><Label htmlFor="report-from">From</Label><Input id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div className="space-y-1"><Label htmlFor="report-to">To</Label><Input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div></div><DataTable rows={filteredLog} columns={logColumns} rowKey={(r) => r.id} searchable={(r) => [r.action, r.reason, r.ticket_reference, employeeMap.get(r.employee_id ?? "")?.full_name, systemMap.get(r.system_id ?? "")?.name].join(" ")} searchPlaceholder="Search access changes…" /></TabsContent>
    </Tabs>
  </AppShell>;
}