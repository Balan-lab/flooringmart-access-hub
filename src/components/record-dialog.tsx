import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Field = {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "textarea" | "select" | "switch";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  full?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  fields: Field[];
  initial?: Record<string, unknown>;
  saving?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;

  // Optional draft persistence
  draftKey?: string;
};

export function RecordDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  saving,
  onSubmit,
  draftKey,
}: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!open) return;

    // Restore an existing draft when this dialog supports draft persistence.
    if (draftKey && !initial?.id) {
      try {
        const saved = sessionStorage.getItem(draftKey);

        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, unknown>;

          const restored: Record<string, unknown> = {};

          for (const f of fields) {
            const v = parsed[f.name];
            restored[f.name] =
              f.type === "switch" ? !!v : (v ?? "");
          }

          setValues(restored);
          return;
        }
      } catch {
        // Ignore malformed sessionStorage data.
        sessionStorage.removeItem(draftKey);
      }
    }

    const next: Record<string, unknown> = {};

    for (const f of fields) {
      const v = initial?.[f.name];
      next[f.name] = f.type === "switch" ? !!v : (v ?? "");
    }

    setValues(next);
  }, [open, initial, fields, draftKey]);

  // Persist the current draft whenever the user changes a field.
  useEffect(() => {
    if (!open || !draftKey || initial?.id) return;

    try {
      sessionStorage.setItem(draftKey, JSON.stringify(values));
    } catch {
      // Ignore storage errors.
    }
  }, [values, open, draftKey, initial?.id]);

  const set = (name: string, v: unknown) => {
    setValues((p) => ({ ...p, [name]: v }));
  };

  const clearDraft = () => {
    if (!draftKey) return;

    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      // Ignore storage errors.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();

            const cleaned: Record<string, unknown> = {};

            for (const f of fields) {
              const v = values[f.name];

              if (f.type === "switch") {
                cleaned[f.name] = !!v;
              } else if (v === "" || v === undefined) {
                cleaned[f.name] = null;
              } else if (f.type === "number") {
                cleaned[f.name] = Number(v);
              } else {
                cleaned[f.name] = v;
              }
            }

            onSubmit(cleaned);

            // Do not clear the draft here.
            // The parent clears it only after a successful database save.
          }}
        >
          {fields.map((f) => (
            <div
              key={f.name}
              className={
                f.full || f.type === "textarea"
                  ? "sm:col-span-2 space-y-2"
                  : "space-y-2"
              }
            >
              <Label htmlFor={f.name}>
                {f.label}
                {f.required ? (
                  <span className="text-destructive"> *</span>
                ) : null}
              </Label>

              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  value={String(values[f.name] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "select" ? (
                <Select
                  value={String(values[f.name] ?? "")}
                  onValueChange={(v) =>
                    set(f.name, v === "__none" ? "" : v)
                  }
                >
                  <SelectTrigger id={f.name}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>

                  <SelectContent>
                    {!f.required ? (
                      <SelectItem value="__none">— None —</SelectItem>
                    ) : null}

                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "switch" ? (
                <div className="flex h-9 items-center gap-3">
                  <Switch
                    id={f.name}
                    checked={!!values[f.name]}
                    onCheckedChange={(v) => set(f.name, v)}
                  />

                  <span className="text-sm text-muted-foreground">
                    {values[f.name] ? "Yes" : "No"}
                  </span>
                </div>
              ) : (
                <Input
                  id={f.name}
                  type={f.type}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}

              {f.help ? (
                <p className="text-xs text-muted-foreground">
                  {f.help}
                </p>
              ) : null}
            </div>
          ))}

          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}