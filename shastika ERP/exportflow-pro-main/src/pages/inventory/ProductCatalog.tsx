import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { products } from "@/data/mock";

export default function ProductCatalog() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Product Catalog" description="All export-ready products" breadcrumbs={[{ label: "Inventory" }, { label: "Products" }]}
        actions={<Button size="sm" onClick={() => nav("/inventory/products/create")}><Plus className="h-4 w-4 mr-1.5" />New Product</Button>} />
      <DataTable
        data={products}
        searchKeys={["sku", "name", "category"]}
        columns={[
          { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
          { key: "name", header: "Product", render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "category", header: "Category", render: (r) => <span className="text-sm text-muted-foreground">{r.category}</span> },
          { key: "uom", header: "UOM", render: (r) => <span className="text-xs">{r.uom}</span> },
          { key: "stock", header: "Stock", render: (r) => <span className="tabular-nums">{r.stock.toLocaleString()}</span> },
          { key: "price", header: "Price", render: (r) => <span className="font-medium tabular-nums">{r.currency} {r.price}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}
