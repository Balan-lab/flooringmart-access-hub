import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { RecordDialog, type Field } from "@/components/record-dialog";
import { LevelBadge, StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/lib/auth";
import { byId, useAccessRecords, useEmployees, useSave, useSystems, type AccessRecord } from "@/lib/data";
import { ACCESS_LEVELS, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/access")({
  head: () => ({ meta: [
    { title: "Access Management — FlooringMart Access Manager" },
    { name: "description", content: "Employee and system access records, privileged accounts, MFA status and access reviews." },
    { property: "og:title", content: "Access Management — FlooringMart" },
    { property: "og:description", content: "Employee and system access records with review and MFA status." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AccessPage,
});

function AccessPage() {
  const { canWrite, user } = useCurrentUser();
  const employees = useEmployees(); const systems = useSystems(); const access = useAccessRecords();
  const save = useSave("access_records", ["access_change_log"]); const saveLog = useSave("access_change_log");
  const employeeMap = byId(employees.data); const systemMap = byId(systems.data);
  const [editing, setEditing] = useState<AccessRecord | null>(null); const [open, setOpen] = useState(false);
  const active = useMemo(() => (access.data ?? []).filter((a) => a.status === "active"), [access.data]);
  const fields: Field[] = [
    { name: "employee_id", label: "Employee", type: "select", required: true, options: (employees.data ?? []).map((e) => ({ value: e.id, label: e.full_name })) },
    { name: "system_id", label: "System", type: "select", required: true, options: (systems.data ?? []).map((s) => ({ value: s.id, label: s.name })) },
    { name: "access_level", label: "Access level", type: "select", required: true, options: ACCESS_LEVELS.map((value) => ({ value, label: value })) },
    { name: "status", label: "Status", type: "select", required: true, options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }, { value: "removed", label: "Removed" }] },
    { name: "username", label: "Username / login email", type: "text" },
    { name: "vault_reference", label: "Credential-vault reference", type: "text", help: "Reference only. Never enter a password, API key, MFA secret or recovery code." },
    { name: "granted_on", label: "Granted on", type: "date" }, { name: "granted_by", label: "Granted by", type: "text" },
    { name: "access_owner", label: "Access owner", type: "text" }, { name: "mfa_enabled", label: "MFA enabled", type: "switch" },
    { name: "last_review_date", label: "Last reviewed", type: "date" }, { name: "removed_on", label: "Removed on", type: "date" },
    { name: "removed_by", label: "Removed by", type: "text" }, { name: "notes", label: "Notes", type: "textarea" },
  ];
  const columns: Column<AccessRecord>[] = [
    { key: "employee", header: "Employee", sortValue: (r) => employeeMap.get(r.employee_id)?.full_name ?? "", cell: (r) => <div><p className="font-medium">{employeeMap.get(r.employee_id)?.full_name ?? "Unknown"}</p><p className="text-xs text-muted-foreground">{employeeMap.get(r.employee_id)?.department ?? "—"}</p></div> },
    { key: "system", header: "System", sortValue: (r) => systemMap.get(r.system_id)?.name ?? "", cell: (r) => systemMap.get(r.system_id)?.name ?? "Unknown" },
    { key: "level", header: "Level", sortValue: (r) => r.access_level, cell: (r) => <LevelBadge value={r.access_level} /> },
    { key: "login", header: "Login / vault", cell: (r) => <div><p>{r.username ?? "—"}</p><p className="text-xs text-muted-foreground">{r.vault_reference ?? "No vault reference"}</p></div> },
    { key: "mfa", header: "MFA", sortValue: (r) => r.mfa_enabled ? 1 : 0, cell: (r) => <Badge variant="outline" className={r.mfa_enabled ? "border-success/30 text-success" : "border-warning/40 text-warning-foreground"}>{r.mfa_enabled ? "Enabled" : "Not recorded"}</Badge> },
    { key: "review", header: "Last review", sortValue: (r) => r.last_review_date ?? "", cell: (r) => formatDate(r.last_review_date) },
    { key: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <StatusBadge value={r.status} /> },
    { key: "actions", header: "", className: "text-right", cell: (r) => canWrite ? <Button size="sm" variant="outline" onClick={() => { setEditing(r); setOpen(true); }}>Edit</Button> : null },
  ];
  return <AppShell title="Access Management" description="Who can access each system, at what level, and when it was last reviewed." actions={canWrite ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 size-4" /> Add access</Button> : null}>
    <Tabs defaultValue="records"><TabsList className="mb-4"><TabsTrigger value="records">Access records</TabsTrigger><TabsTrigger value="employee">By employee</TabsTrigger><TabsTrigger value="system">By system</TabsTrigger><TabsTrigger value="matrix">Matrix</TabsTrigger></TabsList>
      <TabsContent value="records"><DataTable rows={access.data ?? []} columns={columns} loading={access.isLoading} rowKey={(r) => r.id} searchable={(r) => [employeeMap.get(r.employee_id)?.full_name, systemMap.get(r.system_id)?.name, r.username, r.vault_reference, r.access_level, r.status].join(" ")} searchPlaceholder="Search employees, systems or access…" /></TabsContent>
      <TabsContent value="employee"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(employees.data ?? []).map((e) => { const rows = active.filter((a) => a.employee_id === e.id); return <section key={e.id} className="rounded-md border bg-card p-4 shadow-panel"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-display font-semibold">{e.full_name}</h2><p className="text-xs text-muted-foreground">{e.job_title ?? "—"}</p></div><Badge variant="outline">{rows.length}</Badge></div><div className="space-y-2">{rows.map((a) => <div key={a.id} className="flex items-center justify-between gap-2 text-sm"><span className="truncate">{systemMap.get(a.system_id)?.name ?? "Unknown"}</span><LevelBadge value={a.access_level} /></div>)}</div></section>; })}</div></TabsContent>
      <TabsContent value="system"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(systems.data ?? []).map((s) => { const rows = active.filter((a) => a.system_id === s.id); return <section key={s.id} className="rounded-md border bg-card p-4 shadow-panel"><div className="mb-3 flex items-center justify-between"><h2 className="font-display font-semibold">{s.name}</h2><Badge variant="outline">{rows.length}</Badge></div><div className="space-y-2">{rows.map((a) => <div key={a.id} className="flex items-center justify-between gap-2 text-sm"><span className="truncate">{employeeMap.get(a.employee_id)?.full_name ?? "Unknown"}</span><LevelBadge value={a.access_level} /></div>)}</div></section>; })}</div></TabsContent>
      <TabsContent value="matrix"><div className="overflow-x-auto rounded-md border bg-card shadow-panel"><table className="w-full text-sm"><thead><tr className="bg-muted/60"><th className="sticky left-0 bg-muted px-3 py-2 text-left">Employee</th>{(systems.data ?? []).map((s) => <th key={s.id} className="min-w-28 px-2 py-2 text-left font-medium">{s.name}</th>)}</tr></thead><tbody>{(employees.data ?? []).map((e) => <tr key={e.id} className="border-t"><th className="sticky left-0 bg-card px-3 py-2 text-left font-medium">{e.full_name}</th>{(systems.data ?? []).map((s) => { const found = active.find((a) => a.employee_id === e.id && a.system_id === s.id); return <td key={s.id} className="px-2 py-2">{found ? <LevelBadge value={found.access_level} /> : <span className="text-muted-foreground">—</span>}</td>; })}</tr>)}</tbody></table></div></TabsContent>
    </Tabs>
    <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Edit access record" : "Add access record"} description="Store a vault reference only—never credentials, keys, MFA secrets or recovery codes." fields={fields} initial={editing ?? { status: "active", access_level: "Standard", mfa_enabled: false }} saving={save.isPending} onSubmit={(values) => {
      const oldLevel = editing?.access_level ?? null;
      const nextLevel = String(values["access_level"] ?? "Standard");
      const nextStatus = String(values["status"] ?? "active");
      const rank = ACCESS_LEVELS.indexOf(nextLevel as (typeof ACCESS_LEVELS)[number]);
      const oldRank = oldLevel ? ACCESS_LEVELS.indexOf(oldLevel) : -1;
      const action = !editing ? "GRANT" : nextStatus === "removed" ? "REMOVE" : nextStatus === "suspended" ? "SUSPEND" : rank > oldRank ? "ELEVATE" : "MODIFY";
      save.mutate({ id: editing?.id, values }, { onSuccess: () => {
        saveLog.mutate({ values: {
          employee_id: values["employee_id"],
          system_id: values["system_id"],
          action,
          old_access: oldLevel,
          new_access: nextStatus === "active" ? nextLevel : nextStatus,
          completed_by: user?.fullName ?? null,
          reason: editing ? "Access record updated" : "Access granted",
        } });
        setOpen(false);
      } });
    }} />
  </AppShell>;
}