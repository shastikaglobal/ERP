import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, Globe, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CRM_CONVERTED_LEAD_STAGES } from "@/lib/crmStages";

export default function CrmConvert() {
  const { data: conversions, isLoading } = useQuery({
    queryKey: ["crm-conversions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("stage", CRM_CONVERTED_LEAD_STAGES as readonly string[])
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Successful Conversions" 
        description="Monitor leads that have been successfully converted into customers"
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
              <TableHead className="text-right font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading conversions...</p>
                </TableCell>
              </TableRow>
            ) : conversions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="max-w-xs mx-auto space-y-2">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">No successful conversions yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              conversions?.map((conversion) => (
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
                  <TableCell>{conversion.product_type}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={`bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 uppercase text-[10px]`}>
                      {conversion.stage || "Unknown"}
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
