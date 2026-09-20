import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "it_admin" | "manager" | "viewer";

export const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super Admin",
  it_admin: "IT / Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export function useCurrentUser() {
  const { session, loading } = useSession();
  const userId = session?.user.id;

  const profile = useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("No signed-in user");
      const [{ data: prof }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      const roleList = (roles ?? []).map((r) => r.role as AppRole);
      const role: AppRole =
        (["super_admin", "it_admin", "manager", "viewer"] as AppRole[]).find((r) =>
          roleList.includes(r),
        ) ?? "viewer";
      return {
        id: userId,
        email: session?.user.email ?? prof?.email ?? "",
        fullName: prof?.full_name ?? session?.user.email ?? "",
        role,
      };
    },
  });

  const role = profile.data?.role ?? "viewer";
  return {
    loading: loading || profile.isLoading,
    session,
    user: profile.data,
    role,
    canWrite: role === "super_admin" || role === "it_admin",
    canDelete: role === "super_admin",
  };
}
