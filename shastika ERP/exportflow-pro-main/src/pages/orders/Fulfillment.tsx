import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { orders } from "@/data/mock";

export default function OrderFulfillment() {
  return (
    <div>
      <PageHeader title="Fulfillment Tracking" description="Picking, packing and shipping progress" breadcrumbs={[{ label: "Sales Orders" }, { label: "Fulfillment" }]} />
      <DataTable
        data={orders.filter((o) => o.status !== "Cancelled")}
        searchKeys={["id", "customer"]}
        columns={[
          { key: "id", header: "Order", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer}</span> },
          { key: "picking", header: "Picking", render: () => <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-success" style={{ width: "100%" }} /></div> },
          { key: "packing", header: "Packing", render: (r) => <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-success" style={{ width: r.status === "Pending" ? "0%" : "100%" }} /></div> },
          { key: "shipping", header: "Shipping", render: (r) => <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-warning" style={{ width: r.status === "Delivered" ? "100%" : r.status === "Shipped" ? "60%" : "20%" }} /></div> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
