import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmAction } from "@/components/confirm-button";
import { RecordDialog, type Field } from "@/components/record-dialog";
import { formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/auth";
import {
  byId,
  useEmployees,
  useRemove,
  useRoleTemplates,
  useSave,
  useSystems,
  useWorkflowItems,
  useWorkflows,
  type Workflow,
} from "@/lib/data";

const DEFAULT_TASKS: Record<string, string[]> = {
  onboarding: [
    "Collect signed offer & policy acknowledgement",
    "Create company email account",
    "Provision core system access per role template",
    "Enable MFA on every account",
    "Hand over equipment",
    "Manager confirms day-one access works",
  ],
  offboarding: [
    "Confirm last working day with manager",
    "Suspend company email / SSO account",
    "Remove Magento access",
    "Remove GitHub and DigitalOcean access",
    "Remove Figma access",
    "Remove ChatGPT, Claude and Cursor access",
    "Remove QuickBooks and Floorzap access",
    "Remove Namecheap, GoDaddy and domain access",
    "Remove password manager access",
    "Rotate or revoke assigned API keys and tokens",
    "Transfer shared drives, files and document ownership",
    "Review every registered system for remaining access",
    "Collect equipment",
    "Second person verifies all access removed",
  ],
  role_change: [
    "Confirm new job title with manager",
    "Review current access against new role template",
    "Remove access no longer required",
    "Grant new access required by the role",
    "Manager verifies final access list",
  ],
};

const WORKFLOW_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  role_change: "Role change",
};

