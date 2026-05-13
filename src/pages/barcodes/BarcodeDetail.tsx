import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";

export default function BarcodeDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["barcode", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batch_barcodes")
        .select(`
          id, code, level, box_number, current_location, status, scan_count, last_scanned_at, created_at,
          batch:inventory_batches(lot_number, grade, received_date, product:products(name), farmer:farmers(full_name), warehouse:warehouses(name)),
          shipment:export_shipments(shipment_number, destination_port, customer_name, carrier, eta)
        `)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [qrSrc, setQrSrc] = useState("");
  useEffect(() => {
    if (!data?.code) return;
    QRCode.toDataURL(data.code, {
      margin: 1,
      width: 360,
      color: { dark: "#141414", light: "#f2cc78" },
    }).then(setQrSrc);
  }, [data?.code]);

  if (isLoading || !data) {
    return (
      <div className="erp-card flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const print = () => window.print();
  const download = () => {
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `${data.code}.png`;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title={`Tracking · ${data.code}`}
        breadcrumbs={[
          { label: "Barcode & Tracking", to: "/barcodes" },
          { label: data.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => nav("/barcodes")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={download}>Download QR</Button>
            <Button size="sm" className="btn-gold" onClick={print}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Label
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Section className="erp-card overflow-hidden">
          <div id="print-area" className="flex flex-col items-center gap-6 p-4">
            <div className="text-center space-y-1">
              <div className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Logistics Tracking</div>
              <div className="text-xl font-bold text-white">{data.sku_code || data.batch?.product?.name || "Cargo Unit"}</div>
            </div>

            {qrSrc ? (
              <div className="rounded-3xl p-6 bg-white shadow-xl shadow-primary/10 border border-primary/20">
                <img src={qrSrc} alt={data.code} className="block w-[280px] h-[280px] object-contain" />
              </div>
            ) : (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            )}
            
            <div className="text-center space-y-2">
              <div className="text-xs font-mono font-bold bg-primary/10 text-primary px-4 py-1.5 rounded-full border border-primary/20">
                {data.code}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Carton {data.box_number} of {data.carton_number_total || "—"}</p>
            </div>
          </div>
        </Section>

        <div className="space-y-6">
          <Section title="Cargo Status" className="erp-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Field label="Tracking Status"><StatusBadge status={data.status} /></Field>
              <Field label="Current Location"><StatusBadge status={data.current_location} /></Field>
              <Field label="Scans Count"><span className="text-xl font-bold tabular-nums text-white">{data.scan_count}</span></Field>
              <Field label="Net Weight"><span className="text-xl font-bold text-emerald-500">{data.net_weight ? `${data.net_weight} Kg` : "—"}</span></Field>
            </div>
          </Section>

          <Section title="Logistics & Destination" className="erp-card">
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 text-sm">
              {data.shipment ? (
                <>
                  <Field label="Shipment No."><span className="font-bold text-primary">{data.shipment.shipment_number}</span></Field>
                  <Field label="Destination Port"><span className="font-bold text-white">{data.shipment.destination_port || "—"}</span></Field>
                  <Field label="Customer"><span className="font-bold">{data.shipment.customer_name || "—"}</span></Field>
                  <Field label="Carrier"><span className="font-medium text-blue-400">{data.shipment.carrier || "—"}</span></Field>
                  <Field label="Expected Arrival (ETA)"><span className="font-bold">{data.shipment.eta ? new Date(data.shipment.eta).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "TBD"}</span></Field>
                </>
              ) : (
                <>
                  <Field label="Inventory Lot"><span className="font-bold text-amber-500">{data.batch?.lot_number}</span></Field>
                  <Field label="Product Name"><span className="font-bold">{data.batch?.product?.name || "—"}</span></Field>
                  <Field label="Warehouse"><span className="font-medium">{data.batch?.warehouse?.name || "—"}</span></Field>
                  <Field label="Supplier/Farmer">{data.batch?.farmer?.full_name || "—"}</Field>
                </>
              )}
              <Field label="Packing Date">{data.packing_date ? new Date(data.packing_date).toLocaleDateString('en-GB') : "—"}</Field>
              <Field label="Last Scanned Activity">
                <span className="text-muted-foreground">
                  {data.last_scanned_at ? new Date(data.last_scanned_at).toLocaleString() : "No scans yet"}
                </span>
              </Field>
            </dl>
          </Section>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute; inset: 0; padding: 24px; background: white; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
