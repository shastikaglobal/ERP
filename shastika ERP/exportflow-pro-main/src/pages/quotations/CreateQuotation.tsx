import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { toast } from "sonner";

type Item = { id: number; product: string; qty: number; price: number };

export default function CreateQuotation() {
  const nav = useNavigate();
  const [items, setItems] = useState<Item[]>([
    { id: 1, product: "", qty: 1, price: 0 },
  ]);

  const addItem = () => setItems((s) => [...s, { id: Date.now(), product: "", qty: 1, price: 0 }]);
  const removeItem = (id: number) => setItems((s) => s.filter((i) => i.id !== id));
  const updateItem = (id: number, patch: Partial<Item>) => setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <div>
      <PageHeader title="Create Quotation" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1.5" />Preview</Button>
          <Button size="sm" onClick={() => { toast.success("Quotation saved"); nav("/quotations"); }}><Save className="h-4 w-4 mr-1.5" />Save</Button>
        </>}
      />
      <div className="space-y-4">
        <Section title="Customer & Terms">
          <FormGrid cols={3}>
            <FormRow label="Customer" required>
              <Select><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent><SelectItem value="mum">Mumbai Textiles Ltd</SelectItem><SelectItem value="ber">Berlin Auto GmbH</SelectItem><SelectItem value="osa">Osaka Electronics</SelectItem></SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Currency"><Select defaultValue="usd"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="usd">USD</SelectItem><SelectItem value="eur">EUR</SelectItem><SelectItem value="inr">INR</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Valid until"><Input type="date" /></FormRow>
            <FormRow label="Incoterm"><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="fob">FOB</SelectItem><SelectItem value="cif">CIF</SelectItem><SelectItem value="exw">EXW</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Payment terms"><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="net30">Net 30</SelectItem><SelectItem value="net60">Net 60</SelectItem><SelectItem value="lc">LC at sight</SelectItem></SelectContent></Select></FormRow>
            <FormRow label="Reference"><Input placeholder="Customer PO #" /></FormRow>
          </FormGrid>
        </Section>

        <Section title="Line Items" actions={<Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />Add Item</Button>}>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-2">Product</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-24">Qty</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-32">Unit Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-32">Total</th>
                <th className="px-3 py-2 w-10" />
              </tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 border-border">
                    <td className="px-5 py-2"><Input value={i.product} onChange={(e) => updateItem(i.id, { product: e.target.value })} placeholder="Product or SKU" /></td>
                    <td className="px-3 py-2"><Input type="number" value={i.qty} onChange={(e) => updateItem(i.id, { qty: +e.target.value || 0 })} /></td>
                    <td className="px-3 py-2"><Input type="number" value={i.price} onChange={(e) => updateItem(i.id, { price: +e.target.value || 0 })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{(i.qty * i.price).toLocaleString()}</td>
                    <td className="px-3 py-2"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">${subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (18%)</span><span className="tabular-nums">${tax.toLocaleString()}</span></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><span>Total</span><span className="tabular-nums">${total.toLocaleString()}</span></div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
