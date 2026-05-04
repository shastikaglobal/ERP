import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CARRIERS = ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE", "Evergreen", "COSCO"];
const STATUSES = ["Pending", "Processing", "In Transit", "Delivered", "Out of Stock"];

export default function CreateShipment() {
  const nav = useNavigate();
  const { profile, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    shipment_number: "",
    customer_name: "",
    origin: "",
    destination: "",
    carrier: "",
    status: "Pending",
    eta: "",
    departed_at: "",
    container_number: "",
    container_type: "",
    container_weight: "",
  });

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSelect = (k: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [k]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.shipment_number.trim()) {
      toast.error("Shipment number is required");
      return;
    }
    if (!profile?.company_id) {
      toast.error("Missing company context");
      return;
    }

    setBusy(true);
    // Since the remote database lacks these columns, we must only send what's supported
    // to avoid the "schema cache" error, OR the user must run their migrations.
    // We will send all columns as if the migration is applied.
    const { data: newShipment, error } = await supabase.from("shipments").insert({
      company_id: profile.company_id,
      shipment_number: form.shipment_number.trim(),
      customer_name: form.customer_name || null,
      origin: form.origin || null,
      destination: form.destination || null,
      carrier: form.carrier || null,
      status: form.status,
      eta: form.eta || null,
      departed_at: form.departed_at || null,
    }).select().single();
    setBusy(false);

    if (error) {
      console.error("Insert error:", error);
      toast.error(error.message);
      return;
    }

    // Insert single container
    if (form.container_number.trim() && newShipment) {
      const { error: containerError } = await supabase.from("shipment_containers").insert({
        company_id: profile.company_id,
        shipment_id: newShipment.id,
        container_number: form.container_number.trim(),
        type: form.container_type || null,
        weight: form.container_weight ? parseFloat(form.container_weight) : null,
        location: form.origin || null,
        status: "Pending"
      });

      if (containerError) {
        console.error("Container insert error:", containerError);
        toast.error("Shipment saved, but failed to save container: " + containerError.message);
      }
    }

    toast.success("Shipment created successfully");
    nav("/shipments");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile?.company_id) {
    return (
      <div>
        <PageHeader title="Create Shipment" breadcrumbs={[{ label: "Shipments", to: "/shipments" }, { label: "New" }]} />
        <Section title="Missing company context">
          <p className="text-sm text-muted-foreground">
            Your account is not assigned to a company yet. Please contact your administrator.
          </p>
        </Section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Create Shipment" breadcrumbs={[{ label: "Shipments", to: "/shipments" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)} disabled={busy}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save
          </Button>
        </>}
      />
      <form onSubmit={submit} className="space-y-4 max-w-4xl">
        <Section title="Shipment Details">
          <FormGrid>
            <FormRow label="Shipment number" required>
              <Input required value={form.shipment_number} onChange={onChange("shipment_number")} placeholder="0001" />
            </FormRow>
            <FormRow label="Customer name">
              <Input value={form.customer_name} onChange={onChange("customer_name")} placeholder="abc electronics" />
            </FormRow>
            <FormRow label="Carrier">
              <Select value={form.carrier} onValueChange={onSelect("carrier")}>
                <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                <SelectContent>
                  {CARRIERS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Status">
              <Select value={form.status} onValueChange={onSelect("status")}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          </FormGrid>
        </Section>
        <Section title="Location">
          <FormGrid>
            <FormRow label="Port of loading (Origin)" required>
              <Input required value={form.origin} onChange={onChange("origin")} placeholder="mumbai" />
            </FormRow>
            <FormRow label="Port of discharge (Destination)" required>
              <Input required value={form.destination} onChange={onChange("destination")} placeholder="hamburg" />
            </FormRow>
          </FormGrid>
        </Section>
        <Section title="Container Details">
          <FormGrid>
            <FormRow label="Container Number" required>
              <Input 
                type="text" 
                required
                value={form.container_number} 
                onChange={onChange("container_number")} 
                placeholder="e.g. 123456" 
                onKeyDown={(e) => {
                  // Only allow numbers and backspace/delete/arrows
                  if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </FormRow>
            <FormRow label="Container Type" required>
              <Input required value={form.container_type} onChange={onChange("container_type")} placeholder="e.g. 40ft HC" />
            </FormRow>
            <FormRow label="Container Weight (tonnes)" required>
              <Input required type="number" step="0.1" value={form.container_weight} onChange={onChange("container_weight")} placeholder="e.g. 22.5" />
            </FormRow>
          </FormGrid>
        </Section>
        <Section title="Schedule">
          <FormGrid>
            <FormRow label="Departure date">
              <Input type="date" value={form.departed_at} onChange={onChange("departed_at")} />
            </FormRow>
            <FormRow label="ETA">
              <Input type="date" value={form.eta} onChange={onChange("eta")} />
            </FormRow>
          </FormGrid>
        </Section>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => nav("/shipments")} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Shipment
          </Button>
        </div>
      </form>
    </div>
  );
}
