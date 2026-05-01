import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useState } from "react";
import { shipments as mockShipments } from "@/data/mock";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsAdminOrManager } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ShipmentAnalytics() {
  const queryClient = useQueryClient();
  const isAdminOrManager = useIsAdminOrManager();
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    if (!editingShipment || !newStatus) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ status: newStatus })
        .eq('id', editingShipment.dbId);

      if (error) throw error;

      toast.success(`Shipment ${editingShipment.id} updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['dashboard_shipments_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_shipments'] }); 
      setEditingShipment(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update shipment");
    } finally {
      setIsUpdating(false);
    }
  };

  const { data: realShipments, error: shipmentsError } = useQuery({
    queryKey: ['dashboard_shipments_list'],
    queryFn: async () => {
      // Fetch shipments and join with sales_orders and customers to get the customer name
      const { data, error } = await supabase 
        .from('shipments')
        .select(`
          id,
          tracking_number,
          destination,
          status,
          created_at,
          sales_orders (
            customers (
              name
            )
          )
        `);
      
      if (error) throw error;
      return data;
    },
    retry: false
  });

  const isLive = realShipments !== undefined && !shipmentsError;

  // Map the nested Supabase relational data into the flat structure expected by the DataTable
  const displayShipments = isLive 
    ? (realShipments || []).map((s: any) => ({
        id: s.tracking_number || s.id.substring(0, 8),
        dbId: s.id,
        customer: s.sales_orders?.customers?.name || 'Unknown',
        origin: 'Global HQ', // Mock origin since we don't track it yet
        destination: s.destination,
        carrier: 'Maersk Line', // Mock carrier
        status: s.status,
        eta: new Date(new Date(s.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString() // Mock ETA as 14 days after creation
      }))
    : mockShipments;

  // Live total calculations
  const activeContainers = isLive ? displayShipments.length : 38;
  const delayed = isLive ? displayShipments.filter((s: any) => s.status === 'Delayed').length : 3;

  return (
    <div>
      <PageHeader title="Shipment Analytics" description="Delivery performance, container utilization and delays" breadcrumbs={[{ label: "Dashboards" }, { label: "Shipments" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="On-Time Delivery" value="92.4%" delta={{ value: isLive ? "Live" : "+1.8%", positive: true }} />
        <StatCard label="Avg Transit Days" value="14.2" delta={{ value: isLive ? "Live" : "-0.6", positive: true }} />
        <StatCard label="Active Containers" value={activeContainers.toString()} delta={{ value: isLive ? "Live" : "+5", positive: true }} />
        <StatCard label="Delayed" value={delayed.toString()} delta={{ value: isLive ? "Live" : "-2", positive: true }} />
      </div>
      <Section title="Active Shipments">
        <DataTable
          data={displayShipments}
          searchKeys={["id", "customer", "destination"]}
          columns={[
            { key: "id", header: "Shipment", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "customer", header: "Customer", render: (r) => r.customer },
            { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin} → {r.destination}</span> },
            { key: "carrier", header: "Carrier", render: (r) => r.carrier },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "eta", header: "ETA", render: (r) => <span className="text-xs">{r.eta}</span> },
            { 
              key: "actions", 
              header: "", 
              render: (r) => (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setEditingShipment(r); 
                    setNewStatus(r.status); 
                  }}
                  disabled={!isLive || !isAdminOrManager}
                  title={!isAdminOrManager ? "Only Admins can update status" : ""}
                >
                  Update Status
                </Button>
              ) 
            },
          ]}
        />
      </Section>

      <Dialog open={!!editingShipment} onOpenChange={(open) => !open && setEditingShipment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">New Status for {editingShipment?.id}</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingShipment(null)} disabled={isUpdating}>Cancel</Button>
            <Button className="btn-gold" onClick={handleUpdateStatus} disabled={isUpdating || newStatus === editingShipment?.status}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
