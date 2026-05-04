import { PageHeader } from "@/components/shared/PageHeader";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Workspace preferences" breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
        actions={<Button size="sm" onClick={() => toast.success("Settings saved")}>Save Changes</Button>} />
      <div className="space-y-4 max-w-3xl">
        <Section title="Company">
          <FormGrid>
            <FormRow label="Company name"><Input defaultValue="Acme Exports Ltd" /></FormRow>
            <FormRow label="Tax ID / GSTIN"><Input defaultValue="27ABCDE1234F1Z5" /></FormRow>
            <FormRow label="Default currency"><Select defaultValue="usd"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="usd">USD</SelectItem><SelectItem value="eur">EUR</SelectItem><SelectItem value="inr">INR</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Timezone"><Select defaultValue="ist"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ist">Asia/Kolkata</SelectItem><SelectItem value="utc">UTC</SelectItem></SelectContent></Select></FormRow>
          </FormGrid>
        </Section>
        <Section title="Document Numbering">
          <FormGrid>
            <FormRow label="Invoice prefix"><Input defaultValue="INV-" /></FormRow>
            <FormRow label="Quotation prefix"><Input defaultValue="QT-" /></FormRow>
            <FormRow label="Order prefix"><Input defaultValue="SO-" /></FormRow>
            <FormRow label="Shipment prefix"><Input defaultValue="SH-" /></FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
