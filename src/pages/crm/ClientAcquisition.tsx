import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { UserPlus, Star, BarChart3, TrendingUp, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { authFetch } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { isConvertedLeadStage } from "@/lib/crmStages";

const DEFAULT_ACQUISITION_CHANNELS = [
  "Social Media (Instagram, Facebook)",
  "Trade Fair / Exhibition",
  "Referral",
  "Cold Call / Direct Outreach",
  "Website / Online Inquiry",
  "WhatsApp Marketing",
  "Agent / Broker",
];

export default function ClientAcquisition() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Channel State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelCost, setNewChannelCost] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [totalLeads, setTotalLeads] = useState(0);
  const [convertedClients, setConvertedClients] = useState(0);
  const [avgAcquisitionRate, setAvgAcquisitionRate] = useState("0%");
  const [totalPipeValue, setTotalPipeValue] = useState("$0");

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'acquisition_channels' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCompanyId = async () => {
    if (profile?.company_id) return profile.company_id;
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return null;

    const res = await authFetch(`/api/employees/${userId}`);
    if (!res.ok) {
      console.warn("Failed to fetch employee record for company ID");
      return null;
    }

    const employeeData = await res.json();
    return employeeData?.company_id || null;
  };

  const ensureDefaultChannels = async (companyId: string, currentChannels: any[]) => {
    const existingNames = new Set(currentChannels.map(ch => String(ch.channel_name || '').trim().toLowerCase()));
    const missingChannels = DEFAULT_ACQUISITION_CHANNELS
      .filter(name => !existingNames.has(name.trim().toLowerCase()))
      .map(name => ({
        company_id: companyId,
        channel_name: name,
        avg_lead_cost: 0,
      }));

    if (missingChannels.length === 0) return;

    for (const channel of missingChannels) {
      const res = await authFetch('/api/leads/meta/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channel),
      });
      if (!res.ok) {
        const body = await res.text();
        console.warn('Failed to create default acquisition channel', channel.channel_name, body);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const companyId = await getCompanyId();
      if (!companyId) {
        console.warn("No company ID found for user");
        setSources([]);
        setLoading(false);
        return;
      }

      console.log(`[ClientAcquisition] Fetching data for company ${companyId}`);

      // Fetch acquisition channels from backend
      const channelsRes = await authFetch(`/api/leads/meta/sources?company_id=${encodeURIComponent(companyId)}`);
      if (!channelsRes.ok) {
        console.error("Error fetching channels from backend:", channelsRes.statusText);
        toast.error("Failed to load acquisition channels");
        setLoading(false);
        return;
      }
      const channels = await channelsRes.json();

      // Ensure default channels exist
      if (channels) {
        await ensureDefaultChannels(companyId, channels);
      }

      // Fetch all leads FOR THIS COMPANY ONLY
      const leadsRes = await authFetch(`/api/leads?company_id=${encodeURIComponent(companyId)}`);
      if (!leadsRes.ok) {
        console.error("Error fetching leads from backend:", leadsRes.statusText);
        toast.error("Failed to load leads");
        setLoading(false);
        return;
      }
      const leads = await leadsRes.json();

      // IMPORTANT: Use the workflow endpoint to get ONLY "Client Successfully Acquired" leads
      // Data Fetching Rule: Fetch all leads where stage = "Client Successfully Acquired"
      const clientAcqRes = await authFetch(`/api/leads/workflow/client-acquisition?company_id=${encodeURIComponent(companyId)}`);
      const clientAcquiredLeads = clientAcqRes.ok ? await clientAcqRes.json() : [];

      console.log(`[ClientAcquisition] Fetched ${leads?.length || 0} total leads, ${clientAcquiredLeads.length} "Client Successfully Acquired"`);

      // Fetch channels again to ensure we have latest
      const allChannelsRes = await authFetch(`/api/leads/meta/sources?company_id=${encodeURIComponent(companyId)}`);
      if (!allChannelsRes.ok) {
        console.error("Error fetching final channels from backend:", allChannelsRes.statusText);
        toast.error("Failed to load channels");
        setLoading(false);
        return;
      }
      const allChannels = await allChannelsRes.json();

      // Process data
      if (allChannels && leads) {
        let tLeads = 0;
        let tClients = 0;
        let tRevenue = 0;

        const processed = allChannels.map(ch => {
          // Get leads from this channel
          const chLeads = leads.filter(l => l.source_id === ch.id);
          // Count how many of those leads are in "Client Successfully Acquired" workflow
          const chClients = chLeads.filter(l => l.stage === 'Client Successfully Acquired');

          const leadsCount = chLeads.length;
          const clientsCount = chClients.length;
          const rate = leadsCount > 0 ? ((clientsCount / leadsCount) * 100).toFixed(1) + "%" : "0.0%";

          // Revenue calculation: $12,000 per acquired client
          const revenue = clientsCount * 12000;

          tLeads += leadsCount;
          tClients += clientsCount;
          tRevenue += revenue;

          console.log(`[ClientAcquisition] Channel ${ch.channel_name}: ${leadsCount} leads, ${clientsCount} acquired clients`);

          return {
            id: ch.id,
            channel: ch.channel_name,
            leads: leadsCount,
            clients: clientsCount,
            cost: `$${parseFloat(ch.avg_lead_cost || 0).toFixed(2)}`,
            rate: rate,
            value: `$${revenue.toLocaleString()}`
          };
        });

        setSources(processed);
        setTotalLeads(tLeads);
        // Use the actual count of "Client Successfully Acquired" leads from the workflow endpoint
        setConvertedClients(clientAcquiredLeads.length);
        tClients = clientAcquiredLeads.length;
        tRevenue = tClients * 12000;

        const overallRate = tLeads > 0 ? ((tClients / tLeads) * 100).toFixed(1) + "%" : "0.0%";
        setAvgAcquisitionRate(overallRate);

        let formattedRev = `$${tRevenue.toLocaleString()}`;
        if (tRevenue >= 1000000) {
          formattedRev = `$${(tRevenue / 1000000).toFixed(2)}M`;
        } else if (tRevenue >= 1000) {
          formattedRev = `$${(tRevenue / 1000).toFixed(1)}K`;
        }
        setTotalPipeValue(formattedRev);

        console.log(`[ClientAcquisition] Summary: ${tLeads} total leads, ${tClients} "Client Successfully Acquired", ${formattedRev} revenue`);
      }
    } catch (err) {
      console.error("Unexpected error in fetchData:", err);
      toast.error("An unexpected error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName) return;
    setSubmitting(true);
    try {
      const companyId = profile?.company_id || (await getCompanyId());
      if (!companyId) throw new Error("Could not find company ID");

      const res = await authFetch('/api/leads/meta/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          channel_name: newChannelName,
          avg_lead_cost: parseFloat(newChannelCost) || 0,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Failed to add channel: ${errorBody || res.statusText}`);
      }

      toast.success("Channel added successfully!");
      setIsDialogOpen(false);
      setNewChannelName("");
      setNewChannelCost("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add channel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <SectionHeader
        title="Client Acquisition & Funnels"
        sub="Trace customer generation channels, review marketing ROI, and analyze channel conversion ratios"
        actions={
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-border/50 shadow-sm">
                  <UserPlus className="h-4 w-4 mr-1.5" /> New Channel
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add Acquisition Channel</DialogTitle>
                  <DialogDescription className="text-muted-foreground/60 text-xs">Track a new marketing channel.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddChannel} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Channel Name *</Label>
                    <Input required value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="e.g. Google Ads" className="bg-background border-input" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Average Lead Cost ($) *</Label>
                    <Input required type="number" step="0.01" value={newChannelCost} onChange={e => setNewChannelCost(e.target.value)} placeholder="0.00" className="bg-background border-input" />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Channel"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button size="sm" className="btn-gold shadow-md" onClick={() => navigate('/crm/reports')}>
              <BarChart3 className="h-4 w-4 mr-1.5" /> Funnel Reports
            </Button>
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">New Leads Acquired</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{totalLeads}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Converted Buyers</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{convertedClients} Clients</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Acquisition Rate</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{avgAcquisitionRate}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 bg-card/60 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Pipe Value</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{totalPipeValue}</div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Acquisition Channels Register</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cost efficiency and inquiry volume analysis across all sales routes</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900/60 text-muted-foreground font-semibold border-b border-border">
                <th className="p-3">Inbound Channel</th>
                <th className="p-3">Leads Captured</th>
                <th className="p-3">Converted Clients</th>
                <th className="p-3">Avg Lead Cost</th>
                <th className="p-3">Conversion Rate</th>
                <th className="p-3 font-semibold">Total Revenue Acquired</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Loading channels...</td></tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6">
                    <div className="text-center space-y-2">
                      <p className="text-muted-foreground font-medium">No acquisition data available yet</p>
                      <p className="text-xs text-muted-foreground/60">Create leads and mark them as "Client Successfully Acquired" to see data here.</p>
                      <p className="text-xs text-muted-foreground/60">Channels are being seeded automatically.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sources.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-border/40 hover:bg-neutral-900/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{item.channel}</td>
                    <td className="p-3 font-mono text-muted-foreground">{item.leads}</td>
                    <td className="p-3 font-mono text-muted-foreground">{item.clients}</td>
                    <td className="p-3 font-mono text-muted-foreground">{item.cost}</td>
                    <td className="p-3 font-mono text-primary font-semibold">{item.rate}</td>
                    <td className="p-3 font-mono text-emerald-500 font-bold">{item.value}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
