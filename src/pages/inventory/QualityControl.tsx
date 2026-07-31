import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Loader2, FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCan, useAuth } from "@/hooks/useAuth";

export default function QualityControlWarehouse() {
  const nav = useNavigate();
  const can = useCan();
  const { session } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["wh_inventory_batches_qc"],
    queryFn: async () => {
      const res = await fetch('/api/inventory/inventory_batches', { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      
      // Transform data for the table
      return (data || []).map((batch: any) => {
        // Get latest QC inspection
        const qc = batch.qc_inspections && batch.qc_inspections.length > 0 
          ? batch.qc_inspections.sort((a: any, b: any) => new Date(b.inspected_at).getTime() - new Date(a.inspected_at).getTime())[0] 
          : null;
          
        return {
          id: batch.id,
          lot: batch.lot_number,
          warehouse: batch.warehouses?.name || "Unassigned",
          product: batch.products?.name || "Unknown Product",
          qty: batch.quantity_remaining_kg,
          grade: qc?.grade || "Pending QC",
          result: qc?.result || "Pending",
          last_inspected: qc?.inspected_at ? new Date(qc.inspected_at).toLocaleDateString() : "Never",
        };
      });
    },
  });

  return (
    <div className="p-6">
      <PageHeader
        title="WH Quality Control"
        description="Monitor and manage quality control for inventory batches across warehouses."
        breadcrumbs={[{ label: "Warehouse" }, { label: "Quality Control" }]}
        actions={
          can("qc.inspect") && (
            <Button size="sm" onClick={() => nav("/qc/inspections/create")} className="btn-gold">
              <Plus className="h-4 w-4 mr-1.5" /> Record QC Result
            </Button>
          )
        }
      />
      
      {isLoading ? (
        <div className="erp-card flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="h-8 w-8" />}
          title="No inventory batches found"
          description="There are currently no inventory batches to perform quality control on."
          action={
            can("qc.inspect") && (
              <Button size="sm" onClick={() => nav("/qc/inspections/create")}>
                <Plus className="h-4 w-4 mr-1.5" /> Record QC Result
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          data={data}
          searchKeys={["lot", "warehouse", "product"]}
          columns={[
            { key: "lot", header: "Lot Number", render: (r: any) => <span className="font-mono text-xs">{r.lot}</span> },
            { key: "product", header: "Product", render: (r: any) => <span className="font-medium text-white">{r.product}</span> },
            { key: "warehouse", header: "Warehouse", render: (r: any) => <span className="text-muted-foreground">{r.warehouse}</span> },
            { key: "qty", header: "Quantity (kg)", render: (r: any) => <span className="tabular-nums font-medium text-white">{Number(r.qty).toLocaleString()} kg</span> },
            { key: "grade", header: "Grade", render: (r: any) => <span className={`font-medium ${r.grade === 'Pending QC' ? 'text-yellow-500/70' : 'text-primary'}`}>{r.grade}</span> },
            { key: "result", header: "Result", render: (r: any) => <StatusBadge status={r.result} /> },
            { key: "last_inspected", header: "Last Inspected", render: (r: any) => <span className="text-xs text-muted-foreground">{r.last_inspected}</span> },
          ]}
        />
      )}
    </div>
  );
}
