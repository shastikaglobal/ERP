import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";

export default function ShipmentsList() {
  const nav = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shipments")
        .select("*, shipment_containers(id, type, weight)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching shipments:", error);
        setShipments([]);
      } else {
        setShipments(
          (data || []).map((s: any) => ({
            id: s.shipment_number,
            dbId: s.id,
            customer: s.customer_name || "—",
            origin: s.origin || "—",
            destination: s.destination || "—",
            status: s.status,
            carrier: s.carrier || "—",
            type: s.shipment_containers?.[0]?.type || "—",
            totalWeight: s.shipment_containers?.reduce((sum: number, c: any) => sum + (Number(c.weight) || 0), 0) || 0,
            containerCount: s.shipment_containers?.length ?? 0,
            eta: s.eta || "—",
          }))
        );
      }
      setLoading(false);
    };
    fetchShipments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Shipment Register" description="All outbound shipments and their status" breadcrumbs={[{ label: "Shipments" }]}
        actions={<Button size="sm" onClick={() => nav("/shipments/create")}><Plus className="h-4 w-4 mr-1.5" />New Shipment</Button>}
      />
      <DataTable
        data={shipments}
        searchKeys={["id", "customer", "destination"]}
        onRowClick={(r) => nav(`/shipments/${r.dbId}`)}
        columns={[
          { key: "id", header: "Shipment", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer}</span> },
          { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin} → {r.destination}</span> },
          { key: "carrier", header: "Carrier", render: (r) => r.carrier },
          { key: "type", header: "Type", render: (r) => <span className="text-xs">{r.type}</span> },
          { key: "totalWeight", header: "Total Wt.", render: (r) => <span className="tabular-nums">{r.totalWeight ? `${r.totalWeight} t` : "—"}</span> },
          { key: "containers", header: "Containers", render: (r) => <span className="tabular-nums">{r.containerCount}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "eta", header: "ETA", render: (r) => <span className="text-xs text-muted-foreground">{r.eta}</span> },
        ]}
      />
    </div>
  );
}
