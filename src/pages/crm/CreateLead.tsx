import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { toast } from "sonner";

export default function CreateLead() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader
        title="Create Lead"
        breadcrumbs={[{ label: "CRM" }, { label: "Leads", to: "/crm/leads" }, { label: "New" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
            <Button size="sm" onClick={() => { toast.success("Lead created"); nav("/crm/leads"); }}><Save className="h-4 w-4 mr-1.5" />Save Lead</Button>
          </>
        }
      />
      <div className="space-y-4 max-w-4xl">
        <Section title="Company Information">
          <FormGrid>
            <FormRow label="Company name" required><Input placeholder="Acme Imports Ltd" /></FormRow>
            <FormRow label="Website"><Input placeholder="acme.com" /></FormRow>
            <FormRow label="Country" required>
              <Select><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent><SelectItem value="us">United States</SelectItem><SelectItem value="de">Germany</SelectItem><SelectItem value="jp">Japan</SelectItem><SelectItem value="in">India</SelectItem></SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Industry">
              <Select><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent><SelectItem value="textiles">Textiles</SelectItem><SelectItem value="electronics">Electronics</SelectItem><SelectItem value="auto">Auto Parts</SelectItem></SelectContent>
              </Select>
            </FormRow>
          </FormGrid>
        </Section>
        <Section title="Primary Contact">
          <FormGrid>
            <FormRow label="Contact name" required><Input placeholder="Jane Smith" /></FormRow>
            <FormRow label="Job title"><Input placeholder="Procurement Manager" /></FormRow>
            <FormRow label="Email" required><Input type="email" placeholder="jane@acme.com" /></FormRow>
            <FormRow label="Phone"><Input placeholder="+1 555 0100" /></FormRow>
          </FormGrid>
        </Section>
        <Section title="Lead Details">
          <FormGrid>
            <FormRow label="Status">
              <Select defaultValue="new"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="warm">Warm</SelectItem><SelectItem value="hot">Hot</SelectItem><SelectItem value="cold">Cold</SelectItem></SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Source">
              <Select><SelectTrigger><SelectValue placeholder="Where did this lead come from?" /></SelectTrigger>
                <SelectContent><SelectItem value="website">Website</SelectItem><SelectItem value="referral">Referral</SelectItem><SelectItem value="trade-show">Trade Show</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem></SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Estimated value (USD)"><Input type="number" placeholder="50000" /></FormRow>
            <FormRow label="Owner">
              <Select><SelectTrigger><SelectValue placeholder="Assign to" /></SelectTrigger>
                <SelectContent><SelectItem value="john">John Doe</SelectItem><SelectItem value="sara">Sara Kim</SelectItem><SelectItem value="maria">Maria Lopez</SelectItem></SelectContent>
              </Select>
            </FormRow>
          </FormGrid>
          <div className="mt-4">
            <FormRow label="Notes"><Textarea placeholder="Initial conversation, requirements, next steps…" rows={4} /></FormRow>
          </div>
        </Section>
      </div>
    </div>
  );
}
