import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Loader2, Trash2, Download } from "lucide-react";
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
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("export_orders")
          .select("*, export_shipments(*)")
          .neq("is_deleted", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setShipments(data || []);
      } catch (err) {
        console.error("Invoice load error:", err);
        toast.error("Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${number}?`)) return;

    try {
      const { error } = await supabase
        .from("export_orders")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Invoice hidden successfully");
      // Refresh local state
      setShipments(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Invoices" 
        description="Generate and manage commercial invoices" 
        breadcrumbs={[{ label: "Documents" }, { label: "Invoices" }]}
        actions={
          <Button size="sm" onClick={() => nav("/orders/create")}>
            <Plus className="h-4 w-4 mr-1.5" />New Invoice
          </Button>
        } 
      />
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          data={shipments}
          searchKeys={["order_number", "customer_name"]}
          columns={[
            { 
              key: "order_number", 
              header: "Invoice #", 
              render: (r) => <span className="font-mono text-xs text-primary font-bold">{r.order_number?.replace('EXP', 'PI')}</span> 
            },
            { 
              key: "customer_name", 
              header: "Customer", 
              render: (r) => <span className="font-medium">{r.customer_name}</span> 
            },
            { 
              key: "product", 
              header: "Product", 
              render: (r) => <span className="text-muted-foreground">{r.product}</span> 
            },
            { 
              key: "amount", 
              header: "Amount", 
              render: (r) => <span className="font-medium tabular-nums">{r.currency} {r.total_amount?.toLocaleString()}</span> 
            },
            { 
              key: "status", 
              header: "Status", 
              render: (r) => <StatusBadge status={r.status} /> 
            },
            { 
              key: "actions", 
              header: "", 
              render: (r) => {
                const shipmentId = r.export_shipments?.[0]?.id;
                return (
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => window.open(`/invoices/${shipmentId || r.id}/preview`, '_blank')}
                      title="View Invoice"
                    >
                      <FileText className="h-4 w-4 text-[#1A5276]" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => window.open(`/invoices/${shipmentId || r.id}/preview?download=true`, '_blank')}
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4 text-primary" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(r.id, r.order_number?.replace('EXP', 'PI'))}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete Invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              } 
            },
          ]}
        />
      )}
    </div>
  );
}
