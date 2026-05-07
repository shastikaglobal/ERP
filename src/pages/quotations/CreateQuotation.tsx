import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2, Eye, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = { id: number; product_id: string; qty: number; price: number };
type Customer = { id: string; name: string };
type Product = { id: string; name: string };

export default function CreateQuotation() {
  const nav = useNavigate();
  const [items, setItems] = useState<Item[]>([
    { id: Date.now(), product_id: "", qty: 1, price: 0 },
  ]);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          supabase.from("customers").select("id, name").order("name"),
          supabase.from("products").select("id, name").order("name")
        ]);
        if (custRes.error) throw custRes.error;
        if (prodRes.error) throw prodRes.error;
        
        setCustomers(custRes.data || []);
        setProducts(prodRes.data || []);
      } catch (error: any) {
        toast.error("Failed to load options");
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const addItem = () => setItems((s) => [...s, { id: Date.now(), product_id: "", qty: 1, price: 0 }]);
  const removeItem = (id: number) => setItems((s) => s.filter((i) => i.id !== id));
  const updateItem = (id: number, patch: Partial<Item>) => setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleSave = async () => {
    if (!customerId) return toast.error("Please select a customer");
    const validItems = items.filter(i => i.product_id && i.qty > 0 && i.price >= 0);
    if (validItems.length === 0) return toast.error("Please add at least one valid line item");

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");
      
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", session.user.id).single();
      if (!profile?.company_id) throw new Error("Company ID not found");

      // Insert quotation
      const quoteNumber = `QT-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
      const { data: quote, error: quoteErr } = await supabase.from("quotations").insert({
        company_id: profile.company_id,
        customer_id: customerId,
        quotation_number: quoteNumber,
        amount: total,
        currency: currency.toUpperCase(),
        items_count: validItems.length,
        valid_until: validUntil || null,
        status: "Draft"
      }).select("id").single();

      if (quoteErr) throw quoteErr;

      // Insert items
      const itemsToInsert = validItems.map(i => ({
        quotation_id: quote.id,
        product_id: i.product_id,
        quantity: i.qty,
        unit_price: i.price,
        total_price: i.qty * i.price
      }));

      const { error: itemsErr } = await supabase.from("quotation_items").insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      toast.success("Quotation created successfully!");
      nav("/quotations");
    } catch (error: any) {
      toast.error(error.message || "Failed to save quotation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create Quotation" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || loadingData}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save
          </Button>
        </>}
      />
      <div className="space-y-4">
        <Section title="Customer & Terms">
          <FormGrid cols={3}>
            <FormRow label="Customer" required>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select customer"} /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Currency">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="usd">USD</SelectItem><SelectItem value="eur">EUR</SelectItem><SelectItem value="inr">INR</SelectItem></SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Valid until"><Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></FormRow>
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
                    <td className="px-5 py-2">
                      <Select value={i.product_id} onValueChange={(val) => updateItem(i.id, { product_id: val })}>
                        <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2"><Input type="number" min="1" value={i.qty} onChange={(e) => updateItem(i.id, { qty: +e.target.value || 0 })} /></td>
                    <td className="px-3 py-2"><Input type="number" min="0" step="0.01" value={i.price} onChange={(e) => updateItem(i.id, { price: +e.target.value || 0 })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{(i.qty * i.price).toLocaleString()}</td>
                    <td className="px-3 py-2"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></td>
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
