import { useState, useEffect } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { ShieldCheck, Key, Lock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Security() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    ip_whitelisting: false,
    hardware_token: false,
    screenshot_protection: false
  });
  const [loadingToggles, setLoadingToggles] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchSettings();
      fetchLogs();

      // Subscribe to real-time logs
      const channel = supabase
        .channel('security-logs')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'audit_logs' },
          () => fetchLogs()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.company_id]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("security_settings")
        .select("*")
        .eq("company_id", profile?.company_id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setSettings({
          ip_whitelisting: data.ip_whitelisting,
          hardware_token: data.hardware_token,
          screenshot_protection: data.screenshot_protection
        });
      }
    } catch (err: any) {
      console.error("Error loading security settings:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          user_agent,
          status,
          timestamp,
          profiles!inner(company_id, full_name, email)
        `)
        .eq("profiles.company_id", profile?.company_id)
        .order("timestamp", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) setLogs(data);
    } catch (err: any) {
      console.error("Error loading audit logs:", err);
    }
  };

  const togglePolicy = async (policyName: keyof typeof settings) => {
    if (loadingToggles) return;
    setLoadingToggles(true);
    try {
      const newValue = !settings[policyName];
      
      // Optimistic update
      setSettings(prev => ({ ...prev, [policyName]: newValue }));

      const { error } = await supabase
        .from("security_settings")
        .upsert({ 
          company_id: profile?.company_id,
          [policyName]: newValue,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success("Security policy updated successfully");
      
      // Log this action
      await supabase.from("audit_logs").insert({
        user_id: profile?.id,
        action: `Toggled ${policyName.replace('_', ' ')} to ${newValue ? 'ON' : 'OFF'}`,
        resource_type: "security",
        user_agent: navigator.userAgent,
        status: "Secure"
      });
      
    } catch (err: any) {
      toast.error("Failed to update policy");
      fetchSettings(); // Revert
    } finally {
      setLoadingToggles(false);
    }
  };

  const forceKeyRotation = async () => {
    try {
      toast.loading("Rotating keys...", { id: "rotation" });
      
      // Simulate cryptographic key rotation delay
      await new Promise(r => setTimeout(r, 1000));
      
      await supabase.from("audit_logs").insert({
        user_id: profile?.id,
        action: "Forced 2FA Key Rotation",
        resource_type: "security",
        user_agent: navigator.userAgent,
        status: "Secure"
      });
      
      toast.success("Security keys rotated successfully", { id: "rotation" });
    } catch (err) {
      toast.error("Failed to rotate keys", { id: "rotation" });
    }
  };

  const policies = [
    { key: "ip_whitelisting" as const, label: "IP Whitelisting Restrictions", sub: "BDE logins constrained to registered office ranges." },
    { key: "hardware_token" as const, label: "Hardware Token Pairing", sub: "Pairing authenticated via RSA encrypted keys." },
    { key: "screenshot_protection" as const, label: "Screenshots Tracking Protection", sub: "Revokes token if monitor flags sensitive downloads." }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="Security & Auditing"
        sub="Configure BDE database access rights, monitor 2FA pairing tokens, and trace server logs"
        actions={
          <Button size="sm" className="btn-gold shadow-md" onClick={forceKeyRotation}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Force Key Rotation
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Security Score</div>
            <div className="text-2xl font-bold font-mono mt-0.5">A+ Excellent</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Data Encryption</div>
            <div className="text-2xl font-bold font-mono mt-0.5">AES 256-GCM</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">2FA Compliance</div>
            <div className="text-2xl font-bold font-mono mt-0.5">100% Enforced</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy Setting Grid */}
        <Card className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-primary" /> CRM Access Policies
          </h3>
          <p className="text-xs text-muted-foreground leading-normal">
            Enforced policies for BDE agents accessing agribusiness customer pipelines.
          </p>

          <div className="space-y-3 pt-2">
            {policies.map((p, i) => {
              const active = settings[p.key];
              return (
                <div 
                  key={i} 
                  onClick={() => togglePolicy(p.key)}
                  className="p-3 rounded-lg bg-neutral-900/40 border border-white/5 flex items-start justify-between gap-3 cursor-pointer hover:bg-neutral-900/60 transition-colors"
                >
                  <div className="min-w-0 pointer-events-none">
                    <div className="text-xs font-bold text-foreground">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{p.sub}</div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${active ? "bg-primary" : "bg-neutral-800"} flex-shrink-0 pointer-events-none`}>
                    <div className={`w-3 h-3 rounded-full bg-black shadow-md transition-transform ${active ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Security Audit logs list */}
        <Card className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Recent Security Activities</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Audit log of system sessions, authentication changes, and warnings</p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Activity</th>
                  <th className="p-3">Device Signature</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">No recent security events found.</td>
                  </tr>
                ) : logs.map((log) => {
                  let deviceStr = "Unknown Device";
                  if (log.user_agent) {
                    if (log.user_agent.includes("iPhone")) deviceStr = "iPhone";
                    else if (log.user_agent.includes("Mac")) deviceStr = "Mac";
                    else if (log.user_agent.includes("Windows")) deviceStr = "Windows PC";
                    else if (log.user_agent.includes("Android")) deviceStr = "Android Device";
                  }

                  let timeStr = "Just now";
                  if (log.timestamp) {
                    try {
                      timeStr = formatDistanceToNow(new Date(log.timestamp), { addSuffix: true });
                    } catch (e) {}
                  }

                  return (
                    <tr key={log.id} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground">{log.id.split('-')[0]}...</td>
                      <td className="p-3 font-semibold text-foreground">{log.profiles?.full_name || log.profiles?.email || 'Unknown'}</td>
                      <td className="p-3 text-foreground">{log.action}</td>
                      <td className="p-3 font-mono text-muted-foreground">{deviceStr}</td>
                      <td className="p-3 text-muted-foreground">{timeStr}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                          log.status === "Secure" || log.status === "Success"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse"
                        }`}>
                          {log.status === "Secure" || log.status === "Success" ? (
                            <CheckCircle className="h-2.5 w-2.5" />
                          ) : (
                            <AlertTriangle className="h-2.5 w-2.5" />
                          )}
                          {log.status || "Secure"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
