import { ArrowDown, ArrowUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";

const movements = [
  { id: "M-1", date: "2025-04-18", sku: "TEX-COT-001", direction: "in", qty: 500, ref: "PO-2025-0078", warehouse: "Mumbai DC" },
  { id: "M-2", date: "2025-04-17", sku: "ELC-LED-220", direction: "out", qty: 120, ref: "SO-2025-0088", warehouse: "Chennai DC" },
  { id: "M-3", date: "2025-04-16", sku: "SPC-CRD-050", direction: "out", qty: 40, ref: "SO-2025-0086", warehouse: "Kochi DC" },
  { id: "M-4", date: "2025-04-15", sku: "AUT-BRK-101", direction: "in", qty: 200, ref: "PO-2025-0075", warehouse: "Pune DC" },
  { id: "M-5", date: "2025-04-14", sku: "FOOD-RIC-100", direction: "out", qty: 800, ref: "SO-2025-0085", warehouse: "Mumbai DC" },
];

export default function StockMovements() {
  return (
    <div>
      <PageHeader title="Stock Movements" description="History of all inventory in/out transactions" breadcrumbs={[{ label: "Inventory" }, { label: "Movements" }]} />
      <DataTable
        data={movements}
        searchKeys={["sku", "ref"]}
        columns={[
          { key: "date", header: "Date", render: (r) => <span className="text-xs">{r.date}</span> },
          { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
          { key: "dir", header: "Type", render: (r) => r.direction === "in"
            ? <span className="inline-flex items-center gap-1 text-success text-xs font-medium"><ArrowDown className="h-3 w-3" />Inbound</span>
            : <span className="inline-flex items-center gap-1 text-warning text-xs font-medium"><ArrowUp className="h-3 w-3" />Outbound</span> },
          { key: "qty", header: "Qty", render: (r) => <span className="tabular-nums font-medium">{r.qty}</span> },
          { key: "ref", header: "Reference", render: (r) => <span className="font-mono text-xs">{r.ref}</span> },
          { key: "wh", header: "Warehouse", render: (r) => r.warehouse },
        ]}
      />
    </div>
  );
}
