import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, Download, FileSpreadsheet, Eye, Pencil, Trash2, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useFarmerContext, KYCRecord } from '@/context/FarmerContext';

// --- TYPES ---
export type KYCStatus = 'Pending' | 'Completed' | 'Rejected';

export interface FarmerKYC {
  id: string;
  farmer_code: string;
  farmer_name: string;
  aadhaar_no: string;
  pan_no: string;
  bank_account: string;
  ifsc: string;
  doc_urls: {
    aadhaar?: string;
    pan?: string;
    bank?: string;
    land?: string;
  };
  status: KYCStatus;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

// --- HELPER FUNCTIONS ---
const maskAadhaar = (aadhaar: string) => {
  if (!aadhaar || aadhaar.length !== 12) return aadhaar;
  return `XXXX-XXXX-${aadhaar.slice(8)}`;
};

const maskBankAccount = (account: string) => {
  if (!account || account.length < 4) return account;
  return `XXXX...${account.slice(-4)}`;
};

const validateAadhaar = (val: string) => /^\d{12}$/.test(val);
const validatePAN = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
const validateIFSC = (val: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val);

export default function KYC() {
  const { farmers, kycRecords, addKyc, updateKyc, updateFarmerStatus } = useFarmerContext();
  
  const loading = false;
  
  // Join farmers and kycRecords
  const data: FarmerKYC[] = useMemo(() => {
    return farmers
      .map(f => {
        const record = kycRecords.find(k => k.farmer_id === f.id);
        return {
          id: record?.id || `kyc-auto-${f.id}`,
          farmer_code: f.id,
          farmer_name: f.full_name,
          aadhaar_no: record?.aadhaar || '',
          pan_no: record?.pan || '',
          bank_account: '',
          ifsc: '',
          doc_urls: {},
          status: (record?.status as KYCStatus) || 'Pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: 'System'
        };
      });
  }, [farmers, kycRecords]);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<KYCStatus | 'All'>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof FarmerKYC; direction: 'asc' | 'desc' } | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal/Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FarmerKYC | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<FarmerKYC>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<{ aadhaar: File | null; pan: File | null; bank: File | null; land: File | null }>({ aadhaar: null, pan: null, bank: null, land: null });
  const [busy, setBusy] = useState(false);



  // Compute stats
  const stats = useMemo(() => {
    return {
      total: data.length,
      pending: data.filter(d => d.status === 'Pending').length,
      completed: data.filter(d => d.status === 'Completed').length,
      rejected: data.filter(d => d.status === 'Rejected').length
      };
  }, [data]);

