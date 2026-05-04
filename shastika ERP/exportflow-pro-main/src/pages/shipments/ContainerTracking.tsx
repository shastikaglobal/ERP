import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { shipmentStore } from "@/store/shipmentStore";

// Map internal statuses to user-requested labels
const STATUS_MAP: Record<string, string> = {
  "In Transit": "Transmit",
  "Processing": "Processing",
  "Delivered": "Delivery",
  "Pending": "pending",
  "Out of Stock": "Out of Stocks"
};

const FILTER_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Transmit", value: "In Transit" },
  { label: "Processing", value: "Processing" },
  { label: "Delivery", value: "Delivered" },
  { label: "pending", value: "Pending" },
  { label: "Out of Stocks", value: "Out of Stock" },
];

export default function ContainerTracking() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [containerData, setContainerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContainers = async () => {
    setLoading(true);
    const data = await shipmentStore.getContainers();
    setContainerData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchContainers();
    return shipmentStore.subscribe(() => {
      fetchContainers();
    });
  }, []);

  const handleStatusChange = async (containerId: string, newStatus: string) => {
    try {
      await shipmentStore.updateContainerStatus(containerId, newStatus);
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  const filteredContainers = useMemo(() => {
    if (statusFilter === "all") return containerData;
    return containerData.filter(c => c.status === statusFilter);
  }, [statusFilter, containerData]);

  return (
    <div>
      <PageHeader
        title="Container Tracking"
        description="Live container locations across all shipments"
        breadcrumbs={[{ label: "Shipments" }, { label: "Containers" }]}
      />

      <DataTable
        data={filteredContainers}
        searchKeys={["id", "shipmentId"]}
        toolbar={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        columns={[
          { key: "container_number", header: "Container", render: (r) => <span className="font-mono text-xs">{r.container_number || r.id}</span> },
          { key: "shipment", header: "Shipment", render: (r) => <span className="text-xs text-muted-foreground">{r.shipmentId}</span> },
          { key: "type", header: "Type", render: (r) => r.type || "—" },
          { key: "weight", header: "Weight", render: (r) => <span className="tabular-nums">{!r.weight || isNaN(r.weight) ? "—" : `${r.weight} t`}</span> },
          { key: "loc", header: "Location", render: (r) => r.location || "—" },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <Select value={r.status} onValueChange={(val) => handleStatusChange(r.id, val)}>
                <SelectTrigger className="h-8 border-none bg-transparent hover:bg-muted/50 transition-colors p-0 focus:ring-0">
                  <StatusBadge status={r.status} label={STATUS_MAP[r.status] || r.status} />
                </SelectTrigger>
                <SelectContent align="end">
                  {FILTER_OPTIONS.slice(1).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          },
        ]}
      />
    </div>
  );
}
