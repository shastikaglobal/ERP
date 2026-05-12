import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, CameraOff, Loader2, ScanLine, ShieldCheck, X,
  Ship, Container as ContainerIcon, Link2, Link2Off, Globe,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

/* ─── Types ─────────────────────────────────────────────────── */
type ScanResult = {
  barcode_id: string;
  code: string;
  level: string;
  box_number: number | null;
  current_location: string;
  status: string;
  scan_count: number;
  batch_id: string;
  lot_number: string;
  product_name: string;
  sku_code: string | null;
  net_weight: number | null;
  packing_date: string | null;
  carton_total: number | null;
  grade: string | null;
  warehouse_name: string | null;
  farmer_name: string | null;
  received_date: string;
  shipment_number: string | null;
  destination_port: string | null;
  container_number: string | null;
  company_name: string | null;
};

type ActiveShipment = { id: string; shipment_number: string; destination_port: string; status: string };
type ShipmentContainer = { id: string; container_number: string; container_type: string };

/* ─── Constants ──────────────────────────────────────────────── */
const LOCATIONS = [
  { value: "storage",    label: "Storage" },
  { value: "picking",    label: "Picking" },
  { value: "packing",    label: "Packing" },
  { value: "dispatch",   label: "Dispatch" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered",  label: "Delivered" },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function ScanBarcode() {
  const nav = useNavigate();

  // scanner state
  const [code, setCode]           = useState("");
  const [updateLoc, setUpdateLoc] = useState<string>("none");
  const [result, setResult]       = useState<ScanResult | null>(null);
  const [scanning, setScanning]   = useState(false);
  const [busy, setBusy]           = useState(false);
  const scannerRef                = useRef<Html5Qrcode | null>(null);

  // shipment linking state
  const [shipmentId, setShipmentId]   = useState<string>("none");
  const [containerId, setContainerId] = useState<string>("none");

  /* ── Active shipments (not yet delivered) ── */
  const { data: activeShipments = [], isLoading: shipsLoading } = useQuery<ActiveShipment[]>({
    queryKey: ["active_shipments_scan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("export_shipments")
        .select("id, shipment_number, destination_port, status")
        .neq("status", "Delivered")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ActiveShipment[];
    },
  });

  /* ── Containers for selected shipment ── */
  const { data: shipContainers = [] } = useQuery<ShipmentContainer[]>({
    queryKey: ["scan_containers", shipmentId],
    enabled: shipmentId !== "none",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("export_containers")
        .select("id, container_number, container_type")
        .eq("shipment_id", shipmentId);
      if (error) throw error;
      return (data ?? []) as ShipmentContainer[];
    },
  });

  // Reset container when shipment changes
  useEffect(() => { setContainerId("none"); }, [shipmentId]);

  /* ── Submit scan ── */
  const submit = async (raw: string) => {
    if (!raw) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("scan_barcode", {
        _code:         raw,
        _new_location: updateLoc === "none" || !updateLoc ? null : (updateLoc as any),
        _shipment_id:  shipmentId  === "none" ? null : shipmentId,
        _container_id: containerId === "none" ? null : containerId,
      });
      if (error) throw error;
      const row = (data as any[])?.[0] as ScanResult | undefined;
      if (!row) throw new Error("Barcode not found");
      setResult(row);
      toast.success("Scanned ✓", {
        description: shipmentId !== "none"
          ? `Linked to ${activeShipments.find(s => s.id === shipmentId)?.shipment_number}`
          : row.code,
      });
    } catch (e: any) {
      toast.error("Scan failed", { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  /* ── Camera ── */
  const startCamera = async () => {
    setScanning(true);
    try {
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const inst = new Html5Qrcode("qr-reader");
      scannerRef.current = inst;
      await inst.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => { await stopCamera(); setCode(decoded); submit(decoded); },
        () => { /* ignore partial decode */ }
      );
    } catch (e: any) {
      toast.error("Camera unavailable", { description: e?.message ?? "Permission denied" });
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch { /* noop */ }
    setScanning(false);
  };

  useEffect(() => () => { stopCamera(); }, []);

  const isLinked = shipmentId !== "none";

  return (
    <div>
      <PageHeader
        title="Scan QR"
        description="Scan a barcode and optionally link it to a shipment & container."
        breadcrumbs={[{ label: "Barcode & Tracking", to: "/barcodes" }, { label: "Scan" }]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* ── Left: scanner + options ── */}
        <div className="space-y-4">
          <Section title="Scanner">
            <div className="space-y-4">
              {/* Camera button */}
              {!scanning ? (
                <Button size="lg" className="btn-gold w-full h-16 text-base" onClick={startCamera}>
                  <Camera className="h-6 w-6 mr-2" /> Start camera scan
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="w-full h-16 text-base" onClick={stopCamera}>
                  <CameraOff className="h-6 w-6 mr-2" /> Stop camera
                </Button>
              )}

              {/* Camera viewfinder */}
              <div
                id="qr-reader"
                className="w-full rounded-md overflow-hidden bg-black [&_video]:w-full [&_video]:h-auto"
                style={{ minHeight: scanning ? 240 : 0 }}
              />

              {/* Manual input */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">Or enter code manually</div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="SGI|B|LOT-001|A|…"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-xs"
                    onKeyDown={(e) => e.key === "Enter" && submit(code.trim())}
                  />
                  <Button
                    onClick={() => submit(code.trim())}
                    disabled={busy || !code.trim()}
                    className="btn-gold"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Location update */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium">Update location on scan</div>
                <Select value={updateLoc} onValueChange={setUpdateLoc}>
                  <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keep current</SelectItem>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* ── Shipment linking panel ── */}
          <Section title={
            <span className="flex items-center gap-2">
              {isLinked
                ? <Link2 className="h-4 w-4 text-primary" />
                : <Link2Off className="h-4 w-4 text-muted-foreground" />}
              Link to Shipment
              {isLinked && (
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-[10px]">
                  Active
                </Badge>
              )}
            </span>
          }>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                When set, each scan will auto-link this barcode to the chosen shipment and log a tracking event.
              </p>

              {/* Shipment select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1.5">
                  <Ship className="h-3.5 w-3.5" /> Shipment (optional)
                </label>
                <Select value={shipmentId} onValueChange={setShipmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder={shipsLoading ? "Loading…" : "None — scan without linking"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — scan without linking</SelectItem>
                    {activeShipments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.shipment_number} · {s.destination_port}
                        <span className="ml-2 text-muted-foreground text-[10px]">({s.status})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Container select — only when shipment chosen */}
              {shipmentId !== "none" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1.5">
                    <ContainerIcon className="h-3.5 w-3.5" /> Container (optional)
                  </label>
                  <Select value={containerId} onValueChange={setContainerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="No specific container" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific container</SelectItem>
                      {shipContainers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.container_number} · {c.container_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── Right: result ── */}
        <Section title="Result">
          {!result ? (
            <div className="h-80 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-3">
              <ScanLine className="h-10 w-10 opacity-40" />
              Scan or enter a code to see batch details
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary-glow font-semibold text-sm">
                <ShieldCheck className="h-4 w-4" /> Verified · scan #{result.scan_count}
              </div>

              {/* Shipment link banner */}
              {result.shipment_number && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in slide-in-from-right-4 duration-500">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <Ship className="h-5 w-5" />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary text-sm">{result.shipment_number}</span>
                      <Badge variant="outline" className="text-[9px] border-primary/20 bg-primary/5">Linked</Badge>
                    </div>
                    <div className="text-muted-foreground mt-1 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>Destination: <strong>{result.destination_port || 'Not Assigned'}</strong></span>
                    </div>
                    {result.container_number && (
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
                        <ContainerIcon className="h-3 w-3" />
                        <span>Container: {result.container_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border border-primary/20 rounded-2xl bg-card overflow-hidden shadow-2xl">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/5">
                    <tr className="bg-primary/5">
                      <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Company Name</td>
                      <td className="px-4 py-3 font-bold text-primary">{result.company_name || "Shastika Global Impex"}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Product Name</td>
                      <td className="px-4 py-3 font-semibold">{result.product_name}</td>
                    </tr>
                    <tr className="bg-primary/5">
                      <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">SKU / Product Code</td>
                      <td className="px-4 py-3 font-mono text-xs">{result.sku_code || "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Carton Number</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {result.box_number} / {result.carton_total || "—"}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="bg-primary/5">
                      <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Net Weight</td>
                      <td className="px-4 py-3 font-bold text-emerald-500">{result.net_weight ? `${result.net_weight} Kg` : "—"}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Packing Date</td>
                      <td className="px-4 py-3 text-muted-foreground">{result.packing_date || "—"}</td>
                    </tr>
                    <tr className="bg-primary/5">
                      <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Barcode Number</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-primary-glow">{result.code}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-muted-foreground uppercase text-[9px] font-bold mb-1">Current Status</div>
                  <StatusBadge status={result.status} />
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-muted-foreground uppercase text-[9px] font-bold mb-1">Last Location</div>
                  <StatusBadge status={result.current_location} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" className="btn-gold" onClick={() => nav(`/barcodes/${result.barcode_id}`)}>
                  Open barcode
                </Button>
                {result.shipment_number && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // navigate to the shipment — need the shipment id from state
                      if (shipmentId !== "none") nav(`/shipments/${shipmentId}`);
                    }}
                  >
                    <Ship className="h-3.5 w-3.5 mr-1.5" /> View Shipment
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setResult(null); setCode(""); }}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              </div>
            </div>
          )}
        </Section>
      </div>
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
