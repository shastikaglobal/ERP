import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Quotation = {
  id: string;
  quotation_number: string;
  total_amount: number;
  currency: string;
  status: string;
  items_count?: number;
  customers: { name: string } | null;
  quotation_items?: { id: string }[];
};

export default function QuotationApprovals() {
  const [pending, setPending] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          id, quotation_number, total_amount, currency, status,
          customers (name),
          quotation_items (id)
        `)
        .in("status", ["Pending", "In Review"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      const formatted = (data as any[]).map(q => ({
        ...q,
        items_count: q.quotation_items ? q.quotation_items.length : 0
      }));
      setPending(formatted);
    } catch (error: any) {
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, newStatus: string) => {
    setActionId(id);
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Quotation ${newStatus.toLowerCase()}`);
      setPending(pending.filter(q => q.id !== id));
    } catch (error: any) {
      toast.error(error.message || "Failed to update quotation");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Approval Workflow" description="Quotations awaiting your sign-off" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "Approvals" }]} />
      <Section title={`${pending.length} pending approvals`}>
        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : pending.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">No pending approvals at the moment.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md bg-warning-muted text-warning flex items-center justify-center text-xs font-semibold">{q.currency}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{q.customers?.name || "Unknown Customer"}</div>
                    <div className="text-xs text-muted-foreground">{q.quotation_number} · {q.items_count} items · {q.currency} {Number(q.total_amount || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={q.status} />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAction(q.id, "Rejected")}
                    disabled={actionId === q.id}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />Reject
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleAction(q.id, "Approved")}
                    disabled={actionId === q.id}
                  >
                    {actionId === q.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                    Approve
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
