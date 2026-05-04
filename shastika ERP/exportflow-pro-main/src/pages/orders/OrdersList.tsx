import { useNavigate } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { orders } from "@/data/mock";

export default function OrdersList() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Sales Orders" description="All confirmed customer orders" breadcrumbs={[{ label: "Sales Orders" }]}
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => nav("/orders/create")}><Plus className="h-4 w-4 mr-1.5" />New Order</Button>
        </>}
      />
      <DataTable
        data={orders}
        searchKeys={["id", "customer"]}
        onRowClick={(r) => nav(`/orders/${r.id}`)}
        columns={[
          { key: "id", header: "Order", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer}</span> },
          { key: "items", header: "Items", render: (r) => <span className="tabular-nums">{r.items}</span> },
          { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {r.amount.toLocaleString()}</span> },
          { key: "incoterm", header: "Incoterm", render: (r) => <span className="text-xs">{r.incoterm}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "delivery", header: "Delivery", render: (r) => <span className="text-xs text-muted-foreground">{r.deliveryDate}</span> },
        ]}
      />
    </div>
  );
}
