import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { CheckCircle2, Star, BarChart3, TrendingUp, Search, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { authFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const COLORS = {
  green: "#10b981",
  blue: "#3b82f6",
  purple: "#a855f7",
  gold: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
};

export default function SuccessfulConversations() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [totalWonLeads, setTotalWonLeads] = useState(0);
  const [totalConversions, setTotalConversions] = useState(0);
  const [conversionValue, setConversionValue] = useState("$0");

  useEffect(() => {
    fetchData();

    // Subscribe to leads table changes for real-time updates
    const channel = supabase
      .channel('client-success-sync')
      .on('broadcast', { event: 'data_changed' }, (payload) => {
        if (payload.payload?.table === 'leads') {
          console.log('[ClientSuccess] 🔔 Lead update detected via broadcast, refreshing...');
          fetchData();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const filtered = leads.filter(lead =>
      (lead.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.country || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      // Prioritize profile company_id, then fallback to getCompanyId()
      let companyId = profile?.company_id;

      if (!companyId) {
        console.log("[SuccessfulConversations] Profile company_id missing, fetching via getCompanyId...");
        companyId = await getCompanyId();
      }

      if (!companyId) {
        console.warn("[SuccessfulConversations] No company ID found");
        setLeads([]);
        setLoading(false);
        return;
      }

      console.log(`[SuccessfulConversations] Fetching Won leads for company ${companyId}`);

      const res = await authFetch(
        `/api/leads/conversions?company_id=${companyId}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error(`Server returned ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log(`[SuccessfulConversations] Fetched ${data?.length || 0} Won leads`);
      setLeads(data || []);

      // Calculate simple metrics based on fetched data
      const wonCount = data?.length || 0;
      setTotalWonLeads(wonCount);
      setTotalConversions(wonCount);

      // Estimated Value for display
      const totalValue = wonCount * 12000;
      setConversionValue(`$${totalValue.toLocaleString()}`);

    } catch (err: any) {
      console.error("Fetch error details:", err);
      toast.error("Failed to load successful conversations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = (lead: any) => {
    navigate(`/crm/leads/${lead.id}`);
  };

  return (
    <div className="w-full h-screen overflow-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
      <SectionHeader
        title="Client Success"
        sub="Won leads - Successful conversions ready for acquisition"
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800/80 border-slate-700 hover:border-green-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Won Leads</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{totalWonLeads}</p>
            </div>
            <CheckCircle2 size={28} color={COLORS.green} />
          </div>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 hover:border-blue-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Ready for Acquisition</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{totalConversions}</p>
            </div>
            <Star size={28} color={COLORS.blue} />
          </div>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 hover:border-purple-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Potential Value</p>
              <p className="text-2xl font-bold text-purple-400 mt-2">{conversionValue}</p>
            </div>
            <BarChart3 size={28} color={COLORS.purple} />
          </div>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700 hover:border-orange-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">100%</p>
            </div>
            <TrendingUp size={28} color={COLORS.orange} />
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

      {/* Won Leads Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading successful conversations...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <CheckCircle2 size={48} color={COLORS.textMuted} />
            <div className="text-center">
              <p className="text-slate-400">No successful conversations yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Leads will appear here when you mark them as "Won"
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Company</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Contact Person</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Country</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Assigned To</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Date Won</th>
                  <th className="px-4 py-3 text-center text-slate-300 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr
                    key={lead.id || idx}
                    className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => handleLeadClick(lead)}
                  >
                    <td className="px-4 py-3 text-slate-100 font-medium">{lead.company_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.contact_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300 flex items-center gap-2">
                      <MapPin size={14} color={COLORS.textMuted} />
                      {lead.country || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 flex items-center gap-2">
                      <Mail size={14} color={COLORS.textMuted} />
                      {lead.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {lead.assigned_to || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {lead.converted_at
                        ? new Date(lead.converted_at).toLocaleDateString()
                        : lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString()
                          : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                        onClick={() => handleLeadClick(lead)}
                      >
                        View
                      </Button>
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
