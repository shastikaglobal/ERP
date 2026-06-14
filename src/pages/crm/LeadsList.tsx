import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Loader2, Plus, Trash2, MessageSquare, Search, FileDown, FileSpreadsheet, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { authFetch } from "@/lib/api";
import {
  CRM_LEAD_STAGES,
  CRM_OPEN_LEAD_STAGES,
  CRM_CLOSED_LEAD_STAGES,
  getLeadStageBadgeColor,
  isWonLeadStage,
} from "@/lib/crmStages";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

// CRM Security Imports
import { useCRMPermissions } from "@/hooks/useCRMPermissions";
import { exportCRMtoPDF, exportCRMtoExcel } from "@/utils/crmExport";
import { useCRMPageTracking } from "@/hooks/useCRMPageTracking";

type Lead = {

  id: string;
  date: string;
  business_category: string;
  company_name: string;
  contact_name?: string | null;
  product_type: string;
  country: string;
  mobile: string;
  email: string;
  website: string;
  stage: string;
  assigned_to: string | null;
  remark?: string | null;
  source_id?: string | null;
};

const STAGES = CRM_LEAD_STAGES;

const EMAIL_SEPARATOR_REGEX = /[;,\n]+/;

const parseEmails = (value?: string | null) =>
  value
    ? value
      .split(EMAIL_SEPARATOR_REGEX)
      .map((email) => email.trim())
      .filter(Boolean)
    : [];

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function LeadsList() {
  useCRMPageTracking(); // STEP 5: Add page tracking
  const { roleSlugs } = useAuth();

  const { isAdmin, isManager, isPrivileged, canExportPDF, canExportExcel, isLoading: permissionsLoading } = useCRMPermissions();

  // Allow admin, manager and bde to edit lead stage
  const canEditStage = ["admin", "manager", "bde"].some((r) => roleSlugs.has(r));
  const nav = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedFollowUpLead, setSelectedFollowUpLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const bdTeam = ["Gayathri", "Vemula Navya Lahari", "Aditi"];
  const [followUpAssignedTo, setFollowUpAssignedTo] = useState(bdTeam[0]);

  const [isRemarkOpen, setIsRemarkOpen] = useState(false);
  const [selectedRemarkLead, setSelectedRemarkLead] = useState<Lead | null>(null);
  const [remarkMethod, setRemarkMethod] = useState("WhatsApp");
  const [remarkText, setRemarkText] = useState("");

  // Form state
  const [date, setDate] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [productType, setProductType] = useState("");
  const [country, setCountry] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Assignment state
  const [team, setTeam] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [leadsTab, setLeadsTab] = useState<"open" | "closed">("open");

  const OPEN_STAGES = CRM_OPEN_LEAD_STAGES;
  const CLOSED_STAGES = CRM_CLOSED_LEAD_STAGES;

  const uniqueCountries = Array.from(
    new Set(leads
      .map((lead) => lead.country?.trim() || "")
      .filter(Boolean))
  ).sort();

  const openLeadsCount = leads.filter(l => OPEN_STAGES.some(s => s.toLowerCase() === l.stage?.toLowerCase())).length;
  const closedLeadsCount = leads.filter(l => CLOSED_STAGES.some(s => s.toLowerCase() === l.stage?.toLowerCase())).length;

  const filteredLeads = leads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      lead.company_name?.toLowerCase().includes(query) ||
      lead.country?.toLowerCase().includes(query) ||
      lead.product_type?.toLowerCase().includes(query) ||
      lead.assigned_to?.toLowerCase().includes(query) ||
      lead.business_category?.toLowerCase().includes(query) ||
      lead.mobile?.toLowerCase().includes(query);

    const matchesCountry =
      selectedCountry === "All Countries" ||
      lead.country === selectedCountry;

    const matchesTab =
      leadsTab === "open"
        ? OPEN_STAGES.some(s => s.toLowerCase() === lead.stage?.toLowerCase())
        : CLOSED_STAGES.some(s => s.toLowerCase() === lead.stage?.toLowerCase());

    return matchesSearch && matchesCountry && matchesTab;
  });

  const fetchLeads = async () => {
    try {
      const res = await authFetch('/api/leads');
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Failed to fetch leads: ${res.status} ${res.statusText} ${errorBody}`);
      }
      const data = await res.json();
      setLeads(data as unknown as Lead[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await authFetch('/api/employees');
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Failed to fetch employees: ${res.status} ${res.statusText} ${errorBody}`);
      }
      const profiles = await res.json();
      setTeam(profiles);
    } catch (error) {
      console.warn('[LeadsList] fetchTeam failed:', error);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await authFetch('/api/leads/meta/sources');
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Failed to fetch sources: ${res.status} ${res.statusText} ${errorBody}`);
      }
      const data = await res.json();
      setSources(data);
    } catch (error) {
      console.warn('[LeadsList] fetchSources failed:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchTeam();
    fetchSources();

    // Subscribe to global sync broadcast for real-time updates
    const channel = supabase
      .channel('leads-list-sync')
      .on('broadcast', { event: 'data_changed' }, (payload) => {
        if (payload.payload?.table === 'leads') {
          console.log('[LeadsList] 🔔 Lead update detected via broadcast, refreshing...');
          fetchLeads();
        }
      })
      .subscribe();

    const pollInterval = setInterval(fetchLeads, 15000); // Slower fallback

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const resetForm = () => {
    setDate("");
    setBusinessCategory("");
    setCompanyName("");
    setContactName("");
    setProductType("");
    setCountry("");
    setMobile("");
    setEmail("");
    setWebsite("");
    setAssignedTo("");
    setSourceId("");
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      toast.error("Company name is required");
      return;
    }

    const parsedEmails = parseEmails(email);
    if (parsedEmails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    if (!parsedEmails.every(isValidEmail)) {
      toast.error("Please enter valid email addresses separated by commas, semicolons, or new lines");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date || null,
          business_category: businessCategory,
          company_name: companyName,
          contact_name: contactName,
          product_type: productType,
          country: country,
          mobile: mobile,
          email: parsedEmails.join(", "),
          website: website,
          stage: "New",
          assigned_to: String(assignedTo || ""),
          source_id: sourceId && sourceId !== "none" ? sourceId : null
        })
      });

      if (!res.ok) throw new Error("Failed to create lead");

      toast.success("Lead created successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const convertToCustomer = async (lead: Lead) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const empRes = await authFetch(`/api/employees/${session?.user?.id}`);
      if (!empRes.ok) throw new Error("Could not identify your company");
      const empData = await empRes.json();
      const companyId = empData?.company_id;

      if (!companyId) throw new Error("Could not identify your company");

      const res = await authFetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          name: lead.company_name,
          country: lead.country,
          email: lead.email,
        })
      });

      if (!res.ok) throw new Error("Conversion failed");

      toast.success(`${lead.company_name} is now a registered Customer!`);
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Conversion failed");
    }
  };

  const openFollowUp = (lead: Lead) => {
    setSelectedFollowUpLead(lead);
    setFollowUpDate(new Date().toISOString().slice(0, 10));
    setFollowUpNote("");
    setFollowUpAssignedTo(bdTeam[0]);
    setIsFollowUpOpen(true);
  };

  const saveFollowUp = async () => {
    if (!selectedFollowUpLead || !followUpDate) {
      toast.error("Please enter a follow-up date");
      return;
    }

    const assignee = followUpAssignedTo;
    try {
      const res = await authFetch(`/api/leads/${selectedFollowUpLead.id}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: selectedFollowUpLead.company_name,
          contact_name: selectedFollowUpLead.contact_name,
          follow_up_date: followUpDate,
          note: followUpNote,
          assigned_to: assignee,
        })
      });

      if (!res.ok) throw new Error("Failed to save follow up");

      toast.success("Follow-up saved successfully");
      setIsFollowUpOpen(false);
      setSelectedFollowUpLead(null);
      setFollowUpDate("");
      setFollowUpNote("");
      setFollowUpAssignedTo(bdTeam[0]);

      // Refresh the leads list to show the updated assigned_to value
      await fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to save follow-up");
    }
  };

  const openRemark = (lead: Lead) => {
    setSelectedRemarkLead(lead);

    // Robustly parse existing remark: "[Method]: Note"
    if (lead.remark && lead.remark.includes(']: ')) {
      const parts = lead.remark.split(']: ');
      const method = parts[0].replace('[', '').trim();
      const note = parts.slice(1).join(']: ').trim();
      setRemarkMethod(method);
      setRemarkText(note);
    } else {
      // Default for no prefix - check if it's just a raw note
      setRemarkMethod("WhatsApp");
      setRemarkText(lead.remark || "");
    }

    setIsRemarkOpen(true);
  };

  const saveRemark = async () => {
    if (!selectedRemarkLead) return;
    setSubmitting(true);
    try {
      const trimmedText = remarkText.trim();
      // Ensure we store in the standardized "[Method]: Note" format
      const formattedRemark = trimmedText ? `[${remarkMethod}]: ${trimmedText}` : "";

      const res = await authFetch(`/api/leads/${selectedRemarkLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: formattedRemark })
      });

      if (!res.ok) throw new Error("Failed to update remark");
      toast.success("Remark updated successfully");
      setIsRemarkOpen(false);
      setSelectedRemarkLead(null);
      setRemarkText("");
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to save remark");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await authFetch(`/api/leads/${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Failed to delete lead");
      toast.success("Lead removed from view (soft-deleted)");
      // Refresh list to hide it
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const toggleLeadStatus = async (lead: Lead, newStage: string) => {
    const previousLeads = [...leads];
    setLeads(leads.map((item) => item.id === lead.id ? { ...item, stage: newStage } : item));

    try {
      const res = await authFetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || errorBody?.message || `${res.status} ${res.statusText}`;
        throw new Error(`Failed to update status: ${message}`);
      }

      toast.success(`Lead status updated to ${newStage}`);
      await fetchLeads();
    } catch (err: any) {
      console.error('[LeadsList] Stage update failed:', err);
      setLeads(previousLeads);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleExportPDF = () => {
    exportCRMtoPDF("crm-table", isPrivileged, filteredLeads.length);
  };

  const handleExportExcel = () => {
    exportCRMtoExcel(filteredLeads, isPrivileged);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads</h1>
          {isAdmin ? (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 px-3 py-1">
              <ShieldCheck className="h-3 w-3" /> Admin
            </Badge>
          ) : isManager ? (
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1 px-3 py-1">
              <ShieldCheck className="h-3 w-3" /> Manager
            </Badge>
          ) : (
            <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 gap-1 px-3 py-1">
              <ShieldAlert className="h-3 w-3" /> View Only
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={handleExportPDF}
                    disabled={!canExportPDF}
                    className={!canExportPDF ? "opacity-40 cursor-not-allowed" : ""}
                  >
                    <FileDown className="mr-2 h-4 w-4" /> Export PDF
                  </Button>
                </span>
              </TooltipTrigger>
              {!canExportPDF && <TooltipContent>Privileged access required</TooltipContent>}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    disabled={!canExportExcel}
                    className={!canExportExcel ? "opacity-40 cursor-not-allowed" : ""}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                  </Button>
                </span>
              </TooltipTrigger>
              {!canExportExcel && <TooltipContent>Privileged access required</TooltipContent>}
            </Tooltip>
          </TooltipProvider>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Lead</DialogTitle>
                <DialogDescription className="text-muted-foreground/60 text-xs">
                  Enter company and contact details to add a new lead to the CRM.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">

                {/* DATE */}
                <div className="space-y-2">
                  <Label className="text-foreground">DATE *</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="bg-background border-input"
                  />
                </div>

                {/* Business Category */}
                <div className="space-y-2">
                  <Label className="text-foreground">Business Category *</Label>
                  <Input
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    placeholder="Enter Business Category"
                    required
                    className="bg-background border-input"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label className="text-foreground">Company Name *</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter Company Name"
                    required
                    className="bg-background border-input"
                  />
                </div>

                {/* Contact Name */}
                <div className="space-y-2">
                  <Label className="text-foreground">Contact Name</Label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter contact person name"
                    className="bg-background border-input"
                  />
                </div>

                {/* Product Type */}
                <div className="space-y-2">
                  <Label className="text-foreground">Product_Type *</Label>
                  <Input
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="Enter Product_Type"
                    className="bg-background border-input"
                  />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label className="text-foreground">Country *</Label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Enter Country"
                    className="bg-background border-input"
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <Label className="text-foreground">Mobile *</Label>
                  <Input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter Mobile Number"
                    className="bg-background border-input"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-foreground">Email *</Label>
                  <Textarea
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter one or more emails, separated by commas, semicolons, or new lines."
                    className="bg-background border-input min-h-[70px]"
                    autoComplete="off"
                    name="emails"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    You can paste or type many emails, separated by commas, semicolons, or new lines.
                  </p>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label className="text-foreground">Website</Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Enter Website"
                    className="bg-background border-input"
                  />
                </div>

                {/* Assigned To */}
                <div className="space-y-2">
                  <Label className="text-foreground">Assigned To *</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo} required>
                    <SelectTrigger className="h-10 bg-background border-input">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {bdTeam.map((member) => (
                        <SelectItem key={member} value={member}>
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lead Source */}
                <div className="space-y-2">
                  <Label className="text-foreground">Lead Source</Label>
                  <Select value={sourceId} onValueChange={setSourceId}>
                    <SelectTrigger className="h-10 bg-background border-input">
                      <SelectValue placeholder="Select acquisition channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Direct</SelectItem>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.channel_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Lead
                </Button>

              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isFollowUpOpen} onOpenChange={(open) => { if (!open) setIsFollowUpOpen(open); }}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Schedule Follow-Up</DialogTitle>
              <DialogDescription className="text-muted-foreground/60 text-xs">
                Set a date and reminder for your next interaction with this lead.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveFollowUp();
              }}
              className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2"
            >
              <div className="space-y-2">
                <Label className="text-foreground">Lead</Label>
                <Input
                  value={selectedFollowUpLead?.company_name || selectedFollowUpLead?.contact_name || ""}
                  readOnly
                  className="bg-muted/10 border-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Follow-Up Date *</Label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Assigned To</Label>
                <Select value={followUpAssignedTo} onValueChange={setFollowUpAssignedTo}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {bdTeam.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Note</Label>
                <Input
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Add a quick note"
                  className="bg-background border-input"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Save Follow-Up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsFollowUpOpen(false);
                    setSelectedFollowUpLead(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isRemarkOpen} onOpenChange={(open) => { if (!open) setIsRemarkOpen(open); }}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Remark - {selectedRemarkLead?.company_name}</DialogTitle>
              <DialogDescription className="text-muted-foreground/60 text-xs">
                Add internal notes and contact preferences for this lead.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-foreground">Preferred Contact Method</Label>
                <Select value={remarkMethod} onValueChange={setRemarkMethod}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Phone Call">Phone Call</SelectItem>
                    <SelectItem value="WhatsApp & Email">WhatsApp & Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Remark / Notes</Label>
                <Textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="e.g. Customer interested, follow up via WhatsApp..."
                  className="bg-background border-input min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={saveRemark}
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Remark
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsRemarkOpen(false);
                    setSelectedRemarkLead(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border">
          <button
            onClick={() => setLeadsTab("open")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${leadsTab === "open"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
          >
            Open
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${leadsTab === "open" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>{openLeadsCount}</span>
          </button>
          <button
            onClick={() => setLeadsTab("closed")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${leadsTab === "closed"
              ? "bg-slate-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
          >
            Closed
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${leadsTab === "closed" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>{closedLeadsCount}</span>
          </button>
        </div>
        <div className="text-sm text-muted-foreground">Showing: <span className="font-bold text-foreground">{filteredLeads.length}</span> / Total: <span className="font-bold text-foreground">{leads.length}</span></div>
      </div>

      {/* Search and Country Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full max-w-4xl">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, country, product, assigned to..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border focus-visible:ring-primary h-11"
          />
        </div>
        <div className="w-full max-w-xs">
          <Label className="sr-only">Country filter</Label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="h-11 w-full bg-card border-border">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="All Countries">All Countries</SelectItem>
              {uniqueCountries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table - Wrapped with id for export and select-none to discourage scraping */}
      <div id="crm-table" className="border border-border rounded-lg bg-card overflow-hidden shadow-sm select-none">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-foreground font-bold">#</TableHead>
              <TableHead className="text-foreground font-bold">Date</TableHead>
              <TableHead className="text-foreground font-bold">Company</TableHead>
              <TableHead className="text-foreground font-bold">Contact Name</TableHead>
              <TableHead className="text-foreground font-bold">Business Category</TableHead>
              <TableHead className="text-foreground font-bold">Product Type</TableHead>
              <TableHead className="text-foreground font-bold">Country</TableHead>
              <TableHead className="text-foreground font-bold">Mobile</TableHead>
              <TableHead className="text-foreground font-bold">Email</TableHead>
              <TableHead className="text-foreground font-bold">Stage</TableHead>

              <TableHead className="text-foreground font-bold">Assigned To</TableHead>
              <TableHead className="text-foreground font-bold text-center">Open/Close</TableHead>
              <TableHead className="text-right text-foreground font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" />
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12 text-muted-foreground italic">
                  {searchQuery ? `No leads matching "${searchQuery}"` : "No leads found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead, idx) => (
                <TableRow
                  key={lead.id}
                  className="border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => nav(`/crm/leads/${lead.id}`)}
                >
                  <TableCell className="text-sm font-mono text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="text-sm">{lead.date || "-"}</TableCell>
                  <TableCell className="font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      {lead.company_name}
                      {lead.remark && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <MessageSquare className="h-4 w-4 text-amber-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-900 border-amber-500/50 text-amber-400 max-w-xs">
                              {lead.remark}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.contact_name || "-"}</TableCell>
                  <TableCell className="text-sm">{lead.business_category || "-"}</TableCell>
                  <TableCell className="text-sm">{lead.product_type || "-"}</TableCell>
                  <TableCell className="text-sm">{lead.country || "-"}</TableCell>
                  <TableCell className="text-sm font-mono tracking-wider">
                    {isPrivileged ? (
                      lead.mobile || "-"
                    ) : (
                      <div className="group relative cursor-help">
                        <span className="block group-hover:hidden">*******</span>
                        <span className="hidden group-hover:block bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded font-bold transition-all">
                          {lead.mobile || "-"}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {isPrivileged ? (
                      lead.email || "-"
                    ) : (
                      <div className="group relative cursor-help">
                        <span className="block group-hover:hidden text-xs opacity-50">*******@***.com</span>
                        <span className="hidden group-hover:block bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded transition-all">
                          {lead.email || "-"}
                        </span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canEditStage ? (
                      <Select
                        value={lead.stage}
                        onValueChange={async (newStage) => {
                          if (!newStage || newStage === lead.stage) return;

                          const previousLeads = [...leads];
                          setLeads(leads.map((item) => item.id === lead.id ? { ...item, stage: newStage } : item));

                          try {
                            const res = await authFetch(`/api/leads/${lead.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ stage: newStage })
                            });

                            if (!res.ok) {
                              const errorBody = await res.json().catch(() => null);
                              const message = errorBody?.error || errorBody?.message || `${res.status} ${res.statusText}`;
                              throw new Error(message);
                            }

                            const result = await res.json();
                            toast.success(result.message || `Lead moved to ${newStage}`);
                            await fetchLeads();
                          } catch (err: any) {
                            console.error(`[LeadsList] Stage update error:`, err);
                            setLeads(previousLeads);
                            toast.error(err.message || "Failed to update stage");
                          }
                        }}
                      >
                        <SelectTrigger className={`h-8 w-32 ${getLeadStageBadgeColor(lead.stage)} text-white border-none font-bold`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`h-8 w-32 justify-center ${getLeadStageBadgeColor(lead.stage)} text-white border-none font-bold`}>
                        {lead.stage}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {lead.assigned_to || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    {OPEN_STAGES.some(s => s.toLowerCase() === lead.stage?.toLowerCase()) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                        onClick={() => toggleLeadStatus(lead, "Lost")}
                      >
                        Close
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20"
                        onClick={() => toggleLeadStatus(lead, "New")}
                      >
                        Open
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          e.preventDefault();
                          nav("/quotations/create", { state: { lead: lead } });
                        }}
                      >
                        Quote
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          e.preventDefault();
                          openFollowUp(lead);
                        }}
                      >
                        Follow-Up
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          e.preventDefault();
                          openRemark(lead);
                        }}
                      >
                        Remark
                      </Button>
                      {isWonLeadStage(lead.stage) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                          onClick={(e: MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            e.preventDefault();
                            convertToCustomer(lead);
                          }}
                        >
                          Convert
                        </Button>
                      )}
                      {/* Delete button removed */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}