import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ConfirmAction } from "@/components/confirm-button";
import { DataTable, type Column } from "@/components/data-table";
import { RecordDialog, type Field } from "@/components/record-dialog";
import { DecisionBadge, StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth";
import { useRemove, useSave, useSystems, type System } from "@/lib/data";
import { currency, DECISIONS, DECISION_LABEL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/systems")({
  head: () => ({ meta: [
    { title: "Systems & Subscriptions — FlooringMart Access Manager" },
    { name: "description", content: "FlooringMart software systems, subscription costs, owners, renewals and review decisions." },
    { property: "og:title", content: "Systems & Subscriptions — FlooringMart" },
    { property: "og:description", content: "Software inventory, spend, renewals and review decisions." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SystemsPage,
});

function SystemsPage() {
  const { canWrite, canDelete } = useCurrentUser();
  const systems = useSystems();
  const save = useSave("systems");
  const remove = useRemove("systems", ["access_records"]);
  const [editing, setEditing] = useState<System | null>(null);
  const [open, setOpen] = useState(false);
  const fields: Field[] = [
    { name: "name", label: "System / subscription", type: "text", required: true },
    { name: "vendor", label: "Vendor", type: "text" },
    { name: "category", label: "Category", type: "text" },
    { name: "account_email", label: "Account email", type: "email" },
    { name: "business_owner", label: "Business owner", type: "text" },
    { name: "technical_owner", label: "Technical owner", type: "text" },
    { name: "monthly_cost", label: "Monthly cost", type: "number" },
    { name: "annual_cost", label: "Annual cost", type: "number" },
    { name: "renewal_date", label: "Renewal date", type: "date" },
    { name: "cancellation_date", label: "Cancellation date", type: "date" },
    { name: "paid_seats", label: "Paid seats", type: "number" },
    { name: "active_users", label: "Active users", type: "number" },
    { name: "status", label: "Status", type: "select", required: true, options: [
      { value: "active", label: "Active" }, { value: "needs_review", label: "Needs review" },
      { value: "pending_cancellation", label: "Pending cancellation" }, { value: "cancelled", label: "Cancelled" },
    ] },
    { name: "decision", label: "Review decision", type: "select", required: true, options: DECISIONS.map((value) => ({ value, label: DECISION_LABEL[value] ?? value })) },
    { name: "consolidation_candidate", label: "Consolidation candidate", type: "switch" },
    { name: "purpose", label: "Business purpose", type: "textarea" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  const columns: Column<System>[] = [
    { key: "name", header: "System", sortValue: (r) => r.name, cell: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.vendor ?? "—"} · {r.category ?? "Uncategorised"}</p></div> },
    { key: "owners", header: "Owners", cell: (r) => <div className="text-sm"><p>{r.business_owner ?? "—"}</p><p className="text-xs text-muted-foreground">Technical: {r.technical_owner ?? "—"}</p></div> },
    { key: "cost", header: "Cost", sortValue: (r) => Number(r.monthly_cost ?? 0), cell: (r) => <div><p>{currency(Number(r.monthly_cost ?? 0))}/mo</p><p className="text-xs text-muted-foreground">{currency(Number(r.annual_cost ?? 0))}/yr</p></div> },
    { key: "seats", header: "Seats", sortValue: (r) => r.paid_seats ?? 0, cell: (r) => `${r.active_users ?? 0} / ${r.paid_seats ?? 0}` },
    { key: "renewal", header: "Renewal", sortValue: (r) => r.renewal_date ?? "", cell: (r) => formatDate(r.renewal_date) },
    { key: "decision", header: "Decision", cell: (r) => <div className="flex flex-wrap gap-1"><DecisionBadge value={r.decision} />{r.consolidation_candidate ? <Badge variant="outline">Consolidate</Badge> : null}</div> },
    { key: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <StatusBadge value={r.status} /> },
    { key: "actions", header: "", className: "text-right", cell: (r) => <div className="flex justify-end gap-1">{canWrite ? <Button size="sm" variant="outline" onClick={() => { setEditing(r); setOpen(true); }}>Edit</Button> : null}{canDelete ? <ConfirmAction trigger={<Button size="icon" variant="ghost"><Trash2 className="size-4 text-destructive" /></Button>} title={`Delete ${r.name}?`} description="This deletes the system record. Prefer changing its status to Cancelled so history remains intact." confirmLabel="Delete" onConfirm={() => remove.mutate(r.id)} /> : null}</div> },
  ];
  return <AppShell title="Systems & Subscriptions" description="Costs, renewals, ownership and review decisions for every registered system." actions={canWrite ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 size-4" /> Add system</Button> : null}>
    <DataTable rows={systems.data ?? []} columns={columns} loading={systems.isLoading} rowKey={(r) => r.id} searchable={(r) => [r.name, r.vendor, r.category, r.business_owner, r.technical_owner, r.decision].join(" ")} searchPlaceholder="Search systems, vendors or owners…" emptyMessage="No systems recorded." />
    <RecordDialog open={open} onOpenChange={setOpen} title={editing ? `Edit ${editing.name}` : "Add system"} description="Record decisions only. This app never cancels an external subscription automatically." fields={fields} initial={editing ?? { status: "active", decision: "VERIFY", consolidation_candidate: false }} saving={save.isPending} onSubmit={(values) => save.mutate({ id: editing?.id, values }, { onSuccess: () => setOpen(false) })} />
  </AppShell>;
}