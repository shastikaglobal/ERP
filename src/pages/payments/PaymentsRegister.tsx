import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function PaymentsRegister() {
  const { roleSlugs, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    party_name: "",
    reference_no: "",
    method: "Wire Transfer",
    amount: "",
    currency: "USD",
    received_at: format(new Date(), "yyyy-MM-dd"),
    status: "Pending",
    remarks: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (roleSlugs.has("farmer") || roleSlugs.has("buyer")) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [authLoading, roleSlugs, navigate]);

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          payment_number,
          amount,
          currency,
          method,
          status,
          received_at,
          party_name,
          reference_no,
          remarks,
          invoices (
            invoice_number
          ),
          customers (
            name
          )
        `);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          currency,
          status,
          due_at,
          sales_orders (
            order_number
          ),
          customers (
            name
          )
        `)
        .neq('status', 'Paid');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const addPayment = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: inserted, error } = await supabase.from('payments').insert({
        company_id: profile?.company_id,
        party_name: data.party_name,
        reference_no: data.reference_no,
        payment_number: `PAY-${Date.now().toString().slice(-6)}`,
        method: data.method,
        amount: parseFloat(data.amount),
        currency: data.currency,
        received_at: new Date(data.received_at).toISOString(),
        status: data.status,
        remarks: data.remarks,
      });
      if (error) throw error;
      return inserted;
    },
    onSuccess: () => {
      toast.success("Payment added successfully");
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setOpen(false);
      setFormData({
        party_name: "",
        reference_no: "",
        method: "Wire Transfer",
        amount: "",
        currency: "USD",
        received_at: format(new Date(), "yyyy-MM-dd"),
        status: "Pending",
        remarks: "",
      });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add payment");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.party_name || !formData.reference_no || !formData.amount || !formData.received_at) {
      toast.error("Please fill all required fields");
      return;
    }
    addPayment.mutate(formData);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (roleSlugs.has("farmer") || roleSlugs.has("buyer")) return null;

  const isLoading = isLoadingPayments || isLoadingInvoices;

  const all = [
    ...payments.map((p: any) => ({
      id: p.payment_number,
      ref: p.reference_no || p.invoices?.invoice_number || 'N/A',
      party: p.party_name || p.customers?.name || 'Unknown',
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      status: p.status,
      date: p.received_at ? format(new Date(p.received_at), 'MMM dd, yyyy') : '—',
    })),
    ...invoices.map((i: any) => ({
      id: i.invoice_number,
      ref: i.sales_orders?.order_number || 'N/A',
      party: i.customers?.name || 'Unknown',
      amount: i.amount,
      currency: i.currency,
      method: "Pending",
      status: i.status,
      date: i.due_at ? format(new Date(i.due_at), 'MMM dd, yyyy') : '—',
    })),
  ];

  return (
    <div>
      <PageHeader 
        title="Payment Register" 
        description="All incoming and outstanding payments" 
        breadcrumbs={[{ label: "Payments" }]} 
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Plus className="h-4 w-4" /> Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="party_name">Party Name *</Label>
                    <Input 
                      id="party_name" 
                      value={formData.party_name}
                      onChange={(e) => setFormData({...formData, party_name: e.target.value})}
                      placeholder="e.g. Acme Corp" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference_no">Reference No *</Label>
                    <Input 
                      id="reference_no" 
                      value={formData.reference_no}
                      onChange={(e) => setFormData({...formData, reference_no: e.target.value})}
                      placeholder="Invoice or Order Ref" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={formData.method} onValueChange={(val) => setFormData({...formData, method: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                        <SelectItem value="TT">TT</SelectItem>
                        <SelectItem value="LC">LC</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Received">Received</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={formData.currency} onValueChange={(val) => setFormData({...formData, currency: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="received_at">Payment Date *</Label>
                    <Input 
                      id="received_at" 
                      type="date"
                      value={formData.received_at}
                      onChange={(e) => setFormData({...formData, received_at: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea 
                      id="remarks" 
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      placeholder="Optional notes..." 
                      className="resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addPayment.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                    {addPayment.isPending ? "Saving..." : "Save Payment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          data={all}
          searchKeys={["id", "party", "ref"]}
          columns={[
            { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
            { key: "party", header: "Party", render: (r) => <span className="font-medium">{r.party}</span> },
            { key: "ref", header: "Reference", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ref}</span> },
            { key: "method", header: "Method", render: (r) => <span className="text-sm">{r.method}</span> },
            { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {r.amount.toLocaleString()}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "date", header: "Date", render: (r) => <span className="text-xs text-muted-foreground">{r.date}</span> },
          ]}
        />
      )}
    </div>
  );
}
