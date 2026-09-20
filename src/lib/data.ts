import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Employee = Tables["employees"]["Row"];
export type System = Tables["systems"]["Row"];
export type AccessRecord = Tables["access_records"]["Row"];
export type ChangeLog = Tables["access_change_log"]["Row"];
export type Workflow = Tables["workflows"]["Row"];
export type WorkflowItem = Tables["workflow_items"]["Row"];
export type Review = Tables["reviews"]["Row"];
export type ReviewItem = Tables["review_items"]["Row"];
export type RoleTemplate = Tables["role_access_templates"]["Row"];

async function must<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: () => must<Employee[]>(supabase.from("employees").select("*").order("full_name")),
  });
}

export function useSystems() {
  return useQuery({
    queryKey: ["systems"],
    queryFn: () => must<System[]>(supabase.from("systems").select("*").order("name")),
  });
}

export function useAccessRecords() {
  return useQuery({
    queryKey: ["access_records"],
    queryFn: () =>
      must<AccessRecord[]>(
        supabase.from("access_records").select("*").order("created_at", { ascending: false }),
      ),
  });
}

export function useChangeLog() {
  return useQuery({
    queryKey: ["access_change_log"],
    queryFn: () =>
      must<ChangeLog[]>(
        supabase.from("access_change_log").select("*").order("change_date", { ascending: false }),
      ),
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: () =>
      must<Workflow[]>(supabase.from("workflows").select("*").order("created_at", { ascending: false })),
  });
}

export function useWorkflowItems() {
  return useQuery({
    queryKey: ["workflow_items"],
    queryFn: () =>
      must<WorkflowItem[]>(supabase.from("workflow_items").select("*").order("sort_order")),
  });
}

export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: () =>
      must<Review[]>(supabase.from("reviews").select("*").order("created_at", { ascending: false })),
  });
}

export function useReviewItems() {
  return useQuery({
    queryKey: ["review_items"],
    queryFn: () => must<ReviewItem[]>(supabase.from("review_items").select("*")),
  });
}

export function useRoleTemplates() {
  return useQuery({
    queryKey: ["role_access_templates"],
    queryFn: () => must<RoleTemplate[]>(supabase.from("role_access_templates").select("*")),
  });
}

type TableName =
  | "employees"
  | "systems"
  | "access_records"
  | "access_change_log"
  | "workflows"
  | "workflow_items"
  | "reviews"
  | "review_items"
  | "role_access_templates";

export function useSave(table: TableName, invalidate: string[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: Record<string, unknown> }) => {
      const query = id
        ? supabase.from(table).update(values as never).eq("id", id)
        : supabase.from(table).insert(values as never);
      const { error } = await query;
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      for (const key of [table, ...invalidate]) qc.invalidateQueries({ queryKey: [key] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemove(table: TableName, invalidate: string[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      for (const key of [table, ...invalidate]) qc.invalidateQueries({ queryKey: [key] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function byId<T extends { id: string }>(rows: T[] | undefined) {
  const map = new Map<string, T>();
  for (const r of rows ?? []) map.set(r.id, r);
  return map;
}
