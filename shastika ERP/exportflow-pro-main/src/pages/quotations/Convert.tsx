import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { quotations } from "@/data/mock";
import { toast } from "sonner";

export default function ConvertQuotation() {
  const nav = useNavigate();
  const ready = quotations.filter((q) => q.status === "Approved");
  return (
    <div>
      <PageHeader title="Convert to Sales Order" description="Approved quotations ready to convert" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "Convert" }]} />
      <Section>
        <div className="space-y-2">
          {ready.map((q) => (
            <div key={q.id} className="flex items-center justify-between p-3 border border-border rounded-md">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-success-muted text-success flex items-center justify-center text-xs font-semibold">✓</div>
                <div>
                  <div className="text-sm font-medium">{q.customer}</div>
                  <div className="text-xs text-muted-foreground">{q.id} · {q.currency} {q.amount.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={q.status} />
                <Button size="sm" onClick={() => { toast.success(`${q.id} converted to sales order`); nav("/orders"); }}>
                  Convert <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
