import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { salesByMonth } from "@/data/mock";

export default function SalesAnalytics() {
  return (
    <div>
      <PageHeader title="Sales Analytics" description="Pipeline, conversion and revenue trends" breadcrumbs={[{ label: "Dashboards" }, { label: "Sales" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pipeline Value" value="$1.84M" delta={{ value: "+12%", positive: true }} hint="this quarter" />
        <StatCard label="Conversion Rate" value="34.2%" delta={{ value: "+2.1%", positive: true }} hint="leads → orders" />
        <StatCard label="Avg Deal Size" value="$28.4K" delta={{ value: "+$3.2K", positive: true }} hint="this month" />
        <StatCard label="Win Rate" value="62%" delta={{ value: "-3%", positive: false }} hint="last 30 days" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Orders per Month">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Revenue Growth">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    </div>
  );
}