  // Filter & Sort Data
  const filteredData = useMemo(() => {
    let result = data;
    
    if (statusFilter !== 'All') {
      result = result.filter(d => d.status === statusFilter);
    }
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.farmer_name.toLowerCase().includes(lower) || 
        d.farmer_code.toLowerCase().includes(lower)
      );
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [data, searchTerm, statusFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: keyof FarmerKYC) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Actions
  const openAddModal = () => {
    setSelectedRecord(null);
    setFormData({ status: 'Pending' });
    setFormErrors({});
    setFiles({ aadhaar: null, pan: null, bank: null, land: null });
    setModalOpen(true);
  };

  const openEditModal = async (record: FarmerKYC) => {
    try {
      setBusy(true);
      const res = await fetch(`/api/farmers/kyc/${record.farmer_code}`);
      if (res.ok) {
        const fullData = await res.json();
        const updatedRecord = { ...record, ...fullData };
        setSelectedRecord(updatedRecord);
        setFormData({ ...updatedRecord });
      } else {
        setSelectedRecord(record);
        setFormData({ ...record });
      }
    } catch (e) {
      setSelectedRecord(record);
      setFormData({ ...record });
    } finally {
      setBusy(false);
      setFormErrors({});
      setFiles({ aadhaar: null, pan: null, bank: null, land: null });
      setModalOpen(true);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.farmer_code) errors.farmer_code = "Please select a farmer";
    if (formData.aadhaar_no && !validateAadhaar(formData.aadhaar_no)) errors.aadhaar_no = "Aadhaar must be exactly 12 digits";
    if (formData.pan_no && !validatePAN(formData.pan_no)) errors.pan_no = "Invalid PAN format (e.g. ABCDE1234F)";
    if (formData.bank_account && formData.bank_account.length < 6) errors.bank_account = "Invalid Bank Account length";
    if (formData.ifsc && !validateIFSC(formData.ifsc)) errors.ifsc = "Invalid IFSC format (e.g. SBIN0123456)";
    
    // File validation
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
          errors[`file_${key}`] = "Only JPG, PNG or PDF allowed";
        }
        if (file.size > 5 * 1024 * 1024) {
          errors[`file_${key}`] = "File must be less than 5MB";
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setBusy(true);

    try {
      let newDocUrls = { ...(formData.doc_urls || {}) };
      if (files.aadhaar) newDocUrls.aadhaar = `/uploads/mock_aadhaar_${Date.now()}.pdf`;
      if (files.pan) newDocUrls.pan = `/uploads/mock_pan_${Date.now()}.pdf`;
      if (files.bank) newDocUrls.bank = `/uploads/mock_bank_${Date.now()}.pdf`;
      if (files.land) newDocUrls.land = `/uploads/mock_land_${Date.now()}.pdf`;

      const payload = {
        id: selectedRecord ? selectedRecord.id : `kyc-${Date.now()}`,
        farmer_id: formData.farmer_code || '',
        aadhaar: formData.aadhaar_no || '',
        pan: formData.pan_no || '',
        bank_account: formData.bank_account || '',
        ifsc: formData.ifsc || '',
        doc_urls: newDocUrls,
        status: formData.status || 'Pending'
      };

      if (selectedRecord && !selectedRecord.id.startsWith('kyc-auto-')) {
        // updateKyc uses PUT /api/farmers/kyc/:id
        await updateKyc(payload);
      } else {
        await addKyc(payload);
      }
      
      if (formData.status === 'Completed') {
        updateFarmerStatus(formData.farmer_code || '', 'KYC Verified');
      }

      toast.success("KYC Record saved");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save KYC record');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      setData(prev => prev.filter(d => d.id !== selectedRecord.id));
      toast.success("Record deleted");
    }
    setDeleteDialogOpen(false);
  };

  // Exports
  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(filteredData.map(d => ({
      'Farmer Code': d.farmer_code,
      'Name': d.farmer_name,
      'Aadhaar': d.aadhaar_no,
      'PAN': d.pan_no,
      'Bank Account': d.bank_account,
      'IFSC': d.ifsc,
      'Status': d.status,
      'Last Updated': new Date(d.updated_at).toLocaleDateString()
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "KYC");
    xlsx.writeFile(wb, "Farmer_KYC.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Farmer KYC Report", 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['Code', 'Name', 'Aadhaar', 'PAN', 'Bank', 'Status']],
      body: filteredData.map(d => [
        d.farmer_code, 
        d.farmer_name, 
        maskAadhaar(d.aadhaar_no), 
        d.pan_no, 
        maskBankAccount(d.bank_account), 
        d.status
      ])
      });
    
    doc.save("Farmer_KYC.pdf");
  };

  // Render Helpers
  const renderBadge = (status: KYCStatus) => {
    switch (status) {
      case 'Completed': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Completed</Badge>;
      case 'Rejected': return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Rejected</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pending</Badge>;
    }
  };

  const FileUploader = ({ label, type }: { label: string, type: 'aadhaar' | 'pan' | 'bank' | 'land' }) => {
    const file = files[type];
    const existingFile = formData.doc_urls?.[type];
    
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        {file ? (
          <div className="flex items-center justify-between p-2 rounded-md border border-slate-700 bg-slate-900">
            <span className="text-sm text-slate-300 truncate max-w-[200px]">{file.name}</span>
            <button type="button" onClick={() => setFiles(f => ({ ...f, [type]: null }))} className="text-slate-400 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : existingFile ? (
           <div className="flex items-center justify-between p-2 rounded-md border border-slate-700 bg-slate-900">
             <span className="text-sm text-slate-400 truncate max-w-[200px]">{existingFile}</span>
             <button type="button" onClick={() => setFormData(fd => ({ ...fd, doc_urls: { ...fd.doc_urls, [type]: undefined } }))} className="text-slate-400 hover:text-red-400">
               <X className="w-4 h-4" />
             </button>
           </div>
        ) : (
          <div className="border-2 border-dashed border-slate-700 rounded-md p-4 flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-800 transition-colors relative cursor-pointer">
            <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => {
              if (e.target.files?.[0]) setFiles(f => ({ ...f, [type]: e.target.files![0] }));
            }} />
            <UploadCloud className="w-6 h-6 text-slate-500 mb-2" />
            <span className="text-xs text-slate-400 text-center">Click or drag to upload<br/>(Max 5MB)</span>
          </div>
        )}
        {formErrors[`file_${type}`] && <span className="text-xs text-red-500">{formErrors[`file_${type}`]}</span>}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Farmer KYC"
        description="Manage farmer KYC verification and documents"
        breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Farmer KYC" }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
              <Button variant="ghost" size="sm" onClick={exportExcel} className="rounded-none border-r border-slate-800 h-9 px-3 hover:bg-slate-800 text-slate-300">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={exportPDF} className="rounded-none h-9 px-3 hover:bg-slate-800 text-slate-300">
                <FileText className="w-4 h-4 mr-2 text-red-500" /> PDF
              </Button>
            </div>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-1.5" /> Add KYC Record
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Farmers', value: stats.total, icon: UsersCard, color: 'text-blue-400' },
          { label: 'KYC Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-400' },
        ].map((card, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-100">{card.value}</h3>
            </div>
            <div className={`p-3 bg-[#222] rounded-full ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search by name or code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#0d0d0d] border border-[#2a2a2a] text-sm rounded-md px-3 h-9 text-slate-300 w-full sm:w-auto outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('farmer_code')}>Code</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('farmer_name')}>Farmer Name</th>
                <th className="px-4 py-3">Aadhaar</th>
                <th className="px-4 py-3">PAN</th>
                <th className="px-4 py-3">Bank A/c</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('updated_at')}>Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No KYC records found</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map(record => (
                  <tr key={record.id} className="hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{record.farmer_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{record.farmer_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{maskAadhaar(record.aadhaar_no) || '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{record.pan_no || '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{maskBankAccount(record.bank_account) || '—'}</td>
                    <td className="px-4 py-3">{renderBadge(record.status)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(record.updated_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400" onClick={() => { setSelectedRecord(record); setViewDrawerOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400" onClick={() => openEditModal(record)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/30" onClick={() => { setSelectedRecord(record); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredData.length > 0 && (
          <div className="p-4 border-t border-[#2a2a2a] flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show rows:</span>
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1 outline-none"
              >
                {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#0d0d0d] border-[#2a2a2a]" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>{'<'}</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#0d0d0d] border-[#2a2a2a]" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>{'>'}</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedRecord ? 'Edit KYC Record' : 'Add KYC Record'}</DialogTitle>
              <DialogDescription>Fill out the required KYC information for the farmer.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <FormGrid cols={2}>
                <div className="col-span-2">
                  <FormRow label="Select Farmer" required>
                    <select 
                      className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-indigo-500/50"
                      value={formData.farmer_code || ''}
                      onChange={(e) => setFormData(f => ({ ...f, farmer_code: e.target.value }))}
                      disabled={!!selectedRecord}
                    >
                      <option value="">-- Choose a farmer --</option>
                      {farmers.map((f: any) => <option key={f.id} value={f.id}>{f.code || f.id.substring(0,8)} - {f.full_name}</option>)}
                    </select>
                    {formErrors.farmer_code && <span className="text-xs text-red-500">{formErrors.farmer_code}</span>}
                  </FormRow>
                </div>
                
                <FormRow label="Aadhaar Number">
                  <Input value={formData.aadhaar_no || ''} onChange={e => setFormData(f => ({ ...f, aadhaar_no: e.target.value.replace(/\D/g, '') }))} maxLength={12} className="bg-[#0d0d0d] border-[#2a2a2a]" placeholder="12 digit number" />
                  {formErrors.aadhaar_no && <span className="text-xs text-red-500">{formErrors.aadhaar_no}</span>}
                </FormRow>
                
                <FormRow label="PAN Number">
                  <Input value={formData.pan_no || ''} onChange={e => setFormData(f => ({ ...f, pan_no: e.target.value.toUpperCase() }))} maxLength={10} className="bg-[#0d0d0d] border-[#2a2a2a]" placeholder="ABCDE1234F" />
                  {formErrors.pan_no && <span className="text-xs text-red-500">{formErrors.pan_no}</span>}
                </FormRow>

                <FormRow label="Bank Account">
                  <Input value={formData.bank_account || ''} onChange={e => setFormData(f => ({ ...f, bank_account: e.target.value.replace(/\D/g, '') }))} className="bg-[#0d0d0d] border-[#2a2a2a]" placeholder="Account number" />
                  {formErrors.bank_account && <span className="text-xs text-red-500">{formErrors.bank_account}</span>}
                </FormRow>

                <FormRow label="IFSC Code">
                  <Input value={formData.ifsc || ''} onChange={e => setFormData(f => ({ ...f, ifsc: e.target.value.toUpperCase() }))} maxLength={11} className="bg-[#0d0d0d] border-[#2a2a2a]" placeholder="SBIN0001234" />
                  {formErrors.ifsc && <span className="text-xs text-red-500">{formErrors.ifsc}</span>}
                </FormRow>
                
                <FormRow label="KYC Status">
                  <select 
                    className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none"
                    value={formData.status || 'Pending'}
                    onChange={(e) => setFormData(f => ({ ...f, status: e.target.value as KYCStatus }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </FormRow>
              </FormGrid>

              <div className="border-t border-[#2a2a2a] pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-4">Document Uploads</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploader label="Aadhaar Copy" type="aadhaar" />
                  <FileUploader label="PAN Copy" type="pan" />
                  <FileUploader label="Bank Passbook" type="bank" />
                  <FileUploader label="Land Documents" type="land" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300" disabled={busy}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={busy}>
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Drawer (Simulated with Dialog for simplicity, behaving like a large modal) */}
      <Dialog open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              KYC Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center bg-[#0d0d0d] p-4 rounded-lg border border-[#2a2a2a]">
                <div>
                  <p className="text-xs text-slate-500 font-mono">{selectedRecord.farmer_code}</p>
                  <p className="text-lg font-semibold">{selectedRecord.farmer_name}</p>
                </div>
                {renderBadge(selectedRecord.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-500">Aadhaar Number</p>
                  <p className="font-mono">{selectedRecord.aadhaar_no || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">PAN Number</p>
                  <p className="font-mono">{selectedRecord.pan_no || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Bank Account</p>
                  <p className="font-mono">{selectedRecord.bank_account || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">IFSC Code</p>
                  <p className="font-mono">{selectedRecord.ifsc || 'Not provided'}</p>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Documents</h4>
                <div className="space-y-2">
                  {selectedRecord.doc_urls.aadhaar && <p className="text-sm bg-[#0d0d0d] p-2 rounded border border-[#2a2a2a]">Aadhaar: <span className="text-indigo-400">{selectedRecord.doc_urls.aadhaar}</span></p>}
                  {selectedRecord.doc_urls.pan && <p className="text-sm bg-[#0d0d0d] p-2 rounded border border-[#2a2a2a]">PAN: <span className="text-indigo-400">{selectedRecord.doc_urls.pan}</span></p>}
                  {selectedRecord.doc_urls.bank && <p className="text-sm bg-[#0d0d0d] p-2 rounded border border-[#2a2a2a]">Bank: <span className="text-indigo-400">{selectedRecord.doc_urls.bank}</span></p>}
                  {selectedRecord.doc_urls.land && <p className="text-sm bg-[#0d0d0d] p-2 rounded border border-[#2a2a2a]">Land Documents: <span className="text-indigo-400">{selectedRecord.doc_urls.land}</span></p>}
                  {!selectedRecord.doc_urls.aadhaar && !selectedRecord.doc_urls.pan && !selectedRecord.doc_urls.bank && !selectedRecord.doc_urls.land && (
                    <p className="text-sm text-slate-500 italic">No documents uploaded.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-4 text-xs text-slate-500 grid grid-cols-2 gap-4">
                <div>
                  <p>Created</p>
                  <p className="text-slate-300">{new Date(selectedRecord.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p>Last Updated</p>
                  <p className="text-slate-300">{new Date(selectedRecord.updated_at).toLocaleString()}<br/>by {selectedRecord.updated_by}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDrawerOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete KYC Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the KYC record for <strong>{selectedRecord?.farmer_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

const UsersCard = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
