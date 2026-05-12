import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCan } from "@/hooks/useAuth";

export default function QCApprovals() {
  const qc = useQueryClient();
  const can = useCan();
  const [busy, setBusy] = useState<string | null>(null);

  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["qc_inspections", "pending", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("qc_inspections")
        .select(`
          id, 
          inspected_at, 
          grade, 
          moisture_pct, 
          foreign_matter_pct, 
          broken_pct, 
          result, 
          batch:inventory_batches(lot_number, product:products(name))
        `)
        .eq("company_id", profile.company_id)
        .eq("result", "pending")
        .order("inspected_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.company_id
  });

  const handleDecision = async (id: string, decision: "approved" | "rejected") => {
    setBusy(id);
    const { error } = await supabase
      .from("qc_inspections")
      .update({ result: decision })
      .eq("id", id);
      
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    
    toast.success(`Inspection ${decision}`);
    qc.invalidateQueries({ queryKey: ["qc_inspections"] });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="QC Approvals"
        description="Review and approve pending quality inspections from the warehouse"
        breadcrumbs={[{ label: "Quality Control" }, { label: "Approvals" }]}
      />

      {isLoading ? (
        <div className="erp-card flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !data || data.length === 0 ? (
        <div className="erp-card py-20">
          <EmptyState
            icon={<ClipboardCheck className="h-10 w-10 text-muted-foreground opacity-20" />}
            title="No pending approvals"
            description="All quality control inspections have been processed."
          />
        </div>
      ) : (
        <div className="erp-card overflow-hidden">
          <DataTable
            data={data}
            searchKeys={["id", "batch.lot_number"]}
            columns={[
              { key: "lot", header: "Lot Number", render: (r: any) => <span className="font-mono text-xs font-bold text-primary">{r.batch?.lot_number || "—"}</span> },
              { key: "product", header: "Product", render: (r: any) => <span className="font-semibold">{r.batch?.product?.name || "—"}</span> },
              { key: "date", header: "Inspected At", render: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.inspected_at).toLocaleString()}</span> },
              { key: "moisture", header: "Moisture %", render: (r: any) => <span className="tabular-nums font-mono">{r.moisture_pct ?? "—"}%</span> },
              { key: "broken", header: "Broken %", render: (r: any) => <span className="tabular-nums font-mono">{r.broken_pct ?? "—"}%</span> },
              { key: "grade", header: "Grade", render: (r: any) => <StatusBadge status={r.grade} /> },
              { 
                key: "actions", 
                header: "Action", 
                render: (r: any) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 h-8 text-xs"
                      disabled={!!busy || !can("qc.approve")}
                      onClick={() => handleDecision(r.id, "rejected")}
                    >
                      {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                      disabled={!!busy || !can("qc.approve")}
                      onClick={() => handleDecision(r.id, "approved")}
                    >
                      {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                      Approve
                    </Button>
                  </div>
                ) 
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
