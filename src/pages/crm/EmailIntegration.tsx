import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mail, ShieldCheck, Server, AlertCircle, CheckCircle2, HelpCircle, ExternalLink, Info, Loader2, User, Key, AtSign, Zap, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-card/50 rounded-2xl border p-6">
    <h3 className="font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

const FormRow = ({ label, children, required }: { label: string, children: React.ReactNode, required?: boolean }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{label} {required && <span className="text-primary">*</span>}</label>
    {children}
  </div>
);

export default function EmailIntegration() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  
  const [smtpHost, setSmtpHost] = useState("smtppro.zoho.in");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("bde@shastikaglobalimpex.co.in");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromEmail, setFromEmail] = useState("bde@shastikaglobalimpex.co.in");

  useEffect(() => {
    if (!profile?.company_id) return;
    const fetchCompany = async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("id", profile.company_id).single();
      if (!error && data) {
        if (data.smtp_host) setSmtpHost(data.smtp_host);
        if (data.smtp_port) setSmtpPort(data.smtp_port);
        if (data.smtp_user) setSmtpUser(data.smtp_user);
        if (data.from_email) setFromEmail(data.from_email);
      }
      setLoading(false);
    };
    fetchCompany();
  }, [profile?.company_id]);

  const handleSave = async () => {
    if (!profile?.company_id) return;
    setSaving(true);
    const updateData: any = { smtp_host: smtpHost, smtp_port: smtpPort, smtp_user: smtpUser, from_email: fromEmail };
    if (smtpPass) updateData.smtp_pass = smtpPass;
    const { error } = await supabase.from("companies").update(updateData).eq("id", profile.company_id);
    setSaving(false);
    if (error) toast.error("Error saving email settings: " + error.message);
    else toast.success("Email configuration securely saved.");
  };

  const handleTestConnection = async () => {
    if (!smtpHost || !smtpUser || (!smtpPass && !profile?.company_id)) return toast.error("Please fill in all SMTP details.");
    setTesting(true); setTestSuccess(null);
    try {
      await handleSave();
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          to: smtpUser, 
          subject: "SMTP Connection Test", 
          message: "This is a test email to verify your SMTP configuration in Shastika ERP.", 
          leadName: profile?.full_name || "Admin", 
          companyId: profile?.company_id
        }
      });
      
      if (error) {
        // Supabase function errors are returned in the response body
        // We need to parse them if it's a FunctionsHttpError
        let errorMsg = "Connection failed";
        try {
          const body = await error.context?.json();
          errorMsg = body?.error || error.message || errorMsg;
        } catch (e) {
          errorMsg = error.message || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      setTestSuccess(true); toast.success("Connection successful! Test email sent.");
    } catch (error: any) {
      setTestSuccess(false);
      console.error("Test error:", error);
      toast.error(error.message || "Connection failed");
    } finally { setTesting(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <PageHeader
        title="Email Integration"
        description="Configure your SMTP server to send automated emails directly from the ERP."
        breadcrumbs={[{ label: "CRM" }, { label: "Email Integration" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Server className="h-4 w-4 mr-2" />}
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {testSuccess === true && (
            <Alert className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your SMTP server is correctly configured and reachable. You can now send automated emails.</AlertDescription>
            </Alert>
          )}

          {testSuccess === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>We couldn't connect to your mail server. Please check your host, port, and credentials.</AlertDescription>
            </Alert>
          )}

          <Section title="SMTP Configuration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormRow label="SMTP Host Address" required>
                <div className="relative">
                  <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9 bg-background/50"
                    placeholder="smtppro.zoho.in" 
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
              </FormRow>
              <FormRow label="SMTP Port" required>
                <div className="relative">
                  <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9 bg-background/50"
                    placeholder="465" 
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
              </FormRow>
              <FormRow label="Authentication Username" required>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9 bg-background/50"
                    placeholder="bde@shastikaglobalimpex.co.in" 
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>
              </FormRow>
              <FormRow label="Authentication Password" required>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9 bg-background/50"
                    type="password" 
                    placeholder="••••••••" 
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                  />
                </div>
              </FormRow>
              <FormRow label="Sender Email (From)" required>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9 bg-background/50"
                    placeholder="bde@shastikaglobalimpex.co.in" 
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                  />
                </div>
              </FormRow>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Setup Guide">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="zoho">
                <AccordionTrigger className="text-sm font-medium">Using Zoho Mail</AccordionTrigger>
                <AccordionContent className="text-xs space-y-2 text-muted-foreground">
                  <p>1. Use <code>smtppro.zoho.in</code> as Host.</p>
                  <p>2. Use Port <code>465</code> (SSL) or <code>587</code> (TLS).</p>
                  <p>3. Use an App-specific password.</p>
                  <p>4. <strong>Enable SMTP Access</strong> in Zoho Mail Settings.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>
        </div>
      </div>
    </div>
  );
}
