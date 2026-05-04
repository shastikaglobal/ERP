import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { toast } from "sonner";

export default function CreatePO() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Create Purchase Order" breadcrumbs={[{ label: "Procurement" }, { label: "Orders", to: "/procurement/orders" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={() => { toast.success("PO created"); nav("/procurement/orders"); }}><Save className="h-4 w-4 mr-1.5" />Save</Button>
        </>} />
      <div className="space-y-4 max-w-4xl">
        <Section title="Supplier & Terms">
          <FormGrid>
            <FormRow label="Supplier" required><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="g">Gujarat Cotton Mills</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Currency"><Select defaultValue="usd"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="usd">USD</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Expected delivery"><Input type="date" /></FormRow>
            <FormRow label="Payment terms"><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="n30">Net 30</SelectItem></SelectContent></Select></FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
