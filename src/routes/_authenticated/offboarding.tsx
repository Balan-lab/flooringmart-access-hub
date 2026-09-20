import { createFileRoute } from "@tanstack/react-router";
import { WorkflowBoard } from "@/components/workflow-board";

export const Route = createFileRoute("/_authenticated/offboarding")({ head: () => ({ meta: [
  { title: "Offboarding & Role Changes — FlooringMart Access Manager" }, { name: "description", content: "Verified offboarding and employee role-change access checklists." },
  { property: "og:title", content: "Offboarding & Role Changes — FlooringMart" }, { property: "og:description", content: "Verified offboarding and role-change access checklists." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: () => <WorkflowBoard types={["offboarding", "role_change"]} title="Offboarding / Role Change" description="Track every account decision and require second-person verification." /> });