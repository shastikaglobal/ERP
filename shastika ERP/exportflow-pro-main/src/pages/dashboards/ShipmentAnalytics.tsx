import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { shipments } from "@/data/mock";
import { shipmentStore } from "@/store/shipmentStore";

export default function ShipmentAnalytics() {
  const [containers, setContainers] = useState(() => shipmentStore.getContainers());

  useEffect(() => {
    return shipmentStore.subscribe(() => {
      setContainers(shipmentStore.getContainers());
    });
  }, []);

  const stats = useMemo(() => {
    const counts = {
      transmit: containers.filter(c => c.status === "In Transit").length,
      processing: containers.filter(c => c.status === "Processing").length,
      delivery: containers.filter(c => c.status === "Delivered").length,
      pending: containers.filter(c => c.status === "Pending").length,
      outOfStock: containers.filter(c => c.status === "Out of Stock").length,
    };
    return counts;
  }, [containers]);

  return (
    <div>
      <PageHeader 
        title="Shipment Analytics" 
        description="Delivery performance, container utilization and delays" 
        breadcrumbs={[{ label: "Dashboards" }, { label: "Shipments" }]} 
      />
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="On-Time Delivery" value={stats.delivery.toString()} hint="containers delivered" />
        <StatCard label="Avg Transit Days" value={stats.processing.toString()} hint="containers processing" />
        <StatCard label="Active Containers" value={stats.transmit.toString()} hint="containers in transit" />
        <StatCard label="Delayed" value={stats.pending.toString()} hint="containers pending" />
        <StatCard label="Out of Stock" value={stats.outOfStock.toString()} hint="containers out of stock" />
      </div>

      <Section title="Active Shipments">
        <DataTable
          data={shipments}
          searchKeys={["id", "customer", "destination"]}
          columns={[
            { key: "id", header: "Shipment", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "customer", header: "Customer", render: (r) => r.customer },
            { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin} → {r.destination}</span> },
            { key: "carrier", header: "Carrier", render: (r) => r.carrier },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "eta", header: "ETA", render: (r) => <span className="text-xs">{r.eta}</span> },
          ]}
        />
      </Section>
    </div>
  );
}
