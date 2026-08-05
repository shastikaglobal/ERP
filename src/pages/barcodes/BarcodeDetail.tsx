import { apiFetch } from "@/lib/api";
import { vpsDb } from "@/lib/vpsDb";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import Barcode from "react-barcode";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";


export default function BarcodeDetail() {
  const { session } = useAuth();

  const { id } = useParams();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["barcode", id],
    queryFn: async () => {
      const res = await apiFetch("/api/vps-fallback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            table: "batch_barcodes",
            action: "select",
            select: "*, batch:inventory_batches(*, product:products(*), farmer:farmers(*))",
            filters: [{ column: "id", type: "eq", value: id }],
            single: true
          })
        });
        const { data, error } = await res.json();
      if (error) throw error;
      return data as any;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Barcode not found.
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Label · ${data.code}`}
        breadcrumbs={[
          { label: "Barcode & Tracking", to: "/barcodes" },
          { label: data.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => nav("/barcodes")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <Button size="sm" className="btn-gold" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Label
            </Button>
          </div>
        }
      />

      {/* ── Label Card ─────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto mt-6">
        <div
          id="print-label"
          className="bg-white text-black border-2 border-gray-200 flex flex-col items-center justify-center py-20 px-8 rounded-xl"
        >
          {/* Title */}
          <h2 className="text-[#c1a153] text-2xl md:text-3xl font-black tracking-[0.25em] uppercase mb-12 text-center">
            Logistics Tracking
          </h2>

          {/* Barcode */}
          <div className="flex flex-col items-center gap-6">
            <Barcode
              value={data.code}
              width={3}
              height={120}
              format="CODE128"
              displayValue={false}
              background="transparent"
              lineColor="#000000"
              margin={0}
            />
            <p className="text-2xl font-mono font-black tracking-widest text-center">
              {data.code}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-label, #print-label * { visibility: visible !important; }
          #print-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: 100vh !important;
            border: none !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
          }
          button, nav, header, aside { display: none !important; }
          @page { margin: 0; }
        }
      `}</style>
    </div>
  );
}