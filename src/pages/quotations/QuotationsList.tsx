import { useNavigate } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { quotations } from "@/data/mock";

export default function QuotationsList() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Quotations" description="Manage all customer price quotes" breadcrumbs={[{ label: "Quotations" }]}
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => nav("/quotations/create")}><Plus className="h-4 w-4 mr-1.5" />New Quotation</Button>
        </>}
      />
      <DataTable
        data={quotations}
        searchKeys={["id", "customer"]}
        onRowClick={(r) => nav(`/quotations/${r.id}`)}
        columns={[
          { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer}</span> },
          { key: "items", header: "Items", render: (r) => <span className="tabular-nums">{r.items}</span> },
          { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {r.amount.toLocaleString()}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "valid", header: "Valid Until", render: (r) => <span className="text-xs text-muted-foreground">{r.validUntil}</span> },
          { key: "created", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{r.createdAt}</span> },
        ]}
      />
    </div>
  );
}
