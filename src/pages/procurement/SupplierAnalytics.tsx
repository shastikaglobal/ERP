import { Star, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SupplierAnalytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["supplier_analytics"],
    queryFn: async () => {
      // Fetch farmers and their ratings
      const { data: farmers, error: fErr } = await supabase
        .from("farmers")
        .select("id, full_name, rating");
      if (fErr) throw fErr;

      // Fetch all completed purchase orders for total spend
      const { data: pos, error: pErr } = await supabase
        .from("purchase_orders")
        .select("farmer_id, total")
        .eq("status", "received");
      if (pErr) throw pErr;

      // Aggregate spend by farmer
      const spendMap: Record<string, number> = {};
      pos?.forEach(po => {
        spendMap[po.farmer_id] = (spendMap[po.farmer_id] || 0) + Number(po.total);
      });

      // Format data for chart and ratings list
      const aggregatedData = (farmers || []).map(f => {
        const totalSpend = spendMap[f.id] || 0;
        return {
          id: f.id,
          name: f.full_name,
          shortName: f.full_name.split(" ")[0], // First word for chart XAxis
          rating: (f as any).rating || 0.0,
          spend: totalSpend / 1000, // Spend in USD '000
          rawSpend: totalSpend
        };
      });

      // Filter out farmers with 0 spend and 0 rating if we want, but let's sort them
      aggregatedData.sort((a, b) => b.rawSpend - a.rawSpend);
      
      return aggregatedData;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Supplier Analytics" description="Vendor performance and spend insights" breadcrumbs={[{ label: "Procurement" }, { label: "Analytics" }]} />
        <div className="erp-card flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Supplier Analytics" description="Vendor performance and spend insights" breadcrumbs={[{ label: "Procurement" }, { label: "Analytics" }]} />
        <div className="erp-card flex flex-col items-center justify-center py-20 text-destructive bg-destructive/5 border-destructive/20">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>Failed to load analytics data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <PageHeader title="Supplier Analytics" description="Vendor performance and spend insights" breadcrumbs={[{ label: "Procurement" }, { label: "Analytics" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Spend by Supplier (USD '000)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.filter(d => d.spend > 0).slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="shortName" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip cursor={{fill: 'hsl(var(--muted)/0.5)'}} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="spend" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Ratings">
          <div className="space-y-2">
            {data.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/50 transition-colors">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {Number(s.rating).toFixed(1)}
                </div>
              </div>
            ))}
            {data.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No supplier data available.
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
