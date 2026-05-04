import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CameraOff, Loader2, ScanLine, ShieldCheck, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

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
  grade: string | null;
  warehouse_name: string | null;
  farmer_name: string | null;
  received_date: string;
};

const LOCATIONS = [
  { value: "storage", label: "Storage" },
  { value: "picking", label: "Picking" },
  { value: "packing", label: "Packing" },
  { value: "dispatch", label: "Dispatch" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
];

export default function ScanBarcode() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [updateLoc, setUpdateLoc] = useState<string>("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const submit = async (raw: string) => {
    if (!raw) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("scan_barcode", {
        _code: raw,
        _new_location: (updateLoc as any) || null,
      });
      if (error) throw error;
      const row = (data as any[])?.[0] as ScanResult | undefined;
      if (!row) throw new Error("No result");
      setResult(row);
      toast.success("Scanned", { description: row.code });
    } catch (e: any) {
      toast.error("Scan failed", { description: e.message });
    } finally {
      setBusy(false);
    }
  };

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
        async (decoded) => {
          await stopCamera();
          setCode(decoded);
          submit(decoded);
        },
        () => { /* ignore decode errors */ }
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

  return (
    <div>
      <PageHeader
        title="Scan QR"
        description="Scan a code with your phone's camera or paste it manually."
        breadcrumbs={[
          { label: "Barcode & Tracking", to: "/barcodes" },
          { label: "Scan" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Section title="Scanner">
          <div className="space-y-4">
            {!scanning ? (
              <Button
                size="lg"
                className="btn-gold w-full h-16 text-base"
                onClick={startCamera}
              >
                <Camera className="h-6 w-6 mr-2" /> Start camera scan
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="w-full h-16 text-base"
                onClick={stopCamera}
              >
                <CameraOff className="h-6 w-6 mr-2" /> Stop camera
              </Button>
            )}

            <div
              id="qr-reader"
              className="w-full rounded-md overflow-hidden bg-black [&_video]:w-full [&_video]:h-auto"
              style={{ minHeight: scanning ? 240 : 0 }}
            />

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Or enter code manually</div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="SGI|B|LOT-001|A|…"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-xs"
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

            <div className="space-y-1.5">
              <div className="text-xs font-medium">Update location on scan (optional)</div>
              <Select value={updateLoc} onValueChange={setUpdateLoc}>
                <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep current</SelectItem>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section title="Result">
          {!result ? (
            <div className="h-72 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-3">
              <ScanLine className="h-10 w-10 opacity-40" />
              Scan or enter a code to see batch details
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary-glow font-semibold text-sm">
                <ShieldCheck className="h-4 w-4" /> Verified · scan #{result.scan_count}
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Code"><span className="font-mono text-xs">{result.code}</span></Field>
                <Field label="Type">
                  <span className="capitalize">
                    {result.level}
                    {result.box_number != null ? ` · Box #${result.box_number}` : ""}
                  </span>
                </Field>
                <Field label="Lot"><span className="font-mono text-xs">{result.lot_number}</span></Field>
                <Field label="Grade">{result.grade ?? "—"}</Field>
                <Field label="Product">{result.product_name}</Field>
                <Field label="Supplier">{result.farmer_name ?? "—"}</Field>
                <Field label="Warehouse">{result.warehouse_name ?? "—"}</Field>
                <Field label="Received">{result.received_date}</Field>
                <Field label="Status"><StatusBadge status={result.status} /></Field>
                <Field label="Location"><StatusBadge status={result.current_location} /></Field>
              </dl>
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" onClick={() => nav(`/barcodes/${result.barcode_id}`)}>
                  Open barcode
                </Button>
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
