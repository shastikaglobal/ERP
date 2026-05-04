import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { toast } from "sonner";

export default function CreateOrder() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Create Sales Order" breadcrumbs={[{ label: "Sales Orders", to: "/orders" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={() => { toast.success("Order created"); nav("/orders"); }}><Save className="h-4 w-4 mr-1.5" />Save Order</Button>
        </>}
      />
      <div className="space-y-4 max-w-4xl">
        <Section title="Customer & Shipping">
          <FormGrid>
            <FormRow label="Customer" required><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="m">Mumbai Textiles Ltd</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Customer PO #"><Input placeholder="PO-12345" /></FormRow>
            <FormRow label="Incoterm" required><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="fob">FOB</SelectItem><SelectItem value="cif">CIF</SelectItem><SelectItem value="exw">EXW</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Port of loading"><Input placeholder="Mumbai (INMUN)" /></FormRow>
            <FormRow label="Port of discharge"><Input placeholder="Hamburg (DEHAM)" /></FormRow>
            <FormRow label="Delivery date"><Input type="date" /></FormRow>
          </FormGrid>
        </Section>
        <Section title="Payment">
          <FormGrid>
            <FormRow label="Currency" required><Select defaultValue="usd"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="usd">USD</SelectItem><SelectItem value="eur">EUR</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Payment terms"><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="net30">Net 30</SelectItem><SelectItem value="lc">LC at sight</SelectItem></SelectContent></Select></FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
