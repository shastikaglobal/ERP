import { Loader2, Boxes } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/integrations/supabase/client";

export default function StockDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory_batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_batches")
        .select("id, lot_number, quantity_kg, quantity_remaining_kg, grade, moisture_pct, received_date, expiry_date, status, product:products(name, sku), warehouse:warehouses(name), farmer:farmers(full_name)")
        .order("received_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Inventory Batches"
        description="Lot-tracked stock with FIFO ordering"
        breadcrumbs={[{ label: "Inventory" }, { label: "Batches" }]}
      />
      {isLoading ? (
        <div className="erp-card flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-5 w-5" />}
          title="No inventory batches yet"
          description="Batches are created automatically when purchase orders are received, or you can record one manually after a QC inspection."
        />
      ) : (
        <DataTable
          data={data}
          searchKeys={["lot_number"] as any}
          columns={[
            { key: "lot", header: "Lot #", render: (r: any) => <span className="font-mono text-xs">{r.lot_number}</span> },
            { key: "product", header: "Product", render: (r: any) => <span className="font-medium">{r.product?.name || "—"}</span> },
            { key: "wh", header: "Warehouse", render: (r: any) => <span className="text-sm text-muted-foreground">{r.warehouse?.name || "—"}</span> },
            { key: "qty", header: "Remaining (kg)", render: (r: any) => <span className="tabular-nums">{Number(r.quantity_remaining_kg).toLocaleString()}</span> },
            { key: "grade", header: "Grade", render: (r: any) => r.grade || "—" },
            { key: "moisture", header: "Moisture %", render: (r: any) => <span className="tabular-nums text-sm">{r.moisture_pct ?? "—"}</span> },
            { key: "received", header: "Received", render: (r: any) => <span className="text-xs text-muted-foreground">{r.received_date}</span> },
            { key: "status", header: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          ]}
        />
      )}
    </div>
  );
}
