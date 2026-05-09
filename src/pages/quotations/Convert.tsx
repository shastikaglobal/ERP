import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
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
  company_id: string;
  customer_id: string | null;
  items_count?: number;
  customers: { name: string; country: string | null } | null;
  quotation_items?: { id: string }[];
};

export default function ConvertQuotation() {
  const nav = useNavigate();
  const [ready, setReady] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);

  const fetchReady = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          id, quotation_number, total_amount, currency, status, company_id, customer_id,
          customers (name, country),
          quotation_items (id)
        `)
        .eq("status", "Approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const formatted = (data as any[]).map(q => ({
        ...q,
        items_count: q.quotation_items ? q.quotation_items.length : 0
      }));
      setReady(formatted);
    } catch (error: any) {
      toast.error("Failed to load approved quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReady();
  }, []);

  const handleConvert = async (q: Quotation) => {
    setConverting(q.id);
    try {
      const year = new Date().getFullYear();
      const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `EXP-${year}-${rand}`;
      
      const { error: insertErr } = await supabase.from("export_orders").insert({
        order_number: orderNumber,
        customer_name: q.customers?.name || "Unknown",
        customer_country: q.customers?.country || "Unknown",
        product: `Converted from ${q.quotation_number}`,
        quantity: q.items_count || 1,
        unit: "items",
        unit_price: q.total_amount / (q.items_count || 1),
        total_amount: q.total_amount,
        currency: q.currency,
        status: "pending",
        payment_status: "unpaid"
      });

      if (insertErr) throw insertErr;

      // Update quotation status so it won't show in the convert list again
      await supabase.from("quotations").update({ status: "Draft" }).eq("id", q.id);

      setReady(ready.filter(item => item.id !== q.id));
      
      toast.success(`${q.quotation_number} converted to export order ${orderNumber}`);
      nav("/orders");
    } catch (error: any) {
      toast.error(error.message || "Failed to convert quotation");
    } finally {
      setConverting(null);
    }
  };

  return (
    <div>
      <PageHeader title="Convert to Export Order" description="Approved quotations ready to convert" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "Convert" }]} />
      <Section>
        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : ready.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">No approved quotations ready for conversion.</div>
        ) : (
          <div className="space-y-2">
            {ready.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-success-muted text-success flex items-center justify-center text-xs font-semibold">✓</div>
                  <div>
                    <div className="text-sm font-medium">{q.customers?.name || "Unknown Customer"}</div>
                    <div className="text-xs text-muted-foreground">{q.quotation_number} · {q.currency} {Number(q.total_amount || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={q.status} />
                  <Button 
                    size="sm" 
                    onClick={() => handleConvert(q)}
                    disabled={converting === q.id}
                  >
                    {converting === q.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
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
