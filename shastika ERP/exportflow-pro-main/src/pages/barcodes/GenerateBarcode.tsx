import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, QrCode, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type ApprovedBatch = {
  id: string;
  lot_number: string;
  grade: string | null;
  received_date: string;
  product: { name: string } | null;
  farmer: { full_name: string } | null;
};

export default function GenerateBarcode() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { profile, loading } = useAuth();
  const [batchId, setBatchId] = useState<string>("");
  const [level, setLevel] = useState<"batch" | "box">("batch");
  const [boxCount, setBoxCount] = useState<number>(1);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["barcode_eligible_batches"],
    queryFn: async () => {
      const { data: approvedBatches } = await supabase
        .from("inventory_batches")
        .select("id, lot_number, grade, received_date, status, product:products(name), farmer:farmers(full_name)")
        .eq("status", "approved")
        .order("received_date", { ascending: false });

      const { data: qcApproved } = await supabase
        .from("qc_inspections")
        .select("batch_id")
        .eq("result", "approved");

      const ids = new Set<string>([
        ...(approvedBatches?.map((b: any) => b.id) ?? []),
        ...(qcApproved?.map((q: any) => q.batch_id) ?? []),
      ]);
      if (ids.size === 0) return [] as ApprovedBatch[];

      const { data, error } = await supabase
        .from("inventory_batches")
        .select("id, lot_number, grade, received_date, product:products(name), farmer:farmers(full_name)")
        .in("id", Array.from(ids))
        .order("received_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApprovedBatch[];
    },
  });

  const selected = useMemo(
    () => batches?.find((b) => b.id === batchId) ?? null,
    [batches, batchId]
  );

  const { data: existing } = useQuery({
    queryKey: ["existing_barcodes", batchId],
    enabled: !!batchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("batch_barcodes")
        .select("level, box_number")
        .eq("batch_id", batchId);
      return data ?? [];
    },
  });

  const hasBatchLevel = !!existing?.find((e: any) => e.level === "batch");
  const nextBox =
    1 +
    (existing
      ?.filter((e: any) => e.level === "box" && e.box_number != null)
      .reduce((m: number, e: any) => Math.max(m, e.box_number), 0) ?? 0);

  const generate = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Choose a batch");

      const { data: prof } = await supabase
        .from("profiles")
        .select("company_id")
        .maybeSingle();
      if (!prof?.company_id) throw new Error("No company on profile");

      const rows: any[] = [];
      const supplierKey = (selected.farmer?.full_name ?? "NA").slice(0, 3).toUpperCase();
      const productKey = (selected.product?.name ?? "NA").slice(0, 3).toUpperCase();

      const buildCode = (kind: "B" | "X", n?: number) =>
        [
          "SGI",
          kind,
          selected.lot_number,
          selected.grade ?? "NA",
          productKey,
          supplierKey,
          (selected.received_date ?? "").replace(/-/g, ""),
          n != null ? String(n).padStart(3, "0") : null,
        ]
          .filter(Boolean)
          .join("|");

      if (level === "batch") {
        if (hasBatchLevel) throw new Error("Batch-level QR already exists for this batch");
        rows.push({
          company_id: prof.company_id,
          batch_id: selected.id,
          code: buildCode("B"),
          level: "batch",
          box_number: null,
        });
      } else {
        for (let i = 0; i < boxCount; i++) {
          const n = nextBox + i;
          rows.push({
            company_id: prof.company_id,
            batch_id: selected.id,
            code: buildCode("X", n),
            level: "box",
            box_number: n,
          });
        }
      }

      const { error } = await supabase.from("batch_barcodes").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} QR code${n > 1 ? "s" : ""} generated`);
      qc.invalidateQueries({ queryKey: ["batch_barcodes"] });
      qc.invalidateQueries({ queryKey: ["existing_barcodes", batchId] });
      nav("/barcodes");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to generate"),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading barcode generator…</div>
      </div>
    );
  }

  if (!profile?.company_id) {
    return (
      <div>
        <PageHeader
          title="Generate QR Code"
          description="QR codes can only be generated for QC-approved batches."
          breadcrumbs={[
            { label: "Barcode & Tracking", to: "/barcodes" },
            { label: "Generate" },
          ]}
        />
        <Section title="Missing company context">
          <p className="text-sm text-muted-foreground">
            Your account is not assigned to a company yet. Barcode generation requires a company assignment.
            Please contact your administrator to update your profile with a company_id.
          </p>
        </Section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Generate QR Code"
        description="QR codes can only be generated for QC-approved batches."
        breadcrumbs={[
          { label: "Barcode & Tracking", to: "/barcodes" },
          { label: "Generate" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Section title="Batch & QR options">
          <FormGrid cols={2}>
            <FormRow label="Eligible batch (QC approved)" required>
              {isLoading ? (
                <div className="h-9 flex items-center text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading…
                </div>
              ) : (
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      batches?.length ? "Select a batch" : "No QC-approved batches yet"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {batches?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.lot_number} · {b.product?.name ?? "—"} · Grade {b.grade ?? "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormRow>

            <FormRow label="QR level" required>
              <Select value={level} onValueChange={(v) => setLevel(v as "batch" | "box")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch">Batch-level (one QR for the whole lot)</SelectItem>
                  <SelectItem value="box">Box-level (one QR per box)</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>

            {level === "box" && (
              <FormRow
                label="How many boxes?"
                hint={`Next box number will start at #${nextBox}`}
                required
              >
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={boxCount}
                  onChange={(e) => setBoxCount(Math.max(1, Number(e.target.value || 1)))}
                />
              </FormRow>
            )}
          </FormGrid>

          {selected && (
            <div className="mt-5 rounded-md border border-border bg-secondary p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-primary-glow font-semibold">
                <ShieldCheck className="h-4 w-4" /> QC-approved · ready to barcode
              </div>
              <div><span className="text-muted-foreground">Lot:</span> <span className="font-mono">{selected.lot_number}</span></div>
              <div><span className="text-muted-foreground">Product:</span> {selected.product?.name ?? "—"}</div>
              <div><span className="text-muted-foreground">Grade:</span> {selected.grade ?? "—"}</div>
              <div><span className="text-muted-foreground">Supplier:</span> {selected.farmer?.full_name ?? "—"}</div>
              <div><span className="text-muted-foreground">Received:</span> {selected.received_date}</div>
              {level === "batch" && hasBatchLevel && (
                <div className="text-destructive mt-2">
                  A batch-level QR already exists. Switch to Box-level instead.
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center gap-2">
            <Button
              className="btn-gold"
              disabled={
                !batchId ||
                generate.isPending ||
                (level === "batch" && hasBatchLevel)
              }
              onClick={() => generate.mutate()}
            >
              {generate.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Generate {level === "box" ? `${boxCount} box QR${boxCount > 1 ? "s" : ""}` : "batch QR"}
            </Button>
            <Button variant="ghost" onClick={() => nav("/barcodes")}>Cancel</Button>
          </div>
        </Section>

        <Section title="Live preview">
          {selected ? (
            <QRPreview
              text={`SGI|${level === "batch" ? "B" : "X"}|${selected.lot_number}|${selected.grade ?? "NA"}`}
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-3">
              <QrCode className="h-10 w-10 opacity-40" />
              Select a batch to preview the QR
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function QRPreview({ text }: { text: string }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(text, {
      margin: 1,
      width: 240,
      color: { dark: "#141414", light: "#f2cc78" },
    }).then(setSrc).catch(() => setSrc(""));
  }, [text]);

  if (!src) return <div className="h-64 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-md p-3 bg-[hsl(var(--primary-light))]">
        <img src={src} alt="QR preview" className="block" />
      </div>
      <div className="text-[10px] font-mono text-muted-foreground break-all text-center">{text}</div>
    </div>
  );
}
