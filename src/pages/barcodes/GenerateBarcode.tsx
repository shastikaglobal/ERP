import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Ship, Package, Globe, Printer, Barcode as BarcodeIcon } from "lucide-react";
import Barcode from "react-barcode";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type LogisticsTarget = {
  id: string;
  name: string;
  ref: string;
  type: 'shipment' | 'batch';
  detail?: string;
  sku?: string;
  // New fields for dynamic linking
  quantity?: number;
  packing_details?: string;
  total_cartons?: number;
  unit_net_weight?: number;
};

export default function GenerateBarcode() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [targetId, setTargetId] = useState<string>("");
  const [boxCount, setBoxCount] = useState<number>(10);
  const [netWeight, setNetWeight] = useState<string>("13.50");
  const [packingDate, setPackingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [skuCode, setSkuCode] = useState<string>("");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch both Shipments and Batches as potential cargo targets
  const { data: targets, isLoading } = useQuery({
    queryKey: ["logistics_targets"],
    queryFn: async () => {
      const [shipRes, batchRes] = await Promise.all([
        supabase.from("export_shipments").select(`
          id, 
          shipment_number, 
          destination_port, 
          total_cartons,
          unit_net_weight,
          export_orders(quantity, net_weight, packing_details, product, total_cartons, unit_net_weight)
        `).order("created_at", { ascending: false }).limit(20),
        supabase.from("inventory_batches").select("id, lot_number, quantity_kg, product:products(name, sku)").order("created_at", { ascending: false }).limit(20)
      ]);

      const list: LogisticsTarget[] = [];
      
      shipRes.data?.forEach(s => {
        const order = Array.isArray(s.export_orders) ? s.export_orders[0] : s.export_orders;
        list.push({
          id: s.id,
          name: `Shipment: ${s.shipment_number}`,
          ref: s.shipment_number,
          type: 'shipment',
          detail: `Dest: ${s.destination_port}`,
          sku: order?.product,
          quantity: order?.quantity,
          packing_details: order?.packing_details,
          // New formal fields (priority to shipment-level)
          total_cartons: s.total_cartons || order?.total_cartons,
          unit_net_weight: s.unit_net_weight || order?.unit_net_weight
        });
      });

      batchRes.data?.forEach(b => list.push({
        id: b.id,
        name: `Cargo Lot: ${b.lot_number}`,
        ref: b.lot_number,
        type: 'batch',
        detail: `Product: ${b.product?.name || '—'}`,
        sku: b.product?.sku,
        quantity: b.quantity_kg
      }));

      return list;
    },
  });

  const selected = useMemo(() => targets?.find(t => t.id === targetId), [targets, targetId]);

  // Logic to auto-fill and calculate based on selected target
  useEffect(() => {
    if (!selected) return;

    if (selected.sku) setSkuCode(selected.sku);

    // Dynamic Carton & Weight Logic
    if (selected.type === 'shipment') {
      // 1. Priority: Formal fields from DB
      if (selected.unit_net_weight) {
        setNetWeight(String(selected.unit_net_weight));
      } else {
        // Fallback: Parsing logic
        const details = selected.packing_details?.toLowerCase() || "";
        const match = details.match(/(\d+(\.\d+)?)\s*kg/);
        const weightPerBox = match ? parseFloat(match[1]) : 13.50;
        setNetWeight(String(weightPerBox));
      }

      if (selected.total_cartons) {
        setBoxCount(selected.total_cartons);
      } else if (selected.quantity) {
        // Fallback: Calculation logic
        const w = parseFloat(netWeight) || 13.50;
        setBoxCount(Math.ceil(selected.quantity / w) || 10);
      }
    } else if (selected.type === 'batch') {
      setNetWeight("10.00");
      if (selected.quantity) {
        setBoxCount(Math.ceil(selected.quantity / 10));
      }
    }
  }, [selected, netWeight]);

  const generate = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select a shipment or cargo lot");

      const { data: prof } = await supabase.from("profiles").select("company_id").maybeSingle();
      let companyId = prof?.company_id;
      
      // Fallback: if profile has no company_id, fetch the first available company
      if (!companyId) {
        const { data: companies } = await supabase.from("companies").select("id").limit(1);
        companyId = companies?.[0]?.id;
      }

      if (!companyId) throw new Error("No company found in the system. Please contact administrator.");

      let currentBatchId = selected.type === 'batch' ? selected.id : null;

      if (selected.type === 'shipment') {
        const shipmentNumber = selected.ref;
        // 1. Check if batch exists for this shipment
        const { data: existingBatch } = await supabase
          .from("shipment_batches")
          .select("id")
          .eq("shipment_id", shipmentNumber)
          .maybeSingle();
        
        if (existingBatch) {
          // 3. If batch found -> proceed as normal
          currentBatchId = existingBatch.id;
        } else {
          // 2. If batch NOT found -> automatically CREATE a new batch record
          console.log("Attempting to auto-create batch for shipment:", shipmentNumber, "UUID was:", selected.id);
          const { data: newBatch, error: batchError } = await supabase
            .from("shipment_batches")
            .insert({
              shipment_id: shipmentNumber,
              shipment_uuid: selected.id,
              status: 'active',
              carton_number_total: boxCount
            })
            .select("id")
            .single();
            
          if (batchError) {
            console.error("Exact batch error:", batchError);
            throw new Error(`Batch creation failed: ${batchError.message}`);
          }
          currentBatchId = newBatch.id;
        }
      }

      const rows: any[] = [];
      const codes: string[] = [];
      const prefix = selected.type === 'shipment' ? 'SHP' : 'LOT';

      for (let i = 0; i < boxCount; i++) {
        const n = i + 1;
        const code = `SGI|${prefix}|${selected.ref}|${String(n).padStart(3, "0")}`;
        codes.push(code);
        
        const row: any = {
          company_id: companyId,
          batch_id: currentBatchId,
          shipment_id: selected.type === 'shipment' ? selected.id : null,
          code: code,
          level: "box",
          box_number: n,
          current_location: 'packing',
        };

        rows.push(row);
      }

      const { error: barcodeError } = await supabase.from("batch_barcodes").insert(rows);
      if (barcodeError) {
        console.error('Full barcode insert error:', JSON.stringify(barcodeError));
        throw new Error(`Barcode insert failed: ${barcodeError.message}`);
      }
      
      setGeneratedCodes(codes);
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} Tracking barcodes generated`);
      qc.invalidateQueries({ queryKey: ["batch_barcodes"] });
      setShowSuccess(true);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to generate"),
  });

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in zoom-in duration-500 print:p-0">
        <div className="p-6 rounded-full bg-primary/10 text-primary scale-150 mb-4 print:hidden">
          <BarcodeIcon className="h-12 w-12" />
        </div>
        <div className="text-center space-y-2 print:hidden">
          <h1 className="text-4xl font-bold text-white">Barcodes Ready!</h1>
          <p className="text-muted-foreground">Generated {generatedCodes.length} tracking barcodes for {selected?.ref}</p>
        </div>
        
        <div className="flex gap-4 print:hidden">
          <Button className="btn-gold px-12 h-14 text-lg" onClick={() => window.print()}>
            <Printer className="mr-2 h-5 w-5" /> Print All Barcodes
          </Button>
          <Button variant="outline" className="h-14 px-8 border-white/10" onClick={() => nav("/barcodes")}>
            Back to Dashboard
          </Button>
        </div>

        {/* Hidden Printable Section */}
        <div className="hidden print:block print:w-full">
          <div className="grid grid-cols-2 gap-4 p-4">
            {generatedCodes.map((code, idx) => (
              <div key={idx} className="border border-black p-4 flex flex-col items-center justify-center bg-white page-break-inside-avoid mb-4 h-[250px]">
                <div className="flex flex-col items-center w-full">
                  <div className="mb-2 font-bold text-black uppercase text-[10px] tracking-widest border-b border-black w-full text-center pb-1">
                    Shastika Global Impex — {selected?.type === 'shipment' ? 'Shipment' : 'Cargo Lot'}
                  </div>
                  <Barcode 
                    value={code} 
                    width={1.2} 
                    height={60} 
                    format="CODE128" 
                    displayValue={false}
                    background="#ffffff"
                    lineColor="#000000"
                  />
                  <div className="mt-4 text-[12px] font-mono font-bold text-black bg-gray-100 px-3 py-1 rounded border border-black/10">
                    {code}
                  </div>
                  <div className="mt-3 grid grid-cols-2 w-full text-[8px] font-bold text-black border-t border-black pt-2 uppercase">
                    <div>Net Wt: {netWeight} Kg</div>
                    <div className="text-right">Date: {packingDate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cargo Labeling & Tracking"
        description="Generate tracking barcodes for shipments and cargo lots to monitor their logistics journey."
        breadcrumbs={[
          { label: "Logistics", to: "/barcodes" },
          { label: "Generate Labels" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Section title="Labeling Options" className="erp-card p-8">
          <FormGrid cols={2}>
            <FormRow label="Select Target (Shipment or Lot)" required>
              {isLoading ? (
                <div className="h-12 flex items-center text-xs text-muted-foreground bg-white/5 rounded-lg px-4">
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-primary" /> Loading targets…
                </div>
              ) : (
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 hover:border-primary/50 transition-all">
                    <SelectValue placeholder="Select shipment or cargo lot..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {targets?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          {t.type === 'shipment' ? <Ship className="h-4 w-4 text-primary" /> : <Package className="h-4 w-4 text-amber-500" />}
                          <span className="font-medium">{t.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 px-1.5 py-0.5 bg-white/5 rounded">({t.detail})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormRow>

            <FormRow label="Labels per Lot/Shipment" required>
              <Input
                type="number"
                min={1}
                max={500}
                value={boxCount}
                onChange={(e) => setBoxCount(Math.max(1, Number(e.target.value || 1)))}
                className="h-12 bg-white/5 border-white/10 text-lg font-bold text-primary"
              />
            </FormRow>
          </FormGrid>

          <div className="mt-8 pt-8 border-t border-white/5">
            <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Export Details</h3>
            <FormGrid cols={3}>
              <FormRow label="Net Weight (Kg)" required>
                <Input
                  type="number"
                  step="0.01"
                  value={netWeight}
                  onChange={(e) => setNetWeight(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                />
              </FormRow>
              <FormRow label="Packing Date" required>
                <Input
                  type="date"
                  value={packingDate}
                  onChange={(e) => setPackingDate(e.target.value)}
                  className="h-12 bg-white/5 border-white/10"
                />
              </FormRow>
              <FormRow label="Product SKU (Auto)">
                <Input
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  placeholder="Auto-filled from batch"
                  className="h-12 bg-white/5 border-white/10 font-mono text-xs"
                />
              </FormRow>
            </FormGrid>
          </div>

          {selected && (
            <div className="mt-8 p-6 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-6 animate-in slide-in-from-top-4 duration-500">
              <div className="p-4 rounded-full bg-primary/10 text-primary shadow-lg shadow-primary/20">
                {selected.type === 'shipment' ? <Globe className="h-8 w-8" /> : <Package className="h-8 w-8" />}
              </div>
              <div>
                <h4 className="text-xl font-bold text-primary">System Ready</h4>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We will generate <strong>{boxCount} unique tracking barcodes</strong> for <strong>{selected.ref}</strong>. 
                  Every barcode will be automatically linked to the <strong>{selected.type} tracking timeline</strong> for real-time logistics monitoring.
                </p>
              </div>
            </div>
          )}

          <div className="mt-12 flex items-center gap-4">
            <Button
              className="btn-gold px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={!targetId || generate.isPending}
              onClick={() => generate.mutate()}
            >
              {generate.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </div>
              ) : (
                <>Generate {boxCount} Tracking Barcodes</>
              )}
            </Button>
            <Button variant="ghost" className="h-14 px-8 text-muted-foreground hover:text-white" onClick={() => nav("/barcodes")}>Cancel</Button>
          </div>
        </Section>

        <Section title="Label Preview" className="erp-card p-8">
          {selected ? (
            <div className="flex flex-col items-center animate-in fade-in duration-1000">
              <BarcodePreview
                text={`SGI|${selected.type === 'shipment' ? 'SHP' : 'LOT'}|${selected.ref}|001`}
              />
              <div className="mt-8 space-y-2 text-center">
                <p className="text-xs font-bold text-white uppercase tracking-widest">Serial Numbering</p>
                <p className="text-[10px] text-muted-foreground px-6 leading-relaxed">
                  Sequence starts at <strong>001</strong> and ends at <strong>{String(boxCount).padStart(3, "0")}</strong>. 
                  Each barcode is globally unique.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-6 border-2 border-dashed border-white/5 rounded-3xl">
              <div className="p-6 rounded-full bg-white/2">
                <BarcodeIcon className="h-12 w-12 opacity-10" />
              </div>
              <p className="max-w-[200px]">Select a shipment or lot to preview the tracking label</p>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function BarcodePreview({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-3xl p-8 bg-white border border-primary/20 shadow-[0_0_50px_rgba(242,204,120,0.1)] relative group flex flex-col items-center">
        <Barcode 
          value={text} 
          width={1.5} 
          height={80} 
          format="CODE128" 
          displayValue={false}
          background="transparent"
          lineColor="#000000"
        />
        <div className="mt-8 pt-6 border-t border-black/5 flex flex-col items-center w-full">
          <span className="text-xs font-black tracking-[0.3em] text-primary uppercase">Logistics Tracking</span>
          <span className="text-sm font-mono mt-2 text-black/70 bg-black/5 px-4 py-1 rounded-full">{text}</span>
        </div>
      </div>
    </div>
  );
}
