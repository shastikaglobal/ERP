import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, FileSpreadsheet, Eye, Banknote, Clock, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useFarmerContext, PayoutRecord } from '@/context/FarmerContext';

// --- TYPES ---
export interface Payment {
  id: string;
  farmer_id: string;
  farmer_name: string;
  contract_id: string;
  amount: number;
  payment_date: string;
  bank_account: string;
  ifsc: string;
  transaction_ref: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Failed';
  notes: string;
  created_at: string;
}

export default function FarmerPayoutsPage() {
  const { farmers, payouts, addPayout, updateFarmerStatus } = useFarmerContext();
  const loading = false;
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Payment>>({});

  const data: Payment[] = useMemo(() => {
    return payouts.map(d => {
      const f = farmers.find(x => x.id === d.farmer_id);
      return {
        id: d.id,
        farmer_id: d.farmer_id,
        farmer_name: f?.full_name || 'Unknown Farmer',
        contract_id: `CNTR-2026-${d.id.slice(-3)}`,
        amount: d.amount,
        payment_date: new Date().toISOString(),
        bank_account: f?.bank_account_no || 'XXXX-XXXX',
        ifsc: f?.ifsc_code || 'XXXX0000',
        transaction_ref: '',
        status: (d.status as any) || 'Pending',
        notes: '',
        created_at: new Date().toISOString()
      };
    });
  }, [payouts, farmers]);

  const stats = useMemo(() => {
    return {
      totalAmount: data.reduce((acc, curr) => acc + curr.amount, 0),
      pendingAmount: data.filter(d => d.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0),
      pendingCount: data.filter(d => d.status === 'Pending').length,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    let result = data;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(d => d.farmer_name.toLowerCase().includes(lower) || d.id.toLowerCase().includes(lower));
    }
    return result;
  }, [data, searchTerm]);

  const openAddModal = () => {
    setFormData({ status: 'Pending', payment_date: new Date().toISOString().substring(0, 10) });
    setModalOpen(true);
  };

  const handleFarmerChange = (farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId);
    if (farmer) {
      setFormData(prev => ({ ...prev, farmer_id: farmerId, farmer_name: farmer.full_name, bank_account: farmer.bank_account_no, ifsc: farmer.ifsc_code }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmer_id || !formData.amount) return;

    addPayout({
      id: `pay-${Date.now()}`,
      farmer_id: formData.farmer_id,
      amount: Number(formData.amount),
      status: formData.status || 'Pending'
    });

    if (formData.status === 'Completed') {
      updateFarmerStatus(formData.farmer_id, 'Completed');
    }

    toast.success("Payout scheduled");
    setModalOpen(false);
  };

  const markApproved = (id: string) => {
    // In a real scenario, this would update the context store
    toast.success("Payment approved");
  };

  const renderBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>;
      case 'Approved': return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Approved</Badge>;
      case 'Failed': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
    }
  };

  return (
    <div>
      <PageHeader
        title="Payouts & Payments"
        description="Manage farmer payments, approvals, and transaction history."
        breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Payouts" }]}
        actions={
          <Button size="sm" onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-1.5" /> Schedule Payment
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 flex justify-between">
          <div><p className="text-sm text-slate-400 mb-1">Total Processed</p><h3 className="text-2xl font-bold text-slate-100">₹{stats.totalAmount.toLocaleString()}</h3></div>
          <div className="p-3 bg-[#222] rounded-full text-indigo-400"><Banknote className="w-6 h-6" /></div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 flex justify-between">
          <div><p className="text-sm text-slate-400 mb-1">Pending Amount</p><h3 className="text-2xl font-bold text-amber-400">₹{stats.pendingAmount.toLocaleString()}</h3></div>
          <div className="p-3 bg-[#222] rounded-full text-amber-400"><Clock className="w-6 h-6" /></div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 flex justify-between">
          <div><p className="text-sm text-slate-400 mb-1">Pending Approvals</p><h3 className="text-2xl font-bold text-red-400">{stats.pendingCount}</h3></div>
          <div className="p-3 bg-[#222] rounded-full text-red-400"><ShieldCheck className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a]">
          <Input placeholder="Search payments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-72 bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
              <tr>
                <th className="px-4 py-3">Pay ID</th>
                <th className="px-4 py-3">Farmer Details</th>
                <th className="px-4 py-3">Bank Details</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : (
                filteredData.map(record => (
                  <tr key={record.id} className="hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{record.id}</td>
                    <td className="px-4 py-3">
                      <span className="block font-medium text-slate-200">{record.farmer_name}</span>
                      <span className="text-xs text-slate-500">{record.contract_id}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      <span className="block">{record.bank_account}</span>
                      <span>{record.ifsc}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-400">₹{record.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300">{new Date(record.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{renderBadge(record.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {record.status === 'Pending' && (
                        <Button size="sm" variant="outline" className="border-indigo-500 text-indigo-400 hover:bg-indigo-900/30" onClick={() => markApproved(record.id)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader><DialogTitle>Schedule Payout</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <FormRow label="Select Farmer" required>
                  {farmers.filter(f => ['Payout Pending', 'Completed'].includes(f.workflow_status)).length === 0 ? (
                    <div className="flex h-10 w-full items-center rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-amber-500">
                      No farmers pending payout.
                    </div>
                  ) : (
                    <select 
                      className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none"
                      value={formData.farmer_id || ''}
                      onChange={(e) => handleFarmerChange(e.target.value)}
                    >
                      <option value="">-- Choose a farmer --</option>
                      {farmers
                        .filter(f => ['Payout Pending', 'Completed'].includes(f.workflow_status))
                        .map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.code || f.id.substring(0,8)} - {f.full_name}
                          </option>
                        ))}
                    </select>
                  )}
                </FormRow>
              <FormGrid cols={2}>
                <FormRow label="Amount (₹)" required>
                  <Input type="number" value={formData.amount || ''} onChange={e => setFormData(f => ({ ...f, amount: Number(e.target.value) }))} className="bg-[#0d0d0d] border-[#2a2a2a]" />
                </FormRow>
                <FormRow label="Payment Date" required>
                  <Input type="date" value={formData.payment_date || ''} onChange={e => setFormData(f => ({ ...f, payment_date: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a]" />
                </FormRow>
              </FormGrid>
              <div className="bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a] text-xs font-mono text-slate-400">
                <p>Bank: {formData.bank_account || 'N/A'}</p>
                <p>IFSC: {formData.ifsc || 'N/A'}</p>
              </div>
              <FormRow label="Notes">
                <Input value={formData.notes || ''} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a]" />
              </FormRow>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Schedule Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
