import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import {
  CRM_LEAD_STAGES,
  getLeadStageBadgeColor,
} from "@/lib/crmStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  country: string;
  interested_product: string;
  product_type?: string | null;
  stage: string;
};

const STAGES = CRM_LEAD_STAGES.map((stage) => ({
  id: stage,
  label: stage,
  color: getLeadStageBadgeColor(stage),
}));

export default function LeadPipeline() {
  const { roleSlugs } = useAuth();
  const canEditStage = ["admin", "manager", "bde"].some((r) => roleSlugs.has(r));
  const [leads, setLeads] = useState<Lead[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const res = await authFetch('/api/leads');
      if (!res.ok) throw new Error("Failed to fetch pipeline data");
      const data = await res.json();
      const activeLeads = (data || []).filter((l: any) => !l.is_deleted);
      setLeads(activeLeads as Lead[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch pipeline data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    // Add realtime subscription for leads
    const channel = supabase
      .channel('pipeline-leads-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateLeadStage = async (id: string, newStage: string) => {
    // Optimistic update
    const previousLeads = [...leads];
    setLeads(leads.map(lead => lead.id === id ? { ...lead, stage: newStage } : lead));

    try {
      const res = await authFetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || errorBody?.message || `Failed to update stage (${res.status})`;
        throw new Error(message);
      }

      toast.success('Stage updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stage');
      setLeads(previousLeads); // Rollback
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Sales Pipeline</h1>
      
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage?.toLowerCase() === stage.id.toLowerCase());
            
            return (
              <div key={stage.id} className="w-80 flex flex-col bg-muted/30 rounded-lg border border-border/50">
                <div className="p-3 border-b flex items-center justify-between bg-card rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold">{stage.label}</h3>
                  </div>
                  <Badge variant="secondary">{stageLeads.length}</Badge>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                  {stageLeads.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                      No leads
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <Card key={lead.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base font-semibold">{lead.company_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="text-sm text-muted-foreground space-y-1">
                            {lead.contact_name && <div>👤 {lead.contact_name}</div>}
                            {lead.country && <div>🌍 {lead.country}</div>}
                            {(lead.interested_product || lead.product_type) && <div>📦 {lead.interested_product || lead.product_type}</div>}
                          </div>
                          
                          {canEditStage ? (
                            <Select
                              value={lead.stage}
                              onValueChange={(val) => updateLeadStage(lead.id, val)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STAGES.map((s) => (
                                  <SelectItem key={s.id} value={s.id} className="text-xs">
                                    Move to {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary" className="w-full justify-center text-[10px] h-6">
                              {lead.stage}
                            </Badge>
                          )}

                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
