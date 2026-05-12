import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function CreateOrder() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [productsList, setProductsList] = useState<{id: string, name: string, unit?: string}[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.company_id) return;
      
      const [productsRes, leadsRes] = await Promise.all([
        supabase.from('products').select('id, name, unit').eq('company_id', profile.company_id).order('name'),
        supabase.from('leads')
          .select('id, company_name, email, country, interested_product')
          .eq('company_id', profile.company_id)
          .order('company_name')
      ]);
      
      if (productsRes.data) setProductsList(productsRes.data);
      if (leadsRes.data) {
        setLeadsList(leadsRes.data);
      }
    };
    loadData();
  }, [profile?.company_id]);

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCountry, setCustomerCountry] = useState("");
  const [product, setProduct] = useState("");
  
  // Update fields when a lead is selected
  useEffect(() => {
    if (!selectedLeadId) return;
    const lead = leadsList.find(l => l.id === selectedLeadId);
    if (lead) {
      setCustomerName(lead.company_name || "");
      setCustomerCountry(lead.country || "");
      setCustomerEmail(lead.email || "");
      if (lead.interested_product) setProduct(lead.interested_product);
    }
  }, [selectedLeadId, leadsList]);

  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  
  // Update unit when product is selected
  useEffect(() => {
    if (!product) return;
    const p = productsList.find(item => item.name === product);
    if (p?.unit) setUnit(p.unit);
  }, [product, productsList]);
  
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [currency, setCurrency] = useState("USD");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [incoterms, setIncoterms] = useState("CIF");
  const [packingDetails, setPackingDetails] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("90 % of the invoice value to be paid in advance, and the remaining 10 % of the invoice value to be paid after the loading of goods.\n\nNote : Including packing, loading and Transport.");
  const [notes, setNotes] = useState("");

  const totalAmount = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const handleSave = async () => {
    if (!customerName || !product || !quantity || !unitPrice) {
      return toast.error("Please fill all required fields (Customer, Product, Quantity, Price)");
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Authentication required to create orders");

      // Generate order number EXP-2026-XXX
      const year = new Date().getFullYear();
      const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `EXP-${year}-${rand}`;

      const { error } = await supabase.from("export_orders").insert({
        company_id: profile!.company_id,
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_country: customerCountry,
        product,
        quantity: Number(quantity),
        unit,
        unit_price: Number(unitPrice),
        total_amount: totalAmount,
        currency,
        expected_delivery: expectedDelivery ? new Date(expectedDelivery).toISOString() : null,
        shipping_address: shippingAddress,
        hsn_code: hsnCode,
        incoterms: incoterms,
        packing_details: packingDetails,
        payment_terms: paymentTerms,
        notes,
        created_by: userId,
        status: 'pending',
        payment_status: 'unpaid'
      });

      if (error) throw error;

      toast.success("Order created successfully!");
      navigate("/orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Export Order</h1>
          <p className="text-sm text-muted-foreground">Log a new customer request</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-primary font-bold">Select CRM Buyer / Lead</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger className="bg-primary/5 border-primary/20">
                  <SelectValue placeholder="Choose a Lead from CRM" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {leadsList.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      <div className="flex flex-col">
                        <span className="font-bold">{l.company_name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{l.country || 'Global'} Buyer</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic">Note: Export Orders are created for Buyers. For Farmers/Suppliers, use the Procurement section.</p>
            </div>
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Company or Individual Name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={customerCountry} onChange={e => setCustomerCountry(e.target.value)} placeholder="e.g. UAE, UK" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Shipping Address</Label>
              <Textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className="h-24" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                <SelectContent>
                  {productsList.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" min="0" value={quantity} onChange={e => setQuantity(Number(e.target.value) || "")} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="ton">ton</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Price *</Label>
                <Input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value) || "")} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="AED">AED (د.إ)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border mt-2 flex justify-between items-center">
              <span className="font-medium text-muted-foreground">Total Amount</span>
              <span className="text-xl font-bold">{currency} {totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Trade Terms (Incoterms)</Label>
              <Select value={incoterms} onValueChange={setIncoterms}>
                <SelectTrigger><SelectValue placeholder="Select Terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIF">CIF (Cost, Insurance, Freight)</SelectItem>
                  <SelectItem value="FOB">FOB (Free On Board)</SelectItem>
                  <SelectItem value="EXW">EXW (Ex Works)</SelectItem>
                  <SelectItem value="CNF">CNF (Cost and Freight)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HSN Code</Label>
              <Input value={hsnCode} onChange={e => setHsnCode(e.target.value)} placeholder="e.g. 08039010" />
            </div>
            <div className="space-y-2">
              <Label>Packing Details</Label>
              <Input value={packingDetails} onChange={e => setPackingDetails(e.target.value)} placeholder="e.g. 13 Kg per box" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Terms of Payment</Label>
              <Textarea value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. 90% advance..." className="h-20" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes, etc..." className="h-20" />
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t p-4 mt-2">
            <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto min-w-[150px]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Order
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
