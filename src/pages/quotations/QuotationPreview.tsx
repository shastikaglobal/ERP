import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Download, Edit, Send, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

type QuotationItem = {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: { name: string } | null;
};

type Quotation = {
  id: string;
  quotation_number: string;
  total_amount: number;
  currency: string;
  status: string;
  valid_until: string | null;
  created_at: string;
  customers: { name: string; country: string | null } | null;
  quotation_items: QuotationItem[];
};

export default function QuotationPreview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [q, setQ] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotation() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("quotations")
          .select(`
            *,
            customers (name, country),
            quotation_items (
              id, quantity, unit_price, total_price,
              products (name)
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setQ(data as any);
      } catch (error: any) {
        toast.error("Failed to load quotation details");
      } finally {
        setLoading(false);
      }
    }
    fetchQuotation();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!q) {
    return <div className="p-6 text-center text-muted-foreground">Quotation not found</div>;
  }

  const subtotal = q.quotation_items.reduce((acc, item) => acc + Number(item.total_price), 0);
  const tax = subtotal * 0.18; // Fixed 18% tax for preview

  return (
    <div className="print:bg-white print:p-0">
      <div className="print:hidden">
        <PageHeader title={q.quotation_number} description="Quotation preview" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: q.quotation_number }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Edit feature is currently under construction")}><Edit className="h-4 w-4 mr-1.5" />Edit</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-4 w-4 mr-1.5" />PDF</Button>
          <Button size="sm" onClick={() => { toast.success("Quotation sent to customer"); }}><Send className="h-4 w-4 mr-1.5" />Send</Button>
        </>}
      />
      </div>
      <Section className="bg-white">
        <div className="max-w-3xl mx-auto bg-white text-black p-8 rounded-md print:p-0">
          <div className="flex items-start justify-between pb-6 border-b border-gray-200">
            <div>
              <div className="text-2xl font-bold">QUOTATION</div>
              <div className="text-sm text-gray-500 mt-1">{q.quotation_number}</div>
              <div className="text-xs text-gray-500 mt-1">Date: {format(new Date(q.created_at), "PP")}</div>
            </div>
            <StatusBadge status={q.status} />
          </div>
          <div className="grid grid-cols-2 gap-8 py-6 border-b border-gray-200">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">From</div>
              <div className="font-semibold text-sm">Acme Exports Ltd</div>
              <div className="text-sm text-gray-500 mt-1">123 Marine Drive<br />Mumbai 400001, India<br />GST: 27ABCDE1234F1Z5</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">To</div>
              <div className="font-semibold text-sm">{q.customers?.name || "Unknown Customer"}</div>
              <div className="text-sm text-gray-500 mt-1">{q.customers?.country || ""}</div>
              <div className="text-sm text-gray-500 mt-1">Valid until: {q.valid_until ? format(new Date(q.valid_until), "PP") : "N/A"}</div>
            </div>
          </div>
          <table className="w-full mt-6 text-sm">
            <thead className="border-b border-gray-200">
              <tr><th className="text-left py-2 text-xs uppercase font-medium text-gray-500">Description</th><th className="text-right py-2 text-xs uppercase font-medium text-gray-500">Qty</th><th className="text-right py-2 text-xs uppercase font-medium text-gray-500">Price</th><th className="text-right py-2 text-xs uppercase font-medium text-gray-500">Total</th></tr>
            </thead>
            <tbody>
              {q.quotation_items.map((item, i) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3">{item.products?.name || "Unknown Product"}</td>
                  <td className="text-right py-3 tabular-nums">{item.quantity}</td>
                  <td className="text-right py-3 tabular-nums">{q.currency} {Number(item.unit_price).toLocaleString()}</td>
                  <td className="text-right py-3 tabular-nums">{q.currency} {Number(item.total_price).toLocaleString()}</td>
                </tr>
              ))}
              {q.quotation_items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500 italic">No items included in this quotation</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="tabular-nums">{q.currency} {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax (18%)</span><span className="tabular-nums">{q.currency} {tax.toLocaleString()}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-base"><span>Total</span><span className="tabular-nums">{q.currency} {Number(q.total_amount || 0).toLocaleString()}</span></div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500">Generated by ExportOS · Acme Exports Ltd</div>
            <Button size="sm" className="print:hidden" onClick={() => nav("/quotations/convert")}>Convert to Order <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </div>
        </div>
      </Section>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 1cm; }
          body { background: white !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
          nav, header, aside, .sidebar { display: none !important; }
        }
      `}} />
    </div>
  );
}
