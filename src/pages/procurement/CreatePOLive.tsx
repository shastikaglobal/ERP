import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type LineItem = { product_id: string; quantity: string; unit_price: string; expected_grade: string };

export default function CreatePOLive() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [poNumber, setPoNumber] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [farmerId, setFarmerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ product_id: "", quantity: "", unit_price: "", expected_grade: "A" }]);

  const { data: farmers } = useQuery({
    queryKey: ["farmers-min"],
    queryFn: async () => (await supabase.from("farmers").select("id, full_name").order("full_name")).data || [],
  });
  const { data: products } = useQuery({
    queryKey: ["products-min"],
    queryFn: async () => (await supabase.from("products").select("id, name, sku, unit").order("name")).data || [],
  });
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses-min"],
    queryFn: async () => (await supabase.from("warehouses").select("id, name").order("name")).data || [],
  });

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0),
    [items]
  );

  const updateItem = (idx: number, k: keyof LineItem, v: string) => {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  };
  const addRow = () => setItems((a) => [...a, { product_id: "", quantity: "", unit_price: "", expected_grade: "A" }]);
  const removeRow = (idx: number) => setItems((a) => a.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return toast.error("Missing company context");
    if (!farmerId) return toast.error("Select a farmer");
    if (items.length === 0 || items.some((i) => !i.product_id || !i.quantity || !i.unit_price)) {
      return toast.error("Complete all line items");
    }

    setBusy(true);
    const { data: po, error: poErr } = await supabase
      .from("purchase_orders")
      .insert({
        company_id: profile.company_id,
        po_number: poNumber,
        farmer_id: farmerId,
        warehouse_id: warehouseId || null,
        order_date: orderDate,
        expected_delivery: expectedDelivery || null,
        currency,
        subtotal,
        total: subtotal,
        notes: notes || null,
        status: "draft",
      })
      .select("id")
      .single();

    if (poErr || !po) {
      setBusy(false);
      return toast.error(poErr?.message || "Failed to create PO");
    }

    const { error: itemsErr } = await supabase.from("purchase_order_items").insert(
      items.map((i) => ({
        po_id: po.id,
        product_id: i.product_id,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        expected_grade: i.expected_grade || null,
      }))
    );
    setBusy(false);
    if (itemsErr) return toast.error(itemsErr.message);
    toast.success("Purchase order created");
    qc.invalidateQueries({ queryKey: ["purchase_orders"] });
    nav("/procurement/orders");
  };

  const noFarmers = farmers && farmers.length === 0;
  const noProducts = products && products.length === 0;

  return (
    <div>
      <PageHeader
        title="Create Purchase Order"
        description="Procure produce from a farmer"
        breadcrumbs={[{ label: "Procurement", to: "/procurement/orders" }, { label: "New PO" }]}
      />

      {(noFarmers || noProducts) && (
        <div className="erp-card p-4 mb-4 border-l-4 border-l-warning">
          <p className="text-sm">
            You need at least one {noFarmers && <a href="/farmers/create" className="text-primary underline">farmer</a>}
            {noFarmers && noProducts && " and one "}
            {noProducts && <a href="/inventory/products/create" className="text-primary underline">product</a>} before creating a PO.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Section title="Order details">
          <FormGrid cols={2}>
            <FormRow label="PO number" required><Input required value={poNumber} onChange={(e) => setPoNumber(e.target.value)} /></FormRow>
            <FormRow label="Farmer" required>
              <Select value={farmerId} onValueChange={setFarmerId}>
                <SelectTrigger><SelectValue placeholder="Select farmer" /></SelectTrigger>
                <SelectContent>{farmers?.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Warehouse">
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                <SelectContent>{warehouses?.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Currency"><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></FormRow>
            <FormRow label="Order date" required><Input type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} /></FormRow>
            <FormRow label="Expected delivery"><Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} /></FormRow>
          </FormGrid>
        </Section>

        <Section title="Line items" actions={<Button type="button" size="sm" variant="outline" onClick={addRow}><Plus className="h-3.5 w-3.5 mr-1" />Add row</Button>}>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <label className="text-xs text-muted-foreground">Product</label>
                  <Select value={item.product_id} onValueChange={(v) => updateItem(idx, "product_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Quantity (kg)</label>
                  <Input type="number" step="0.001" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Unit price</label>
                  <Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Grade</label>
                  <Select value={item.expected_grade} onValueChange={(v) => updateItem(idx, "expected_grade", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 text-right text-sm tabular-nums">
                  {(() => {
                    const val = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                    return val > 0 && val < 0.01 ? val.toFixed(4) : val.toFixed(2);
                  })()}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeRow(idx)} disabled={items.length === 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-end gap-8 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold tabular-nums">
              {currency} {subtotal > 0 && subtotal < 0.01 ? subtotal.toFixed(4) : subtotal.toFixed(2)}
            </span>
          </div>
        </Section>

        <Section title="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => nav("/procurement/orders")} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create purchase order
          </Button>
        </div>
      </form>
    </div>
  );
}
