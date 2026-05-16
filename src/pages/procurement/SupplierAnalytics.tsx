import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from "sonner";
import { startOfMonth } from "date-fns";

export default function SupplierAnalytics() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({

    totalSuppliers: 0,
    totalPOValueMonth: 0,
  });
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!profile?.company_id) return;

        const { count: supCount, error: supErr } = await supabase
          .from("farmers")
          .select("*", { count: "exact", head: true })
          .eq("company_id", profile.company_id);
        
        if (supErr) throw supErr;

        const { data: pos, error: poErr } = await supabase
          .from("purchase_orders")
          .select("id, status, total, order_date, farmers(full_name)")
          .eq("company_id", profile.company_id);

        if (poErr) throw poErr;

        // Calculate PO value this month
        const thisMonthStart = startOfMonth(new Date());
        const monthValue = pos
          ?.filter(po => new Date(po.order_date) >= thisMonthStart)
          .reduce((sum, po) => sum + (Number(po.total) || 0), 0) || 0;

        setStats({
          totalSuppliers: supCount || 0,
          totalPOValueMonth: monthValue,
        });

        // Calculate top 5 suppliers
        const supplierTotals: Record<string, {name: string, value: number}> = {};
        pos?.forEach(po => {
          // Handle both object and array response for the relation
          const farmerData = Array.isArray(po.farmers) ? po.farmers[0] : po.farmers;
          const supName = (farmerData as any)?.full_name || "Unknown Supplier";
          
          if (!supplierTotals[supName]) supplierTotals[supName] = { name: supName, value: 0 };
          supplierTotals[supName].value += Number(po.total) || 0;
        });



        const sortedSuppliers = Object.values(supplierTotals)
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        setTopSuppliers(sortedSuppliers);

        // Status breakdown
        const statusCounts: Record<string, number> = {};
        pos?.forEach(po => {
          statusCounts[po.status] = (statusCounts[po.status] || 0) + 1;
        });

        const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ 
          name: name.charAt(0).toUpperCase() + name.slice(1), 
          value 
        }));

        setStatusData(statusChartData);

      } catch (err: any) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    if (profile?.company_id) {
      fetchData();
    }
  }, [profile?.company_id]);


  const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#64748b', '#ef4444'];

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Procurement Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registered suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total PO Value (This Month)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {stats.totalPOValueMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Value of orders placed since start of month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top 5 Suppliers by Value</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topSuppliers.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSuppliers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <RechartsTooltip formatter={(value) => `₹ ${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>PO Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend className="capitalize" formatter={(value) => value} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
