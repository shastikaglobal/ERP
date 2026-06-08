import { useEffect, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { UserPlus, Star, BarChart3, TrendingUp, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ClientAcquisition() {
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

  const fetchData = async () => {
    setLoading(true);

    const { data: channels } = await supabase
      .from('acquisition_channels')
      .select('*')
      .order('channel_name');

    const { data: leads } = await supabase
      .from('leads')
      .select('id, source_id, stage');

    if (channels && leads) {
      let tLeads = 0;
      let tClients = 0;
      let tRevenue = 0;

      const processed = channels.map(ch => {
        const chLeads = leads.filter(l => l.source_id === ch.id);
        const chClients = chLeads.filter(l => l.stage && ['Won', 'Closed Won', 'Deal Won', 'Client', 'Converted'].some(s => l.stage.toLowerCase().includes(s.toLowerCase())));

        const leadsCount = chLeads.length;
        const clientsCount = chClients.length;
        const rate = leadsCount > 0 ? ((clientsCount / leadsCount) * 100).toFixed(1) + "%" : "0.0%";

        const revenue = clientsCount * 12000;

        tLeads += leadsCount;
        tClients += clientsCount;
        tRevenue += revenue;

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
      setConvertedClients(tClients);

      const overallRate = tLeads > 0 ? ((tClients / tLeads) * 100).toFixed(1) + "%" : "0.0%";
      setAvgAcquisitionRate(overallRate);

      let formattedRev = `$${tRevenue.toLocaleString()}`;
      if (tRevenue >= 1000000) {
        formattedRev = `$${(tRevenue / 1000000).toFixed(2)}M`;
      } else if (tRevenue >= 1000) {
        formattedRev = `$${(tRevenue / 1000).toFixed(1)}K`;
      }
      setTotalPipeValue(formattedRev);
    }
    setLoading(false);
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const companyId = (await supabase.from("profiles").select("company_id").eq("id", session?.user?.id).single()).data?.company_id;

      if (!companyId) throw new Error("Could not find company ID");

      const { error } = await supabase.from('acquisition_channels').insert({
        company_id: companyId,
        channel_name: newChannelName,
        avg_lead_cost: parseFloat(newChannelCost) || 0
      });

      if (error) throw error;
      toast.success("Channel added successfully!");
      setIsDialogOpen(false);
      setNewChannelName("");
      setNewChannelCost("");
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
            <Button size="sm" className="btn-gold shadow-md">
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
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No channels found.</td></tr>
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
