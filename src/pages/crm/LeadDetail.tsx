import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Mail, Phone, Loader2, Send, History, MessageSquare, Plus, Clock, AtSign, CheckCircle2, ChevronDown, FileText, UserCheck, Paperclip, X, Trash2, RefreshCw } from "lucide-react";
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

type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  country: string;
  interested_product: string;
  stage: string;
  assigned_to: string;
  company_id: string;
  profiles?: { full_name: string } | null;
};

type Activity = {
  id: string;
  title: string;
  type: string;
  content: string;
  created_at: string;
  completed: boolean;
  profiles?: { full_name: string } | null;
};

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile } = useAuth();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [company, setCompany] = useState<any>(null);
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
        const { data: leadData } = await supabase
          .from("leads")
          .select(`*, profiles:assigned_to(full_name)`)
          .eq("id", id)
          .single();
        
        if (leadData) {
          setLead(leadData as Lead);
          
          if (leadData.company_id) {
            const { data: comp } = await supabase
              .from("companies")
              .select("*")
              .eq("id", leadData.company_id)
              .single();
            if (comp) setCompany(comp);
          }
        }

        const { data: acts } = await supabase
          .from("activities")
          .select(`id, title, type, content, created_at, completed, profiles:created_by(full_name)`)
          .eq("lead_id", id)
          .order("created_at", { ascending: false });
        
        if (acts) setActivities(acts as unknown as Activity[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSendEmail = async () => {
    if (!lead?.email || !subject || !message) return toast.error("Missing email details");
    
    setSending(true);
    try {
      // 1. Upload Attachments if any
      const uploadedAttachments = [];
      if (attachments.length > 0) {
        setUploading(true);
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${lead.company_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('email-attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;
          
          uploadedAttachments.push({
            filename: file.name,
            path: filePath
          });
        }
        setUploading(false);
      }

      const emailBody = `${message}${company?.email_signature || ''}`;
      
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: lead.email,
          subject,
          text: emailBody.replace(/<[^>]*>?/gm, ''),
          html: emailBody,
          companyId: lead.company_id,
          attachments: uploadedAttachments // Send attachment metadata
        },
      });
      
      if (error) throw error;
      
      // 2. Record the sent email in the database history
      await supabase.from("activities").insert({
        lead_id: lead.id,
        title: `Sent Email: ${subject}${attachments.length > 0 ? ' (with attachments)' : ''}`,
        type: "email",
        content: message,
        completed: true,
        created_by: profile?.id,
        company_id: lead.company_id
      });

      toast.success("Email sent successfully!");
      setShowComposer(false);
      setAttachments([]); // Clear attachments
      
      // 3. Refresh activities list immediately
      const { data: newActs } = await supabase
        .from("activities")
        .select(`id, title, type, content, created_at, completed, profiles:created_by(full_name)`)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      if (newActs) setActivities(newActs as unknown as Activity[]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };
  const handleSync = async () => {
    if (!lead || !id) return;
    setSyncing(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("sync-emails", {
        body: { companyId: lead.company_id, leadId: lead.id }
      });
      
      if (invokeError) throw invokeError;
      
      if (data?.count > 0) {
        toast.success(`Synced ${data.count} new replies!`);
        // Refresh activities
        const { data: acts } = await supabase
          .from("activities")
          .select(`id, title, type, content, created_at, completed, profiles:created_by(full_name)`)
          .eq("lead_id", lead.id)
          .order("created_at", { ascending: false });
        if (acts) setActivities(acts as unknown as Activity[]);
      } else {
        toast.info("No new replies found.");
      }
    } catch (e: any) {
      toast.error(`Sync Failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!mounted || loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
  if (!lead) return <div className="p-20 text-center">Lead not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title={lead?.company_name || "Lead Details"} 
        breadcrumbs={[{ label: "CRM" }, { label: "Leads", to: "/crm/leads" }, { label: lead?.company_name }]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold border-b pb-2">Contact Information</h3>
            <div><p className="text-xs text-muted-foreground uppercase font-bold">Email</p><p className="font-medium">{lead?.email}</p></div>
            <div><p className="text-xs text-muted-foreground uppercase font-bold">Phone</p><p className="font-medium">{lead?.phone}</p></div>
            <div><p className="text-xs text-muted-foreground uppercase font-bold">Product</p><p className="font-medium">{lead?.interested_product}</p></div>
            <Badge className="w-full justify-center">{lead?.stage}</Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Communication History</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                    {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Sync Replies
                  </Button>
                  <Button className="btn-gold" onClick={() => setShowComposer(true)}>Compose Email</Button>
                </div>
             </div>

              {showComposer && (
                <div className="mb-8 p-4 border rounded-xl bg-muted/10 space-y-4">
                  <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
                  <ReactQuill theme="snow" value={message} onChange={setMessage} />
                  
                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-white/50 rounded-lg border border-dashed">
                      {attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm text-xs font-medium">
                          <FileText className="h-3 w-3 text-blue-600" />
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <button 
                            onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                            className="hover:text-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div>
                      <input 
                        type="file" 
                        id="email-attachment" 
                        className="hidden" 
                        multiple 
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setAttachments(prev => [...prev, ...files]);
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById('email-attachment')?.click()}
                        disabled={uploading}
                        className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attach PDF/File
                      </Button>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" onClick={() => setShowComposer(false)}>Cancel</Button>
                       <Button onClick={handleSendEmail} disabled={sending || uploading} className="btn-gold">
                         {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                         Send Message
                       </Button>
                    </div>
                  </div>
                </div>
              )}

             <div className="space-y-4">
                {activities.map(act => (
                  <div key={act.id} className="p-4 border rounded-xl hover:bg-muted/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="font-bold">{act.title}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(act.created_at), "MMM d, yyyy")}</div>
                    </div>
                    {act.content && <div className="mt-2 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: act.content }} />}
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