export function WorkflowBoard({
  types,
  title,
  description,
}: {
  types: ("onboarding" | "offboarding" | "role_change")[];
  title: string;
  description: string;
}) {
  const { canWrite, canDelete, user } = useCurrentUser();
  const employees = useEmployees();
  const systems = useSystems();
  const templates = useRoleTemplates();
  const workflows = useWorkflows();
  const items = useWorkflowItems();

  const saveWorkflow = useSave("workflows");
  const removeWorkflow = useRemove("workflows", ["workflow_items"]);
  const saveItem = useSave("workflow_items");
  const removeItem = useRemove("workflow_items");
  const saveLog = useSave("access_change_log");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [newTask, setNewTask] = useState<Record<string, string>>({});

  const employeeMap = byId(employees.data);
  const systemMap = byId(systems.data);

  const list = useMemo(
    () => (workflows.data ?? []).filter((w) => types.includes(w.type as never)),
    [workflows.data, types],
  );

  const fields: Field[] = [
    {
      name: "type",
      label: "Workflow type",
      type: "select",
      required: true,
      options: types.map((t) => ({
        value: t,
        label: WORKFLOW_LABEL[t],
      })),
    },
    {
      name: "employee_id",
      label: "Employee",
      type: "select",
      required: true,
      options: (employees.data ?? []).map((e) => ({ value: e.id, label: e.full_name })),
    },
    { name: "title", label: "Title", type: "text", required: true, full: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "not_started", label: "Not started" },
        { value: "in_progress", label: "In progress" },
        { value: "completed", label: "Completed" },
      ],
    },
    { name: "target_date", label: "Target date", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  function startNew() {
    setEditing(null);
    setOpen(true);
  }

  return (
    <AppShell
      title={title}
      description={description}
      actions={
        canWrite ? (
          <Button onClick={startNew}>
            <Plus className="mr-2 size-4" /> New workflow
          </Button>
        ) : null
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        {list.length === 0 ? (
          <Card className="shadow-panel">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No workflows yet.
            </CardContent>
          </Card>
        ) : null}

        {list.map((w) => {
          const wItems = (items.data ?? []).filter((i) => i.workflow_id === w.id);
          const done = wItems.filter((i) => i.completed).length;
          const pct = wItems.length ? Math.round((done / wItems.length) * 100) : 0;
          const employee = employeeMap.get(w.employee_id);
          return (
            <Card key={w.id} className="shadow-panel">
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-display text-base">{w.title}</CardTitle>
                    <CardDescription>
                      {employee?.full_name ?? "Unknown"} · {employee?.job_title ?? "—"} · target{" "}
                      {formatDate(w.target_date)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {WORKFLOW_LABEL[w.type]}
                    </span>
                    <StatusBadge value={w.status} />
                    {canWrite ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(w);
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
                        title="Delete workflow?"
                        description="This removes the workflow and its checklist. The access change log is kept."
                        confirmLabel="Delete"
                        onConfirm={() => removeWorkflow.mutate(w.id)}
                      />
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    {done} of {wItems.length} steps complete ({pct}%)
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {wItems.length === 0 && canWrite ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const tasks = DEFAULT_TASKS[w.type] ?? [];
                      tasks.forEach((label, idx) =>
                        saveItem.mutate({
                          values: {
                            workflow_id: w.id,
                            label,
                            category: "Checklist",
                            sort_order: idx,
                          },
                        }),
                      );
                      if (w.type === "onboarding" && employee?.job_title) {
                        (templates.data ?? [])
                          .filter((t) => t.job_title === employee.job_title)
                          .forEach((t, idx) =>
                            saveItem.mutate({
                              values: {
                                workflow_id: w.id,
                                label: `Grant ${systemMap.get(t.system_id)?.name ?? "system"} (${t.recommended_level})`,
                                category: "Access",
                                system_id: t.system_id,
                                recommended_level: t.recommended_level,
                                sort_order: 100 + idx,
                              },
                            }),
                          );
                      }
                    }}
                  >
                    Generate standard checklist
                  </Button>
                ) : null}

                <ul className="divide-y rounded-md border">
                  {wItems.map((i) => (
                    <li key={i.id} className="flex items-start gap-3 px-3 py-2.5">
                      <Checkbox
                        checked={i.completed}
                        disabled={!canWrite}
                        onCheckedChange={(v) => {
                          const completed = !!v;
                          saveItem.mutate({
                            id: i.id,
                            values: {
                              completed,
                              completed_on: completed
                                ? new Date().toISOString().slice(0, 10)
                                : null,
                              completed_by: completed ? (user?.fullName ?? null) : null,
                            },
                          });
                          if (completed && i.system_id) {
                            saveLog.mutate({
                              values: {
                                employee_id: w.employee_id,
                                system_id: i.system_id,
                                action: w.type === "offboarding" ? "REMOVE" : "GRANT",
                                new_access: i.recommended_level,
                                completed_by: user?.fullName ?? null,
                                reason: w.title,
                              },
                            });
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            i.completed
                              ? "text-sm text-muted-foreground line-through"
                              : "text-sm"
                          }
                        >
                          {i.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {i.category ?? "Task"}
                          {i.completed_on ? ` · done ${formatDate(i.completed_on)}` : ""}
                          {i.completed_by ? ` by ${i.completed_by}` : ""}
                        </p>
                      </div>
                      {canWrite ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            saveItem.mutate({
                              id: i.id,
                              values: {
                                verified: !i.verified,
                                verified_by: !i.verified ? (user?.fullName ?? null) : null,
                              },
                            })
                          }
                          title="Second-person verification"
                        >
                          {i.verified ? (
                            <CheckCircle2 className="size-4 text-success" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button size="sm" variant="ghost" onClick={() => removeItem.mutate(i.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {canWrite ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const label = (newTask[w.id] ?? "").trim();
                      if (!label) return;
                      saveItem.mutate({
                        values: {
                          workflow_id: w.id,
                          label,
                          category: "Task",
                          sort_order: wItems.length + 1,
                        },
                      });
                      setNewTask((p) => ({ ...p, [w.id]: "" }));
                    }}
                  >
                    <Input
                      value={newTask[w.id] ?? ""}
                      onChange={(e) => setNewTask((p) => ({ ...p, [w.id]: e.target.value }))}
                      placeholder="Add a step…"
                    />
                    <Button type="submit" variant="outline">
                      Add
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit workflow" : "New workflow"}
        description="Workflows track the checklist only — no external accounts are changed automatically."
        fields={fields}
        initial={editing ?? { type: types[0], status: "not_started" }}
        saving={saveWorkflow.isPending}
        onSubmit={(values) => {
          saveWorkflow.mutate(
            { id: editing?.id, values },
            { onSuccess: () => setOpen(false) },
          );
        }}
      />
    </AppShell>
  );
}
