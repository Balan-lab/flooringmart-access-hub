import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const employeeInput = z.object({
  employee_code: z.string().trim().min(1).max(80),
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  department: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.enum(["active", "on_leave", "former"]),
  notes: z.string().nullable().optional(),
});

const groups = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%^&*-_+=?",
] as const;
const alphabet = groups.join("");

function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const bytes = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(bytes);
    value = bytes[0] ?? 0;
  } while (value >= limit);
  return value % max;
}

export function generateEmployeePassword(): string {
  const characters = groups.map((group) => group[randomIndex(group.length)] ?? group[0]);
  while (characters.length < 20) characters.push(alphabet[randomIndex(alphabet.length)] ?? alphabet[0]);
  for (let i = characters.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [characters[i], characters[j]] = [characters[j] ?? "", characters[i] ?? ""];
  }
  return characters.join("");
}

async function assertAccountAdmin(context: {
  userId: string;
  supabase: {
    from: (table: "user_roles") => {
      select: (columns: "role") => {
        eq: (column: "user_id", id: string) => PromiseLike<{
          data: { role: string }[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}) {
  const { data, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  if (error || !data?.some(({ role }) => role === "super_admin" || role === "it_admin")) {
    throw new Error("Only Super Admin and IT/Admin can manage employee passwords.");
  }
}

export const createEmployeeAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => employeeInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAccountAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = generateEmployeePassword();
    const email = data.email.toLowerCase();
    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (authError || !created.user) throw new Error(authError?.message ?? "Could not create login account.");

    const { error: employeeError } = await context.supabase.from("employees").insert({
      ...data,
      email,
      auth_user_id: created.user.id,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (employeeError) {
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      if (cleanupError) console.error("Could not clean up incomplete employee login creation");
      throw new Error(employeeError.message);
    }
    return { password, email, fullName: data.full_name };
  });

const resetInput = z.object({ employeeId: z.string().uuid() });

export const resetEmployeePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => resetInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAccountAdmin(context);
    const { data: employee, error: employeeError } = await context.supabase
      .from("employees").select("id, full_name, email, auth_user_id")
      .eq("id", data.employeeId).single();
    if (employeeError || !employee) throw new Error("Employee not found.");
    if (!employee.auth_user_id && !employee.email) throw new Error("This employee needs a work email before a login can be found.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId = employee.auth_user_id;
    if (!userId && employee.email) {
      // Existing employee accounts may predate the employee/auth link. Match by exact email.
      for (let page = 1; page <= 100; page++) {
        const { data: batch, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error("Could not locate the employee login.");
        const match = batch.users.find((user) => user.email?.toLowerCase() === employee.email?.toLowerCase());
        if (match) { userId = match.id; break; }
        if (batch.users.length < 1000) break;
      }
      if (!userId) throw new Error("No login exists for this employee's work email.");
    }
    if (!userId) throw new Error("No login exists for this employee.");

    const { data: authUser, error: authLookupError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authLookupError || !authUser.user || authUser.user.email?.toLowerCase() !== employee.email?.toLowerCase()) {
      throw new Error("The employee email does not match their login. Check the work email before resetting.");
    }

    if (!employee.auth_user_id) {
      const { error: linkError } = await context.supabase.from("employees")
        .update({ auth_user_id: userId, updated_by: context.userId }).eq("id", employee.id).is("auth_user_id", null);
      if (linkError) throw new Error("Could not link the existing login to this employee.");
    }

    const password = generateEmployeePassword();
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (resetError) throw new Error("Could not reset the employee password.");

    const { error: auditError } = await context.supabase.from("access_change_log").insert({
      employee_id: employee.id,
      action: "PASSWORD_RESET",
      completed_by: context.claims.email ?? context.userId,
      reason: "Administrator reset employee login password",
      created_by: context.userId,
    });
    if (auditError) {
      // Password has changed; never lose the newly generated credential due to a log failure.
      console.error("Employee password reset audit event failed");
      return { password, email: employee.email ?? "", fullName: employee.full_name, auditFailed: true };
    }
    return { password, email: employee.email ?? "", fullName: employee.full_name, auditFailed: false };
  });