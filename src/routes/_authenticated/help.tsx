import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  KeyRound,
  Search,
  ShieldAlert,
  UserRoundCog,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help Guide — FlooringMart Access & Subscription Manager" },
      {
        name: "description",
        content: "Administrator instructions for managing employees, subscriptions, access, reviews and reports.",
      },
      { property: "og:title", content: "Help Guide — FlooringMart Access Manager" },
      {
        property: "og:description",
        content: "Administrator instructions for FlooringMart access and subscription management.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

const sections = [
  {
    title: "Sign in and account roles",
    icon: UserRoundCog,
    summary: "Access the app and understand what each role can do.",
    items: [
      "Sign in with your confirmed FlooringMart work email and password.",
      "If you created a new account, open the confirmation email before signing in.",
      "Super Admin has full administration, including role management and permitted deletions.",
      "IT / Admin can create and edit operational records, workflows, reviews and logs.",
      "Manager and Viewer accounts have read-only access. Grant elevated roles only when needed.",
    ],
  },
  {
    title: "Daily administration",
    icon: BookOpen,
    summary: "Keep employee and subscription records current.",
    items: [
      "Use Dashboard to review access risks, upcoming renewals, open workflows and recent changes.",
      "Add employees on Employees and keep their department, manager, role, dates and status current.",
      "Never delete a historical employee. Mark them Former and remove their active access records.",
      "Use Systems & Subscriptions to maintain owners, costs, seats, renewals and review decisions.",
      "A cancellation decision is tracking only. Confirm cancellation with the vendor, then update the record.",
    ],
  },
  {
    title: "Access management",
    icon: KeyRound,
    summary: "Record every grant, change, suspension and removal.",
    items: [
      "Add or update access from Access Management, including level, account name, owner, MFA and review date.",
      "Store only a credential-vault reference. Never enter passwords, API keys, MFA secrets or recovery codes.",
      "Use employee, system and matrix views to identify gaps and excess access.",
      "The Access Change Log preserves who changed access, when, why and who approved it.",
      "Record removal details after the account has been removed in the external service.",
    ],
  },
  {
    title: "Employee lifecycle workflows",
    icon: CheckCircle2,
    summary: "Use verified checklists for onboarding, offboarding and role changes.",
    items: [
      "For onboarding, add the employee, open a workflow and generate the standard checklist.",
      "Review role-based suggestions, complete each real-world action and record the access grant.",
      "For offboarding or role changes, generate the checklist and review every listed system.",
      "Complete the external account change first, then update Access Management and the checklist.",
      "Use a second person for verification where required. Completion documents work; it does not revoke access automatically.",
    ],
  },
  {
    title: "Quarterly reviews and reports",
    icon: ShieldAlert,
    summary: "Review access, cost and ownership on a regular cadence.",
    items: [
      "Create separate subscription and access reviews for each quarter.",
      "Confirm pricing, usage, seats, renewal date, owner and business need for each subscription.",
      "Confirm every employee’s active access, ownership, MFA status and appropriate access level.",
      "Use Reports for current access, former employees with access, privileged access, costs, renewals and change history.",
      "Mark review items complete only when evidence is present and follow-up work is recorded.",
    ],
  },
  {
    title: "Recommended operating cadence",
    icon: CheckCircle2,
    summary: "A simple schedule for keeping records reliable.",
    items: [
      "Daily: resolve departure risks and urgent access changes.",
      "Weekly: review upcoming renewals, incomplete workflows, missing owners and MFA gaps.",
      "Monthly: reconcile paid seats with active users and confirm cancellation decisions.",
      "Quarterly: complete subscription and access reviews, including Admin and Owner grants.",
    ],
  },
];

function HelpPage() {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sections;
    return sections.filter((section) =>
      [section.title, section.summary, ...section.items].some((text) =>
        text.toLowerCase().includes(query),
      ),
    );
  }, [search]);

  return (
    <AppShell
      title="Help Guide"
      description="Administrator guidance for common access and subscription tasks."
      actions={
        <Button asChild size="sm" variant="outline">
          <a href="/guides/FlooringMart_Admin_Help_Guide.docx" download>
            <Download className="size-4" />
            <span className="hidden sm:inline">Download guide</span>
          </a>
        </Button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <Alert>
          <ShieldAlert className="size-4" />
          <AlertTitle>Tracking and verification only</AlertTitle>
          <AlertDescription>
            This app never cancels a subscription or revokes an external account automatically.
            Complete the action with the provider first, then record and verify it here.
          </AlertDescription>
        </Alert>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search the guide"
            aria-label="Search the help guide"
            className="pl-9"
          />
        </div>

        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title} className="shadow-panel">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <CardTitle className="font-display text-base">{section.title}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">{section.summary}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2 pl-5 text-sm">
                      {section.items.map((item) => (
                        <li key={item} className="list-decimal pl-1 leading-relaxed marker:text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed py-16 text-center">
            <p className="font-medium">No guidance found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a broader search term.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-sm text-muted-foreground">
          <p>FlooringMart internal use only</p>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <a href="/guides/FlooringMart_Admin_Help_Guide.docx" download>
              Open printable Word guide <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}