import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, UserCheck, Globe, Search, Filter, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Edit2, FileDown, MessageSquare, AlertCircle, TrendingUp, History, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomersList() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // New state for Add/Edit/Detail
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    email: "",
    phone: "",
    notes: "",
    relationship_status: "Active Client",
    satisfaction_notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      // Fetch customers, leads, profiles, and orders for metrics
      const [custRes, leadsRes, profilesRes, ordersRes] = await Promise.all([
        supabase
          .from("customers" as any)
          .select("*")
          .eq("company_id", profile.company_id)
          .neq("is_deleted", true)
          .order("name"),
        supabase
          .from("leads" as any)
          .select("company_name, country, email"),
        supabase
          .from("profiles")
          .select("id, full_name"),
        supabase
          .from("sales_orders" as any)
          .select("id, customer_id, created_at")
          .eq("company_id", profile.company_id)
      ]);

      if (custRes.error) throw custRes.error;

      const leadsMap = new Map();
      (leadsRes.data as any[] || []).forEach((l: any) => {
        if (l.company_name) {
          leadsMap.set(l.company_name.toLowerCase(), l);
        }
      });

      const profilesMap = new Map();
      (profilesRes.data || []).forEach(p => {
        profilesMap.set(p.id, p.full_name);
      });

      const ordersByCustomer = new Map();
      (ordersRes.data || []).forEach(o => {
        const list = ordersByCustomer.get(o.customer_id) || [];
        list.push(o);
        ordersByCustomer.set(o.customer_id, list);
      });

      const merged = (custRes.data || []).map((c: any) => {
        const lead = leadsMap.get(c.name?.toLowerCase());
        const customerOrders = ordersByCustomer.get(c.id) || [];
        const lastOrder = customerOrders.length > 0
          ? new Date(Math.max(...customerOrders.map((o: any) => new Date(o.created_at).getTime())))
          : null;

        return {
          ...c,
          country: c.country || lead?.country || "Unspecified",
          email: c.email || lead?.email || "No email recorded",
          added_by_name: profilesMap.get(c.created_by) || "System / Auto",
          order_count: customerOrders.length,
          last_order_date: lastOrder,
          days_since_order: lastOrder ? differenceInDays(new Date(), lastOrder) : null
        };
      });

      setCustomers(merged);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load customer directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [profile?.company_id]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.country?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const handleDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("customers" as any).update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: profile?.id
      } as any).eq("id", deleteId);
      if (error) throw error;
      toast.success("Customer removed from view (soft-deleted)");
      setCustomers(customers.filter(c => c.id !== deleteId));
      setConfirmOpen(false);
    } catch (err: any) {
      toast.error("Could not delete customer record.");
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("customers" as any).insert([{
        ...formData,
        company_id: profile.company_id
      }]);

      if (error) throw error;

      toast.success("Customer added successfully");
      setIsAddDialogOpen(false);
      setFormData({ name: "", country: "", email: "", phone: "", notes: "", relationship_status: "Active Client", satisfaction_notes: "" });
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || "Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      country: customer.country || "",
      email: customer.email || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
      relationship_status: customer.relationship_status || "Active Client",
      satisfaction_notes: customer.satisfaction_notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleRowClick = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || "",
      country: customer.country || "",
      email: customer.email || "",
      phone: customer.phone || "",
      notes: customer.notes || "",
      relationship_status: customer.relationship_status || "Active Client",
      satisfaction_notes: customer.satisfaction_notes || ""
    });
    setIsSheetOpen(true);
  };

  const handleUpdateFromSheet = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from("customers" as any)
        .update({
          name: formData.name,
          country: formData.country,
          email: formData.email,
          relationship_status: formData.relationship_status,
          satisfaction_notes: formData.satisfaction_notes,
          phone: formData.phone,
          notes: formData.notes
        })
        .eq("id", selectedCustomer.id);

      if (error) throw error;

      toast.success("Client data synchronized");
      setIsSheetOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error("Failed to update record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotesClick = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      ...formData,
      satisfaction_notes: customer.satisfaction_notes || ""
    });
    setIsNotesDialogOpen(true);
  };

  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from("customers" as any)
        .update({
          satisfaction_notes: formData.satisfaction_notes
        })
        .eq("id", editingCustomer.id);

      if (error) throw error;

      toast.success("Engagement notes updated");
      setIsNotesDialogOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error("Failed to save notes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from("customers" as any)
        .update({
          name: formData.name,
          country: formData.country,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          relationship_status: formData.relationship_status
        })
        .eq("id", editingCustomer.id);

      if (error) throw error;

      toast.success("Customer updated successfully");
      setIsEditDialogOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = () => {
    if (customers.length === 0) return;

    const headers = ["Name", "Country", "Email", "Phone", "Notes"];
    const csvContent = [
      headers.join(","),
      ...customers.map(c => [
        `"${c.name || ''}"`,
        `"${c.country || ''}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Official database of your global clients and export partners"
        breadcrumbs={[{ label: "CRM", to: "/crm/leads" }, { label: "Customers" }]}
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or country..."
            className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={exportToCSV} className="flex-1 md:flex-none border-white/10 hover:bg-white/5">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex-1 md:flex-none btn-gold">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-2xl border-white/5">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-white/5">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Customer Name</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Region / Country</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Orders</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Added By</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">Accessing Directory...</p>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <div className="max-w-xs mx-auto space-y-3">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? `No matches found for "${searchQuery}"` : "Your Customer Directory is empty."}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Convert your won leads from the CRM pipeline to build your official client list.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="hover:bg-primary/5 transition-colors border-white/5 cursor-pointer"
                  onClick={() => handleRowClick(customer)}
                >
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span>{customer.name}</span>
                        {customer.days_since_order !== null && customer.days_since_order > 30 && (
                          <div className="flex items-center gap-1 text-[9px] text-red-500 font-bold uppercase mt-0.5">
                            <AlertCircle className="h-2.5 w-2.5" />
                            Inactive {customer.days_since_order}d
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "text-[9px] uppercase px-3 whitespace-nowrap border-none font-bold",
                      customer.relationship_status === "High Value Client" ? "bg-amber-500/20 text-amber-500" :
                        customer.relationship_status === "Repeat Buyer" ? "bg-blue-500/20 text-blue-500" :
                          customer.relationship_status === "Inactive Client" ? "bg-red-500/20 text-red-500" :
                            customer.relationship_status === "Potential Growth Client" ? "bg-purple-500/20 text-purple-500" :
                              "bg-emerald-500/20 text-emerald-500"
                    )}>
                      {customer.relationship_status || "Active Client"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-blue-500/70" />
                      <span className="font-medium">{customer.country || "Unspecified"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <History className="h-3 w-3 text-primary/60" />
                        {customer.order_count} {customer.order_count === 1 ? 'order' : 'orders'}
                      </div>
                      {customer.order_count > 1 && (
                        <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase">
                          <TrendingUp className="h-2.5 w-2.5" />
                          Repeat Buyer
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-orange-500/70" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {customer.added_by_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-all"
                        onClick={() => handleNotesClick(customer)}
                        title="Satisfaction Notes"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                        onClick={() => handleEditClick(customer)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                        onClick={() => handleDelete(customer.id, customer.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Search Insights */}
      {filteredCustomers.length > 0 && searchQuery && (
        <p className="text-xs text-muted-foreground italic">
          Showing {filteredCustomers.length} of {customers.length} total customers.
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Remove Customer"
        description={`Are you sure you want to remove "${deleteName}" from the business directory? This will only hide the record from view.`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel="Confirm Archive"
      />

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-neutral-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Customer Entry
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Manually add a new client to the official directory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-foreground">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-widest font-bold opacity-70">Company Name *</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/10" placeholder="e.g. Global Exports Ltd" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="text-xs uppercase tracking-widest font-bold opacity-70">Country</Label>
                <Input id="country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="bg-white/5 border-white/10" placeholder="e.g. Germany" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs uppercase tracking-widest font-bold opacity-70">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-white/5 border-white/10" placeholder="+1..." />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold opacity-70">Contact Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border-white/10" placeholder="contact@company.com" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs uppercase tracking-widest font-bold opacity-70">Initial Health Category</Label>
                <Select
                  value={String(formData.relationship_status || "")}
                  onValueChange={(val) => setFormData({ ...formData, relationship_status: val })}
                >
                  <SelectTrigger className="w-full bg-white/5 border border-white/10 rounded-md h-10 px-3 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10">
                    <SelectItem value="Active Client">Active Client</SelectItem>
                    <SelectItem value="Repeat Buyer">Repeat Buyer</SelectItem>
                    <SelectItem value="High Value Client">High Value Client</SelectItem>
                    <SelectItem value="Potential Growth Client">Potential Growth Client</SelectItem>
                    <SelectItem value="Inactive Client">Inactive Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes" className="text-xs uppercase tracking-widest font-bold opacity-70">Business Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-white/5 border-white/10 min-h-[100px]" placeholder="Key commodities, past requirements..." />
              </div>
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-white/10">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="btn-gold min-w-[120px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-neutral-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-primary" />
              Edit Customer Info
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-foreground">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-name" className="text-xs uppercase tracking-widest font-bold opacity-70">Company Name</Label>
                <Input id="edit-name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country" className="text-xs uppercase tracking-widest font-bold opacity-70">Country</Label>
                <Input id="edit-country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-xs uppercase tracking-widest font-bold opacity-70">Phone</Label>
                <Input id="edit-phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-email" className="text-xs uppercase tracking-widest font-bold opacity-70">Email Address</Label>
                <Input id="edit-email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs uppercase tracking-widest font-bold opacity-70">Relationship Health Status</Label>
                <Select
                  value={String(formData.relationship_status || "")}
                  onValueChange={(val) => setFormData({ ...formData, relationship_status: val })}
                >
                  <SelectTrigger className="w-full bg-white/5 border border-white/10 rounded-md h-10 px-3 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10">
                    <SelectItem value="Active Client">Active Client</SelectItem>
                    <SelectItem value="Repeat Buyer">Repeat Buyer</SelectItem>
                    <SelectItem value="High Value Client">High Value Client</SelectItem>
                    <SelectItem value="Potential Growth Client">Potential Growth Client</SelectItem>
                    <SelectItem value="Inactive Client">Inactive Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-white/10">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="btn-gold min-w-[120px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Satisfaction Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-neutral-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              Satisfaction & Feedback
            </DialogTitle>
            <DialogDescription className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
              {editingCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNotesSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold opacity-70">Customer Service Notes</Label>
              <Textarea
                value={formData.satisfaction_notes}
                onChange={e => setFormData({ ...formData, satisfaction_notes: e.target.value })}
                placeholder="Log satisfaction level, recent complaints, or relationship health notes..."
                className="bg-white/5 border-white/10 min-h-[150px] text-foreground"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsNotesDialogOpen(false)} className="text-muted-foreground">Close</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Save Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[500px] bg-neutral-950 border-l border-white/10 p-0 overflow-y-auto">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent relative">
            <div className="absolute -bottom-10 left-8">
              <div className="h-20 w-20 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-primary shadow-2xl">
                <User className="h-10 w-10" />
              </div>
            </div>
          </div>

          <div className="p-8 pt-16 space-y-8">
            <SheetHeader className="text-left">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-bold">{selectedCustomer?.name}</SheetTitle>
              </div>
              <SheetDescription className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                {selectedCustomer?.country} • {selectedCustomer?.email}
              </SheetDescription>
            </SheetHeader>

            <Separator className="bg-white/5" />

            {/* Health Status Dropdown */}
            <div className="space-y-4">
              <Label className="text-xs uppercase tracking-widest font-bold opacity-70">Relationship Health</Label>
              <Select
                value={formData.relationship_status}
                onValueChange={(val) => setFormData({ ...formData, relationship_status: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 h-12">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10">
                  <SelectItem value="Active Client">Active Client</SelectItem>
                  <SelectItem value="Repeat Buyer">Repeat Buyer</SelectItem>
                  <SelectItem value="High Value Client">High Value Client</SelectItem>
                  <SelectItem value="Potential Growth Client">Potential Growth Client</SelectItem>
                  <SelectItem value="Inactive Client">Inactive Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Orders</p>
                <p className="text-2xl font-mono font-bold text-primary">{selectedCustomer?.order_count}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Business Alert</p>
                {selectedCustomer?.days_since_order > 30 ? (
                  <p className="text-red-500 font-bold flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Inactive
                  </p>
                ) : (
                  <p className="text-emerald-500 font-bold italic">Healthy</p>
                )}
              </div>
            </div>

            {/* Satisfaction Notes */}
            <div className="space-y-4">
              <Label className="text-xs uppercase tracking-widest font-bold opacity-70">Customer Service & Satisfaction Notes</Label>
              <Textarea
                value={formData.satisfaction_notes}
                onChange={(e) => setFormData({ ...formData, satisfaction_notes: e.target.value })}
                className="bg-white/5 border-white/10 min-h-[120px] focus:ring-primary"
                placeholder="Log internal feedback, complaints, or positive results..."
              />
            </div>

            {/* Meta Data */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="opacity-60">Account Holder</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-orange-400" />
                  {selectedCustomer?.added_by_name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="opacity-60">Last Engagement</span>
                <span className="font-mono">
                  {selectedCustomer?.last_order_date ? format(new Date(selectedCustomer.last_order_date), "MMM d, yyyy") : "No orders recorded"}
                </span>
              </div>
            </div>

            <SheetFooter className="mt-8">
              <Button
                onClick={handleUpdateFromSheet}
                disabled={isSubmitting}
                className="w-full btn-gold h-12 text-lg"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Synchronize Records"}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

