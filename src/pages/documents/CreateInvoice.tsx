import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CreateInvoice() {
  const nav = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ id: Date.now().toString(), description: '', quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  const updateItem = (id: string, patch: any) => setItems(s => s.map(i => i.id === id ? { ...i, ...patch } : i));
  const addItem = () => setItems(s => [...s, { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (id: string) => setItems(s => s.filter(i => i.id !== id));

  const total = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);

  const handleSave = async () => {
    if (!customerName) return toast.error('Customer name is required');
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const payload: any = {
        company_id: null,
        invoice_number: undefined,
        customer_name: customerName,
        customer_address: null,
        customer_phone: null,
        customer_email: null,
        currency,
        amount: total,
        notes,
        created_by: session.user.id,
        items: items.map(i => ({ description: i.description, quantity: Number(i.quantity || 0), unit_price: Number(i.unit_price || 0), total_price: (Number(i.quantity || 0) * Number(i.unit_price || 0)) }))
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create invoice');
      }

      toast.success('Invoice created');
      nav('/documents/invoices');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Invoice</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav('/documents/invoices')}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Invoice'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" />
        <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="Currency (e.g. USD)" />
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />

        <div>
          <h3 className="font-semibold mb-2">Items</h3>
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-6" value={it.description} onChange={e => updateItem(it.id, { description: e.target.value })} placeholder="Description" />
                <Input type="number" className="col-span-2" value={it.quantity} onChange={e => updateItem(it.id, { quantity: Number(e.target.value) })} />
                <Input type="number" className="col-span-2" value={it.unit_price} onChange={e => updateItem(it.id, { unit_price: Number(e.target.value) })} />
                <div className="col-span-1 text-right">{((it.quantity || 0) * (it.unit_price || 0)).toLocaleString()}</div>
                <Button variant="ghost" size="icon" className="col-span-1" onClick={() => removeItem(it.id)}>x</Button>
              </div>
            ))}
          </div>
          <div className="mt-2"><Button variant="outline" onClick={addItem}>Add Item</Button></div>
        </div>

        <div className="text-right font-semibold">Total: {currency} {total.toLocaleString()}</div>
      </div>
    </div>
  );
}
