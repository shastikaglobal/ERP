import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cashFlowData } from "@/data/mock";
import { DollarSign, ArrowDownRight, ArrowUpRight, Wallet, AlertTriangle } from "lucide-react";

export default function FinancialOverview() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Financial Overview" 
        description="Cash position, receivables and currency exposure" 
        breadcrumbs={[{ label: "Dashboards" }, { label: "Financial" }]} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="RECEIVABLES" 
          value="$0" 
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          label="PAYABLES" 
          value="$0" 
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          label="CASH ON HAND" 
          value="$0" 
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          label="OVERDUE" 
          value="$0" 
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} 
        />
      </div>

      <Section title="Cash Flow" description="Inflow vs Outflow trend">
        <div className="h-[400px] w-100 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--chart-2))" 
                fillOpacity={1} 
                fill="url(#colorBalance)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  );
}
