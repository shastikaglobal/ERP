import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Package, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type ExportShipment = {
  id: string;
  shipment_number: string;
  customer_name: string;
  carrier: string;
  origin_port: string;
  destination_port: string;
  eta: string;
  status: string;
  containerCount?: number;
};

export default function ShipmentsList() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const [shipments, setShipments] = useState<ExportShipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShipments = async () => {
    try {
      if (!profile?.company_id) return;
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const [shipmentsRes, containersRes] = await Promise.all([
        fetch(`/api/finance/export_shipments?company_id=${profile.company_id}`, { headers }),
        fetch(`/api/finance/export_containers?company_id=${profile.company_id}`, { headers })
      ]);

      if (shipmentsRes.ok && containersRes.ok) {
        const shipmentsData = await shipmentsRes.json();
        const containersData = await containersRes.json();
        
        const activeShipments = shipmentsData.filter((s: any) => s.is_deleted !== true);
        const activeContainers = containersData.filter((c: any) => c.is_deleted !== true);

        const formatted = activeShipments.map((s: any) => {
          const count = activeContainers.filter((c: any) => c.shipment_id === s.id).length;
          return {
            ...s,
            containerCount: count
          };
        });

        const sorted = formatted.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setShipments(sorted as ExportShipment[]);
      } else {
        throw new Error("Failed to fetch shipments or containers data");
      }
    } catch (err) {
      console.error("Fetch shipments error:", err);
      toast.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [profile?.company_id]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this shipment? This will also remove linked tracking data.")) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/finance/export_shipments/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error(await res.text() || "Failed to delete shipment");

      toast.success("Shipment hidden successfully");
      fetchShipments();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete shipment");
    }
  };

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
            { key: "containers", header: "Containers", render: (r) => <span className="tabular-nums">{r.containerCount}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "eta", header: "ETA", render: (r) => <span className="text-xs text-muted-foreground">{r.eta ? new Date(r.eta).toLocaleDateString() : 'TBD'}</span> },
            { 
              key: "actions", 
              header: "", 
              render: (r) => (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDelete(e, r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) 
            },
          ]}
        />

      )}
    </div>
  );
}
