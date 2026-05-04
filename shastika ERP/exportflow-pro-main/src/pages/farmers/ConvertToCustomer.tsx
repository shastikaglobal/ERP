import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export default function ConvertToCustomer() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const nav = useNavigate();
  const qc = useQueryClient();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] s = useState(false);
  const [farmer, setFarmer] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    crops: [] as string[],
  });

  useEffect(() => {
    if (!id) {
      toast.error("No farmer ID provided");
      nav("/farmers");
      return;
    }

    async function fetchFarmer() {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Farmer not found");
        nav("/farmers");
        return;
      }

      setFarmer(data);
      setForm({
        name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: [data.village, data.district, data.state].filter(Boolean).join(", ") || "",
        country: data.country || "India",
        crops: data.primary_crops || [],
      });
      setLoading(false);
    }

    fetchFarmer();
  }, [id, nav]);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) {
      toast.error("Missing company context");
      return;
    }

    setBusy(true);

    // Insert into customers table
    const { error } = await supabase.from("customers").insert({
      company_id: profile.company_id,
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      country: form.country || null,
      crops: form.crops,
    });

    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    // Optional: Mark farmer as inactive or add a note
    await supabase.from("farmers").update({ is_active: false }).eq("id", id);

    setBusy(false);
    toast.success("Successfully converted to customer!");

    // Invalidate queries
    qc.invalidateQueries({ queryKey: ["farmers"] });
    qc.invalidateQueries({ queryKey: ["customers"] });

    nav("/customers");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Convert to Customer"
        description={`Convert farmer ${farmer?.full_name} to a customer`}
        breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Convert" }]}
      />

      <div className="space-y-4">
        <Section title="Farmer Profile">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Code</p>
              <p className="font-medium">{farmer?.code || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Farmer Name</p>
              <p className="font-medium">{farmer?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{farmer?.phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium">
                {[farmer?.village, farmer?.district, farmer?.state, farmer?.country].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Primary Crops</p>
              <p className="font-medium">
                {(farmer?.primary_crops || []).join(", ") || "—"}
              </p>
            </div>
          </div>
        </Section>

        <form onSubmit={submit} className="space-y-4">
          <Section title="Customer Details">
            <p className="text-sm text-muted-foreground mb-4">
              Review and edit the information before converting. This will create a new customer record.
            </p>
            <FormGrid cols={2}>
              <FormRow label="Name" required>
                <Input required value={form.name} onChange={onChange("name")} />
              </FormRow>
              <FormRow label="Email">
                <Input type="email" value={form.email} onChange={onChange("email")} />
              </FormRow>
              <FormRow label="Phone">
                <Input value={form.phone} onChange={onChange("phone")} />
              </FormRow>
              <FormRow label="Address">
                <Input value={form.address} onChange={onChange("address")} />
              </FormRow>
              <FormRow label="Country">
                <Input value={form.country} onChange={onChange("country")} />
              </FormRow>
              <FormRow label="Crops">
                <Input
                  value={form.crops.join(", ")}
                  onChange={(e) => setForm(f => ({ ...f, crops: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                  placeholder="e.g. Rice, Wheat"
                />
              </FormRow>
            </FormGrid>
          </Section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => nav(-1)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Convert to Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
