import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import Barcode from "react-barcode";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
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
          id, code, box_number, net_weight, packing_date, sku_code, product_name, carton_number_total,
          company:companies(name),
          batch:inventory_batches(product:products(name))
        `)
        .eq("id", id!)
        .maybeSingle();
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
          className="bg-white text-black border-2 border-black flex flex-col"
        >
          {/* Header */}
          <div className="bg-black py-3 text-center">
            <p className="text-white text-[10px] font-black tracking-[0.35em] uppercase">
              Export Cargo Identification
            </p>
          </div>

          {/* Fields */}
          {[
            ["Company Name",   data.company?.name || "Shastika Global Impex"],
            ["Product Name",   data.product_name || data.batch?.product?.name || "Cargo Unit"],
            ["SKU / Product Code", data.sku_code || "—"],
            ["Carton Number",  `BOX ${data.box_number}${data.carton_number_total ? ` OF ${data.carton_number_total}` : ""}`],
            ["Net Weight",     data.net_weight ? `${data.net_weight} KG` : "—"],
            [
              "Packing Date",
              data.packing_date
                ? new Date(data.packing_date).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })
                : "—",
            ],
          ].map(([label, value]) => (
            <div key={label} className="flex border-b-2 border-black">
              <div className="w-[38%] border-r-2 border-black px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center">
                {label}
              </div>
              <div className="w-[62%] px-4 py-3 text-base font-black uppercase">
                {value}
              </div>
            </div>
          ))}

          {/* Barcode */}
          <div className="flex flex-col items-center py-6 px-4 gap-2">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-1">
              Barcode Number
            </p>
            <p className="text-xl font-mono font-black tracking-widest mb-1">
              {data.code}
            </p>
            <Barcode
              value={data.code}
              width={2}
              height={80}
              format="CODE128"
              displayValue={false}
              background="transparent"
              lineColor="#000000"
              margin={0}
            />
          </div>

          {/* Footer */}
          <div className="bg-black py-2 text-center">
            <p className="text-white text-[9px] font-bold tracking-widest uppercase">
              Official Cargo Identification • Audit Ready Logistics Data
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
            inset: 0;
            width: 100% !important;
            border: none !important;
          }
          button, nav, header { display: none !important; }
        }
      `}</style>
    </div>
  );
}