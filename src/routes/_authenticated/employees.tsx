import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmAction } from "@/components/confirm-button";
import { RecordDialog, type Field } from "@/components/record-dialog";
import { formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/auth";
import { byId, useAccessRecords, useEmployees, useRemove, useSave, type Employee } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "Employees — FlooringMart Access Manager" },
      {
        name: "description",
        content:
          "Directory of FlooringMart employees with department, job title, manager, status and active system access counts.",
      },
      { property: "og:title", content: "Employees — FlooringMart Access Manager" },
      {
        property: "og:description",
        content: "Employee directory with roles, managers and access counts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const { canWrite, canDelete } = useCurrentUser();
  const employees = useEmployees();
  const access = useAccessRecords();
  const save = useSave("employees");
  const remove = useRemove("employees", ["access_records"]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const map = byId(employees.data);

  const fields: Field[] = [
    { name: "employee_code", label: "Employee code", type: "text", required: true },
    { name: "full_name", label: "Full name", type: "text", required: true },
    { name: "email", label: "Work email", type: "email" },
    { name: "department", label: "Department", type: "text" },
    { name: "job_title", label: "Job title", type: "text" },
    {
      name: "manager_id",
      label: "Manager",
      type: "select",
      options: (employees.data ?? [])
        .filter((e) => e.id !== editing?.id)
        .map((e) => ({ value: e.id, label: e.full_name })),
    },
    { name: "start_date", label: "Start date", type: "date" },
    { name: "end_date", label: "End date", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Active" },
        { value: "on_leave", label: "On leave" },
        { value: "former", label: "Former" },
      ],
    },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      sortValue: (r) => r.full_name,
      cell: (r) => (
        <div>
          <p className="font-medium">{r.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {r.employee_code} · {r.email ?? "no email"}
          </p>
        </div>
      ),
    },
    { key: "dept", header: "Department", sortValue: (r) => r.department ?? "", cell: (r) => r.department ?? "—" },
    { key: "title", header: "Job title", sortValue: (r) => r.job_title ?? "", cell: (r) => r.job_title ?? "—" },
    {
      key: "manager",
      header: "Manager",
      cell: (r) => (r.manager_id ? (map.get(r.manager_id)?.full_name ?? "—") : "—"),
    },
    {
      key: "access",
      header: "Active access",
      sortValue: (r) =>
        (access.data ?? []).filter((a) => a.employee_id === r.id && a.status === "active").length,
      cell: (r) =>
        (access.data ?? []).filter((a) => a.employee_id === r.id && a.status === "active").length,
    },
    { key: "start", header: "Start", sortValue: (r) => r.start_date ?? "", cell: (r) => formatDate(r.start_date) },
    { key: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <StatusBadge value={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {canWrite ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(r);
                setOpen(true);
              }}
            >
              Edit
            </Button>
          ) : null}
          {canDelete ? (
            <ConfirmAction
              trigger={
                <Button size="icon" variant="ghost">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              }
              title={`Delete ${r.full_name}?`}
              description="This removes the employee and their access records. Prefer marking them as Former to keep the audit trail."
              confirmLabel="Delete"
              onConfirm={() => remove.mutate(r.id)}
            />
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Employees"
      description="Everyone on record, their role and how much access they hold."
      actions={
        canWrite ? (
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Add employee
          </Button>
        ) : null
      }
    >
      <DataTable
        rows={employees.data ?? []}
        columns={columns}
        loading={employees.isLoading}
        rowKey={(r) => r.id}
        searchable={(r) =>
          [r.full_name, r.employee_code, r.email, r.department, r.job_title].join(" ")
        }
        searchPlaceholder="Search employees…"
        emptyMessage="No employees yet."
      />

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.full_name}` : "Add employee"}
        fields={fields}
        initial={editing ?? { status: "active" }}
        saving={save.isPending}
        onSubmit={(values) =>
          save.mutate({ id: editing?.id, values }, { onSuccess: () => setOpen(false) })
        }
      />
    </AppShell>
  );
}
