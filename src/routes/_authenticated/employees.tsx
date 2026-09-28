import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/confirm-button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { RecordDialog, type Field } from "@/components/record-dialog";
import { formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/auth";
import { byId, useAccessRecords, useEmployees, useSave, type Employee } from "@/lib/data";
import type { Database } from "@/integrations/supabase/types";
import { createEmployeeAccount, resetEmployeePassword } from "@/lib/employee-accounts.functions";

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
  const { canWrite } = useCurrentUser();
  const createAccount = useServerFn(createEmployeeAccount);
  const resetPassword = useServerFn(resetEmployeePassword);
  const queryClient = useQueryClient();
  const employees = useEmployees();
  const access = useAccessRecords();
  const save = useSave("employees");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [credential, setCredential] = useState<{ password: string; email: string; fullName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function createEmployee(values: Record<string, unknown>) {
    setAccountBusy(true);
    try {
      const result = await createAccount({ data: values as Database["public"]["Tables"]["employees"]["Insert"] & { email: string; status: "active" | "on_leave" | "former" } });
      setOpen(false);
      setCopied(false);
      setCredential(result);
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee login created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create employee login.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function resetFor(employee: Employee) {
    setAccountBusy(true);
    try {
      const result = await resetPassword({ data: { employeeId: employee.id } });
      setCopied(false);
      setCredential(result);
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["access_change_log"] });
      if (result.auditFailed) toast.error("Password changed, but the audit entry could not be recorded. Contact an administrator.");
      else toast.success("Password reset");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setAccountBusy(false);
    }
  }

  const map = byId(employees.data);

  const fields: Field[] = [
    { name: "employee_code", label: "Employee code", type: "text", required: true },
    { name: "full_name", label: "Full name", type: "text", required: true },
    { name: "email", label: "Work email", type: "email", required: !editing },
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
          {canWrite && r.email ? <ConfirmAction
            trigger={<Button size="sm" variant="outline" disabled={accountBusy} title="Reset password"><KeyRound className="size-4" /><span className="sr-only">Reset password for {r.full_name}</span></Button>}
            title={`Reset ${r.full_name}'s password?`}
            description="The old password will stop working. A new password will be shown once for you to copy and share securely."
            confirmLabel="Reset password"
            onConfirm={() => void resetFor(r)}
          /> : null}
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
        title={editing ? `Edit ${editing.full_name}` : "Add employee and login"}
        {...(!editing ? { description: "An account password will be generated and shown once after creation." } : {})}
        fields={fields}
        initial={editing ?? { status: "active" }}
        saving={save.isPending || accountBusy}
        onSubmit={(values) => {
          if (editing) save.mutate({ id: editing.id, values }, { onSuccess: () => setOpen(false) });
          else void createEmployee(values);
        }}
      />
      <Dialog open={credential !== null} onOpenChange={(next) => { if (!next) { setCredential(null); setCopied(false); } }}>
        <DialogContent className="sm:max-w-md" onEscapeKeyDown={(event) => { if (accountBusy) event.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Employee password</DialogTitle>
            <DialogDescription>This password is shown only once. Copy it now and share it securely with {credential?.fullName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{credential?.email}</p>
            <code className="block select-all break-all rounded-md border bg-muted p-3 font-mono text-base" data-testid="one-time-password">{credential?.password}</code>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={async () => {
              if (!credential) return;
              try { await navigator.clipboard.writeText(credential.password); setCopied(true); }
              catch { toast.error("Copy failed. Select and copy the password manually."); }
            }}>{copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}{copied ? "Copied" : "Copy password"}</Button>
            <Button onClick={() => { setCredential(null); setCopied(false); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
