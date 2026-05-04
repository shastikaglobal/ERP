import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { toast } from "sonner";

export default function CreateProduct() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="Create Product" breadcrumbs={[{ label: "Inventory" }, { label: "Products", to: "/inventory/products" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={() => { toast.success("Product created"); nav("/inventory/products"); }}><Save className="h-4 w-4 mr-1.5" />Save</Button>
        </>}
      />
      <div className="space-y-4 max-w-4xl">
        <Section title="Product Details">
          <FormGrid>
            <FormRow label="SKU" required><Input placeholder="TEX-COT-001" /></FormRow>
            <FormRow label="Name" required><Input placeholder="Premium Cotton Fabric" /></FormRow>
            <FormRow label="Category"><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="t">Textiles</SelectItem><SelectItem value="e">Electronics</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="UOM"><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="m">Meter</SelectItem><SelectItem value="kg">Kg</SelectItem><SelectItem value="pc">Piece</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="HS Code"><Input placeholder="5208.42" /></FormRow>
            <FormRow label="Country of origin"><Input placeholder="India" /></FormRow>
          </FormGrid>
          <div className="mt-4"><FormRow label="Description"><Textarea rows={3} placeholder="Detailed product description…" /></FormRow></div>
        </Section>
        <Section title="Pricing & Stock">
          <FormGrid cols={3}>
            <FormRow label="Unit price"><Input type="number" placeholder="0.00" /></FormRow>
            <FormRow label="Currency"><Select defaultValue="usd"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="usd">USD</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Reorder level"><Input type="number" placeholder="100" /></FormRow>
          </FormGrid>
        </Section>
      </div>
    </div>
  );
}
