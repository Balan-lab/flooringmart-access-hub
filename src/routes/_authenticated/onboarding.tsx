import { createFileRoute } from "@tanstack/react-router";
import { WorkflowBoard } from "@/components/workflow-board";

export const Route = createFileRoute("/_authenticated/onboarding")({ head: () => ({ meta: [
  { title: "Onboarding — FlooringMart Access Manager" }, { name: "description", content: "Role-based onboarding access suggestions, approval tasks and access-grant logging." },
  { property: "og:title", content: "Onboarding — FlooringMart" }, { property: "og:description", content: "Employee onboarding checklists and role-based access suggestions." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: () => <WorkflowBoard types={["onboarding"]} title="Onboarding" description="Role-based access suggestions, approvals and verified completion." /> });