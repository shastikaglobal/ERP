import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { quotations } from "@/data/mock";
import { toast } from "sonner";

export default function QuotationApprovals() {
  const pending = quotations.filter((q) => q.status === "Pending" || q.status === "In Review");
  return (
    <div>
      <PageHeader title="Approval Workflow" description="Quotations awaiting your sign-off" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "Approvals" }]} />
      <Section title={`${pending.length} pending approvals`}>
        <div className="space-y-2">
          {pending.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-md bg-warning-muted text-warning flex items-center justify-center text-xs font-semibold">{q.currency}</div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{q.customer}</div>
                  <div className="text-xs text-muted-foreground">{q.id} · {q.items} items · {q.currency} {q.amount.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={q.status} />
                <Button variant="outline" size="sm" onClick={() => toast.error("Quotation rejected")}><X className="h-3.5 w-3.5 mr-1" />Reject</Button>
                <Button size="sm" onClick={() => toast.success("Quotation approved")}><Check className="h-3.5 w-3.5 mr-1" />Approve</Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
