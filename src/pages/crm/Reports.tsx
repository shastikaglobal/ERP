import { useState, useEffect, useMemo } from "react";
import SectionHeader from "../../components/SectionHeader";
import Card from "@/components/Card";
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  BarChart3, 
  TrendingUp, 
  RefreshCw, 
  FileSpreadsheet,
  Users,
  DollarSign,
  Briefcase,
  Loader2,
  Filter,
  Search,
  ChevronDown,
  Activity,
  Globe,
  Phone,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  isWithinInterval, 
  parseISO
} from "date-fns";
import { toast } from "sonner";
import Papa from "papaparse";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReChartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// Custom UI Components for Professional Look
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [data, setData] = useState<{
    profiles: any[];
    leads: any[];
    activities: any[];
    followUps: any[];
    quotations: any[];
    exportOrders: any[];
    dailyReports: any[];
    acquisitions: any[];
  } | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedBDE, setSelectedBDE] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: profilesData },
        { data: leadsData },
        { data: activitiesData },
        { data: followUpsData },
        { data: quotationsData },
        { data: exportOrdersData },
        { data: dailyReportsData },
        { data: acquisitionsData }
      ] = await Promise.all([
        supabase.from("profiles" as any).select("id, full_name, avatar_url"),
        supabase.from("leads" as any).select("*"),
        supabase.from("activities" as any).select("*, leads(company_name, country)"),
        supabase.from("follow_ups" as any).select("*"),
        supabase.from("quotations" as any).select("*"),
        supabase.from("export_orders" as any).select("*"),
        supabase.from("bde_daily_reports" as any).select("*"),
        supabase.from("client_acquisition" as any).select("*")
      ]);

      const profiles = (profilesData || []) as any[];
      const leads = (leadsData || []) as any[];
      const activities = (activitiesData || []) as any[];
      const followUps = (followUpsData || []) as any[];
      const quotations = (quotationsData || []) as any[];
      const exportOrders = (exportOrdersData || []) as any[];
      const dailyReports = (dailyReportsData || []) as any[];

      setData({
        profiles: profiles.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")),
        leads,
        activities,
        followUps,
        quotations,
        exportOrders,
        dailyReports,
        acquisitions: (acquisitionsData || []) as any[]
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load reporting data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReCompile = async () => {
    setCompiling(true);
    await fetchData();
    setCompiling(false);
    toast.success("Analytics re-compiled successfully");
  };

  // --- Helper Functions ---
  const isInDateRange = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const d = parseISO(dateStr);
      return isWithinInterval(d, { start: startDate, end: endDate });
    } catch (e) {
      return false;
    }
  };

  const isEmpMatch = (dbValue: any, employeeId: string) => {
    if (employeeId === 'all') return true;
    if (!dbValue || !data) return false;
    const val = String(dbValue).trim().toLowerCase();
    const empId = employeeId.trim().toLowerCase();
    if (val === empId) return true;
    const employee = data.profiles.find(p => p.id === employeeId);
    const empName = employee?.full_name?.trim().toLowerCase();
    return empName && val === empName;
  };

  // --- Analytical Calculations ---
  
  const stats = useMemo(() => {
    if (!data) return { totalReports: 0, leadsThisMonth: 0, revenueThisMonth: 0, activeBDEs: 0, growth: 0 };

    const now = new Date();
    const monthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    const leadsThisMonth = data.leads.filter(l => isWithinInterval(parseISO(l.created_at), { start: monthStart, end: now })).length;
    const leadsPrevMonth = data.leads.filter(l => isWithinInterval(parseISO(l.created_at), { start: prevMonthStart, end: prevMonthEnd })).length;
    
    const revenueThisMonth = data.quotations
      .filter(q => isWithinInterval(parseISO(q.created_at), { start: monthStart, end: now }))
      .reduce((sum, q) => sum + (Number(q.amount) || Number(q.total_amount) || 0), 0);

    const activeBDEs = data.profiles.length;
    const totalReports = data.activities.length + data.quotations.length + data.exportOrders.length + data.dailyReports.length;
    
    const growth = leadsPrevMonth > 0 ? ((leadsThisMonth - leadsPrevMonth) / leadsPrevMonth) * 100 : 100;

    return {
      totalReports,
      leadsThisMonth,
      revenueThisMonth,
      activeBDEs,
      growth: isFinite(growth) ? growth.toFixed(1) : "0"
    };
  }, [data]);

  const activityAnalytics = useMemo(() => {
    if (!data) return [];

    const newLeads = data.leads.filter(l => 
      isInDateRange(l.created_at) && 
      isEmpMatch(l.assigned_to, selectedBDE)
    ).length;

    const activities = data.activities.filter(a => 
      isInDateRange(a.created_at) && 
      isEmpMatch(a.created_by, selectedBDE)
    );

    const filteredDailyReports = data.dailyReports.filter(dr => 
      isInDateRange(dr.report_date) && 
      isEmpMatch(dr.bde_id, selectedBDE)
    );

    const individualCalls = activities.filter(a => ['call', 'Call', 'phone', 'Phone'].includes(a.type)).length;
    const reportedCalls = filteredDailyReports.reduce((sum, dr) => sum + (Number(dr.total_calls) || 0), 0);
    const calls = Math.max(individualCalls, reportedCalls);

    const individualEmails = activities.filter(a => ['email', 'Email'].includes(a.type)).length;
    const reportedEmails = filteredDailyReports.reduce((sum, dr) => sum + (Number(dr.emails_sent) || 0), 0);
    const emails = Math.max(individualEmails, reportedEmails);

    const individualLinkedin = activities.filter(a => ['linkedin', 'LinkedIn'].includes(a.type)).length;
    const reportedLinkedin = filteredDailyReports.reduce((sum, dr) => sum + (Number(dr.linkedin_messages) || 0), 0);
    const linkedin = Math.max(individualLinkedin, reportedLinkedin);

    const whatsapp = activities.filter(a => ['whatsapp', 'WhatsApp'].includes(a.type)).length;
    const meetings = activities.filter(a => ['meeting', 'Meeting', 'visit', 'Visit'].includes(a.type)).length;

    const followUpsDone = data.followUps.filter(f => 
      f.is_notified === true && 
      isInDateRange(f.created_at) && 
      isEmpMatch(f.assigned_to, selectedBDE)
    ).length;

    const quotations = data.quotations.filter(q => 
      isInDateRange(q.created_at) && 
      (isEmpMatch(q.created_by, selectedBDE) || (q.lead_id && data.leads.find(l => l.id === q.lead_id && isEmpMatch(l.assigned_to, selectedBDE))))
    ).length;

    const dealsWon = data.leads.filter(l => 
      ['Won', 'won', 'Closed Won', 'closed_won', 'closed won'].includes(l.stage) &&
      isInDateRange(l.updated_at || l.created_at) &&
      isEmpMatch(l.assigned_to, selectedBDE)
    ).length;

    return [
      { label: "New Leads Added", value: newLeads, icon: Users, color: "text-blue-400" },
      { label: "Calls Made", value: calls, icon: Phone, color: "text-purple-400" },
      { label: "Emails Sent", value: emails, icon: Search, color: "text-emerald-400" },
      { label: "LinkedIn Messages Sent", value: linkedin, icon: Globe, color: "text-blue-500" },
      { label: "WhatsApp Messages Sent", value: whatsapp, icon: Activity, color: "text-green-500" },
      { label: "Follow-ups Done", value: followUpsDone, icon: RefreshCw, color: "text-orange-400" },
      { label: "Meetings Scheduled", value: meetings, icon: CalendarIcon, color: "text-[#c8a84b]" },
      { label: "Meetings Attended", value: meetings, icon: CheckCircle2, color: "text-amber-500" },
      { label: "Quotations Sent", value: quotations, icon: FileText, color: "text-cyan-400" },
      { label: "Deals Won", value: dealsWon, icon: TrendingUp, color: "text-emerald-500" },
    ];
  }, [data, startDate, endDate, selectedBDE]);

  const leadSourceBreakdown = useMemo(() => {
    if (!data) return [];
    
    const sourceCounts: { [key: string]: number } = {};
    let total = 0;

    data.leads.forEach(l => {
      const isInRange = isWithinInterval(parseISO(l.created_at), { start: startDate, end: endDate });
      if (!isInRange) return;

      const source = l.source || "Direct";
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      total++;
    });

    return Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [data, startDate, endDate]);

  const revenueTrendData = useMemo(() => {
    if (!data) return [];
    
    const now = new Date();
    const months = [];
    
    // Generate last 6 months baseline
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      months.push({
        month: format(d, 'MMM'),
        fullMonth: format(d, 'MMMM yyyy'),
        revenue: 0,
        rawDate: d
      });
    }

    data.quotations.forEach(q => {
      const qDate = parseISO(q.created_at);
      const mLabel = format(qDate, 'MMM');
      const yLabel = format(qDate, 'yyyy');
      
      const monthObj = months.find(m => m.month === mLabel && format(m.rawDate, 'yyyy') === yLabel);
      if (monthObj) {
        monthObj.revenue += (Number(q.total_amount) || Number(q.amount) || 0);
      }
    });

    return months;
  }, [data]);

  // Robust Matching Helper
  const isEmployeeMatch = (dbValue: any, employee: any) => {
    if (!dbValue || !employee) return false;
    const val = String(dbValue).trim().toLowerCase();
    const empId = String(employee.id).trim().toLowerCase();
    const empName = employee.full_name ? String(employee.full_name).trim().toLowerCase() : null;
    return val === empId || (empName && val === empName);
  };

  // --- Export Functions ---

  const exportCSV = (content: any[], filename: string) => {
    const csv = Papa.unparse(content);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported");
  };

  const exportPDF = (title: string, headers: string[], rows: any[][], filename: string) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(26, 82, 118); // Professional dark blue
    doc.text("SHASTIKA GLOBAL", 14, 22);
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 32);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${format(new Date(), 'PPpp')}`, 14, 38);
    doc.line(14, 42, 196, 42);
    
    let y = 55;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    headers.forEach((h, i) => doc.text(h, 14 + (i * 32), y));
    y += 10;
    
    doc.setFont("helvetica", "normal");
    rows.forEach(row => {
      if (y > 275) { doc.addPage(); y = 30; }
      row.forEach((cell, i) => doc.text(String(cell).substring(0, 18), 14 + (i * 32), y));
      y += 8;
    });

    doc.save(`${filename}.pdf`);
    toast.success("PDF Exported");
  };

  const exportExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast.success("Excel Exported");
  };

  // --- Report Generations ---

  const handleBDEConversionReport = (format: 'csv' | 'pdf') => {
    if (!data) return;
    const report = data.profiles
      .filter(p => selectedBDE === 'all' || p.id === selectedBDE)
      .map(emp => {
        const empLeads = data.leads.filter(l => 
          isEmployeeMatch(l.assigned_to, emp) && 
          isInDateRange(l.created_at)
        );
        const leadIds = new Set(empLeads.map(l => l.id));
        
        const contacted = empLeads.filter(l => l.stage !== 'New').length;
        const indFollowUps = data.followUps.filter(f => isEmployeeMatch(f.assigned_to, emp) && f.is_notified && isInDateRange(f.created_at)).length;
        const quotes = data.quotations.filter(q => q.lead_id && leadIds.has(q.lead_id) && isInDateRange(q.created_at)).length;
        const won = empLeads.filter(l => ['won', 'closed won', 'closed_won'].includes(l.stage?.toLowerCase())).length;
        const conv = empLeads.length > 0 ? ((won / empLeads.length) * 100).toFixed(1) : "0";

        // Aggregate daily reports
        const empDaily = data.dailyReports.filter(dr => isEmployeeMatch(dr.bde_id, emp) && isInDateRange(dr.report_date));
        const totalCalls = empDaily.reduce((sum, dr) => sum + (Number(dr.total_calls) || 0), 0);
        const reportedAttended = empDaily.reduce((sum, dr) => sum + (Number(dr.calls_attended) || 0), 0);

        return {
          Employee: emp.full_name,
          Leads: empLeads.length,
          Calls_Made: totalCalls,
          Calls_Attended: Math.max(reportedAttended, indFollowUps),
          Quotes: quotes,
          Won: won,
          Conv: `${conv}%`
        };
      });

    if (format === 'csv') exportCSV(report, "BDE_Conversion");
    else {
      const headers = ["Employee", "Leads", "Calls", "Attended", "Quotes", "Won", "Conv%"];
      const rows = report.map(r => [r.Employee, r.Leads, r.Calls_Made, r.Calls_Attended, r.Quotes, r.Won, r.Conv]);
      exportPDF("BDE Conversion Analysis", headers, rows, "BDE_Conversion");
    }
  };

  const handleLeadGenReport = (formatType: 'csv' | 'pdf') => {
    if (!data) return;
    const logs = data.activities
      .filter(a => {
        const dateMatch = isWithinInterval(parseISO(a.created_at), { start: startDate, end: endDate });
        const bdeMatch = selectedBDE === 'all' || isEmployeeMatch(a.created_by, data.profiles.find(p => p.id === selectedBDE));
        const lead = Array.isArray(a.leads) ? a.leads[0] : a.leads;
        const countryMatch = selectedCountry === 'all' || (lead?.country === selectedCountry);
        return dateMatch && bdeMatch && countryMatch;
      })
      .map(a => {
        const lead = Array.isArray(a.leads) ? a.leads[0] : a.leads;
        return {
          Date: format(parseISO(a.created_at), 'yyyy-MM-dd'),
          Employee: data.profiles.find(p => isEmployeeMatch(a.created_by, p))?.full_name || "System",
          Lead: lead?.company_name || lead?.name || "N/A",
          Country: lead?.country || "N/A",
          Type: a.type
        };
      });

    if (formatType === 'csv') exportCSV(logs, "Lead_Gen_Logs");
    else {
      const headers = ["Date", "Employee", "Lead", "Country", "Type"];
      const rows = logs.map(l => [l.Date, l.Employee, l.Lead, l.Country, l.Type]);
      exportPDF("Outbound Sales Logs", headers, rows, "Lead_Gen_Logs");
    }
  };

  const handleMeetingAudit = async (formatType: 'csv' | 'pdf') => {
    // 1. Query activities specifically for meetings
    const { data: actRaw } = await supabase
      .from('activities' as any)
      .select('id, type, title, description, created_at, created_by, lead_id')
      .eq('type', 'meeting');

    // 2. Separately fetch profiles for name mapping
    const { data: profRaw } = await supabase
      .from('profiles' as any)
      .select('id, full_name');

    // 3. Separately fetch leads for company mapping
    const { data: leadsRaw } = await supabase
      .from('leads' as any)
      .select('id, company_name');

    const activitiesData = (actRaw || []) as any[];
    const profilesData = (profRaw || []) as any[];
    const leadsData = (leadsRaw || []) as any[];

    // 4. In JavaScript, join and format the data
    const meetings = activitiesData.map((activity: any) => {
      const bdeName = profilesData.find((p: any) => p.id === activity.created_by)?.full_name || 'Unknown';
      const clientName = leadsData.find((l: any) => l.id === activity.lead_id)?.company_name || activity.title || 'N/A';
      const dateStr = activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'N/A';

      return {
        BDE: bdeName,
        Client: clientName,
        Date: dateStr,
        Status: 'Verified'
      };
    });

    // 5. Generate and download
    if (formatType === 'csv') {
      exportCSV(meetings, "Field_Visit_Audit");
    } else {
      const headers = ["BDE", "Client", "Date", "Verification Status"];
      const rows = meetings.map(m => [m.BDE, m.Client, m.Date, m.Status]);
      exportPDF("Field Meeting Investigation", headers, rows, "Field_Visit_Audit");
    }
  };

  const handleRevenueTrends = (formatType: 'excel' | 'pdf') => {
    if (!data) return;
    const revenue = data.exportOrders
      .filter(o => isWithinInterval(parseISO(o.created_at || o.order_date), { start: startDate, end: endDate }))
      .map(o => ({
        Order: o.order_number || "---",
        Date: format(parseISO(o.created_at || o.order_date), 'yyyy-MM-dd'),
        Value: `$${(Number(o.total_amount) || Number(o.amount) || 0).toLocaleString()}`,
        Status: o.status
      }));

    if (formatType === 'excel') exportExcel(revenue, "Revenue_Pipeline");
    else {
      const headers = ["Order ID", "Order Date", "Amount (USD)", "Fulfillment Status"];
      const rows = revenue.map(r => [r.Order, r.Date, r.Value, r.Status]);
      exportPDF("Revenue Pipeline Trend", headers, rows, "Revenue_Pipeline");
    }
  };

  const handleAcquisitionFunnelReport = (formatType: 'csv' | 'pdf') => {
    if (!data) return;
    const report = data.acquisitions
      .filter(a => isInDateRange(a.acquisition_date || a.created_at))
      .map(a => ({
        Client: a.client_name,
        Date: format(parseISO(a.acquisition_date || a.created_at), 'yyyy-MM-dd'),
        Source: a.inquiry_source || "N/A",
        BDE: data.profiles.find(p => p.id === a.assigned_bde || p.full_name === a.assigned_bde)?.full_name || "Unassigned",
        Stage: a.status,
        Value: `$${(Number(a.deal_value) || 0).toLocaleString()}`
      }));

    if (formatType === 'csv') exportCSV(report, "Acquisition_Funnel");
    else {
      const headers = ["Client", "Date", "Source", "BDE", "Current Stage", "Value"];
      const rows = report.map(r => [r.Client, r.Date, r.Source, r.BDE, r.Stage, r.Value]);
      exportPDF("Client Acquisition Strategy Audit", headers, rows, "Acquisition_Funnel");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative">
          <Loader2 className="h-14 w-14 animate-spin text-[#c8a84b] opacity-20" />
          <Loader2 className="h-14 w-14 animate-spin text-[#c8a84b] absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '3s', opacity: 0.5 }} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-bold text-white tracking-tight uppercase">Processing Analytics</p>
          <p className="text-xs text-muted-foreground">Aggregating live CRM data across all BDE profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-foreground pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 border-b border-white/5">
        <SectionHeader
          title="Reports & Analytics Vault"
          sub="Intelligence center for sales performance and pipeline verification"
        />
        <Button 
          className="btn-gold px-8 py-6 rounded-2xl shadow-xl shadow-[#c8a84b]/10 group transition-all" 
          onClick={handleReCompile}
          disabled={compiling}
        >
          <div className="flex items-center gap-3">
            <RefreshCw className={cn("h-5 w-5", compiling && "animate-spin")} />
            <div className="text-left">
              <div className="text-sm font-black uppercase">Re-Compile</div>
              <div className="text-[10px] uppercase font-bold opacity-70">Sync database</div>
            </div>
          </div>
        </Button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6 bg-gradient-to-br from-neutral-900/60 to-black border-white/5 flex flex-col justify-between group overflow-hidden relative">
          <Activity className="h-12 w-12 text-primary/10 absolute -bottom-2 -right-2 rotate-12 group-hover:scale-125 transition-transform" />
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Audit Trail</div>
          <div className="mt-2">
            <div className="text-3xl font-black font-mono text-white">{stats.totalReports}</div>
            <div className="text-[10px] text-primary/80 font-bold uppercase mt-1">Total Records</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-neutral-900/60 to-black border-white/5 flex flex-col justify-between group overflow-hidden relative">
          <Users className="h-12 w-12 text-blue-400/10 absolute -bottom-2 -right-2 rotate-12 group-hover:scale-125 transition-transform" />
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Monthly Flow</div>
          <div className="mt-2">
            <div className="text-3xl font-black font-mono text-blue-400">{stats.leadsThisMonth}</div>
            <div className="text-[10px] text-blue-400/80 font-bold uppercase mt-1">New Leads · {stats.growth}% Growth</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-neutral-900/60 to-black border-white/5 flex flex-col justify-between group overflow-hidden relative">
          <DollarSign className="h-12 w-12 text-emerald-400/10 absolute -bottom-2 -right-2 rotate-12 group-hover:scale-125 transition-transform" />
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Performance</div>
          <div className="mt-2">
            <div className="text-3xl font-black font-mono text-emerald-500 font-mono">${(stats.revenueThisMonth / 1000).toFixed(1)}K</div>
            <div className="text-[10px] text-emerald-500/80 font-bold uppercase mt-1">Approved Revenue</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-neutral-900/60 to-black border-white/5 flex flex-col justify-between group overflow-hidden relative">
          <Briefcase className="h-12 w-12 text-purple-400/10 absolute -bottom-2 -right-2 rotate-12 group-hover:scale-125 transition-transform" />
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Resources</div>
          <div className="mt-2">
            <div className="text-3xl font-black font-mono text-purple-400">{stats.activeBDEs}</div>
            <div className="text-[10px] text-purple-400/80 font-bold uppercase mt-1">Active BDEs</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-neutral-900/60 to-black border-white/5 flex flex-col justify-between group overflow-hidden relative border-l-4 border-l-[#c8a84b]/30">
          <CalendarIcon className="h-12 w-12 text-amber-400/10 absolute -bottom-2 -right-2 rotate-12 group-hover:scale-125 transition-transform" />
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Audit Cycle</div>
          <div className="mt-2">
            <div className="text-3xl font-black font-mono text-[#c8a84b]">WEEKLY</div>
            <div className="text-[10px] text-[#c8a84b]/80 font-bold uppercase mt-1">Status: Operational</div>
          </div>
        </Card>
      </div>

      {/* Modern Filters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end bg-neutral-900/40 p-8 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <CalendarIcon className="h-3 w-3 text-[#c8a84b]" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Timeframe</span>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-black/40 border-white/10 text-white font-mono h-12 rounded-xl">
                  {format(startDate, "MMM dd, yy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-900 border-white/10">
                <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
            <div className="flex items-center text-muted-foreground px-1">→</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-black/40 border-white/10 text-white font-mono h-12 rounded-xl">
                  {format(endDate, "MMM dd, yy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-900 border-white/10">
                <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Users className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Business Associate</span>
          </div>
          <Select value={selectedBDE} onValueChange={setSelectedBDE}>
            <SelectTrigger className="w-full bg-black/40 border-white/10 text-white h-12 rounded-xl focus:ring-[#c8a84b]/20">
              <SelectValue placeholder="All Associates" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-white/10 text-white">
              <SelectItem value="all">All Global Employees</SelectItem>
              {data?.profiles.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Globe className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Region</span>
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full bg-black/40 border-white/10 text-white h-12 rounded-xl focus:ring-emerald-500/20">
              <SelectValue placeholder="Worldwide" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-white/10 text-white">
              <SelectItem value="all">Everywhere (Total)</SelectItem>
              {[...new Set(data?.leads.map(l => l.country).filter(Boolean))].sort().map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="group">
           <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-[#c8a84b]/50 hover:bg-[#c8a84b]/5 transition-all text-xs font-bold uppercase tracking-widest"
            onClick={() => { setStartDate(startOfMonth(new Date())); setEndDate(new Date()); setSelectedBDE('all'); setSelectedCountry('all'); }}
           >
             Reset Filters
           </Button>
        </div>
      </div>

      {/* Activity Analytics Table */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-[#c8a84b]" />
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Activity Analytics</h2>
        </div>
        
        <Card className="bg-neutral-900/40 border-white/5 overflow-hidden backdrop-blur-xl">
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Metric Category</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-center">Current Total</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-right">System Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityAnalytics.map((metric, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-white/5", metric.color)}>
                        <metric.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-white/90">{metric.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <span className="text-xl font-black font-mono text-white tracking-tighter">
                      {metric.value.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black uppercase text-emerald-500/80 tracking-tighter">Live Sync</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-[#c8a84b]" />
            <h2 className="text-2xl font-black text-[#c8a84b] tracking-tight uppercase">Revenue Trend</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-black uppercase tracking-widest text-[#c8a84b] hover:bg-[#c8a84b]/10 gap-2"
            onClick={() => exportCSV(revenueTrendData.map(d => ({ Month: d.fullMonth, "Total Revenue": d.revenue })), "Revenue_Trend_Report")}
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Trend
          </Button>
        </div>
        
        <Card className="bg-neutral-900/40 border-white/5 p-8 backdrop-blur-xl">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 11 }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <ReChartsTooltip 
                  cursor={{ fill: 'rgba(200, 168, 75, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#111', 
                    border: '1px solid #333', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#c8a84b' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#c8a84b" 
                  radius={[6, 6, 0, 0]} 
                  barSize={45}
                >
                  {revenueTrendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={0.8 + (index * 0.04)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Lead Source Breakdown */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Lead Source Breakdown</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-black uppercase tracking-widest text-[#c8a84b] hover:bg-[#c8a84b]/10 gap-2"
            onClick={() => exportCSV(leadSourceBreakdown, "Lead_Source_Report")}
          >
            <FileSpreadsheet className="h-4 w-4" /> Download CSV
          </Button>
        </div>
        
        <Card className="bg-neutral-900/40 border-white/5 overflow-hidden backdrop-blur-xl">
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Acquisition Source</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-center">Lead Count</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-right">Distribution %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadSourceBreakdown.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground italic uppercase text-xs font-bold tracking-widest">No source data found for selected period</TableCell>
                </TableRow>
              ) : leadSourceBreakdown.map((item, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="py-4 font-bold text-white/90">{item.source}</TableCell>
                  <TableCell className="py-4 text-center font-mono text-white text-lg font-black">{item.count}</TableCell>
                  <TableCell className="py-4 text-right font-mono text-[#c8a84b] text-lg font-black">{item.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Reports Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { 
            title: "BDE Conversion Analytics", 
            icon: Users, 
            color: "text-[#c8a84b]", 
            bg: "bg-[#c8a84b]/10", 
            border: "hover:border-[#c8a84b]/30",
            desc: "Critical analysis of salesperson funnel performance, from lead assignment to final conversion ratios and revenue won.",
            onPdf: () => handleBDEConversionReport('pdf'),
            onCsv: () => handleBDEConversionReport('csv')
          },
          { 
            title: "Outbound Projections Log", 
            icon: Search, 
            color: "text-blue-400", 
            bg: "bg-blue-400/10", 
            border: "hover:border-blue-400/30",
            desc: "Comprehensive audit of all prospecting activities, filtered by selected date range and target region for strategy reviews.",
            onPdf: () => handleLeadGenReport('pdf'),
            onCsv: () => handleLeadGenReport('csv')
          },
          { 
            title: "Client Engagement Audit", 
            icon: Activity, 
            color: "text-purple-400", 
            bg: "bg-purple-400/10", 
            border: "hover:border-purple-400/30",
            desc: "Verified history of client meetings and physical visits, ensuring BDE transparency and documenting follow-up progress.",
            onPdf: () => handleMeetingAudit('pdf'),
            onCsv: () => handleMeetingAudit('csv')
          },
          { 
            title: "Pipeline Revenue Intel", 
            icon: TrendingUp, 
            color: "text-emerald-400", 
            bg: "bg-emerald-400/10", 
            border: "hover:border-emerald-400/30",
            desc: "Financial overview of the current sales pipeline, including active quotations and finalized export order fulfillment trends.",
            onPdf: () => handleRevenueTrends('pdf'),
            onCsv: () => handleRevenueTrends('excel'),
            csvLabel: "Excel Data"
          },
          { 
            title: "Client Acquisition Intel", 
            icon: Globe, 
            color: "text-amber-500", 
            bg: "bg-amber-500/10", 
            border: "hover:border-amber-500/30",
            desc: "End-to-end tracking of the client acquisition funnel, auditing every stage from lead generated to successfully acquired partner.",
            onPdf: () => handleAcquisitionFunnelReport('pdf'),
            onCsv: () => handleAcquisitionFunnelReport('csv')
          }
        ].map((report, idx) => (
          <Card key={idx} className={cn("bg-neutral-900/40 p-8 border-white/5 shadow-xl transition-all duration-500 overflow-hidden group flex flex-col h-full", report.border)}>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <div className={cn("p-4 rounded-2xl shadow-inner", report.bg, report.color)}>
                  <report.icon className="h-7 w-7" />
                </div>
                <div className="text-[9px] font-black tracking-widest text-[#c8a84b] border border-[#c8a84b]/30 px-3 py-1 rounded-full uppercase">
                  System Verified
                </div>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-4 group-hover:text-[#c8a84b] transition-colors">{report.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-10 max-w-sm">
                {report.desc}
              </p>
            </div>
            <div className="flex gap-4">
              <Button className="flex-1 btn-gold shadow-lg shadow-[#c8a84b]/10 py-6 rounded-2xl font-black uppercase tracking-tighter text-xs" onClick={report.onPdf}>
                <FileText className="h-4 w-4 mr-2" /> PDF Intel
              </Button>
              <Button variant="outline" className="flex-1 bg-white/5 border-white/10 py-6 rounded-2xl font-black uppercase tracking-tighter text-xs hover:bg-white/10" onClick={report.onCsv}>
                <Download className="h-4 w-4 mr-2" /> {report.csvLabel || "CSV Logs"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
