import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";


type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  country: string;
  interested_product: string;
  stage: string;
};

export default function ConvertLead() {
  const { roleSlugs } = useAuth();
  const isAdmin = roleSlugs.has("admin");
  const nav = useNavigate();

  const [eligible, setEligible] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);

  const fetchEligibleLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("stage", ["negotiation", "qualified"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEligible(data as unknown as Lead[]);
    } catch (error: any) {
      toast.error("Failed to load eligible leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleLeads();
  }, []);

  const handleConvert = async (lead: any) => {
    setConverting(lead.id);
    try {
      // 1. First, create the official Customer record
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: lead.company_name,
          email: lead.email || null,
          phone: lead.phone || null,
          country: lead.country || null,
          company_id: lead.company_id,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (customerError) {
        if (customerError.code === '23505') {
          throw new Error("This customer already exists in your directory.");
        }
        throw customerError;
      }

      // 2. Mark the lead as won
      const { error: leadError } = await supabase
        .from("leads")
        .update({ stage: "won" })
        .eq("id", lead.id);

      if (leadError) throw leadError;
      
      toast.success(`${lead.company_name} is now an official Customer!`);
      // Remove from list
      setEligible(eligible.filter(l => l.id !== lead.id));
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast.error(error.message || "Failed to convert lead");
    } finally {
      setConverting(null);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Convert Lead to Customer" 
        description="Promote qualified leads into your customer database" 
        breadcrumbs={[{ label: "CRM" }, { label: "Convert" }]} 
      />
      <Section title="Eligible Leads">
        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : eligible.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">No leads eligible for conversion right now. (Only 'qualified' or 'negotiation' leads appear here)</div>
        ) : (
          <div className="space-y-2">
            {eligible.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary-muted text-primary flex items-center justify-center text-xs font-semibold">
                    {l.company_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{l.company_name}</div>
                    <div className="text-xs text-muted-foreground">{l.contact_name || "No contact"} · {l.country || "Unknown location"} · {l.interested_product || "No product"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={l.stage} />
                  <Button 
                    size="sm" 
                    onClick={() => handleConvert(l)}
                    disabled={converting === l.id || !isAdmin}
                  >

                    {converting === l.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5 mr-1.5" />}
                    Convert <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
