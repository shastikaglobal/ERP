import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { invoices } from "@/data/mock";

export default function OverduePayments() {
  const overdue = invoices.filter((i) => i.status === "Overdue");
  const total = overdue.reduce((s, i) => s + i.amount, 0);
  return (
    <div>
      <PageHeader title="Overdue Payments" description="Invoices past their due date" breadcrumbs={[{ label: "Payments" }, { label: "Overdue" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Overdue Count" value={String(overdue.length)} />
        <StatCard label="Overdue Amount" value={`$${total.toLocaleString()}`} />
        <StatCard label="Avg Days Late" value="12" />
        <StatCard label="Recovery Rate" value="87%" />
      </div>
      <Section title="Overdue Invoices">
        <div className="space-y-2">
          {overdue.map((i) => (
            <div key={i.id} className="flex items-center gap-3 p-3 border border-border rounded-md">
              <div className="h-9 w-9 rounded-md bg-destructive/10 text-destructive flex items-center justify-center"><AlertCircle className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{i.customer}</div>
                <div className="text-xs text-muted-foreground">{i.id} · Due {i.dueAt} · {i.currency} {i.amount.toLocaleString()}</div>
              </div>
              <Button size="sm" variant="outline">Send Reminder</Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
