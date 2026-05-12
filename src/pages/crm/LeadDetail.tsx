import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Mail, Phone, Loader2, Send, History, MessageSquare, Plus, Clock, AtSign, CheckCircle2, ChevronDown, FileText, UserCheck, Paperclip, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

// Safe dynamic import for the editor to prevent blank screen crashes
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type Activity = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  completed: boolean;
  profiles?: { full_name: string } | null;
};

type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  country: string;
  interested_product: string;
  stage: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  profiles?: { full_name: string } | null;
};

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile } = useAuth();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [company, setCompany] = useState<any>(null); // Added this state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [templates, setTemplates] = useState<{name: string, subject: string, body: string}[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Sync state
  const [syncing, setSyncing] = useState(false);

  // Note state
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Prevent SSR/Hydration issues with the editor
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Fetch Lead
        const { data: leadData, error: leadError } = await supabase
          .from("leads")
          .select(`*, profiles:assigned_to(full_name)`)
          .eq("id", id)
          .single();
        
        if (leadError) throw leadError;
        setLead(leadData as Lead);

        // 2. Fetch Company (for signature)
        if (leadData?.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("*")
            .eq("id", leadData.company_id)
            .single();
          if (companyData) setCompany(companyData);
        }

        // 3. Fetch Activities
        const { data: actsData } = await supabase
          .from("activities")
          .select(`id, title, type, content, created_at, completed, profiles:created_by(full_name)`)
          .eq("lead_id", id)
          .order("created_at", { ascending: false });
        
        if (actsData) setActivities(actsData as unknown as Activity[]);

        // 4. Fetch Templates
        const { data: temps } = await supabase
          .from("email_templates")
          .select("*");
        if (temps) setTemplates(temps);

      } catch (e: any) {
        toast.error(e.message || "Failed to load lead details");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const { data: act, error } = await supabase.from("activities").insert({
        lead_id: id,
        title: newNote,
        type: "note",
        completed: true,
        created_by: profile?.id
      }).select().single();

      if (error) throw error;
      if (act) setActivities([act as unknown as Activity, ...activities]);
      setNewNote("");
      toast.success("Note added successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!profile?.id || !id) return;
    try {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: profile.id })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Lead assigned to you");
      
      // Refresh lead data
      const { data } = await supabase
        .from("leads")
        .select(`*, profiles:assigned_to(full_name)`)
        .eq("id", id)
        .single();
      if (data) setLead(data as unknown as Lead);
    } catch (e: any) {
      toast.error(e.message || "Assignment failed");
    }
  };

  const applyTemplate = (template: {subject: string, body: string}) => {
    setSubject(template.subject);
    setMessage(template.body);
  };

  useEffect(() => {
    async function fetchTemplates() {
      if (!profile?.company_id) return;
      try {
        const { data } = await supabase
          .from("email_templates")
          .select("name, subject, body")
          .eq("company_id", profile.company_id);
        
        if (data) setTemplates(data);
      } catch (e) {
        console.error("Template fetch failed", e);
      }
    }
    fetchTemplates();
  }, [profile?.company_id]);

  useEffect(() => {
    async function fetchLeadDetails() {
      if (!id) return;
      try {
        const { data: leadData, error: leadError } = await supabase
          .from("leads")
          .select(`*, profiles:assigned_to(full_name)`)
          .eq("id", id)
          .single();

        if (leadError) throw leadError;
        setLead(leadData as unknown as Lead);

        const { data: acts, error: actsError } = await supabase
          .from("activities")
          .select(`id, title, type, created_at, completed, profiles:created_by(full_name)`)
          .eq("lead_id", id)
          .order("created_at", { ascending: false });

        if (actsError) throw actsError;
        setActivities((acts || []) as unknown as Activity[]);
      } catch (error: any) {
        toast.error(error.message || "Failed to load lead details");
      } finally {
        setLoading(false);
      }
    }
    fetchLeadDetails();
  }, [id]);

  const handleSendEmail = async () => {
    if (!lead?.email) return toast.error("Lead has no email address configured");
    if (!subject || !message || message === '<p><br></p>') return toast.error("Please fill in both subject and message");
    
    setSending(true);
    try {
      // 1. Upload attachments if any
      const uploadedFiles = [];
      if (attachments.length > 0) {
        setUploading(true);
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('email_attachments')
            .upload(fileName, file);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('email_attachments')
            .getPublicUrl(fileName);
          
          uploadedFiles.push({ filename: file.name, url: publicUrl });
        }
        setUploading(false);
      }

      const emailBody = `${message}${company?.email_signature || ''}`;
      
      const { data, error: sendError } = await supabase.functions.invoke("send-email", {
        body: {
          to: lead.email,
          subject,
          text: emailBody.replace(/<[^>]*>?/gm, ''), // Plain text version
          html: emailBody,
          attachments: uploadedFiles, // Include attachments!
          companyId: lead.company_id
        },
      });
      
      if (sendError) throw sendError;
      
      toast.success("Email sent successfully!");
      
      const { data: newAct } = await supabase.from("activities").insert({
        lead_id: lead.id,
        title: `Sent Email: ${subject}`,
        type: "email",
        content: message, // Saving the full message here!
        completed: true,
        created_by: profile?.id,
        company_id: lead.company_id
      }).select().single();

      if (newAct) {
        setActivities([newAct as unknown as Activity, ...activities]);
      }

      setSubject("");
      setMessage("");
      setShowComposer(false);

    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleSyncEmails = async () => {
    setSyncing(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('sync-emails', {
        body: { companyId: lead?.company_id, leadId: lead?.id }
      });
      
      if (invokeError) {
        console.error('Invoke Error:', invokeError)
        toast.error(`Sync Failed: ${invokeError.message || "Server Error"}`);
        return;
      }
      
      if (data?.error) {
        toast.error(`Sync Warning: ${data.error}`);
        return;
      }
      
      if (data?.count > 0) {
        toast.success(`Success! Synced ${data.count} new reply emails.`);
        // Refresh activities
        const { data: acts } = await supabase
          .from("activities")
          .select(`id, title, type, content, created_at, completed, profiles:created_by(full_name)`)
          .eq("lead_id", id)
          .order("created_at", { ascending: false });
        if (acts) setActivities(acts as unknown as Activity[]);
      } else {
        toast.info(data?.message || "Scan complete. No new replies found in your Zoho inbox yet.");
      }
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (!mounted || loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
    </div>
  );

  if (!lead) return (
    <div className="p-12 text-center">
      <h2 className="text-xl font-semibold">Lead not found</h2>
      <Button variant="link" onClick={() => nav("/crm/leads")}>Back to Leads</Button>
    </div>
  );

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <PageHeader
        title={lead.company_name}
        breadcrumbs={[{ label: "CRM" }, { label: "Leads", to: "/crm/leads" }, { label: lead.company_name }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
            <Button variant="outline" size="sm" onClick={() => nav(`/crm/leads/${id}/edit`)}><Edit className="h-4 w-4 mr-1.5" />Edit</Button>
            <Button className="btn-gold" size="sm" onClick={() => nav("/crm/convert")}><UserCheck className="h-4 w-4 mr-1.5" />Convert</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-6">
          <Section title="Contact Details">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Email</div>
                  <div className="font-medium truncate text-sm">{lead.email || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Phone</div>
                  <div className="font-medium text-sm">{lead.phone || "N/A"}</div>
                </div>
              </div>
              <div className="pt-2">
                <Badge className="w-full justify-center py-1 bg-primary/5 text-primary border-primary/20" variant="outline">
                  {lead.stage}
                </Badge>
              </div>
            </div>
          </Section>

          <Section title="Lead Context">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-semibold text-primary">{lead.interested_product}</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">Country:</span>
                <span className="font-medium">{lead.country}</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-2 items-center">
                <span className="text-muted-foreground">Owner:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lead.profiles?.full_name || "Unassigned"}</span>
                  {!lead.profiles && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10"
                      onClick={handleAssignToMe}
                    >
                      Assign to Me
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="emails" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-card/50 p-1 rounded-xl border border-border/50">
              <TabsTrigger value="emails" className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Mail className="h-4 w-4 mr-2" /> Emails
              </TabsTrigger>
              <TabsTrigger value="activities" className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <History className="h-4 w-4 mr-2" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <MessageSquare className="h-4 w-4 mr-2" /> Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emails" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center tracking-tight">
                  <AtSign className="h-5 w-5 mr-2 text-primary" /> Communications
                </h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-4" 
                    onClick={handleSyncEmails}
                    disabled={syncing}
                  >
                    {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                    {syncing ? "Syncing..." : "Sync Replies"}
                  </Button>
                  {showComposer && templates.length > 0 && (
                    <div className="relative group">
                      <Button variant="outline" size="sm" className="h-9 px-4 border-primary/20 hover:border-primary/50">
                        <FileText className="h-4 w-4 mr-2" /> Templates <ChevronDown className="h-3 w-3 ml-2" />
                      </Button>
                      <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl hidden group-hover:block z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {templates.map((t) => (
                          <button 
                            key={t.name}
                            className="w-full text-left px-4 py-3 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors border-b border-border/50 last:border-0"
                            onClick={() => applyTemplate(t)}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {!showComposer && (
                    <Button size="sm" className="btn-gold h-9 px-4" onClick={() => setShowComposer(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Compose Email
                    </Button>
                  )}
                </div>
              </div>

              {showComposer && (
                <Card className="border-primary/30 shadow-2xl animate-in zoom-in-95 duration-300 mb-8 overflow-hidden bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <AtSign className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">Recipient</div>
                        <div className="text-sm font-semibold">{lead.email}</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowComposer(false)} className="h-8 w-8 rounded-full">
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="space-y-1">
                        <Input 
                          placeholder="Email Subject" 
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="bg-transparent border-none text-xl font-bold focus-visible:ring-0 px-0 h-auto border-b border-border/50 rounded-none pb-2 placeholder:text-muted-foreground/30"
                        />
                      </div>
                      <div className="min-h-[250px] bg-muted/10 rounded-xl overflow-hidden border border-border/50">
                        <ReactQuill 
                          theme="snow" 
                          value={message} 
                          onChange={setMessage}
                          modules={quillModules}
                          placeholder="Type your message here..."
                          className="bg-card text-foreground"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        {attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {attachments.map((file, idx) => (
                              <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 bg-primary/5 border-primary/20">
                                <span className="max-w-[150px] truncate text-xs">{file.name}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-4 w-4 hover:bg-destructive/20 hover:text-destructive" 
                                  onClick={() => removeAttachment(idx)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer group">
                              <input 
                                type="file" 
                                multiple 
                                className="hidden" 
                                onChange={handleFileChange}
                              />
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/50 text-muted-foreground hover:text-foreground transition-all">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm font-medium">Attach Files</span>
                              </div>
                            </label>
                            {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={() => {
                              setShowComposer(false);
                              setAttachments([]);
                            }}>Cancel</Button>
                            <Button 
                              className="btn-gold px-8" 
                              onClick={handleSendEmail} 
                              disabled={sending || uploading}
                            >
                              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                              {sending ? "Sending..." : "Send Message"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {activities.filter(a => a.type === 'email' || a.type === 'email_inbound').length === 0 ? (
                  <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/50">
                    <Mail className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                    <h4 className="text-lg font-medium text-muted-foreground">No email history</h4>
                    <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">Start a conversation with {lead.contact_name} to see history here.</p>
                  </div>
                ) : (
                  activities.filter(a => a.type === 'email' || a.type === 'email_inbound').map((email) => (
                    <div 
                      key={email.id} 
                      className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:border-primary/40 transition-all group relative overflow-hidden shadow-sm cursor-pointer"
                      onClick={() => {
                        const el = document.getElementById(`email-content-${email.id}`);
                        if (el) el.classList.toggle('hidden');
                      }}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${email.type === 'email_inbound' ? 'bg-amber-500' : 'bg-primary/20'} group-hover:bg-primary transition-colors`} />
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className={`${email.type === 'email_inbound' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'} p-3 rounded-xl`}>
                            {email.type === 'email_inbound' ? <Mail className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-base group-hover:text-primary transition-colors tracking-tight">
                              {email.title.replace('Sent Email: ', '').replace('Inbound Email: ', '')}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(email.created_at), "MMM d, yyyy • h:mm a")}</span>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span className={`flex items-center gap-1 font-medium ${email.type === 'email_inbound' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                <CheckCircle2 className="h-3 w-3" />
                                {email.type === 'email_inbound' ? 'Received' : 'Delivered'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${email.type === 'email_inbound' ? 'bg-amber-500/10 text-amber-500' : ''}`}>
                          {email.type === 'email_inbound' ? 'Inbound' : 'Sent'}
                        </Badge>
                      </div>
                      
                      {/* Expandable Content Area */}
                      <div id={`email-content-${email.id}`} className="hidden mt-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div 
                          className="prose prose-invert prose-sm max-w-none text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: email.content || "<i>No content available</i>" }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="activities" className="animate-in slide-in-from-bottom-2 duration-300">
              <Section title="Activity Timeline">
                <div className="relative space-y-8 pl-4 mt-6">
                  <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary/30 via-border to-transparent" />
                  {activities.map((a) => (
                    <div key={a.id} className="relative pl-12 group">
                      <div className={`absolute left-0 top-0 h-10 w-10 rounded-xl border-4 border-background flex items-center justify-center shadow-md transition-transform group-hover:scale-110 z-10 
                        ${a.type === 'email_inbound' ? 'bg-amber-500 text-white shadow-amber-500/20' : 
                          a.type === 'email' ? 'bg-primary text-primary-foreground shadow-primary/20' : 
                          'bg-muted text-muted-foreground'}`}>
                        {a.type === 'email_inbound' ? <Mail className="h-4 w-4" /> : 
                         a.type === 'email' ? <Send className="h-4 w-4" /> : 
                         <Clock className="h-4 w-4" />}
                      </div>
                      <div className="space-y-1 py-1">
                        <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-tight">
                          {a.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <span className="font-medium">{format(new Date(a.created_at), "MMM d, yyyy • h:mm a")}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span>By {a.profiles?.full_name || "System"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="notes" className="animate-in slide-in-from-bottom-2 duration-300">
              <Section title="Internal Notes">
                <div className="space-y-4">
                  <div className="bg-card border rounded-2xl p-4 shadow-sm focus-within:border-primary/50 transition-all">
                    <textarea 
                      placeholder="Type a new internal note about this lead..." 
                      className="w-full bg-transparent border-none outline-none resize-none text-sm min-h-[80px]"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <div className="flex justify-end pt-2">
                      <Button 
                        size="sm" 
                        className="btn-gold" 
                        onClick={handleAddNote}
                        disabled={addingNote || !newNote.trim()}
                      >
                        {addingNote ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Add Note
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activities.filter(a => a.type === 'note').length === 0 ? (
                      <div className="bg-muted/10 rounded-2xl p-8 text-center border border-dashed">
                        <p className="text-xs text-muted-foreground italic">No internal notes yet.</p>
                      </div>
                    ) : (
                      activities.filter(a => a.type === 'note').map((note) => (
                        <div key={note.id} className="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all">
                          <p className="text-sm">{note.title}</p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {format(new Date(note.created_at), "MMM d, h:mm a")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
