import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { DollarSign, Package, Ship, TrendingUp, Users, AlertCircle, Bell } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { WorkflowHelper } from "@/components/dashboard/WorkflowHelper";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function ExecutiveDashboard() {
  const { profile } = useAuth();

  // --- Query 1: Export Orders (last 6 months) ---
  const { data: orders = [] } = useQuery({
    queryKey: ['exec_orders', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('export_orders')
        .select('id, total_amount, currency, customer_country, created_at, status, payment_status')
        .eq('company_id', profile.company_id)
        .gte('created_at', subMonths(new Date(), 6).toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id
  });

  // --- Query 2: Export Shipments ---
  const { data: shipments = [] } = useQuery({
    queryKey: ['exec_shipments', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('export_shipments')
        .select('id, status')
        .eq('company_id', profile.company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id
  });

  // --- Query 3: Notifications ---
  const { data: notifications = [] } = useQuery({
    queryKey: ['exec_notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('app_notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id
  });

  // --- Build Revenue by Month chart ---
  const chartSales = (() => {
    const months: Record<string, { month: string; orders: number; revenue: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'MMM yyyy');
      months[key] = { month: key, orders: 0, revenue: 0 };
    }
    orders.forEach(o => {
      const key = format(new Date(o.created_at), 'MMM yyyy');
      if (months[key]) {
        months[key].orders += 1;
        // Normalize to USD roughly (just use raw total for now)
        months[key].revenue += Number(o.total_amount || 0);
      }
    });
    return Object.values(months);
  })();

  // --- Build Revenue by Country chart ---
  const chartCountries = (() => {
    const countries: Record<string, { country: string; revenue: number }> = {};
    orders.forEach(o => {
      const c = o.customer_country?.trim() || 'Unknown';
      if (!countries[c]) countries[c] = { country: c, revenue: 0 };
      countries[c].revenue += Number(o.total_amount || 0);
    });
    return Object.values(countries)
      .filter(c => c.country !== 'Unknown' || c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8); // top 8 countries
  })();

  // --- Build Shipment Status pie ---
  const SHIP_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];
  const chartShipments = (() => {
    const statusMap: Record<string, number> = {};
    shipments.forEach(s => {
      const st = s.status || 'Unknown';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value], i) => ({
      name,
      value,
      color: SHIP_COLORS[i % SHIP_COLORS.length]
    }));
  })();

  // --- Top-level stats ---
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalOrders = orders.length;
  const inTransit = shipments.filter(s => s.status === 'In Transit').length;
  const unpaidAmount = orders
    .filter(o => o.payment_status === 'unpaid')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const handleGenerateReport = () => {
    const rows = [
      ["Executive Summary Report", new Date().toLocaleDateString()],
      ["", ""],
      ["Metric", "Value"],
      ["Total Revenue (last 6 months)", totalRevenue.toLocaleString()],
      ["Total Orders", totalOrders.toString()],
      ["In Transit Shipments", inTransit.toString()],
      ["Outstanding (Unpaid)", unpaidAmount.toLocaleString()],
      ["", ""],
      ["Monthly Revenue Data", ""],
      ["Month", "Orders", "Revenue"],
      ...chartSales.map(s => [s.month, s.orders, s.revenue]),
      ["", ""],
      ["Revenue by Country", ""],
      ["Country", "Revenue"],
      ...chartCountries.map(c => [c.country, c.revenue])
    ];
    const csv = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `executive_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Executive report downloaded successfully");
  };

  const isLive = orders.length > 0 || shipments.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        description="Real-time view of your export business performance"
        breadcrumbs={[{ label: "Dashboards" }, { label: "Executive" }]}
      />

      {/* Welcome Hero */}
      <div className="glass-panel p-6 lg:p-8 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-glow/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back, <span className="text-gradient-gold">Executive</span></h2>
            <p className="text-muted-foreground mt-1">Here is what's happening with your export operations today.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateReport}
              className="btn-gold px-4 py-2 rounded-lg shadow-gold text-sm transition-transform hover:-translate-y-0.5"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <WorkflowHelper profile={profile} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
        <StatCard label="Total Revenue" value={isLive ? `$${(totalRevenue / 1000).toFixed(1)}K` : "$0"} delta={{ value: "Live", positive: true }} hint="last 6 months" icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Total Orders" value={totalOrders.toString()} delta={{ value: "Live", positive: true }} hint="last 6 months" icon={<Package className="h-4 w-4" />} />
        <StatCard label="In Transit" value={inTransit.toString()} delta={{ value: "Live", positive: inTransit > 0 }} hint="shipments" icon={<Ship className="h-4 w-4" />} />
        <StatCard label="Outstanding" value={`$${(unpaidAmount / 1000).toFixed(1)}K`} delta={{ value: "Unpaid", positive: false }} hint="receivables" icon={<AlertCircle className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <Section title="Revenue Trend" description="Last 6 months" className="lg:col-span-2">
          <div className="h-64 flex items-center justify-center">
            {chartSales.every(s => s.revenue === 0) ? (
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                <p className="text-xs text-muted-foreground italic">No revenue data — create your first export order</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSales}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: "rgba(20,20,20,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>

        <Section title="Shipment Status" description="Current breakdown">
          <div className="h-64 flex items-center justify-center">
            {chartShipments.length === 0 ? (
              <div className="text-center">
                <Ship className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                <p className="text-xs text-muted-foreground italic">No shipment data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartShipments} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {chartShipments.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(20,20,20,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
        <Section title="Revenue by Country" className="lg:col-span-2">
          <div className="h-64 flex items-center justify-center">
            {chartCountries.length === 0 ? (
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                <p className="text-xs text-muted-foreground italic">No country-wise data — fill in Customer Country on your orders</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartCountries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="country" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: "rgba(20,20,20,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>

        <Section title="Recent Alerts">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground italic">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-10" />
                No recent alerts
              </div>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs">{n.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
