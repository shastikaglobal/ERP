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
        .select(
          "id, code, level, box_number, current_location, status, scan_count, last_scanned_at, created_at, batch:inventory_batches(lot_number, grade, received_date, product:products(name), farmer:farmers(full_name), warehouse:warehouses(name))"
        )
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
        title={`QR · ${data.code}`}
        breadcrumbs={[
          { label: "Barcode & Tracking", to: "/barcodes" },
          { label: data.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => nav("/barcodes")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={download}>Download</Button>
            <Button size="sm" className="btn-gold" onClick={print}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Section>
          <div id="print-area" className="flex flex-col items-center gap-3">
            {qrSrc ? (
              <div className="rounded-md p-4 bg-[hsl(var(--primary-light))]">
                <img src={qrSrc} alt={data.code} className="block w-[300px] h-[300px]" />
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            <div className="text-center space-y-0.5">
              <div className="text-sm font-semibold">{data.batch?.product?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                Lot {data.batch?.lot_number} · Grade {data.batch?.grade ?? "—"}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">{data.code}</div>
            </div>
          </div>
        </Section>

        <Section title="Batch details">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Type">
              <span className="capitalize">
                {data.level}
                {data.box_number != null ? ` · Box #${data.box_number}` : ""}
              </span>
            </Field>
            <Field label="Status"><StatusBadge status={data.status} /></Field>
            <Field label="Current location"><StatusBadge status={data.current_location} /></Field>
            <Field label="Scans"><span className="tabular-nums">{data.scan_count}</span></Field>
            <Field label="Product">{data.batch?.product?.name ?? "—"}</Field>
            <Field label="Grade">{data.batch?.grade ?? "—"}</Field>
            <Field label="Supplier">{data.batch?.farmer?.full_name ?? "—"}</Field>
            <Field label="Warehouse">{data.batch?.warehouse?.name ?? "—"}</Field>
            <Field label="Received">{data.batch?.received_date ?? "—"}</Field>
            <Field label="Last scanned">
              {data.last_scanned_at ? new Date(data.last_scanned_at).toLocaleString() : "Never"}
            </Field>
          </dl>
        </Section>
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
