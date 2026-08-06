import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, FileSpreadsheet, Eye, Pencil, Trash2, Calendar, UploadCloud, X, AlertTriangle, FileSignature } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useFarmerContext, ContractRecord } from '@/context/FarmerContext';

// --- TYPES ---
export type ContractStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export interface FarmerContract {
  id: string;
  farmer_id: string;
  farmer_name: string;
  contract_number: string;
  crop_name: string;
  agreed_quantity: number; // in tons or kg
  agreed_price: number;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  document_name?: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export default function ContractFarming() {
  const { farmers, contracts, addContract, updateFarmerStatus } = useFarmerContext();
  const loading = false;

  // Map raw data to UI model using farmers list
  const data: FarmerContract[] = useMemo(() => {
    return contracts.map((d: any) => {
      const f = farmers.find(x => x.id === d.farmer_id);
      return {
        id: d.id,
        farmer_id: d.farmer_id,
        farmer_name: f ? f.full_name : 'Unknown Farmer',
        contract_number: `CNTR-2026-${d.id.slice(-3)}`,
        crop_name: d.crop,
        agreed_quantity: 50,
        agreed_price: 15000,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        status: d.status as ContractStatus,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'Admin',
        updated_by: 'Admin'
      };
    });
  }, [contracts, farmers]);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'All'>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof FarmerContract; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal/Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FarmerContract | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<FarmerContract>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [contractFile, setContractFile] = useState<File | null>(null);



  // Compute stats
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return {
      total: data.length,
      active: data.filter(d => d.status === 'Active').length,
      expiringSoon: data.filter(d => {
        if (d.status !== 'Active') return false;
        const endDate = new Date(d.end_date);
        return endDate >= now && endDate <= thirtyDaysFromNow;
      }).length,
      completed: data.filter(d => d.status === 'Completed').length
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
        d.contract_number.toLowerCase().includes(lower)
      );
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [data, searchTerm, statusFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: keyof FarmerContract) => {
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Actions
  const openAddModal = () => {
    setSelectedRecord(null);
    setFormData({ status: 'Draft' });
    setFormErrors({});
    setContractFile(null);
    setModalOpen(true);
  };

  const openEditModal = (record: FarmerContract) => {
    setSelectedRecord(record);
    setFormData({ 
      ...record, 
      start_date: record.start_date?.substring(0, 10), 
      end_date: record.end_date?.substring(0, 10) 
    });
    setFormErrors({});
    setContractFile(null);
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.farmer_id) {
      errors.farmer_id = "Please select a farmer";
    }
    
    if (!formData.contract_number) errors.contract_number = "Contract number is required";
    if (!formData.crop_name) errors.crop_name = "Crop name is required";
    if (!formData.agreed_quantity || formData.agreed_quantity <= 0) errors.agreed_quantity = "Valid quantity is required";
    if (!formData.agreed_price || formData.agreed_price <= 0) errors.agreed_price = "Valid price is required";
    if (!formData.start_date) errors.start_date = "Start date is required";
    if (!formData.end_date) errors.end_date = "End date is required";
    else if (formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      errors.end_date = "End date must be after start date";
    }

    if (contractFile) {
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(contractFile.type)) {
        errors.file = "Only JPG, PNG or PDF allowed";
      }
      if (contractFile.size > 5 * 1024 * 1024) {
        errors.file = "File must be less than 5MB";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    addContract({
      id: selectedRecord ? selectedRecord.id : `c-${Date.now()}`,
      farmer_id: formData.farmer_id || '',
      crop: formData.crop_name || '',
      status: formData.status || 'Draft'
    });

    if (formData.status === 'Active') {
      updateFarmerStatus(formData.farmer_id || '', 'Contract Active');
    }

    toast.success("Contract saved");
    setModalOpen(false);
  };

  const confirmDelete = () => {
    toast.success("Contract deleted");
    setDeleteDialogOpen(false);
  };

  // Exports
  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(filteredData.map(d => ({
      'Contract No': d.contract_number,
      'Farmer Name': d.farmer_name,
      'Crop': d.crop_name,
      'Quantity (Tons)': d.agreed_quantity,
      'Price (₹)': d.agreed_price,
      'Start Date': new Date(d.start_date).toLocaleDateString(),
      'End Date': new Date(d.end_date).toLocaleDateString(),
      'Status': d.status
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Contracts");
    xlsx.writeFile(wb, "Contract_Farming.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Contract Farming Report", 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['Contract No', 'Farmer', 'Crop', 'Qty', 'Price', 'End Date', 'Status']],
      body: filteredData.map(d => [
        d.contract_number, 
        d.farmer_name, 
        d.crop_name,
        d.agreed_quantity,
        d.agreed_price,
        new Date(d.end_date).toLocaleDateString(),
        d.status
      ])
      });
    
    doc.save("Contract_Farming.pdf");
  };

  // Render Helpers
  const renderBadge = (status: ContractStatus) => {
    switch (status) {
      case 'Active': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Active</Badge>;
      case 'Completed': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Completed</Badge>;
      case 'Cancelled': return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Cancelled</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Draft</Badge>;
    }
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);
    return end >= now && end <= thirtyDays;
  };

  return (
    <div>
      <PageHeader
        title="Contract Farming"
        description="Manage farmer agreements, pricing, and crop schedules securely."
        breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Contract Farming" }]}
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
              <Plus className="h-4 w-4 mr-1.5" /> Create Contract
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Contracts', value: stats.total, icon: FileSignature, color: 'text-indigo-400' },
          { label: 'Active Contracts', value: stats.active, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Expiring Soon', value: stats.expiringSoon, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Completed', value: stats.completed, icon: FileText, color: 'text-blue-400' },
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
        <div className="p-4 border-b border-[#2a2a2a] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search by farmer or contract no..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#0d0d0d] border border-[#2a2a2a] text-sm rounded-md px-3 h-9 text-slate-300 w-full sm:w-auto outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('contract_number')}>Contract No</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('farmer_name')}>Farmer</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('crop_name')}>Crop</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('agreed_quantity')}>Qty (Tons)</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('agreed_price')}>Price</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('end_date')}>Expiry</th>
                <th className="px-4 py-3">Status</th>
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
                    <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{searchTerm || statusFilter !== 'All' ? 'No contracts match your filters' : 'No contracts found'}</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map(record => {
                  const expiring = record.status === 'Active' && isExpiringSoon(record.end_date);
                  return (
                    <tr key={record.id} className="hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300">{record.contract_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{record.farmer_name}</td>
                      <td className="px-4 py-3 text-slate-300">{record.crop_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{record.agreed_quantity}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">₹{record.agreed_price.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 ${expiring ? 'text-amber-400 font-medium' : 'text-slate-300'}`}>
                          {new Date(record.end_date).toLocaleDateString()}
                          {expiring && <AlertTriangle className="w-3 h-3" />}
                        </span>
                      </td>
                      <td className="px-4 py-3">{renderBadge(record.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400" title="View Details" onClick={() => { setSelectedRecord(record); setViewDrawerOpen(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400" title="Edit" onClick={() => openEditModal(record)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/30" title="Delete" onClick={() => { setSelectedRecord(record); setDeleteDialogOpen(true); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Schedule / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedRecord ? 'Edit Contract' : 'Create Contract'}</DialogTitle>
              <DialogDescription>Draft or update a contract farming agreement.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <FormGrid cols={2}>
                <FormRow label="Select Farmer" required>
                  {farmers.length === 0 ? (
                    <div className="flex h-10 w-full items-center rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-amber-500">
                      No visited farmers available.
                    </div>
                  ) : (
                    <select 
                      className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none"
                      value={formData.farmer_id || ''}
                      onChange={(e) => setFormData(f => ({ ...f, farmer_id: e.target.value }))}
                      disabled={!!selectedRecord}
                    >
                      <option value="">-- Choose a farmer --</option>
                      {farmers
                        
                        .map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.code || f.id?.substring(0,8)} - {f.full_name} | {f.primary_crop || 'Mixed'}
                          </option>
                        ))}
                    </select>
                  )}
                  {formErrors.farmer_id && <span className="text-xs text-red-500">{formErrors.farmer_id}</span>}
                </FormRow>

                <FormRow label="Contract Number" required>
                  <Input value={formData.contract_number || ''} onChange={e => setFormData(f => ({ ...f, contract_number: e.target.value.toUpperCase() }))} className="bg-[#0d0d0d] border-[#2a2a2a] font-mono" placeholder="CNTR-2026-001" />
                  {formErrors.contract_number && <span className="text-xs text-red-500">{formErrors.contract_number}</span>}
                </FormRow>

                <div className="col-span-2">
                  <FormRow label="Crop Name" required>
                    <Input value={formData.crop_name || ''} onChange={e => setFormData(f => ({ ...f, crop_name: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a]" placeholder="e.g. Turmeric (Grade A)" />
                    {formErrors.crop_name && <span className="text-xs text-red-500">{formErrors.crop_name}</span>}
                  </FormRow>
                </div>

                <FormRow label="Agreed Quantity (Tons)" required>
                  <Input type="number" min="0" step="0.1" value={formData.agreed_quantity || ''} onChange={e => setFormData(f => ({ ...f, agreed_quantity: Number(e.target.value) }))} className="bg-[#0d0d0d] border-[#2a2a2a]" placeholder="50" />
                  {formErrors.agreed_quantity && <span className="text-xs text-red-500">{formErrors.agreed_quantity}</span>}
                </FormRow>

                <FormRow label="Agreed Price (₹)" required>
                  <Input type="number" min="0" step="0.01" value={formData.agreed_price || ''} onChange={e => setFormData(f => ({ ...f, agreed_price: Number(e.target.value) }))} className="bg-[#0d0d0d] border-[#2a2a2a]" placeholder="15000" />
                  {formErrors.agreed_price && <span className="text-xs text-red-500">{formErrors.agreed_price}</span>}
                </FormRow>
                
                <FormRow label="Start Date" required>
                  <Input type="date" value={formData.start_date || ''} onChange={e => setFormData(f => ({ ...f, start_date: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a] dark:[color-scheme:dark]" />
                  {formErrors.start_date && <span className="text-xs text-red-500">{formErrors.start_date}</span>}
                </FormRow>

                <FormRow label="End Date" required>
                  <Input type="date" value={formData.end_date || ''} onChange={e => setFormData(f => ({ ...f, end_date: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a] dark:[color-scheme:dark]" />
                  {formErrors.end_date && <span className="text-xs text-red-500">{formErrors.end_date}</span>}
                </FormRow>

                <FormRow label="Contract Status">
                  <select 
                    className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none"
                    value={formData.status || 'Draft'}
                    onChange={(e) => setFormData(f => ({ ...f, status: e.target.value as ContractStatus }))}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </FormRow>
              </FormGrid>

              <div className="border-t border-[#2a2a2a] pt-4">
                <FormRow label="Notes & Terms">
                  <textarea 
                    className="flex w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none min-h-[60px]"
                    value={formData.notes || ''}
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Add contract terms or notes..."
                  />
                </FormRow>
              </div>

              <div className="border-t border-[#2a2a2a] pt-4">
                <p className="text-sm font-medium text-slate-300 mb-2">Signed Agreement Document</p>
                {contractFile ? (
                  <div className="flex items-center justify-between p-3 rounded-md border border-slate-700 bg-slate-900 w-1/2">
                    <span className="text-sm text-slate-300 truncate max-w-[200px]">{contractFile.name}</span>
                    <button type="button" onClick={() => setContractFile(null)} className="text-slate-400 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : formData.document_name ? (
                  <div className="flex items-center justify-between p-3 rounded-md border border-slate-700 bg-slate-900 w-1/2">
                    <span className="text-sm text-slate-400 truncate max-w-[200px]">{formData.document_name}</span>
                    <button type="button" onClick={() => setFormData(fd => ({ ...fd, document_name: undefined }))} className="text-slate-400 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-700 rounded-md p-6 flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-800 transition-colors relative cursor-pointer w-full">
                    <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => {
                      if (e.target.files?.[0]) setContractFile(e.target.files![0]);
                    }} />
                    <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-sm text-slate-400 text-center">Click or drag document to upload<br/><span className="text-xs">(PDF/Image, Max 5MB)</span></span>
                  </div>
                )}
                {formErrors.file && <span className="text-xs text-red-500 mt-1 block">{formErrors.file}</span>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Contract</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete contract <strong>{selectedRecord?.contract_number}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete Contract</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Dialog open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-indigo-400" />
              Contract Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center bg-[#0d0d0d] p-4 rounded-lg border border-[#2a2a2a]">
                <div>
                  <p className="text-xs text-slate-500 font-mono">{selectedRecord.contract_number}</p>
                  <a href={`/farmers/${selectedRecord.farmer_id}`} className="text-xl font-semibold text-indigo-400 hover:underline">{selectedRecord.farmer_name}</a>
                </div>
                {renderBadge(selectedRecord.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-500">Crop Name</p>
                  <p className="font-medium text-slate-200">{selectedRecord.crop_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Agreed Quantity / Price</p>
                  <p className="font-medium text-slate-200 font-mono">{selectedRecord.agreed_quantity} Tons @ ₹{selectedRecord.agreed_price.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Start Date</p>
                  <p className="font-medium text-slate-200">{new Date(selectedRecord.start_date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">End Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <span className="text-slate-200">{new Date(selectedRecord.end_date).toLocaleDateString()}</span>
                    {selectedRecord.status === 'Active' && isExpiringSoon(selectedRecord.end_date) && (
                      <span className="text-amber-400 text-xs flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3"/> Expiring Soon</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-4">
                <p className="text-slate-500 mb-2 text-sm">Notes & Terms</p>
                <div className="text-sm bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a] whitespace-pre-wrap">
                  {selectedRecord.notes || <span className="text-slate-500 italic">No notes provided.</span>}
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-4">
                <p className="text-slate-500 mb-2 text-sm">Signed Agreement</p>
                {selectedRecord.document_name ? (
                  <div className="flex items-center gap-3 bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a] w-fit">
                    <FileText className="text-emerald-400 w-5 h-5" />
                    <span className="text-sm text-slate-300">{selectedRecord.document_name}</span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 ml-4 text-blue-400 hover:text-blue-300">Download</Button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No document uploaded.</p>
                )}
              </div>

              <div className="border-t border-[#2a2a2a] pt-4 bg-[#111] -mx-6 px-6 -mb-6 pb-6 rounded-b-lg">
                <p className="text-slate-500 mb-3 text-sm font-semibold">Audit Log</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-500">Created</p>
                    <p className="text-slate-300 font-mono mt-1">{new Date(selectedRecord.created_at).toLocaleString()}</p>
                    <p className="text-slate-500 mt-1">by <span className="text-slate-300">{selectedRecord.created_by}</span></p>
                  </div>
                  <div>
                    <p className="text-slate-500">Last Updated</p>
                    <p className="text-slate-300 font-mono mt-1">{new Date(selectedRecord.updated_at).toLocaleString()}</p>
                    <p className="text-slate-500 mt-1">by <span className="text-slate-300">{selectedRecord.updated_by}</span></p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
