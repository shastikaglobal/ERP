import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Calendar, CheckCircle, Clock, XCircle, FileSpreadsheet, Eye, User, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function LeaveManagement() {
  const { session, profile } = useAuth();
  const token = session?.access_token;
  const queryClient = useQueryClient();
  const isAdminOrHR = ['admin', 'manager', 'director', 'hr'].includes(profile?.role?.toLowerCase() || '');

  // Fetch Data
  const { data: leaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const res = await fetch('/api/leaves', { headers: { 'Authorization': `Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed to fetch leaves');
      return res.json();
    },
    enabled: !!token
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['leave_balances'],
    queryFn: async () => {
      const res = await fetch('/api/leaves/balances', { headers: { 'Authorization': `Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed to fetch balances');
      return res.json();
    },
    enabled: !!token
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to apply for leave');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave application submitted');
      setApplyModalOpen(false);
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (payload: { id: string, action: string, stage: string }) => {
      const res = await fetch(`/api/leaves/${payload.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Failed to ${payload.action} leave`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave_balances'] });
      toast.success('Leave status updated');
    }
  });

  // State
  const [activeTab, setActiveTab] = useState<'my_leaves' | 'approvals' | 'balances'>('my_leaves');
  const [searchTerm, setSearchTerm] = useState('');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    leave_type: 'Casual Leave (CL)',
    from_date: '',
    to_date: '',
    reason: '',
    attachment_url: ''
  });

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    let count = 0;
    let cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++; // Exclude weekends
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date || !form.reason) return toast.error('Please fill required fields');
    const days = calculateDays(form.from_date, form.to_date);
    if (days <= 0) return toast.error('Invalid date range');
    
    applyMutation.mutate({
      ...form,
      number_of_days: days
    });
  };

  // Stats
  const stats = useMemo(() => {
    const myLeaves = leaves.filter((l: any) => l.employee_id === profile?.id);
    return {
      total: myLeaves.length,
      pending: myLeaves.filter((l: any) => l.status === 'Pending').length,
      approved: myLeaves.filter((l: any) => l.status === 'Approved').length,
      rejected: myLeaves.filter((l: any) => l.status === 'Rejected').length,
    };
  }, [leaves, profile]);

  const approvalStats = useMemo(() => {
    const toApprove = leaves.filter((l: any) => l.employee_id !== profile?.id && l.status === 'Pending');
    return { pending: toApprove.length };
  }, [leaves, profile]);

  const displayedLeaves = useMemo(() => {
    let base = leaves;
    if (activeTab === 'my_leaves') base = leaves.filter((l: any) => l.employee_id === profile?.id);
    else if (activeTab === 'approvals') base = leaves.filter((l: any) => l.employee_id !== profile?.id);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      base = base.filter((l: any) => 
        l.employee_name?.toLowerCase().includes(term) || 
        l.leave_type?.toLowerCase().includes(term) ||
        l.status?.toLowerCase().includes(term)
      );
    }
    return base;
  }, [leaves, activeTab, searchTerm, profile]);

  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(displayedLeaves.map((d: any) => ({
      'Employee Name': d.employee_name,
      'Leave Type': d.leave_type,
      'From': new Date(d.from_date).toLocaleDateString(),
      'To': new Date(d.to_date).toLocaleDateString(),
      'Days': d.number_of_days,
      'Status': d.status
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Leaves");
    xlsx.writeFile(wb, "Leave_Report.xlsx");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030303] overflow-hidden">
      <PageHeader
        title="Leave Management"
        description="Manage leave requests, balances, and approvals."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="bg-[#0d0d0d] border-[#2a2a2a] text-slate-300 hover:text-white" onClick={exportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" /> Export
            </Button>
            <Button onClick={() => setApplyModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> Apply Leave
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {/* KPI CARDS */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.total}</span>
            </div>
            <div className="mt-4 text-sm text-slate-400">Total Leaves Applied</div>
          </div>
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.pending}</span>
            </div>
            <div className="mt-4 text-sm text-slate-400">Pending Approvals</div>
          </div>
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.approved}</span>
            </div>
            <div className="mt-4 text-sm text-slate-400">Approved Leaves</div>
          </div>
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.rejected}</span>
            </div>
            <div className="mt-4 text-sm text-slate-400">Rejected Leaves</div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-4 border-b border-[#2a2a2a] mb-6">
          <button 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my_leaves' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('my_leaves')}
          >
            My Leaves
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'balances' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('balances')}
          >
            My Balances
          </button>
          {isAdminOrHR && (
            <button 
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'approvals' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              onClick={() => setActiveTab('approvals')}
            >
              Team Approvals
              {approvalStats.pending > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{approvalStats.pending}</span>}
            </button>
          )}
        </div>

        {/* DATA SECTION */}
        {activeTab === 'balances' ? (
          <div className="grid grid-cols-3 gap-6">
            {balances.filter((b: any) => b.employee_id === profile?.id).map((b: any) => (
              <div key={b.id} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-1">{b.leave_type}</h3>
                <p className="text-sm text-slate-400 mb-4">Allocated: {b.allocated} days</p>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-black text-emerald-400">{b.allocated - b.used}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Remaining</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-300">{b.used}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Used</div>
                  </div>
                </div>
              </div>
            ))}
            {balances.filter((b: any) => b.employee_id === profile?.id).length === 0 && (
              <div className="col-span-3 text-center py-10 text-slate-500 bg-[#0d0d0d] rounded-xl border border-[#2a2a2a]">
                No leave balances allocated yet for this year.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl flex flex-col shadow-xl">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">{activeTab === 'approvals' ? 'Leave Requests Pending Your Approval' : 'My Leave Requests'}</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search leaves..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-slate-200 placeholder:text-slate-500"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2a2a2a] bg-[#141414] text-xs uppercase tracking-wider text-slate-400">
                    <th className="p-4 font-medium">Employee</th>
                    <th className="p-4 font-medium">Leave Type</th>
                    <th className="p-4 font-medium">Duration</th>
                    <th className="p-4 font-medium">Reason</th>
                    <th className="p-4 font-medium">Status</th>
                    {activeTab === 'approvals' && <th className="p-4 font-medium text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#2a2a2a]">
                  {loadingLeaves ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
                  ) : displayedLeaves.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">No leave requests found.</td></tr>
                  ) : displayedLeaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{l.employee_name || 'You'}</div>
                            <div className="text-xs text-slate-500">{l.employee_department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{l.leave_type}</td>
                      <td className="p-4">
                        <div className="text-slate-300">{new Date(l.from_date).toLocaleDateString()} - {new Date(l.to_date).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{l.number_of_days} Days</div>
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={
                          l.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          l.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }>
                          {l.status}
                        </Badge>
                      </td>
                      {activeTab === 'approvals' && (
                        <td className="p-4 text-right">
                          {l.status === 'Pending' && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => approveMutation.mutate({ id: l.id, action: 'Approve', stage: profile?.role?.toLowerCase() === 'hr' ? 'HR' : 'Manager' })} className="bg-emerald-600 hover:bg-emerald-500 h-8 text-xs">Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ id: l.id, action: 'Reject', stage: profile?.role?.toLowerCase() === 'hr' ? 'HR' : 'Manager' })} className="border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 h-8 text-xs">Reject</Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#0f0f0f] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4 pt-4">
            <FormRow label="Leave Type" required>
              <select className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-sm outline-none" value={form.leave_type} onChange={e => setForm({...form, leave_type: e.target.value})}>
                <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Paternity Leave">Paternity Leave</option>
                <option value="Loss of Pay (LOP)">Loss of Pay (LOP)</option>
                <option value="Comp Off">Comp Off</option>
              </select>
            </FormRow>
            
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="Start Date" required>
                <Input type="date" className="bg-[#1a1a1a] border-[#2a2a2a]" value={form.from_date} onChange={e => setForm({...form, from_date: e.target.value})} />
              </FormRow>
              <FormRow label="End Date" required>
                <Input type="date" className="bg-[#1a1a1a] border-[#2a2a2a]" value={form.to_date} onChange={e => setForm({...form, to_date: e.target.value})} />
              </FormRow>
            </div>
            
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Duration (excluding weekends)</span>
              <span className="font-semibold text-emerald-400">{calculateDays(form.from_date, form.to_date)} Days</span>
            </div>

            <FormRow label="Reason" required>
              <textarea 
                className="flex w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm outline-none min-h-[80px]" 
                placeholder="Briefly explain your reason..."
                value={form.reason}
                onChange={e => setForm({...form, reason: e.target.value})}
              />
            </FormRow>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" className="bg-transparent border-[#2a2a2a]" onClick={() => setApplyModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
