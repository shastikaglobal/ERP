import { useState, useEffect } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { 
  UserPlus, 
  Star, 
  BarChart3, 
  TrendingUp, 
  Search, 
  UserCheck, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Globe,
  Calendar,
  DollarSign,
  ChevronRight,
  Loader2,
  Users
} from "lucide-react";
import { fetchBdeProfiles } from "@/lib/bde";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const STAGES = [
  "Lead Generated",
  "Assigned to BDE",
  "Communication & Follow-up",
  "Quotation Shared",
  "Negotiation",
  "Client Successfully Acquired"
];

const SOURCES = [
  "Corporate Website",
  "Trade Fair / Expo",
  "Partner Referral",
  "LinkedIn Outbound",
  "Marketplace B2B",
  "Direct Inquiry",
  "Cold Call"
];

export default function ClientAcquisition() {
  const [data, setData] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [bdes, setBdes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    lead_id: "",
    client_name: "",
    country: "",
    inquiry_source: "Corporate Website",
    assigned_bde: "",
    acquisition_date: format(new Date(), "yyyy-MM-dd"),
    product_interested: "",
    deal_value: "0",
    status: STAGES[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, profilesRes, bdeProfiles] = await Promise.all([
        supabase.from("client_acquisition" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name").order("full_name"),
        fetchBdeProfiles(supabase)
      ]);

      if (recordsRes.error) throw recordsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setData(recordsRes.data || []);
      setProfiles(profilesRes.data || []);
      setBdes(bdeProfiles || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads" as any)
        .select("id, company_name, country, product_type, assigned_to")
        .order("company_name", { ascending: true });

      if (error) {
        console.error("Fetch leads error:", error);
        const message = error.message?.toLowerCase().includes("permission")
          ? "Unable to load leads. Ensure authenticated users have read access to the leads table."
          : error.message || "Failed to fetch leads.";
        toast.error(message);
        return;
      }

      setLeads(data || []);
    } catch (error: any) {
      console.error("Fetch leads error:", error);
      toast.error(error.message || "Failed to fetch leads.");
    }
  };

  useEffect(() => {
    fetchData();
    fetchLeads();
  }, []);

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      setFormData(prev => ({
        ...prev,
        lead_id: "",
        client_name: "",
        country: "",
        assigned_bde: "",
        product_interested: ""
      }));
      return;
    }

    const matchedProfile = profiles.find(
      p => p.id === lead.assigned_to || p.full_name?.toLowerCase() === lead.assigned_to?.toLowerCase()
    );

    setFormData(prev => ({
      ...prev,
      lead_id: leadId,
      client_name: lead.company_name,
      country: lead.country || "",
      product_interested: lead.product_type || "",
      assigned_bde: matchedProfile?.id || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lead_id) {
      toast.error("Please choose a lead from the existing leads list.");
      return;
    }

    try {
      const payload = {
        ...formData,
        deal_value: parseFloat(formData.deal_value) || 0,
        // Ensure assigned_bde is a valid UUID or null
        assigned_bde: formData.assigned_bde && formData.assigned_bde.length === 36 ? formData.assigned_bde : null
      };

      if (editingId) {
        const { error } = await supabase
          .from("client_acquisition" as any)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Record updated successfully");
      } else {
        const { error } = await supabase
          .from("client_acquisition" as any)
          .insert([payload]);
        if (error) throw error;
        toast.success("New record added");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    setFormData({
      lead_id: record.lead_id || "",
      client_name: record.client_name,
      country: record.country || "",
      inquiry_source: record.inquiry_source || "Corporate Website",
      assigned_bde: record.assigned_bde || "",
      acquisition_date: record.acquisition_date || format(new Date(), "yyyy-MM-dd"),
      product_interested: record.product_interested || "",
      deal_value: record.deal_value?.toString() || "0",
      status: record.status || STAGES[0]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!idToDelete) return;
    try {
      const { error } = await supabase
        .from("client_acquisition" as any)
        .delete()
        .eq("id", idToDelete);
      if (error) throw error;
      toast.success("Record deleted");
      setDeleteConfirmOpen(false);
      setIdToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      lead_id: "",
      client_name: "",
      country: "",
      inquiry_source: "Corporate Website",
      assigned_bde: "",
      acquisition_date: format(new Date(), "yyyy-MM-dd"),
      product_interested: "",
      deal_value: "0",
      status: STAGES[0]
    });
  };

  const filteredData = data.filter(item => 
    item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_interested?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalLeads: data.length,
    converted: data.filter(d => d.status === STAGES[5]).length,
    conversionRate: data.length > 0 ? (data.filter(d => d.status === STAGES[5]).length / data.length * 100).toFixed(1) : "0",
    totalPipe: data.reduce((sum, d) => sum + (d.deal_value || 0), 0)
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case STAGES[0]: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case STAGES[1]: return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case STAGES[2]: return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case STAGES[3]: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case STAGES[4]: return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case STAGES[5]: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-foreground pb-10">
      <SectionHeader
        title="CRM Client Acquisition"
        sub="Monitor the complete funnel from lead generation to successful acquisition"
        actions={
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (open) fetchLeads(); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-gold shadow-md">
                  <Plus className="h-4 w-4 mr-1.5" /> Add New Record
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {editingId ? <Edit2 className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                    {editingId ? "Edit Acquisition Record" : "New Acquisition Entry"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2 col-span-2 text-foreground">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Select Client (from Leads table)</label>
                    <Select 
                      required
                      value={formData.lead_id}
                      onValueChange={handleLeadSelect}
                    >
                      <SelectTrigger className="bg-neutral-900 border-border h-11">
                        <SelectValue placeholder="Select a company from your leads" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-border">
                        {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.company_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Country</label>
                    <Input 
                      readOnly
                      value={formData.country}
                      placeholder="Auto-filled"
                      className="bg-neutral-900 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Assigned BDE</label>
                    <Select 
                      value={formData.assigned_bde}
                      onValueChange={val => setFormData({...formData, assigned_bde: val})}
                    >
                      <SelectTrigger className="bg-neutral-900 border-border">
                        <SelectValue placeholder="Select BDE" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-border">
                        <SelectItem value="none">None / Unassigned</SelectItem>
                        <SelectItem value="gayathri">Gayathri</SelectItem>
                        <SelectItem value="vemula">Vemula Navya lahari</SelectItem>
                        {bdes.filter(b => b.full_name !== 'Gayathri' && b.full_name !== 'Vemula Navya lahari').map(bde => (
                          <SelectItem key={bde.id} value={bde.id}>
                            {bde.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Product Interested</label>
                    <Input 
                      readOnly
                      value={formData.product_interested}
                      placeholder="Auto-filled"
                      className="bg-neutral-900 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Inquiry Source</label>
                    <Select 
                      value={formData.inquiry_source} 
                      onValueChange={val => setFormData({...formData, inquiry_source: val})}
                    >
                      <SelectTrigger className="bg-neutral-900 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-border">
                        {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Acquisition Date</label>
                    <Input 
                      type="date"
                      value={formData.acquisition_date}
                      onChange={e => setFormData({...formData, acquisition_date: e.target.value})}
                      className="bg-neutral-900 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Deal Value ($)</label>
                    <Input 
                      type="number"
                      value={formData.deal_value === "0" ? "" : formData.deal_value}
                      onChange={e => setFormData({...formData, deal_value: e.target.value === "" ? "0" : e.target.value})}
                      placeholder="0.00"
                      className="bg-neutral-900 border-border font-mono"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Workflow Stage</label>
                    <Select 
                      value={formData.status} 
                      onValueChange={val => setFormData({...formData, status: val})}
                    >
                      <SelectTrigger className="bg-neutral-900 border-border h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-border">
                        {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="col-span-2 mt-4">
                    <Button type="submit" className="w-full btn-gold h-11">
                      {editingId ? "Update Record" : "Save Record"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-border shadow-sm hover:bg-neutral-900"
              onClick={() => window.location.href = "/crm/reports"}
            >
              <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics
            </Button>
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md border-border shadow-lg">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Leads in Pipeline</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{stats.totalLeads}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md border-border shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Acquired Clients</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{stats.converted}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md border-border shadow-lg">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Conversion Rate</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{stats.conversionRate}%</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md border-border shadow-lg">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Pipeline Value</div>
            <div className="text-2xl font-bold font-mono mt-0.5">${stats.totalPipe.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4 border-border shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Client Acquisition Pipeline</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and track the conversion journey of potential global trade partners</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search clients, countries..." 
              className="pl-9 h-9 bg-neutral-900 border-border"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                <th className="p-4">Acquisition Date</th>
                <th className="p-4">Client Name</th>
                <th className="p-4">Origin / Country</th>
                <th className="p-4">Source</th>
                <th className="p-4">Assigned BDE</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Deal Value</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <span className="text-xs text-muted-foreground mt-2 block">Loading pipeline...</span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground">
                    No matching records found. Use the "Add New Record" button to start tracking.
                  </td>
                </tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors group">
                  <td className="p-4 font-mono text-muted-foreground">
                    {item.acquisition_date ? format(new Date(item.acquisition_date), "dd MMM yyyy") : "N/A"}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-foreground">{item.client_name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{item.product_interested || "General Product"}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-blue-400" />
                      <span className="text-muted-foreground">{item.country || "International"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-[10px] font-normal border-border opacity-70">
                      {item.inquiry_source}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {profiles.find(p => p.id === item.assigned_bde || p.full_name === item.assigned_bde)?.full_name || item.assigned_bde || "Unassigned"}
                  </td>
                  <td className="p-4">
                    <Badge className={`text-[10px] font-black uppercase tracking-tighter rounded-full border ${getStageColor(item.status)}`}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-500">
                    ${(item.deal_value || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-neutral-900 border-border shadow-2xl">
                        <DropdownMenuItem className="text-xs cursor-pointer focus:bg-primary/10" onClick={() => handleEdit(item)}>
                          <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Workflow Visualization */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-4">
        {STAGES.map((stage, i) => (
          <div key={stage} className="relative">
            <div className={cn(
              "p-3 rounded-lg border text-center transition-all duration-500 h-full flex flex-col items-center justify-center gap-1.5",
              data.some(d => d.status === stage) 
                ? "bg-primary/5 border-primary/30" 
                : "bg-neutral-900 border-border/40 opacity-40"
            )}>
              <div className={cn(
               "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
               data.some(d => d.status === stage) ? "bg-primary text-white border-primary" : "bg-neutral-800 text-muted-foreground border-border"
              )}>
                {i + 1}
              </div>
              <div className="text-[9px] font-black uppercase tracking-tight leading-tight">
                {stage}
              </div>
              <div className="text-xs font-mono font-bold text-foreground">
                {data.filter(d => d.status === stage).length}
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 z-10 hidden lg:block" />
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Acquisition Record"
        description="Are you sure you want to remove this record? This action cannot be undone and will remove the client from your acquisition pipeline."
        onConfirm={executeDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setIdToDelete(null);
        }}
        confirmLabel="Remove Record"
      />
    </div>
  );
}
