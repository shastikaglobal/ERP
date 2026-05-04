import { Star } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { suppliers } from "@/data/mock";

export default function SupplierAnalytics() {
  const data = suppliers.map((s) => ({ name: s.name.split(" ")[0], rating: s.rating, spend: s.totalSpend / 1000 }));
  return (
    <div>
      <PageHeader title="Supplier Analytics" description="Vendor performance and spend insights" breadcrumbs={[{ label: "Procurement" }, { label: "Analytics" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Spend by Supplier (USD '000)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="spend" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Ratings">
          <div className="space-y-2">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="flex items-center gap-1 text-sm font-semibold"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{s.rating}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
