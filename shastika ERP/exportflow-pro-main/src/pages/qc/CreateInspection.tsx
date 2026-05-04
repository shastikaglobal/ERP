import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function CreateInspection() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { profile, user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [moisture, setMoisture] = useState("");
  const [foreign, setForeign] = useState("");
  const [broken, setBroken] = useState("");
  const [grade, setGrade] = useState("A");
  const [result, setResult] = useState("approved");
  const [notes, setNotes] = useState("");

  const { data: batches } = useQuery({
    queryKey: ["batches-pending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory_batches")
        .select("id, lot_number, status, product:products(name)")
        .in("status", ["pending_qc", "approved"])
        .order("received_date", { ascending: false });
      return data || [];
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading inspection form…</div>
      </div>
    );
  }

  if (!profile?.company_id) {
    return (
      <div>
        <PageHeader
          title="Create QC Inspection"
          description="Create a new quality control inspection record"
          breadcrumbs={[{ label: "QC", to: "/qc/inspections" }, { label: "New" }]}
        />
        <Section title="Missing company context">
          <p className="text-sm text-muted-foreground">
            Your account is not assigned to a company yet. QC inspection creation requires a company assignment.
            Please contact your administrator to update your profile with a company_id.
          </p>
        </Section>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Missing user context");
    if (!batchId) return toast.error("Select a batch");
    setBusy(true);
    const { error } = await supabase.from("qc_inspections").insert({
      company_id: profile.company_id,
      batch_id: batchId,
      inspector_id: user.id,
      moisture_pct: moisture ? Number(moisture) : null,
      foreign_matter_pct: foreign ? Number(foreign) : null,
      broken_pct: broken ? Number(broken) : null,
      grade,
      result: result as any,
      lab_notes: notes || null,
    });
    if (!error && (result === "approved" || result === "rejected")) {
      // Cascade batch status
      await supabase.from("inventory_batches").update({
        status: result === "approved" ? "approved" : "rejected",
        grade,
      }).eq("id", batchId);
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Inspection recorded");
    qc.invalidateQueries({ queryKey: ["qc_inspections"] });
    qc.invalidateQueries({ queryKey: ["batches-pending"] });
    nav("/qc/inspections");
  };

  return (
    <div>
      <PageHeader
        title="New QC Inspection"
        description="Record quality results for a batch"
        breadcrumbs={[{ label: "Quality Control", to: "/qc/inspections" }, { label: "New" }]}
      />
      <form onSubmit={submit} className="space-y-4">
        <Section title="Batch">
          <FormRow label="Inventory batch" required>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger><SelectValue placeholder="Select a batch" /></SelectTrigger>
              <SelectContent>
                {batches?.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.lot_number} — {b.product?.name} ({b.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </Section>

        <Section title="Lab measurements">
          <FormGrid cols={3}>
            <FormRow label="Moisture %"><Input type="number" step="0.01" value={moisture} onChange={(e) => setMoisture(e.target.value)} /></FormRow>
            <FormRow label="Foreign matter %"><Input type="number" step="0.01" value={foreign} onChange={(e) => setForeign(e.target.value)} /></FormRow>
            <FormRow label="Broken %"><Input type="number" step="0.01" value={broken} onChange={(e) => setBroken(e.target.value)} /></FormRow>
          </FormGrid>
        </Section>

        <Section title="Result">
          <FormGrid cols={2}>
            <FormRow label="Grade">
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A — Premium</SelectItem>
                  <SelectItem value="B">B — Standard</SelectItem>
                  <SelectItem value="C">C — Below standard</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Outcome">
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="rework">Rework</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormGrid>
          <div className="mt-4">
            <FormRow label="Lab notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></FormRow>
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => nav("/qc/inspections")} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save inspection
          </Button>
        </div>
      </form>
    </div>
  );
}
