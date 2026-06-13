import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, Globe, Calendar, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { CRM_CONVERTED_LEAD_STAGES } from "@/lib/crmStages";

export default function CrmConvert() {
  const [conversions, setConversions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversions from database
  const fetchConversions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("[CrmConvert] Fetching conversions with stages:", CRM_CONVERTED_LEAD_STAGES);
      
      const res = await authFetch(`/api/leads?stage_in=${encodeURIComponent(CRM_CONVERTED_LEAD_STAGES.join(","))}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch conversions");
      }
      const data = await res.json();
      
      console.log(`[CrmConvert] Successfully fetched ${data?.length || 0} conversions`);
      setConversions(data || []);
      setError(null);
    } catch (err: any) {
      console.error("[CrmConvert] Failed to fetch conversions:", err);
      setError(err.message || "Failed to load conversions");
      toast.error("Failed to load conversions: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling for updates
  useEffect(() => {
    fetchConversions();

    // Poll database every 3 seconds for updates instead of real-time subscription
    const pollInterval = setInterval(() => {
      console.log("[CrmConvert] Polling for conversions...");
      fetchConversions();
    }, 3000);

    return () => {
      console.log("[CrmConvert] Clearing polling interval");
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Successful Conversions" 
        description="Monitor leads that have been successfully converted into customers (real-time sync enabled)"
        breadcrumbs={[{ label: "CRM", to: "/crm/dashboard" }, { label: "Conversions" }]}
      />

      <div className="border rounded-xl bg-card overflow-hidden shadow-sm border-border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Conversion Date</TableHead>
              <TableHead className="font-bold">Company Name</TableHead>
              <TableHead className="font-bold">Country</TableHead>
              <TableHead className="font-bold">Product</TableHead>
              <TableHead className="font-bold">Stage</TableHead>
              <TableHead className="text-right font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading conversions...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="max-w-xs mx-auto space-y-3">
                    <AlertCircle className="h-10 w-10 mx-auto text-destructive opacity-60" />
                    <p className="text-destructive font-medium">{error}</p>
                    <button
                      onClick={() => fetchConversions()}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Try again
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : conversions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="max-w-xs mx-auto space-y-3">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">No successful conversions yet.</p>
                    <p className="text-xs text-muted-foreground">Move leads to "Won" or "Client Successfully Acquired" stage in Leads to see them here.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              conversions.map((conversion) => (
                <TableRow key={conversion.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(conversion.updated_at), "dd MMM yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{conversion.company_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-blue-500/70" />
                      {conversion.country}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{conversion.product_type || "—"}</TableCell>
                  <TableCell>
                    <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 font-mono text-[11px]">
                      {conversion.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={`${conversion.stage === "Won" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"} hover:bg-emerald-500/20 uppercase text-[10px] font-bold`}>
                      {conversion.stage === "Won" ? "Won" : "Acquired"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
