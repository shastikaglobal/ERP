import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { suppliers } from "@/data/mock";

export default function SuppliersList() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Suppliers" description="All vendor relationships" breadcrumbs={[{ label: "Procurement" }, { label: "Suppliers" }]} />
      <DataTable
        data={suppliers}
        searchKeys={["name", "category", "country"]}
        onRowClick={(r) => nav(`/procurement/suppliers/${r.id}`)}
        columns={[
          { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "name", header: "Supplier", render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "country", header: "Country", render: (r) => <span className="text-sm text-muted-foreground">{r.country}</span> },
          { key: "cat", header: "Category", render: (r) => r.category },
          { key: "rating", header: "Rating", render: (r) => <span className="inline-flex items-center gap-1 text-sm"><Star className="h-3 w-3 fill-warning text-warning" />{r.rating}</span> },
          { key: "po", header: "Open POs", render: (r) => <span className="tabular-nums">{r.openPOs}</span> },
          { key: "spend", header: "Total Spend", render: (r) => <span className="tabular-nums font-medium">${r.totalSpend.toLocaleString()}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
