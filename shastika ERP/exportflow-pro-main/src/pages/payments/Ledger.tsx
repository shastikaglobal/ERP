import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { DataTable } from "@/components/shared/DataTable";

const ledger = [
  { id: "USD", name: "US Dollar", rate: 1.000, balance: 1240000 },
  { id: "EUR", name: "Euro", rate: 1.085, balance: 412000 },
  { id: "GBP", name: "British Pound", rate: 1.265, balance: 184000 },
  { id: "JPY", name: "Japanese Yen", rate: 0.0067, balance: 28400000 },
  { id: "INR", name: "Indian Rupee", rate: 0.012, balance: 84200000 },
  { id: "CAD", name: "Canadian Dollar", rate: 0.74, balance: 92000 },
];

export default function Ledger() {
  return (
    <div>
      <PageHeader title="Multi-Currency Ledger" description="Balances and exchange rates across all currencies" breadcrumbs={[{ label: "Payments" }, { label: "Ledger" }]} />
      <DataTable
        data={ledger}
        searchKeys={["id", "name"]}
        columns={[
          { key: "id", header: "Code", render: (r) => <span className="font-mono font-semibold">{r.id}</span> },
          { key: "name", header: "Currency", render: (r) => r.name },
          { key: "rate", header: "Rate (USD)", render: (r) => <span className="tabular-nums">{r.rate.toFixed(4)}</span> },
          { key: "bal", header: "Balance", render: (r) => <span className="tabular-nums font-medium">{r.id} {r.balance.toLocaleString()}</span> },
          { key: "usd", header: "USD Equivalent", render: (r) => <span className="tabular-nums font-semibold">${(r.balance * r.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> },
        ]}
      />
    </div>
  );
}
