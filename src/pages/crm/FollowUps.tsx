import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Check, Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type FollowUp = {
  id: string;
  lead_id: string;
  company_name: string;
  contact_name?: string | null;
  follow_up_date?: string | null;
  note?: string | null;
  assigned_to?: string | null;
  is_notified: boolean;
  reminder_time?: string | null;
  business_category?: string | null;
  product_type?: string | null;
  country?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  created_at?: string | null;
};

type LeadOption = {
  id: string;
  company_name: string;
  contact_name?: string | null;
  business_category?: string | null;
  product_type?: string | null;
  country?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
};

const bdTeam = ["Kaviya", "Gayathri"];

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

export default function FollowUps() {
  const { roleSlugs, profile } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [contactMethod, setContactMethod] = useState("WhatsApp");
  const [note, setNote] = useState("");
  const [assignedTo, setAssignedTo] = useState(bdTeam[0]);
  const [filter, setFilter] = useState<"all" | "mine" | "pending">("all");

  const isBde = roleSlugs.has("bd") || roleSlugs.has("bde");


  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, company_name, contact_name, business_category, product_type, country, mobile, email, website")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data as LeadOption[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch leads");
    }
  };

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("id, lead_id, company_name, contact_name, follow_up_date, reminder_time, note, assigned_to, is_notified, business_category, product_type, country, mobile, email, website")
        .order("follow_up_date", { ascending: false });

      if (error) throw error;
      setFollowUps(data as FollowUp[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch follow-ups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchFollowUps();

    const channel = supabase
      .channel("follow-ups-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "follow_ups" }, fetchFollowUps)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSaveFollowUp = async () => {
    if (!selectedLeadId || !followUpDate) {
      toast.error("Please select a lead and a date");
      return;
    }

    const lead = leads.find((item) => item.id === selectedLeadId);
    if (!lead) {
      toast.error("Selected lead is not valid");
      return;
    }

    const assignee = assignedTo;
    
    // Convert 12h to 24h for storage
    let [hours, minutes] = reminderTime.split(':').map(Number);
    if (timePeriod === "PM" && hours < 12) hours += 12;
    if (timePeriod === "AM" && hours === 12) hours = 0;
    const finalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    const combinedNote = note.trim() 
      ? `${contactMethod}: ${note.trim()}`
      : contactMethod;

    try {
      const { error } = await supabase.from("follow_ups").insert({
        lead_id: selectedLeadId,
        company_name: lead.company_name,
        contact_name: lead.contact_name,
        follow_up_date: followUpDate,
        reminder_time: finalTime,
        note: combinedNote,
        assigned_to: assignee,
        is_notified: false,
        business_category: lead.business_category,
        product_type: lead.product_type,
        country: lead.country,
        mobile: lead.mobile,
        email: lead.email,
        website: lead.website,
      });

      if (error) throw error;
      toast.success("Follow-up created successfully");
      setIsDialogOpen(false);
      setSelectedLeadId("");
      setFollowUpDate("");
      setReminderTime("09:00");
      setContactMethod("WhatsApp");
      setNote("");
      setAssignedTo(bdTeam[0]);
      fetchFollowUps();
    } catch (error: any) {
      toast.error(error.message || "Failed to save follow-up");
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const { error } = await supabase.from("follow_ups").update({ is_notified: true }).eq("id", id);
      if (error) throw error;
      toast.success("Follow-up acknowledged");
      fetchFollowUps();
    } catch (error: any) {
      toast.error(error.message || "Failed to acknowledge follow-up");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("follow_ups").delete().eq("id", id);
      if (error) throw error;
      toast.success("Follow-up deleted");
      fetchFollowUps();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete follow-up");
    }
  };

  const filteredFollowUps = followUps.filter((item) => {
    if (filter === "mine") {
      return item.assigned_to === assignedTo;
    }
    if (filter === "pending") {
      return !item.is_notified;
    }
    return true;
  });

  const pendingCount = followUps.filter((item) => !item.is_notified).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Follow-Ups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track upcoming customer follow-ups, assign owners, and acknowledge reminders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Follow-Up
          </Button>
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "mine" ? "default" : "outline"} onClick={() => setFilter("mine")}>
            Assigned to Me
          </Button>
          <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
            Pending ({pendingCount})
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm uppercase tracking-wide text-muted-foreground">Total follow-ups</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{followUps.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm uppercase tracking-wide text-muted-foreground">Pending reminders</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{pendingCount}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm uppercase tracking-wide text-muted-foreground">Team members</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{bdTeam.length}</div>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Reminder Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" />
                </TableCell>
              </TableRow>
            ) : filteredFollowUps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                  No follow-ups found.
                </TableCell>
              </TableRow>
            ) : (
              filteredFollowUps.map((followUp) => (
                <TableRow key={followUp.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell>{followUp.company_name}</TableCell>
                  <TableCell>{followUp.contact_name || "—"}</TableCell>
                  <TableCell>{formatDate(followUp.follow_up_date)}</TableCell>
                  <TableCell>{followUp.assigned_to || "Unassigned"}</TableCell>
                  <TableCell>
                    {followUp.note ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="text-left cursor-help">
                            {followUp.note.length > 40 
                              ? `${followUp.note.substring(0, 40)}...` 
                              : followUp.note}
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] bg-slate-900 text-white border-slate-800">
                            <p>{followUp.note}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {followUp.reminder_time ? (
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Bell className="h-3 w-3" />
                        {new Date(`2000-01-01T${followUp.reminder_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    ) : "09:00 AM"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {!followUp.is_notified && (
                      <Button size="sm" variant="outline" className="h-8 text-[10px] uppercase tracking-wider" onClick={() => handleAcknowledge(followUp.id)}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Acknowledge
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 text-[10px] uppercase tracking-wider" onClick={() => handleDelete(followUp.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Follow-Up</DialogTitle>
            <DialogDescription className="text-muted-foreground/60 text-xs">
              Fill in the details below to schedule a follow-up for a lead.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveFollowUp();
            }}
            className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2"
          >
            <div className="space-y-2">
              <Label className="text-foreground">Lead *</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name}{lead.contact_name ? ` — ${lead.contact_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLeadId && leads.find(l => l.id === selectedLeadId) && (
              <div className="p-4 bg-muted/20 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Selected Lead Details</span>
                  <Badge variant="outline" className="text-[10px] bg-background/50">Auto-filled</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <div className="col-span-full">
                    <div className="text-[10px] text-muted-foreground/60 uppercase font-medium">Company Name</div>
                    <div className="text-sm font-semibold text-foreground">{leads.find(l => l.id === selectedLeadId)?.company_name}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase font-medium">Business Category</div>
                    <div className="text-xs text-foreground/80">{leads.find(l => l.id === selectedLeadId)?.business_category || "—"}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase font-medium">Product Type</div>
                    <div className="text-xs text-foreground/80">{leads.find(l => l.id === selectedLeadId)?.product_type || "—"}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase font-medium">Country</div>
                    <div className="text-xs text-foreground/80">{leads.find(l => l.id === selectedLeadId)?.country || "—"}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase font-medium">Mobile</div>
                    <div className="text-xs text-foreground/80">{leads.find(l => l.id === selectedLeadId)?.mobile || "—"}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase font-medium">Email</div>
                    <div className="text-xs text-foreground/80 truncate">{leads.find(l => l.id === selectedLeadId)?.email || "—"}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground/60 uppercase font-medium">Website</div>
                    <div className="text-xs text-foreground/80 truncate">{leads.find(l => l.id === selectedLeadId)?.website || "—"}</div>
                  </div>
                </div>
              </div>
            )}

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
              <Label className="text-foreground">Reminder Time *</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  required
                  className="bg-background border-input flex-1"
                />
                <Select value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose assignee" />
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
              <Label className="text-foreground">Contact Method *</Label>
              <Select value={contactMethod} onValueChange={setContactMethod}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select contact method" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="WhatsApp & Email">WhatsApp & Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Note (Optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any additional notes..."
                className="bg-background border-input"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Save Follow-Up
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
