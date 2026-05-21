import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Section, FormGrid, FormRow } from "@/components/shared/FormShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { id: string; product_id: string; product_name: string; hsn_code: string; qty: number; price: number };

interface Lead {
  id: string;
  company_name?: string;
  contact_name?: string;
  interested_product?: string;
  email?: string;
}

interface Product {
  id: string;
  name: string;
  hs_code?: string;
  sku?: string;
  unit?: string;
}

interface MetaData {
  name: string;
}

export default function CreateQuotation() {
  const nav = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const leadFromState = location.state?.lead;
  const [saving, setSaving] = useState(false);
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [containerTypesList, setContainerTypesList] = useState<MetaData[]>([]);
  const [packagingTypesList, setPackagingTypesList] = useState<MetaData[]>([]);

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState(leadFromState?.id || "");
  const [customerName, setCustomerName] = useState(leadFromState?.company_name || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [validUntil, setValidUntil] = useState("");
  const [incoterm, setIncoterm] = useState("CIF");
  const [containerType, setContainerType] = useState("");
  const [packagingType, setPackagingType] = useState("");
  const [packagingCost, setPackagingCost] = useState(0);
  const [shipmentType, setShipmentType] = useState("");
  const [shipmentCost, setShipmentCost] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [countryOfOrigin, setCountryOfOrigin] = useState("India");
  const [portOfLoading, setPortOfLoading] = useState("Nhava Sheva Port, India");
  const [portOfDischarge, setPortOfDischarge] = useState("");
  const [netWeight, setNetWeight] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("90 % of the invoice value to be paid in advance, and the remaining 10 % of the invoice value to be paid after the loading of goods.\n\nNote : Including packing, loading and Transport.");
  
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencies = [
    { code: "AED", name: "UAE Dirham" },
    { code: "AFN", name: "Afghan Afghani" },
    { code: "ALL", name: "Albanian Lek" },
    { code: "AMD", name: "Armenian Dram" },
    { code: "ANG", name: "Netherlands Antillean Guilder" },
    { code: "AOA", name: "Angolan Kwanza" },
    { code: "ARS", name: "Argentine Peso" },
    { code: "AUD", name: "Australian Dollar" },
    { code: "AWG", name: "Aruban Florin" },
    { code: "AZN", name: "Azerbaijani Manat" },
    { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark" },
    { code: "BBD", name: "Barbadian Dollar" },
    { code: "BDT", name: "Bangladeshi Taka" },
    { code: "BGN", name: "Bulgarian Lev" },
    { code: "BHD", name: "Bahraini Dinar" },
    { code: "BIF", name: "Burundian Franc" },
    { code: "BMD", name: "Bermudan Dollar" },
    { code: "BND", name: "Brunei Dollar" },
    { code: "BOB", name: "Bolivian Boliviano" },
    { code: "BRL", name: "Brazilian Real" },
    { code: "BSD", name: "Bahamian Dollar" },
    { code: "BTN", name: "Bhutanese Ngultrum" },
    { code: "BWP", name: "Botswanan Pula" },
    { code: "BYN", name: "Belarusian Ruble" },
    { code: "BZD", name: "Belize Dollar" },
    { code: "CAD", name: "Canadian Dollar" },
    { code: "CDF", name: "Congolese Franc" },
    { code: "CHF", name: "Swiss Franc" },
    { code: "CLP", name: "Chilean Peso" },
    { code: "CNY", name: "Chinese Yuan" },
    { code: "COP", name: "Colombian Peso" },
    { code: "CRC", name: "Costa Rican Colon" },
    { code: "CUP", name: "Cuban Peso" },
    { code: "CVE", name: "Cape Verdean Escudo" },
    { code: "CZK", name: "Czech Koruna" },
    { code: "DJF", name: "Djiboutian Franc" },
    { code: "DKK", name: "Danish Krone" },
    { code: "DOP", name: "Dominican Peso" },
    { code: "DZD", name: "Algerian Dinar" },
    { code: "EGP", name: "Egyptian Pound" },
    { code: "ERN", name: "Eritrean Nakfa" },
    { code: "ETB", name: "Ethiopian Birr" },
    { code: "EUR", name: "Euro" },
    { code: "FJD", name: "Fijian Dollar" },
    { code: "GBP", name: "British Pound" },
    { code: "GEL", name: "Georgian Lari" },
    { code: "GHS", name: "Ghanaian Cedi" },
    { code: "GMD", name: "Gambian Dalasi" },
    { code: "GNF", name: "Guinean Franc" },
    { code: "GTQ", name: "Guatemalan Quetzal" },
    { code: "GYD", name: "Guyanaese Dollar" },
    { code: "HKD", name: "Hong Kong Dollar" },
    { code: "HNL", name: "Honduran Lempira" },
    { code: "HRK", name: "Croatian Kuna" },
    { code: "HTG", name: "Haitian Gourde" },
    { code: "HUF", name: "Hungarian Forint" },
    { code: "IDR", name: "Indonesian Rupiah" },
    { code: "ILS", name: "Israeli Shekel" },
    { code: "INR", name: "Indian Rupee" },
    { code: "IQD", name: "Iraqi Dinar" },
    { code: "IRR", name: "Iranian Rial" },
    { code: "ISK", name: "Icelandic Krona" },
    { code: "JMD", name: "Jamaican Dollar" },
    { code: "JOD", name: "Jordanian Dinar" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "KES", name: "Kenyan Shilling" },
    { code: "KGS", name: "Kyrgystani Som" },
    { code: "KHR", name: "Cambodian Riel" },
    { code: "KMF", name: "Comorian Franc" },
    { code: "KPW", name: "North Korean Won" },
    { code: "KRW", name: "South Korean Won" },
    { code: "KWD", name: "Kuwaiti Dinar" },
    { code: "KYD", name: "Cayman Islands Dollar" },
    { code: "KZT", name: "Kazakhstani Tenge" },
    { code: "LAK", name: "Laotian Kip" },
    { code: "LBP", name: "Lebanese Pound" },
    { code: "LKR", name: "Sri Lankan Rupee" },
    { code: "LRD", name: "Liberian Dollar" },
    { code: "LSL", name: "Lesotho Loti" },
    { code: "LYD", name: "Libyan Dinar" },
    { code: "MAD", name: "Moroccan Dirham" },
    { code: "MDL", name: "Moldovan Leu" },
    { code: "MGA", name: "Malagasy Ariary" },
    { code: "MKD", name: "Macedonian Denar" },
    { code: "MMK", name: "Myanmar Kyat" },
    { code: "MNT", name: "Mongolian Tugrik" },
    { code: "MOP", name: "Macanese Pataca" },
    { code: "MRU", name: "Mauritanian Ouguiya" },
    { code: "MUR", name: "Mauritian Rupee" },
    { code: "MVR", name: "Maldivian Rufiyaa" },
    { code: "MWK", name: "Malawian Kwacha" },
    { code: "MXN", name: "Mexican Peso" },
    { code: "MYR", name: "Malaysian Ringgit" },
    { code: "MZN", name: "Mozambican Metical" },
    { code: "NAD", name: "Namibian Dollar" },
    { code: "NGN", name: "Nigerian Naira" },
    { code: "NIO", name: "Nicaraguan Cordoba" },
    { code: "NOK", name: "Norwegian Krone" },
    { code: "NPR", name: "Nepalese Rupee" },
    { code: "NZD", name: "New Zealand Dollar" },
    { code: "OMR", name: "Omani Rial" },
    { code: "PAB", name: "Panamanian Balboa" },
    { code: "PEN", name: "Peruvian Sol" },
    { code: "PGK", name: "Papua New Guinean Kina" },
    { code: "PHP", name: "Philippine Peso" },
    { code: "PKR", name: "Pakistani Rupee" },
    { code: "PLN", name: "Polish Zloty" },
    { code: "PYG", name: "Paraguayan Guarani" },
    { code: "QAR", name: "Qatari Riyal" },
    { code: "RON", name: "Romanian Leu" },
    { code: "RSD", name: "Serbian Dinar" },
    { code: "RUB", name: "Russian Ruble" },
    { code: "RWF", name: "Rwandan Franc" },
    { code: "SAR", name: "Saudi Riyal" },
    { code: "SBD", name: "Solomon Islands Dollar" },
    { code: "SCR", name: "Seychellois Rupee" },
    { code: "SDG", name: "Sudanese Pound" },
    { code: "SEK", name: "Swedish Krona" },
    { code: "SGD", name: "Singapore Dollar" },
    { code: "SLL", name: "Sierra Leonean Leone" },
    { code: "SOS", name: "Somali Shilling" },
    { code: "SRD", name: "Surinamese Dollar" },
    { code: "STN", name: "São Tomé and Príncipe Dobra" },
    { code: "SVC", name: "Salvadoran Colon" },
    { code: "SYP", name: "Syrian Pound" },
    { code: "SZL", name: "Swazi Lilangeni" },
    { code: "THB", name: "Thai Baht" },
    { code: "TJS", name: "Tajikistani Somoni" },
    { code: "TMT", name: "Turkmenistani Manat" },
    { code: "TND", name: "Tunisian Dinar" },
    { code: "TOP", name: "Tongan Paʻanga" },
    { code: "TRY", name: "Turkish Lira" },
    { code: "TTD", name: "Trinidad and Tobago Dollar" },
    { code: "TWD", name: "New Taiwan Dollar" },
    { code: "TZS", name: "Tanzanian Shilling" },
    { code: "UAH", name: "Ukrainian Hryvnia" },
    { code: "UGX", name: "Ugandan Shilling" },
    { code: "USD", name: "US Dollar" },
    { code: "UYU", name: "Uruguayan Peso" },
    { code: "UZS", name: "Uzbekistan Som" },
    { code: "VES", name: "Venezuelan Bolívar" },
    { code: "VND", name: "Vietnamese Dong" },
    { code: "VUV", name: "Vanuatu Vatu" },
    { code: "WST", name: "Samoan Tala" },
    { code: "XAF", name: "Central African CFA Franc" },
    { code: "XCD", name: "East Caribbean Dollar" },
    { code: "XOF", name: "West African CFA Franc" },
    { code: "XPF", name: "CFP Franc" },
    { code: "YER", name: "Yemeni Rial" },
    { code: "ZAR", name: "South African Rand" },
    { code: "ZMW", name: "Zambian Kwacha" },
    { code: "ZWL", name: "Zimbabwean Dollar" },
  ];

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      case "CNY": return "¥";
      case "INR": return "₹";
      case "AED": return "DH";
      default: return curr;
    }
  };
  
  const [items, setItems] = useState<Item[]>(
    leadFromState?.interested_product 
      ? [{ id: Date.now().toString(), product_id: "", product_name: leadFromState.interested_product, hsn_code: "", qty: 1, price: 0 }]
      : [{ id: Date.now().toString(), product_id: "", product_name: "", hsn_code: "", qty: 1, price: 0 }]
  );

  // New Packaging Type State
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [newPkgName, setNewPkgName] = useState("");
  const [savingPkg, setSavingPkg] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.company_id) return;
      const [leadsRes, productsRes, containersRes, pkgsRes] = await Promise.all([
        supabase.from('leads').select('*').eq('company_id', profile.company_id),
        supabase.from('products').select('*').eq('company_id', profile.company_id),
        supabase.from('container_types').select('name').order('name'),
        supabase.from('packaging_types').select('name').order('name')
      ]);
      if (leadsRes.data) setLeadsList(leadsRes.data);
      if (productsRes.data) setProductsList(productsRes.data);
      if (containersRes.data) setContainerTypesList(containersRes.data);
      if (pkgsRes.data) setPackagingTypesList(pkgsRes.data);
    };
    loadData();
  }, [profile?.company_id]);

  const loadPackagingTypes = async () => {
    const { data } = await supabase.from('packaging_types').select('name').order('name');
    if (data) setPackagingTypesList(data);
  };

  const handleAddPackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName) return toast.error("Packaging type name is required");
    
    setSavingPkg(true);
    try {
      const { error } = await supabase.from("packaging_types").insert({ name: newPkgName });
      if (error) throw error;
      toast.success("New packaging type added successfully");
      setIsPkgModalOpen(false);
      setNewPkgName("");
      loadPackagingTypes();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to add packaging type");
    } finally {
      setSavingPkg(false);
    }
  };

  useEffect(() => {
    if (!selectedLeadId) return;
    const lead = leadsList.find(l => l.id === selectedLeadId);
    if (lead) {
      setCustomerName(lead.company_name || lead.contact_name);
    }
  }, [selectedLeadId, leadsList]);

  const addItem = () => setItems((s) => [...s, { id: Date.now().toString(), product_id: "", product_name: "", hsn_code: "", qty: 1, price: 0 }]);
  const removeItem = (id: string) => setItems((s) => s.filter((i) => i.id !== id));
  const updateItem = (id: string, patch: Partial<Item>) => setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  
  const subtotal = items.reduce((s, i) => s + (Number(i.qty) * Number(i.price)), 0);
  const taxableAmount = subtotal + Number(packagingCost) + Number(shipmentCost);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const totalAmount = taxableAmount + taxAmount;

  const handleSave = async () => {
    if (!customerName || items.length === 0 || !items[0].product_name) {
      return toast.error("Please provide a customer name and at least one product.");
    }

    setSaving(true);
    try {
      // 1. Create Customer record if needed
      let customerId = null;
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .insert({ company_id: profile!.company_id, name: customerName })
        .select('id').single();
      
      if (!custErr && custData) customerId = custData.id;

      // 2. Create Quotation
      const finalQuoteNumber = quoteNumber || `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const { data: quoteData, error: quoteErr } = await supabase
        .from('quotations')
        .insert({
          company_id: profile!.company_id,
          customer_id: customerId,
          quotation_number: finalQuoteNumber,
          customer_phone: customerPhone || null,
          amount: totalAmount,
          subtotal: subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          container_type: containerType || null,
          packaging_type: packagingType || null,
          packaging_cost: Number(packagingCost),
          shipment_type: shipmentType || null,
          shipping_cost: Number(shipmentCost),
          country_of_origin: countryOfOrigin || null,
          port_of_loading: portOfLoading || null,
          port_of_discharge: portOfDischarge || null,
          net_weight: netWeight || null,
          currency,
          status: 'Draft',
          items_count: items.length,
          valid_until: validUntil || null,
          incoterm: incoterm || "CIF",
          payment_terms: paymentTerms,
          lead_id: selectedLeadId || null
        })
        .select('id').single();

      if (quoteErr) throw quoteErr;

      // 3. Create Quotation Items
      const insertItems = items.filter(i => i.product_name).map(i => ({
        quotation_id: quoteData.id,
        product_id: i.product_id || null, 
        quantity: Number(i.qty),
        unit_price: Number(i.price),
        total_price: Number(i.qty) * Number(i.price),
        description: i.product_name,
        hsn_code: i.hsn_code
      }));

      if (insertItems.length > 0) {
        const { error: itemsErr } = await supabase.from('quotation_items').insert(insertItems);
        if (itemsErr) throw itemsErr;
      }

      if (selectedLeadId) {
        await supabase.from("leads").update({ stage: "negotiation" }).eq("id", selectedLeadId);
      }

      toast.success("Quotation created successfully!");
      nav("/quotations");
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      toast.error(error.message || "Failed to create quotation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create Quotation" breadcrumbs={[{ label: "Quotations", to: "/quotations" }, { label: "New" }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Quotation
          </Button>
        </>}
      />

      <Dialog open={isPkgModalOpen} onOpenChange={setIsPkgModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Packaging Type</DialogTitle></DialogHeader>
          <form onSubmit={handleAddPackaging} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Packaging Name *</label>
              <Input value={newPkgName} onChange={e => setNewPkgName(e.target.value)} placeholder="e.g., Plastic Bag, Box, etc." required />
            </div>
            <Button type="submit" disabled={savingPkg} className="w-full">
              {savingPkg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Packaging Type
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <Section title="Customer & Terms">
          <FormGrid cols={3}>
            <FormRow label="Select CRM Lead">
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger><SelectValue placeholder="Link a lead (optional)" /></SelectTrigger>
                <SelectContent>
                  {leadsList.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.company_name || l.contact_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Quotation No.">
              <Input value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} placeholder="e.g. QT-2026-001 (auto if empty)" />
            </FormRow>
            <FormRow label="Customer Name *" required>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Company or contact name" />
            </FormRow>
            <FormRow label="Customer Phone">
              <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. +491729819755" />
            </FormRow>
            <FormRow label="Currency">
              <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={currencyOpen}
                    className="w-full justify-between"
                  >
                    {currency
                      ? `${currency} - ${currencies.find((c) => c.code === currency)?.name}`
                      : "Select currency..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search currency..." />
                    <CommandList>
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {currencies.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={`${c.code} ${c.name}`}
                            onSelect={() => {
                              setCurrency(c.code);
                              setCurrencyOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currency === c.code ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {c.code} - {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormRow>
            <FormRow label="Valid until">
              <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </FormRow>
            <FormRow label="Incoterm">
              <Select value={incoterm} onValueChange={setIncoterm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Container Type">
              <Select value={containerType} onValueChange={setContainerType}>
                <SelectTrigger><SelectValue placeholder="Select container type" /></SelectTrigger>
                <SelectContent>
                  {containerTypesList.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Packaging Type">
              <div className="flex gap-2">
                <Select value={packagingType} onValueChange={setPackagingType}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select packaging type" /></SelectTrigger>
                  <SelectContent>
                    {packagingTypesList.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setIsPkgModalOpen(true)} title="Add new packaging type">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormRow>
            <FormRow label="Packaging Cost">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                <Input type="number" min="0" className="pl-7" value={packagingCost || ""} onChange={e => setPackagingCost(Number(e.target.value) || 0)} placeholder="0.00" />
              </div>
            </FormRow>
            <FormRow label="Shipment Type">
              <Select value={shipmentType} onValueChange={setShipmentType}>
                <SelectTrigger><SelectValue placeholder="Select shipment type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Sea">Sea</SelectItem>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Shipment Cost">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                <Input type="number" min="0" className="pl-7" value={shipmentCost || ""} onChange={e => setShipmentCost(Number(e.target.value) || 0)} placeholder="0.00" />
              </div>
            </FormRow>
            <FormRow label="Net Weight">
              <Input value={netWeight} onChange={e => setNetWeight(e.target.value)} placeholder="e.g. 15.00 Kg" />
            </FormRow>
            <FormRow label="Country of Origin">
              <Input value={countryOfOrigin} onChange={e => setCountryOfOrigin(e.target.value)} placeholder="e.g. India" />
            </FormRow>
            <FormRow label="Port of Loading">
              <Input value={portOfLoading} onChange={e => setPortOfLoading(e.target.value)} placeholder="e.g. Nhava Sheva Port" />
            </FormRow>
            <FormRow label="Port of Discharge">
              <Input value={portOfDischarge} onChange={e => setPortOfDischarge(e.target.value)} placeholder="e.g. Jebel Ali Port" />
            </FormRow>
            <FormRow label="Tax Rate (%)">
              <Input type="number" min="0" max="100" step="any" value={taxRate} onChange={e => setTaxRate(Number(e.target.value) || 0)} placeholder="0.00" />
            </FormRow>
          </FormGrid>
          <div className="mt-4">
            <FormRow label="Terms of Payment">
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={paymentTerms} 
                onChange={e => setPaymentTerms(e.target.value)} 
                placeholder="Enter payment terms..."
              />
            </FormRow>
          </div>
        </Section>

        <Section title="Line Items" actions={<Button variant="outline" size="sm" onClick={addItem} disabled={saving}><Plus className="h-3.5 w-3.5 mr-1" />Add Item</Button>}>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-2">Product Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-32">HSN</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-24">Qty</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-32">Unit Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 w-32">Total</th>
                <th className="px-3 py-2 w-10" />
              </tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 border-border">
                    <td className="px-5 py-2">
                      <Input 
                        value={i.product_name} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const prod = productsList.find(p => p.name === val);
                          updateItem(i.id, { 
                            product_name: val, 
                            product_id: prod?.id || "",
                            hsn_code: prod?.hs_code || i.hsn_code
                          });
                        }} 
                        placeholder="Type product name..." 
                        list={`products-list-${i.id}`}
                      />
                      <datalist id={`products-list-${i.id}`}>
                        {productsList.map(p => <option key={p.id} value={p.name} />)}
                      </datalist>
                    </td>
                    <td className="px-3 py-2">
                      <Input 
                        value={i.hsn_code} 
                        onChange={(e) => updateItem(i.id, { hsn_code: e.target.value })} 
                        placeholder="HSN Code"
                      />
                    </td>
                    <td className="px-3 py-2"><Input type="number" min="1" value={i.qty} onChange={(e) => updateItem(i.id, { qty: Number(e.target.value) || 0 })} /></td>
                    <td className="px-3 py-2"><Input type="number" min="0" value={i.price} onChange={(e) => updateItem(i.id, { price: Number(e.target.value) || 0 })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{(i.qty * i.price).toLocaleString()}</td>
                    <td className="px-3 py-2"><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeItem(i.id)} disabled={items.length === 1}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span>{getCurrencySymbol(currency)} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Packaging Cost</span>
                <span>{getCurrencySymbol(currency)} {Number(packagingCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Shipment Cost</span>
                <span>{getCurrencySymbol(currency)} {Number(shipmentCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Tax (%)</span>
                <span className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="0" 
                    className="h-7 w-16 text-right px-2 py-0" 
                    value={taxRate || ""} 
                    onChange={e => setTaxRate(Number(e.target.value) || 0)} 
                    placeholder="0"
                  />
                </span>
                <span>{getCurrencySymbol(currency)} {taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-bold text-base">
                <span>Total Amount</span>
                <span className="tabular-nums text-primary">{getCurrencySymbol(currency)} {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
