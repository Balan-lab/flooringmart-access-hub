import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { RecordDialog, type Field } from "@/components/record-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth";
import { byId, useChangeLog, useEmployees, useSave, useSystems, type ChangeLog } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/access-log")({ head: () => ({ meta: [
  { title: "Access Change Log — FlooringMart Access Manager" }, { name: "description", content: "Auditable history of access grants, changes, elevations, suspensions and removals." },
  { property: "og:title", content: "Access Change Log — FlooringMart" }, { property: "og:description", content: "Auditable history of employee and system access changes." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: AccessLogPage });

function AccessLogPage() {
  const { canWrite, user } = useCurrentUser(); const employees = useEmployees(); const systems = useSystems(); const log = useChangeLog(); const save = useSave("access_change_log");
  const employeeMap = byId(employees.data); const systemMap = byId(systems.data); const [open, setOpen] = useState(false);
  const fields: Field[] = [
    { name: "change_date", label: "Change date", type: "date", required: true }, { name: "employee_id", label: "Employee", type: "select", options: (employees.data ?? []).map((e) => ({ value: e.id, label: e.full_name })) },
    { name: "system_id", label: "System", type: "select", options: (systems.data ?? []).map((s) => ({ value: s.id, label: s.name })) }, { name: "action", label: "Action", type: "select", required: true, options: ["GRANT", "MODIFY", "ELEVATE", "SUSPEND", "REMOVE"].map((value) => ({ value, label: value })) },
    { name: "old_access", label: "Previous access", type: "text" }, { name: "new_access", label: "New access", type: "text" }, { name: "approved_by", label: "Approved by", type: "text" }, { name: "completed_by", label: "Completed by", type: "text" },
    { name: "reason", label: "Reason", type: "textarea" }, { name: "ticket_reference", label: "Ticket reference", type: "text" }, { name: "notes", label: "Notes", type: "textarea" },
  ];
  const columns: Column<ChangeLog>[] = [
    { key: "date", header: "Date", sortValue: (r) => r.change_date, cell: (r) => formatDate(r.change_date) }, { key: "action", header: "Action", sortValue: (r) => r.action, cell: (r) => <Badge variant="outline">{r.action}</Badge> },
    { key: "employee", header: "Employee", sortValue: (r) => employeeMap.get(r.employee_id ?? "")?.full_name ?? "", cell: (r) => employeeMap.get(r.employee_id ?? "")?.full_name ?? "—" }, { key: "system", header: "System", sortValue: (r) => systemMap.get(r.system_id ?? "")?.name ?? "", cell: (r) => systemMap.get(r.system_id ?? "")?.name ?? "—" },
    { key: "change", header: "Access change", cell: (r) => <span>{r.old_access ?? "—"} → {r.new_access ?? "—"}</span> }, { key: "approval", header: "Approval / completion", cell: (r) => <div><p>{r.approved_by ?? "—"}</p><p className="text-xs text-muted-foreground">Completed: {r.completed_by ?? "—"}</p></div> },
    { key: "reason", header: "Reason / ticket", cell: (r) => <div><p>{r.reason ?? "—"}</p><p className="text-xs text-muted-foreground">{r.ticket_reference ?? "No ticket"}</p></div> },
  ];
  return <AppShell title="Access Change Log" description="Permanent history of every grant, change, elevation, suspension and removal." actions={canWrite ? <Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" /> Add log entry</Button> : null}>
    <DataTable rows={log.data ?? []} columns={columns} loading={log.isLoading} rowKey={(r) => r.id} searchable={(r) => [r.action, employeeMap.get(r.employee_id ?? "")?.full_name, systemMap.get(r.system_id ?? "")?.name, r.reason, r.ticket_reference, r.approved_by, r.completed_by].join(" ")} searchPlaceholder="Search audit history…" emptyMessage="No access changes recorded." />
    <RecordDialog open={open} onOpenChange={setOpen} title="Add access change" description="Log entries are append-only and cannot be edited or deleted." fields={fields} initial={{ change_date: new Date().toISOString().slice(0, 10), action: "MODIFY", completed_by: user?.fullName ?? "" }} saving={save.isPending} onSubmit={(values) => save.mutate({ values }, { onSuccess: () => setOpen(false) })} />
  </AppShell>;
}