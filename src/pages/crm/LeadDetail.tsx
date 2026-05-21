import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Mail, Phone, Building, Calendar, Package, UserCheck, Loader2, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

type Activity = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  completed: boolean;
  profiles?: { full_name: string };
};

type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  country: string;
  interested_product: string;
  stage: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string };
};

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

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
        setActivities(acts as unknown as Activity[]);
      } catch (error: any) {
        toast.error(error.message || "Failed to load lead details");
      } finally {
        setLoading(false);
      }
    }
    fetchLeadDetails();
  }, [id]);

  const handleSendEmail = async () => {
    if (!subject || !message) {
      return toast.error("Please fill in both subject and message");
    }
    if (!lead) return;
    setSending(true);
    try {
      const email = (lead as any).email || (lead.contact_name
        ? `${lead.contact_name.toLowerCase().replace(/\s+/g, ".")}@${lead.company_name.split(" ")[0].toLowerCase()}.com`
        : "");

      toast.info("Queuing email...");

      const emailBody = `<p>${message.replace(/\n/g, '<br>')}</p>`;

      // 2. Outbox Pattern: Insert into Database (Webhook triggers backend)
      const { data, error } = await supabase.from("emails").insert({
        to_address: email,
        subject: subject,
        body_html: emailBody,
        company_id: profile?.company_id,
        lead_id: lead.id,
        status: 'pending',
        attachments: []
      }).select('id').single();

      if (error) throw error;

      const emailId = data?.id;

      if (emailId) {
        // Subscribe to real-time status updates for this specific email
        const channel = supabase
          .channel(`email-status-${emailId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'emails',
            filter: `id=eq.${emailId}`
          }, (payload) => {
            const { status, error_message } = payload.new;
            if (status === 'sent') {
              toast.success(`Email Delivered!`);
              setSubject("");
              setMessage("");
              supabase.removeChannel(channel);
            }
            if (status === 'failed') {
              toast.error(`Delivery Failed: ${error_message}`);
              supabase.removeChannel(channel);
            }
          })
          .subscribe();

        toast.loading("Sending...");
      } else {
        // Fallback if no emailId returned
        toast.success(`Email queued!`);
        setSubject("");
        setMessage("");
      }

      // Record activity in history
      await supabase.from("activities").insert({
        lead_id: lead.id,
        title: `Sent Email: ${subject}`,
        type: "email",
        content: message,
        completed: true,
        company_id: profile?.company_id
      });

      // Refresh activities list
      const { data: acts } = await supabase
        .from("activities")
        .select(`id, title, type, created_at, completed, profiles:created_by(full_name)`)
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      if (acts) setActivities(acts as unknown as Activity[]);
    } catch (e: any) {
      console.error("Email error:", e);
      let errorMsg = e.message;

      if (e.context && typeof e.context.json === 'function') {
        try {
          const body = await e.context.json();
          if (body.error) errorMsg = body.error;
        } catch (err) {
          console.error("Failed to parse error body", err);
        }
      }

      toast.error(errorMsg || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) {
    return <div className="p-6">Lead not found</div>;
  }

  const ownerName = lead.profiles?.full_name || "Unassigned";

  return (
    <div>
      <PageHeader
        title={lead.company_name}
        breadcrumbs={[{ label: "CRM" }, { label: "Leads", to: "/crm/leads" }, { label: lead.company_name }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
            <Button size="sm" onClick={() => nav("/quotations/create", { state: { lead } })}>
              <UserCheck className="h-4 w-4 mr-1.5" />Create Quote
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Overview">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground mb-1">Lead ID</dt><dd className="font-mono text-xs">{lead.id}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Stage</dt><dd><StatusBadge status={lead.stage} /></dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Product of Interest</dt><dd>{lead.interested_product || "-"}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Owner</dt><dd>{ownerName}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Country</dt><dd>{lead.country || "-"}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Created</dt><dd>{format(new Date(lead.created_at), "PP")}</dd></div>
            </dl>
          </Section>
          <Section title="Recent Activity">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No activities recorded yet.</p>
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-4">
                {activities.map((a) => (
                  <li key={a.id} className="ml-4">
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-4 border-background" />
                    <div className={`text-sm font-medium ${a.completed ? "line-through text-muted-foreground" : ""}`}>{a.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.profiles?.full_name || "System"} · {a.type.replace("_", " ")} · {format(new Date(a.created_at), "PPp")}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Contact">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{lead.contact_name || "-"}</div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {lead.contact_name
                  ? `${lead.contact_name.toLowerCase().replace(/\s+/g, ".")}@${lead.company_name.split(" ")[0].toLowerCase()}.com`
                  : "-"}
              </div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Not Provided</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Last updated {format(new Date(lead.updated_at || lead.created_at), "PP")}</div>
            </div>
          </Section>
          <Section title="Interest">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5 text-muted-foreground" />
              {lead.interested_product || "No Product Specified"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Primary product interest</div>
          </Section>
          <Section title="Send Email">
            <div className="space-y-3">
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
              />
              <Textarea
                placeholder="Type your message here..."
                className="min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
              />
              <Button className="w-full" onClick={handleSendEmail} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {sending ? "Sending..." : "Send to Lead"}
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}