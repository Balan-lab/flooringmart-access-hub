import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  ClipboardCheck,
  CreditCard,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/systems", label: "Systems & Subscriptions", icon: CreditCard },
  { to: "/access", label: "Access Management", icon: KeyRound },
  { to: "/access-log", label: "Access Change Log", icon: History },
  { to: "/onboarding", label: "Onboarding", icon: UserPlus },
  { to: "/offboarding", label: "Offboarding / Role Change", icon: UserMinus },
  { to: "/reviews", label: "Quarterly Review", icon: ClipboardCheck },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-3 py-4">
      <div className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <ShieldCheck className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-semibold text-sidebar-foreground">FlooringMart</p>
        <p className="text-xs text-sidebar-foreground/60">Access & Subscriptions</p>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, role } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate text-sm text-sidebar-foreground">{user?.fullName}</p>
          <Badge variant="outline" className="mt-1 border-sidebar-border text-sidebar-foreground/80">
            {ROLE_LABEL[role]}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="mt-3 w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <div className="px-3">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-4 border-t border-sidebar-border p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="w-full justify-start text-sidebar-foreground/75"
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
