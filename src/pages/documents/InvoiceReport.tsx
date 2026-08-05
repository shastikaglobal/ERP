import { apiFetch } from "@/lib/api";
import { vpsDb } from "@/lib/vpsDb";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";

import { ProformaInvoice } from "@/components/documents/ProformaInvoice";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvoiceReport() {
  const { session } = useAuth();

  const { id } = useParams();
  const nav = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "export_shipments",
            action: "select",
            select: "*, export_orders(*)",
            filters: [{ column: "id", type: "eq", value: id }],
            single: true
          })
        });
        let { data, error } = await res.json();

        if (error || !data) {
          // If not found in shipments, try export_orders directly
          const res2 = await apiFetch("/api/vps-fallback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              table: "export_orders",
              action: "select",
              select: "*, export_shipments(*)",
              filters: [{ column: "id", type: "eq", value: id }],
              single: true
            })
          });
          const { data: orderOnly, error: orderErr } = await res2.json();
            
          if (orderErr || !orderOnly) {
            // Try fetching from Node API

            const res = await apiFetch(`/api/invoices/${id}`, {
              headers: { }
            });
            if (!res.ok) throw new Error('Invoice not found');
            const apiData = await res.json();
            data = {
              export_orders: {
                id: apiData.id,
                order_number: apiData.invoice_number || 'INV-' + apiData.id.slice(0, 4),
                customer_name: apiData.customer,
                currency: apiData.currency,
                total_amount: apiData.amount,
                status: apiData.status,
                created_at: apiData.created_at,
                product: apiData.items?.[0]?.description || 'Custom Order',
                quantity: apiData.items?.[0]?.quantity || 1,
                unit_price: apiData.items?.[0]?.unit_price || apiData.amount,
              }
            };
          } else {
            data = { export_orders: orderOnly };
          }
        }
        setShipment(data);
      } catch (err) {
        console.error("Report load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  if (!shipment) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p>Invoice not found</p>
      <Button onClick={() => nav("/documents/invoices")}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <ProformaInvoice shipment={shipment} onClose={() => nav("/documents/invoices")} />
    </div>
  );
}