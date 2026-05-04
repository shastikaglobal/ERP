import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { invoices } from "@/data/mock";

export default function Invoices() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Invoices" description="Generate and manage commercial invoices" breadcrumbs={[{ label: "Documents" }, { label: "Invoices" }]}
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Invoice</Button>} />
      <DataTable
        data={invoices}
        searchKeys={["id", "customer"]}
        columns={[
          { key: "id", header: "Invoice", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer}</span> },
          { key: "order", header: "Order", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.orderId}</span> },
          { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {r.amount.toLocaleString()}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "due", header: "Due", render: (r) => <span className="text-xs">{r.dueAt}</span> },
        ]}
      />
    </div>
  );
}
