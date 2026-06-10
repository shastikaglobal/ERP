import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Plus, Trash2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type POItem = {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

export default function CreatePOLive() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [products, setProducts] = useState<{id: string, name: string, unit: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [items, setItems] = useState<POItem[]>([
    { id: "1", product: "", quantity: 1, unit: "kg", unit_price: 0 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          supabase.from("farmers").select("id, full_name").eq("is_active", true).neq("is_deleted", true),
          supabase.from("products").select("id, name, unit").eq("is_active", true)
        ]);
          
        if (supRes.error) throw supRes.error;
        if (prodRes.error) throw prodRes.error;
        
        setSuppliers((supRes.data || []).map(f => ({ id: f.id, name: f.full_name })));
        setProducts((prodRes.data || []).map(p => ({ id: p.id, name: p.name, unit: p.unit })));
      } catch (err: any) {
        toast.error("Failed to load catalog data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), product: "", quantity: 1, unit: "kg", unit_price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // If product changes, try to auto-fill the unit
        if (field === 'product') {
          const prod = products.find(p => p.id === value);
          if (prod) updated.unit = prod.unit;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!user?.id || !profile?.company_id) {
      return toast.error("Authentication error. Please refresh and try again.");
    }
    if (!supplierId) return toast.error("Please select a supplier");
    if (items.some(i => !i.product)) return toast.error("Select a product for all items");

    setSaving(true);
    try {
      // Step 1: Generate a professional PO number instantly
      const timestamp = new Date().getTime().toString().slice(-4);
      const year = new Date().getFullYear();
      const generatedPoNumber = `PO-${year}-${timestamp}`;

      // Step 2: Create the PO header
      const { data: po, error: poErr } = await supabase.from("purchase_orders").insert({
        po_number: generatedPoNumber,
        company_id: profile.company_id,
        farmer_id: supplierId,
        status: status === 'draft' ? 'draft' : 'approved',
        expected_delivery: expectedDate ? new Date(expectedDate).toISOString() : null,
        total: totalAmount,
        subtotal: totalAmount,
        currency,
        notes,
        created_by: user.id,
        order_date: new Date().toISOString()
      }).select().single();

      if (poErr) throw poErr;

      // Step 2: Create the PO items linked to products
      const itemRows = items.map(i => ({
        po_id: po.id,
        product_id: i.product,
        quantity: i.quantity,
        unit_price: i.unit_price
      }));

      const { error: itemsErr } = await supabase.from("purchase_order_items").insert(itemRows);
      if (itemsErr) throw itemsErr;

      toast.success(`Purchase order ${po.po_number} ${status === 'draft' ? 'saved' : 'issued'} successfully`);
      navigate("/procurement/orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase order");
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/procurement/orders")} className="rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Create Purchase Order</h1>
            <p className="text-sm text-muted-foreground mt-1">Draft a new professional order to your supplier</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 erp-card overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Order Items
              </CardTitle>
              <div className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded">
                ITEMS: {items.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="py-4 pl-6 text-xs uppercase tracking-wider font-bold">Product</TableHead>
                    <TableHead className="py-4 w-28 text-xs uppercase tracking-wider font-bold">Qty</TableHead>
                    <TableHead className="py-4 w-32 text-xs uppercase tracking-wider font-bold">Unit</TableHead>
                    <TableHead className="py-4 w-36 text-xs uppercase tracking-wider font-bold">Price</TableHead>
                    <TableHead className="py-4 text-right w-36 text-xs uppercase tracking-wider font-bold">Total</TableHead>
                    <TableHead className="py-4 w-12 pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id} className="group border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="pl-6 py-4">
                        <Select value={item.product} onValueChange={(val) => updateItem(item.id, "product", val)}>
                          <SelectTrigger className="border-none bg-transparent hover:bg-white/5 h-8 focus:ring-1 focus:ring-primary/50 transition-colors">
                            <SelectValue placeholder="Select product..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-white/10 max-h-[200px]">
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-4">
                        <Input 
                          type="number" min="1" 
                          value={item.quantity} 
                          onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} 
                          className="border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/50 h-8 px-2"
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <Select value={item.unit} onValueChange={(val) => updateItem(item.id, "unit", val)}>
                          <SelectTrigger className="border-none bg-transparent hover:bg-white/5 h-8 focus:ring-1 focus:ring-primary/50 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-white/10">
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="ton">ton</SelectItem>
                            <SelectItem value="piece">piece</SelectItem>
                            <SelectItem value="box">box</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="relative">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs pl-2">
                            {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€'}
                          </span>
                          <Input 
                            type="number" min="0" step="0.01" 
                            value={item.unit_price} 
                            onChange={(e) => updateItem(item.id, "unit_price", Number(e.target.value))} 
                            className="border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/50 h-8 pl-6 pr-2 text-right font-mono"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4 font-mono font-medium text-white pr-4">
                        {(item.quantity * item.unit_price).toLocaleString()}
                      </TableCell>
                      <TableCell className="pr-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(item.id)} 
                          disabled={items.length === 1}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 bg-white/[0.02] border-t border-white/5">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={addItem} 
                className="w-full h-12 border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all gap-2"
              >
                <Plus className="h-4 w-4" /> Add Item Line
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-end p-8 bg-black/20 backdrop-blur-sm border-t border-white/5">
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Order Total</span>
              <div className="text-3xl font-bold text-gradient-gold font-mono">
                {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card className="erp-card h-fit">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Supplier *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Expected Delivery</Label>
                  <Input 
                    type="date" 
                    value={expectedDate} 
                    onChange={(e) => setExpectedDate(e.target.value)} 
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Notes / Instructions</Label>
                <Textarea 
                  placeholder="Enter any special instructions or terms..." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-28 bg-white/5 border-white/10 focus:border-primary/50 transition-colors resize-none"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 p-6 pt-0">
              <Button 
                className="w-full btn-gold h-12 text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                onClick={() => handleSave('sent')}
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Issue Purchase Order
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 border-white/10 hover:bg-white/5 hover:text-white transition-all" 
                onClick={() => handleSave('draft')}
                disabled={saving}
              >
                <Save className="mr-2 h-5 w-5" /> Save as Draft
              </Button>
            </CardFooter>
          </Card>
          
          {/* Quick Stats or Info Panel */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-muted-foreground leading-relaxed">
            <p><strong>Note:</strong> Issuing this purchase order will notify the supplier and create a pending record in your procurement ledger.</p>
          </div>
        </div>
      </div>
    </div>

  );
}
