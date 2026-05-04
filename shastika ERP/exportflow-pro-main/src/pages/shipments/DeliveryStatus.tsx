import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";

export default function DeliveryStatus() {
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
            dest: s.destination || "—",
            carrier: s.carrier || "—",
            status: s.status,
            eta: s.eta || "—",
            type: s.shipment_containers?.[0]?.type || "—",
            totalWeight: s.shipment_containers?.reduce((sum: number, c: any) => sum + (Number(c.weight) || 0), 0) || 0,
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
      <PageHeader title="Delivery Status" description="End-to-end delivery monitoring" breadcrumbs={[{ label: "Shipments" }, { label: "Delivery" }]} />
      <DataTable
        data={shipments}
        searchKeys={["id", "dest"]}
        columns={[
          { key: "id", header: "Shipment", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "dest", header: "Destination", render: (r) => r.dest },
          { key: "carrier", header: "Carrier", render: (r) => r.carrier },
          { key: "type", header: "Type", render: (r) => <span className="text-xs">{r.type}</span> },
          { key: "totalWeight", header: "Total Wt.", render: (r) => <span className="tabular-nums">{r.totalWeight ? `${r.totalWeight} t` : "—"}</span> },
          { key: "progress", header: "Progress", render: (r) => {
            const pct = r.status === "Delivered" ? 100 : r.status === "In Transit" ? 65 : r.status === "Processing" ? 25 : 5;
            return (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs tabular-nums">{pct}%</span>
              </div>
            );
          } },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "eta", header: "ETA", render: (r) => <span className="text-xs">{r.eta}</span> },
        ]}
      />
    </div>
  );
}
