import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Package } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ExportShipment = {
  id: string;
  shipment_number: string;
  customer_name: string;
  carrier: string;
  origin_port: string;
  destination_port: string;
  eta: string;
  status: string;
};

export default function ShipmentsList() {
  const nav = useNavigate();
  const [shipments, setShipments] = useState<ExportShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const { data, error } = await supabase
          .from("export_shipments")
          .select("*, export_containers(count)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Map data to include container count easily
        const formatted = data?.map(s => ({
          ...s,
          containerCount: s.export_containers?.[0]?.count || 0
        })) || [];
        
        setShipments(formatted as any);
      } catch (err) {
        toast.error("Failed to load shipments");
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  return (
    <div>
      <PageHeader 
        title="Shipment Register" 
        description="All outbound shipments and their status" 
        breadcrumbs={[{ label: "Shipments" }]}
        actions={<Button size="sm" onClick={() => nav("/shipments/create")}><Plus className="h-4 w-4 mr-1.5" />New Shipment</Button>}
      />
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : shipments.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground mb-4">No shipments found.</p>
          <Button variant="outline" onClick={() => nav("/shipments/create")}>Create your first shipment</Button>
        </div>
      ) : (
        <DataTable
          data={shipments}
          searchKeys={["shipment_number", "customer_name", "destination_port"]}
          onRowClick={(r) => nav(`/shipments/${r.id}`)}
          columns={[
            { key: "shipment_number", header: "Shipment", render: (r) => <span className="font-mono text-xs text-primary">{r.shipment_number}</span> },
            { key: "customer_name", header: "Customer", render: (r) => <span className="font-medium">{r.customer_name || "Unknown"}</span> },
            { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin_port} → {r.destination_port}</span> },
            { key: "carrier", header: "Carrier", render: (r) => r.carrier },
            { key: "containers", header: "Containers", render: (r) => <span className="tabular-nums">{(r as any).containerCount}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "eta", header: "ETA", render: (r) => <span className="text-xs text-muted-foreground">{r.eta ? new Date(r.eta).toLocaleDateString() : 'TBD'}</span> },
          ]}
        />
      )}
    </div>
  );
}
