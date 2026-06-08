import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import Card from "@/components/Card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getBatchTrackingData } from "@/lib/report-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BatchTrackingReport() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState({
    batch_id: "",
    status: "",
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["batch-tracking", filters, profile?.company_id],
    queryFn: async () => {
      return getBatchTrackingData({
        ...filters,
        company_id: profile?.company_id,
      });
    },
    enabled: !!profile?.company_id,
  });

  const handleExport = () => {
    if (!report) return;

    const csv = [
      ["Lot Number", "Product", "Status", "Quantity (kg)", "Remaining (kg)", "Received Date", "Moisture %", "Is Export Ready"].join(","),
      ...report.map(item =>
        [
          item.lot_number,
          item.product?.name || "-",
          item.status,
          item.quantity_kg,
          item.quantity_remaining_kg,
          item.received_date,
          item.moisture_pct || "-",
          item.is_export_ready ? "Yes" : "No"
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Report exported successfully!");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Batch Tracking Report"
        description="Monitor individual batch movements, status changes, and quality metrics"
        breadcrumbs={[{ label: "Reports" }, { label: "Batch Tracking" }]}
        actions={
          <Button onClick={handleExport} disabled={isLoading} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search Batch ID or Lot Number"
            value={filters.batch_id}
            onChange={(e) => setFilters({...filters, batch_id: e.target.value})}
          />

          <Input
            placeholder="Filter by Status"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="p-6 overflow-x-auto">
          <h3 className="font-semibold mb-4">Batch Details</h3>
          {report && report.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Lot Number</th>
                  <th className="px-4 py-2 text-left font-semibold">Product</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold">Qty (kg)</th>
                  <th className="px-4 py-2 text-right font-semibold">Remaining</th>
                  <th className="px-4 py-2 text-left font-semibold">Received</th>
                  <th className="px-4 py-2 text-center font-semibold">Moisture %</th>
                  <th className="px-4 py-2 text-center font-semibold">Export Ready</th>
                  <th className="px-4 py-2 text-left font-semibold">Movements</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.map((row: any) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs">{row.lot_number}</td>
                    <td className="px-4 py-2">{row.product?.name || "-"}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-600">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{row.quantity_kg.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{row.quantity_remaining_kg.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">{format(new Date(row.received_date), "MMM dd, yyyy")}</td>
                    <td className="px-4 py-2 text-center">{row.moisture_pct || "-"}%</td>
                    <td className="px-4 py-2 text-center">
                      <span className={row.is_export_ready ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                        {row.is_export_ready ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span className="inline-block bg-muted px-2 py-1 rounded">
                        {row.movements?.length || 0} moves
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No batches found</p>
          )}
        </Card>
      )}
    </div>
  );
}
