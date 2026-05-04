import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { leads } from "@/data/mock";
import { cn } from "@/lib/utils";

const stages = [
  { key: "New", color: "bg-info" },
  { key: "Warm", color: "bg-warning" },
  { key: "Hot", color: "bg-destructive" },
  { key: "Cold", color: "bg-muted-foreground" },
  { key: "Lost", color: "bg-muted-foreground" },
];

export default function LeadPipeline() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Lead Pipeline" description="Drag-and-drop view of your sales funnel" breadcrumbs={[{ label: "CRM" }, { label: "Pipeline" }]} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          const total = stageLeads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={stage.key} className="erp-card p-3 min-h-[400px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", stage.color)} />
                  <span className="text-xs font-semibold uppercase tracking-wide">{stage.key}</span>
                </div>
                <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">${total.toLocaleString()}</div>
              <div className="space-y-2">
                {stageLeads.map((l) => (
                  <button key={l.id} onClick={() => nav(`/crm/leads/${l.id}`)} className="w-full text-left p-3 bg-background border border-border rounded-md hover:border-primary/50 transition-colors">
                    <div className="text-sm font-medium truncate">{l.company}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{l.contact}</div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-muted-foreground">{l.country}</span>
                      <span className="font-semibold tabular-nums">${(l.value/1000).toFixed(0)}k</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
