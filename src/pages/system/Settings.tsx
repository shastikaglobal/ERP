import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Company state
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("inr");
  const [taxId, setTaxId] = useState("");
  const [timezone, setTimezone] = useState("ist");

  // Document Numbering State
  const [invPrefix, setInvPrefix] = useState("INV-");
  const [qtPrefix, setQtPrefix] = useState("QT-");
  const [soPrefix, setSoPrefix] = useState("SO-");
  const [shPrefix, setShPrefix] = useState("SH-");

  useEffect(() => {
    if (!profile?.company_id) return;
    const fetchCompany = async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", profile.company_id).single();
      if (!error && data) {
        setName(data.name || "Shastika Global Impex Pvt Ltd");
        setCurrency(data.base_currency?.toLowerCase() || "inr");
        
        // Document Numbering Setup
        if (data.invoice_prefix !== undefined) setInvPrefix(data.invoice_prefix || "INV-");
        if (data.quotation_prefix !== undefined) setQtPrefix(data.quotation_prefix || "QT-");
        if (data.order_prefix !== undefined) setSoPrefix(data.order_prefix || "SO-");
        if (data.shipment_prefix !== undefined) setShPrefix(data.shipment_prefix || "SH-");
      }
      setLoading(false);
    };
    fetchCompany();
  }, [profile?.company_id]);

  const handleSave = async () => {
    if (!profile?.company_id) return;
    setSaving(true);
    
    // Update company table in Supabase
    const { error } = await supabase.from("companies").update({
      name,
      base_currency: currency.toUpperCase(),
      invoice_prefix: invPrefix,
      quotation_prefix: qtPrefix,
      order_prefix: soPrefix,
      shipment_prefix: shPrefix
    }).eq("id", profile.company_id);
    
    setSaving(false);
    if (error) {
      toast.error("Error saving: " + error.message);
    } else {
      toast.success("Settings saved successfully!");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <PageHeader title="Settings" description="Workspace preferences" breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
        actions={<Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>} />
      <div className="space-y-4 max-w-3xl">
        <Section title="Company">
          <FormGrid>
            <FormRow label="Company name"><Input value={name} onChange={e => setName(e.target.value)} /></FormRow>
            <FormRow label="Tax ID / GSTIN"><Input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="e.g. 33ABCDE1234F1Z5" /></FormRow>
            <FormRow label="Default currency">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">INR</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Timezone">
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">Asia/Kolkata</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
          </FormGrid>
        </Section>
        <Section title="Document Numbering">
          <FormGrid>
            <FormRow label="Invoice prefix"><Input value={invPrefix} onChange={e => setInvPrefix(e.target.value)} /></FormRow>
            <FormRow label="Quotation prefix"><Input value={qtPrefix} onChange={e => setQtPrefix(e.target.value)} /></FormRow>
            <FormRow label="Order prefix"><Input value={soPrefix} onChange={e => setSoPrefix(e.target.value)} /></FormRow>
            <FormRow label="Shipment prefix"><Input value={shPrefix} onChange={e => setShPrefix(e.target.value)} /></FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
