import { useNavigate } from "react-router-dom";
import { UserCheck, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { leads } from "@/data/mock";
import { toast } from "sonner";

export default function ConvertLead() {
  const nav = useNavigate();
  const eligible = leads.filter((l) => l.status === "Hot" || l.status === "Warm");

  return (
    <div>
      <PageHeader title="Convert Lead to Customer" description="Promote qualified leads into your customer database" breadcrumbs={[{ label: "CRM" }, { label: "Convert" }]} />
      <Section title="Eligible Leads">
        <div className="space-y-2">
          {eligible.map((l) => (
            <div key={l.id} className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-muted text-primary flex items-center justify-center text-xs font-semibold">{l.company.split(" ").map(n => n[0]).slice(0, 2).join("")}</div>
                <div>
                  <div className="text-sm font-medium">{l.company}</div>
                  <div className="text-xs text-muted-foreground">{l.contact} · {l.country} · ${l.value.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={l.status} />
                <Button size="sm" onClick={() => { toast.success(`${l.company} converted to customer`); }}>
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />Convert <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
