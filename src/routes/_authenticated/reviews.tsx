import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConfirmAction } from "@/components/confirm-button";
import { RecordDialog, type Field } from "@/components/record-dialog";
import { DecisionBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrentUser } from "@/lib/auth";
import { byId, useRemove, useReviewItems, useReviews, useSave, useSystems, type Review } from "@/lib/data";
import { DECISIONS, DECISION_LABEL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reviews")({ head: () => ({ meta: [
  { title: "Quarterly Review — FlooringMart Access Manager" }, { name: "description", content: "Quarterly subscription and access review checklists with accountable decisions." },
  { property: "og:title", content: "Quarterly Review — FlooringMart" }, { property: "og:description", content: "Quarterly subscription and access review checklists." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: ReviewsPage });

function ReviewsPage() {
  const { canWrite, canDelete, user } = useCurrentUser(); const reviews = useReviews(); const items = useReviewItems(); const systems = useSystems();
  const saveReview = useSave("reviews"); const removeReview = useRemove("reviews", ["review_items"]); const saveItem = useSave("review_items"); const removeItem = useRemove("review_items");
  const systemMap = byId(systems.data); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Review | null>(null);
  const fields: Field[] = [{ name: "title", label: "Review title", type: "text", required: true }, { name: "period", label: "Period", type: "text", required: true, placeholder: "Q3 2026" }, { name: "type", label: "Review type", type: "select", required: true, options: [{ value: "subscription", label: "Subscription" }, { value: "access", label: "Access" }] }, { name: "status", label: "Status", type: "select", required: true, options: [{ value: "not_started", label: "Not started" }, { value: "in_progress", label: "In progress" }, { value: "completed", label: "Completed" }] }, { name: "due_date", label: "Due date", type: "date" }, { name: "notes", label: "Notes", type: "textarea" }];
  return <AppShell title="Quarterly Review" description="Subscription and access decisions with owners, dates and completion evidence." actions={canWrite ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 size-4" /> New review</Button> : null}>
    <div className="grid gap-5 xl:grid-cols-2">{(reviews.data ?? []).map((review) => { const reviewItems = (items.data ?? []).filter((i) => i.review_id === review.id); const done = reviewItems.filter((i) => i.completed).length; const pct = reviewItems.length ? Math.round(done / reviewItems.length * 100) : 0; return <Card key={review.id} className="shadow-panel"><CardHeader><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="font-display text-base">{review.title}</CardTitle><CardDescription>{review.period} · {review.type === "subscription" ? "Subscription review" : "Access review"} · due {formatDate(review.due_date)}</CardDescription></div><div className="flex items-center gap-1"><StatusBadge value={review.status} />{canWrite ? <Button size="sm" variant="outline" onClick={() => { setEditing(review); setOpen(true); }}>Edit</Button> : null}{canDelete ? <ConfirmAction trigger={<Button size="icon" variant="ghost"><Trash2 className="size-4 text-destructive" /></Button>} title="Delete review?" description="This removes the review and its checklist items." confirmLabel="Delete" onConfirm={() => removeReview.mutate(review.id)} /> : null}</div></div><Progress value={pct} /><p className="text-xs text-muted-foreground">{done} of {reviewItems.length} items complete</p></CardHeader><CardContent className="space-y-2">
      {reviewItems.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-md border px-3 py-2"><Button size="icon" variant="ghost" disabled={!canWrite} title={item.completed ? "Mark incomplete" : "Mark complete"} onClick={() => saveItem.mutate({ id: item.id, values: { completed: !item.completed, reviewed_on: !item.completed ? new Date().toISOString().slice(0, 10) : null, reviewed_by: !item.completed ? user?.fullName ?? null : null } })}>{item.completed ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4" />}</Button><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.label ?? (item.system_id ? systemMap.get(item.system_id)?.name : "Review item")}</p><p className="text-xs text-muted-foreground">{item.reviewed_by ? `Reviewed by ${item.reviewed_by}` : "Awaiting review"}</p></div>{item.decision ? <DecisionBadge value={item.decision} /> : null}{canDelete ? <Button size="icon" variant="ghost" onClick={() => removeItem.mutate(item.id)}><Trash2 className="size-4 text-destructive" /></Button> : null}</div>)}
      {canWrite ? <Button size="sm" variant="secondary" onClick={() => { const existing = new Set(reviewItems.map((i) => i.system_id)); (systems.data ?? []).filter((s) => !existing.has(s.id)).forEach((s) => saveItem.mutate({ values: { review_id: review.id, system_id: s.id, label: s.name, decision: s.decision } })); }}>Add all unreviewed systems</Button> : null}
    </CardContent></Card>; })}</div>
    <RecordDialog open={open} onOpenChange={setOpen} title={editing ? "Edit quarterly review" : "New quarterly review"} fields={fields} initial={editing ?? { type: "subscription", status: "not_started" }} saving={saveReview.isPending} onSubmit={(values) => saveReview.mutate({ id: editing?.id, values }, { onSuccess: () => setOpen(false) })} />
  </AppShell>;
}