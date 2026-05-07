import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Invoices() {
  const nav = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // We select * from export_orders to avoid crashing if new columns haven't been added yet
        const { data, error } = await supabase
          .from("export_shipments")
          .select(`
            *,
            export_orders:order_id (*)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setShipments(data || []);
      } catch (err) {
        console.error("Invoice load error:", err);
        toast.error("Failed to load invoices. Please ensure the latest SQL migration has been run.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  return (
    <div>
      <PageHeader title="Invoices" description="Generate and manage commercial invoices" breadcrumbs={[{ label: "Documents" }, { label: "Invoices" }]}
        actions={<Button size="sm" onClick={() => nav("/orders/create")}><Plus className="h-4 w-4 mr-1.5" />New Invoice</Button>} />

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          data={shipments}
          searchKeys={["shipment_number", "customer_name"]}
          columns={[
            { key: "shipment_number", header: "Invoice #", render: (r) => <span className="font-mono text-xs text-primary">{r.shipment_number?.replace('SHP', 'PI')}</span> },
            { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer_name}</span> },
            { key: "order", header: "Order", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.export_orders?.order_number}</span> },
            { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.export_orders?.currency} {r.export_orders?.total_amount?.toLocaleString()}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "actions", header: "", render: (r) => (
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => window.open(`/invoices/${r.id}/preview`, '_blank')}>
                  <FileText className="h-4 w-4 text-primary" />
                </Button>
              </div>
            ) },
          ]}
        />
      )}
    </div>
  );
}
