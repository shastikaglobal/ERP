import { useNavigate } from "react-router-dom";
import { Plus, Loader2, ClipboardCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useCan } from "@/hooks/useAuth";

export default function InspectionsList() {
  const nav = useNavigate();
  const can = useCan();

  const { data, isLoading } = useQuery({
    queryKey: ["qc_inspections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qc_inspections")
        .select("id, inspected_at, grade, moisture_pct, result, batch:inventory_batches(lot_number, product:products(name))")
        .order("inspected_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Quality Inspections"
        description="QC grading & lab results"
        breadcrumbs={[{ label: "Quality Control" }, { label: "Inspections" }]}
        actions={
          can("qc.inspect") && (
            <Button size="sm" onClick={() => nav("/qc/inspections/create")}>
              <Plus className="h-4 w-4 mr-1.5" /> New inspection
            </Button>
          )
        }
      />
      {isLoading ? (
        <div className="erp-card flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-5 w-5" />}
          title="No inspections yet"
          description="Record QC results for inventory batches awaiting approval."
          action={can("qc.inspect") && <Button size="sm" onClick={() => nav("/qc/inspections/create")}><Plus className="h-4 w-4 mr-1.5" /> New inspection</Button>}
        />
      ) : (
        <DataTable
          data={data}
          searchKeys={["id"] as any}
          columns={[
            { key: "lot", header: "Lot", render: (r: any) => <span className="font-mono text-xs">{r.batch?.lot_number || "—"}</span> },
            { key: "product", header: "Product", render: (r: any) => <span className="font-medium">{r.batch?.product?.name || "—"}</span> },
            { key: "date", header: "Inspected", render: (r: any) => <span className="text-sm">{new Date(r.inspected_at).toLocaleString()}</span> },
            { key: "moisture", header: "Moisture %", render: (r: any) => <span className="tabular-nums">{r.moisture_pct ?? "—"}</span> },
            { key: "grade", header: "Grade", render: (r: any) => <span className="font-medium">{r.grade || "—"}</span> },
            { key: "result", header: "Result", render: (r: any) => <StatusBadge status={r.result} /> },
          ]}
        />
      )}
    </div>
  );
}
