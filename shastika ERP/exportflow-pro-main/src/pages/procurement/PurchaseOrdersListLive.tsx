import { useNavigate } from "react-router-dom";
import { Plus, Loader2, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useCan } from "@/hooks/useAuth";

type PO = {
  id: string;
  po_number: string;
  order_date: string;
  expected_delivery: string | null;
  status: string;
  total: number;
  currency: string;
  farmer: { full_name: string } | null;
};

export default function PurchaseOrdersListLive() {
  const nav = useNavigate();
  const can = useCan();

  const { data, isLoading } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id, po_number, order_date, expected_delivery, status, total, currency, farmer:farmers(full_name)")
        .order("order_date", { ascending: false });
      if (error) throw error;
      return data as unknown as PO[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Procurement from farmers"
        breadcrumbs={[{ label: "Procurement" }, { label: "Purchase Orders" }]}
        actions={
          can("procurement.create") && (
            <Button size="sm" onClick={() => nav("/procurement/orders/create")}>
              <Plus className="h-4 w-4 mr-1.5" /> New PO
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
          icon={<ShoppingBag className="h-5 w-5" />}
          title="No purchase orders yet"
          description="Create your first PO to procure produce from a farmer."
          action={
            can("procurement.create") && (
              <Button size="sm" onClick={() => nav("/procurement/orders/create")}>
                <Plus className="h-4 w-4 mr-1.5" /> New PO
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          data={data}
          searchKeys={["po_number"]}
          columns={[
            { key: "po", header: "PO #", render: (r) => <span className="font-mono text-xs">{r.po_number}</span> },
            { key: "farmer", header: "Farmer", render: (r) => <span className="font-medium">{r.farmer?.full_name || "—"}</span> },
            { key: "date", header: "Order date", render: (r) => <span className="text-sm">{r.order_date}</span> },
            { key: "exp", header: "Expected", render: (r) => <span className="text-sm text-muted-foreground">{r.expected_delivery || "—"}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "total", header: "Total", render: (r) => <span className="tabular-nums font-medium">{r.currency} {Number(r.total).toLocaleString()}</span> },
          ]}
        />
      )}
    </div>
  );
}
