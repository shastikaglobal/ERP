import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { XCircle, TrendingDown, BarChart3, AlertCircle, Search, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { authFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const COLORS = {
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#a855f7",
  gold: "#f59e0b",
  orange: "#f97316",
  green: "#10b981",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
};

export default function LostLeads() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [totalLost, setTotalLost] = useState(0);
  const [lostValue, setLostValue] = useState("$0");
  const [lossRate, setLossRate] = useState("0%");

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('lost-leads-realtime-sync')
      .on('broadcast', { event: 'data_changed' }, (payload) => {
        if (payload.payload?.table === 'leads') {
          console.log('[LostLeads] 🔔 Lead update detected via broadcast, refreshing...');
          fetchData();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const filtered = leads.filter(l =>
      (l.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.country || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const companyId = await getCompanyId();
      if (!companyId) {
        console.warn("No company ID found for user");
        setLeads([]);
        setLoading(false);
        return;
      }

      // Fetch lost leads
      const res = await authFetch(
        `/api/leads/workflow/lost-leads?company_id=${encodeURIComponent(companyId)}`
      );

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || res.statusText;
        console.error("Error fetching lost leads:", message);
        toast.error("Failed to load lost leads");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLeads(data || []);

      // Fetch all leads to calculate metrics
      const allRes = await authFetch(
        `/api/leads?company_id=${encodeURIComponent(companyId)}`
      );

      if (allRes.ok) {
        const allLeads = await allRes.json();
        const lostCount = data.length;
        const totalCount = allLeads.length;

        setTotalLost(lostCount);

        // Revenue lost calculation: assume $12,000 per potential deal
        const lostRevenue = lostCount * 12000;
        setLostValue(`$${lostRevenue.toLocaleString()}`);

        // Loss rate
        const rate = totalCount > 0 ? ((lostCount / totalCount) * 100).toFixed(1) : "0";
        setLossRate(`${rate}%`);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error in fetchData:", err);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleAddNotes = async () => {
    if (!selectedLead || !lostReason) {
      toast.error("Please select a reason for loss");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lost_reason: lostReason,
          notes: notes || selectedLead.notes,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || 'Failed to update lead';
        toast.error(message);
        return;
      }

      toast.success("Lead notes updated");
      setIsDialogOpen(false);
      setLostReason("");
      setNotes("");
      setSelectedLead(null);
      fetchData();
    } catch (err) {
      console.error("Error adding notes:", err);
      toast.error("Failed to update lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeadClick = (lead: any) => {
    navigate(`/crm/leads/${lead.id}`);
  };

  return (
    <div className="w-full h-screen overflow-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
      <SectionHeader
        title="Lost Leads"
        sub="Leads that did not convert"
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800/80 border-slate-700 hover:border-red-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Lost Leads</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{totalLost}</p>
            </div>
            <XCircle size={28} color={COLORS.red} />
          </div>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 hover:border-blue-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Loss Rate</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{lossRate}</p>
            </div>
            <TrendingDown size={28} color={COLORS.blue} />
          </div>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 hover:border-purple-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Lost Revenue</p>
              <p className="text-2xl font-bold text-purple-400 mt-2">{lostValue}</p>
            </div>
            <BarChart3 size={28} color={COLORS.purple} />
          </div>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 hover:border-orange-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Recovery Opportunity</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">{totalLost}</p>
            </div>
            <AlertCircle size={28} color={COLORS.orange} />
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <Input
            placeholder="Search by company, email, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Lost Leads Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading lost leads...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <XCircle size={48} color={COLORS.textMuted} />
            <div className="text-center">
              <p className="text-slate-400">No lost leads yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Leads marked as "Lost" will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Company</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Country</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Source</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Lost Date</th>
                  <th className="px-4 py-3 text-center text-slate-300 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr
                    key={lead.id || idx}
                    className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-100 font-medium">{lead.company_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300 flex items-center gap-2">
                      <MapPin size={14} color={COLORS.textMuted} />
                      {lead.country || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 flex items-center gap-2">
                      <Mail size={14} color={COLORS.textMuted} />
                      {lead.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 flex items-center gap-2">
                      <Phone size={14} color={COLORS.textMuted} />
                      {lead.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{lead.source || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {lead.updated_at
                        ? new Date(lead.updated_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                        onClick={() => handleLeadClick(lead)}
                      >
                        View
                      </Button>
                      <Dialog open={isDialogOpen && selectedLead?.id === lead.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500/20 hover:bg-red-500/30 border-red-500 text-red-300"
                            onClick={() => {
                              setSelectedLead(lead);
                              setLostReason(lead.lost_reason || "");
                              setNotes(lead.notes || "");
                              setIsDialogOpen(true);
                            }}
                          >
                            Reason
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Loss Reason - {lead.company_name}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                              Document why this lead was lost
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-slate-300">Reason for Loss</Label>
                              <select
                                value={lostReason}
                                onChange={(e) => setLostReason(e.target.value)}
                                className="w-full mt-2 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                              >
                                <option value="">Select a reason...</option>
                                <option value="Budget Constraints">Budget Constraints</option>
                                <option value="Lost to Competitor">Lost to Competitor</option>
                                <option value="No Response">No Response</option>
                                <option value="Not Interested">Not Interested</option>
                                <option value="Wrong Timing">Wrong Timing</option>
                                <option value="Quality Issues">Quality Issues</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-slate-300">Additional Notes</Label>
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any additional context..."
                                className="w-full mt-2 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white h-24 resize-none"
                              />
                            </div>
                            <Button
                              onClick={handleAddNotes}
                              disabled={isSubmitting}
                              className="w-full bg-red-600 hover:bg-red-700"
                            >
                              {isSubmitting ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
