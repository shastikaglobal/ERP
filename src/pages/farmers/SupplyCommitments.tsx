import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, FileSpreadsheet, Eye, Pencil, Trash2, Calendar, AlertTriangle, Truck, History } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useFarmerContext, CommitmentRecord } from '@/context/FarmerContext';

// --- TYPES ---
export type CommitmentStatus = 'Pending' | 'Partial' | 'Completed' | 'Cancelled';

export interface DeliveryHistory {
  id: string;
  date: string;
  quantity: number;
  recorded_by: string;
}

export interface SupplyCommitment {
  id: string;
  farmer_id: string;
  farmer_name: string;
  crop_name: string;
  committed_quantity: number;
  delivered_quantity: number;
  unit: string;
  expected_delivery_date: string;
  status: CommitmentStatus;
  history: DeliveryHistory[];
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export default function SupplyCommitments() {
  const { farmers, commitments, addCommitment, updateFarmerStatus } = useFarmerContext();
  const loading = false;

  const data: SupplyCommitment[] = useMemo(() => {
    return commitments.map(d => {
      const f = farmers.find(x => x.id === d.farmer_id);
      return {
        id: d.id,
        farmer_id: d.farmer_id,
        farmer_name: f?.full_name || 'Unknown Farmer',
        crop_name: d.crop,
        committed_quantity: d.qty,
        delivered_quantity: d.status === 'Completed' ? d.qty : 0, // Mock history
        unit: 'Tons',
        expected_delivery_date: new Date().toISOString(),
        status: d.status as CommitmentStatus,
        history: [],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'Admin',
        updated_by: 'Admin'
      };
    });
  }, [commitments, farmers]);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommitmentStatus | 'All'>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof SupplyCommitment; direction: 'asc' | 'desc' }>({ key: 'expected_delivery_date', direction: 'asc' });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal/Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SupplyCommitment | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SupplyCommitment>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Delivery Form State
  const [deliveryQty, setDeliveryQty] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryError, setDeliveryError] = useState('');



  // Compute stats
  const stats = useMemo(() => {
    return {
      total: data.length,
      active: data.filter(d => d.status === 'Pending' || d.status === 'Partial').length,
      completed: data.filter(d => d.status === 'Completed').length,
      pending: data.filter(d => d.status === 'Pending').length
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
        d.id.toLowerCase().includes(lower) ||
        d.crop_name.toLowerCase().includes(lower)
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

  const handleSort = (key: keyof SupplyCommitment) => {
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
    setFormData({ status: 'Pending', unit: 'Tons', delivered_quantity: 0, history: [] });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (record: SupplyCommitment) => {
    setSelectedRecord(record);
    setFormData({ 
      ...record, 
      expected_delivery_date: record.expected_delivery_date.substring(0, 10)
      });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.farmer_id) errors.farmer_id = "Please select a farmer";
    if (!formData.crop_name) errors.crop_name = "Crop name is required";
    if (!formData.committed_quantity || formData.committed_quantity <= 0) errors.committed_quantity = "Valid quantity is required";
    if (!formData.expected_delivery_date) errors.expected_delivery_date = "Expected date is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    addCommitment({
      id: selectedRecord ? selectedRecord.id : `scm-${Date.now()}`,
      farmer_id: formData.farmer_id || '',
      crop: formData.crop_name || '',
      qty: Number(formData.committed_quantity),
      status: formData.status || 'Pending'
    });

    if (formData.status === 'Completed' || formData.status === 'Partial') {
      updateFarmerStatus(formData.farmer_id || '', 'Commitment Pending');
    }

    toast.success("Commitment saved");
    setModalOpen(false);
  };

  const handleLogDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    
    const qty = Number(deliveryQty);
    if (!qty || qty <= 0) {
      setDeliveryError("Please enter a valid quantity.");
      return;
    }

    const remaining = selectedRecord.committed_quantity - selectedRecord.delivered_quantity;
    if (qty > remaining) {
      setDeliveryError(`Cannot deliver more than remaining quantity (${remaining} ${selectedRecord.unit}).`);
      return;
    }

    if (!deliveryDate) {
      setDeliveryError("Please select delivery date.");
      return;
    }

    const newDelivered = selectedRecord.delivered_quantity + qty;
    const newStatus = newDelivered >= selectedRecord.committed_quantity ? 'Completed' : 'Partial';

    const newHistory: DeliveryHistory = {
      id: `h-${Date.now()}`,
      date: new Date(deliveryDate).toISOString(),
      quantity: qty,
      recorded_by: 'Admin User'
    };

    addCommitment({
      id: selectedRecord.id,
      farmer_id: selectedRecord.farmer_id,
      crop: selectedRecord.crop_name,
      qty: selectedRecord.committed_quantity,
      status: newStatus
    });

    if (newStatus === 'Completed') {
      updateFarmerStatus(selectedRecord.farmer_id, 'Collection Pending');
    }

    toast.success("Delivery logged successfully");
    setDeliveryModalOpen(false);
    setViewDrawerOpen(false);
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      setData(prev => prev.filter(d => d.id !== selectedRecord.id));
      toast.success("Commitment deleted");
    }
    setDeleteDialogOpen(false);
  };

  // Exports
  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(filteredData.map(d => ({
      'Commitment ID': d.id,
      'Farmer Name': d.farmer_name,
      'Crop': d.crop_name,
      'Committed': `${d.committed_quantity} ${d.unit}`,
      'Delivered': `${d.delivered_quantity} ${d.unit}`,
      'Remaining': `${d.committed_quantity - d.delivered_quantity} ${d.unit}`,
      'Expected Date': new Date(d.expected_delivery_date).toLocaleDateString(),
      'Status': d.status
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Commitments");
    xlsx.writeFile(wb, "Supply_Commitments.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Supply Commitments Report", 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['ID', 'Farmer', 'Crop', 'Committed', 'Delivered', 'Expected Date', 'Status']],
      body: filteredData.map(d => [
        d.id, 
        d.farmer_name, 
        d.crop_name,
        `${d.committed_quantity} ${d.unit}`,
        `${d.delivered_quantity} ${d.unit}`,
        new Date(d.expected_delivery_date).toLocaleDateString(),
        d.status
      ])
      });
    
    doc.save("Supply_Commitments.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  // Render Helpers
  const renderBadge = (status: CommitmentStatus) => {
    switch (status) {
      case 'Completed': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Completed</Badge>;
      case 'Partial': return <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">Partial</Badge>;
      case 'Cancelled': return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Cancelled</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pending</Badge>;
    }
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Supply Commitments"
          description="Track crop supply commitments, expected deliveries, and fulfillment progress."
          breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Supply Commitments" }]}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                <Button variant="ghost" size="sm" onClick={exportExcel} className="rounded-none border-r border-slate-800 h-9 px-3 hover:bg-slate-800 text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Excel
                </Button>
                <Button variant="ghost" size="sm" onClick={exportPDF} className="rounded-none border-r border-slate-800 h-9 px-3 hover:bg-slate-800 text-slate-300">
                  <FileText className="w-4 h-4 mr-2 text-red-500" /> PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePrint} className="rounded-none h-9 px-3 hover:bg-slate-800 text-slate-300">
                  Print
                </Button>
              </div>
              <Button size="sm" onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-1.5" /> Create Commitment
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Commitments', value: stats.total, icon: Calendar, color: 'text-indigo-400' },
            { label: 'Active Commitments', value: stats.active, icon: Truck, color: 'text-blue-400' },
            { label: 'Fulfilled', value: stats.completed, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
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
                placeholder="Search farmer or ID..." 
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
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('id')}>ID</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('farmer_name')}>Farmer</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('crop_name')}>Crop</th>
                  <th className="px-4 py-3">Fulfillment Progress</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('expected_delivery_date')}>Expected Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                      ))}
                    </tr>
                  ))
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>{searchTerm || statusFilter !== 'All' ? 'No commitments match your filters' : 'No commitments found'}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(record => {
                    const progress = record.committed_quantity > 0 ? (record.delivered_quantity / record.committed_quantity) * 100 : 0;
                    return (
                      <tr key={record.id} className="hover:bg-[#222] transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-300">{record.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-200">{record.farmer_name}</td>
                        <td className="px-4 py-3 text-slate-300">{record.crop_name}</td>
                        <td className="px-4 py-3">
                          <div className="w-48">
                            <div className="flex justify-between text-xs mb-1 text-slate-400">
                              <span>{record.delivered_quantity} {record.unit}</span>
                              <span>{record.committed_quantity} {record.unit}</span>
                            </div>
                            <div className="w-full bg-[#0d0d0d] rounded-full h-2 border border-[#2a2a2a] overflow-hidden">
                              <div 
                                className={`h-2 rounded-full ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-slate-700'}`} 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(record.expected_delivery_date).toLocaleDateString()}
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
      </div>

      {/* Schedule / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedRecord ? 'Edit Commitment' : 'Create Commitment'}</DialogTitle>
              <DialogDescription>Set up a new crop supply commitment for a farmer.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <FormGrid cols={2}>
                <FormRow label="Select Farmer" required>
                  {farmers.filter(f => ['Contract Active', 'Commitment Pending', 'Collection Pending', 'Payout Pending', 'Completed'].includes(f.workflow_status)).length === 0 ? (
                    <div className="flex h-10 w-full items-center rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-amber-500">
                      No contracted farmers available.
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
                        .filter(f => ['Contract Active', 'Commitment Pending', 'Collection Pending', 'Payout Pending', 'Completed'].includes(f.workflow_status))
                        .map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.code || f.id.substring(0,8)} - {f.full_name} | {f.primary_crop || 'Mixed'}
                          </option>
                        ))}
                    </select>
                  )}
                  {formErrors.farmer_id && <span className="text-xs text-red-500">{formErrors.farmer_id}</span>}
                </FormRow>

                <FormRow label="Crop Name" required>
                  <Input value={formData.crop_name || ''} onChange={e => setFormData(f => ({ ...f, crop_name: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a]" placeholder="e.g. Turmeric" />
                  {formErrors.crop_name && <span className="text-xs text-red-500">{formErrors.crop_name}</span>}
                </FormRow>

                <FormRow label="Committed Quantity" required>
                  <div className="flex">
                    <Input type="number" min="0" step="1" value={formData.committed_quantity || ''} onChange={e => setFormData(f => ({ ...f, committed_quantity: Number(e.target.value) }))} className="bg-[#0d0d0d] border-[#2a2a2a] rounded-r-none border-r-0" placeholder="0" />
                    <select 
                      className="flex h-10 w-24 rounded-r-md border border-[#2a2a2a] bg-[#222] px-3 py-2 text-sm ring-offset-background outline-none text-slate-300"
                      value={formData.unit || 'Tons'}
                      onChange={(e) => setFormData(f => ({ ...f, unit: e.target.value }))}
                    >
                      <option value="Tons">Tons</option>
                      <option value="Kg">Kg</option>
                      <option value="Quintal">Quintal</option>
                    </select>
                  </div>
                  {formErrors.committed_quantity && <span className="text-xs text-red-500">{formErrors.committed_quantity}</span>}
                </FormRow>
                
                <FormRow label="Expected Delivery Date" required>
                  <Input type="date" value={formData.expected_delivery_date || ''} onChange={e => setFormData(f => ({ ...f, expected_delivery_date: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a] dark:[color-scheme:dark]" />
                  {formErrors.expected_delivery_date && <span className="text-xs text-red-500">{formErrors.expected_delivery_date}</span>}
                </FormRow>

                <FormRow label="Status">
                  <select 
                    className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none"
                    value={formData.status || 'Pending'}
                    onChange={(e) => setFormData(f => ({ ...f, status: e.target.value as CommitmentStatus }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </FormRow>
              </FormGrid>

              <div className="border-t border-[#2a2a2a] pt-4">
                <FormRow label="Notes">
                  <textarea 
                    className="flex w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none min-h-[60px]"
                    value={formData.notes || ''}
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional details..."
                  />
                </FormRow>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Commitment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delivery Logging Modal */}
      <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleLogDelivery}>
            <DialogHeader>
              <DialogTitle>Log Delivery</DialogTitle>
              <DialogDescription>
                Record a partial or full delivery for {selectedRecord?.farmer_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {selectedRecord && (
                <div className="bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a] flex justify-between text-sm mb-4">
                  <span className="text-slate-400">Remaining to deliver:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {selectedRecord.committed_quantity - selectedRecord.delivered_quantity} {selectedRecord.unit}
                  </span>
                </div>
              )}
              <FormRow label={`Delivery Quantity (${selectedRecord?.unit})`} required>
                <Input type="number" min="0" step="0.1" value={deliveryQty} onChange={e => setDeliveryQty(e.target.value)} className="bg-[#0d0d0d] border-[#2a2a2a]" />
              </FormRow>
              <FormRow label="Delivery Date" required>
                <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="bg-[#0d0d0d] border-[#2a2a2a] dark:[color-scheme:dark]" />
              </FormRow>
              {deliveryError && <p className="text-xs text-red-500">{deliveryError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeliveryModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Delivery</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Commitment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this supply commitment for <strong>{selectedRecord?.farmer_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Dialog open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <DialogContent className="sm:max-w-[700px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              Commitment Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center bg-[#0d0d0d] p-4 rounded-lg border border-[#2a2a2a]">
                <div>
                  <p className="text-xs text-slate-500 font-mono">{selectedRecord.id}</p>
                  <a href={`/farmers/${selectedRecord.farmer_id}`} className="text-xl font-semibold text-indigo-400 hover:underline">{selectedRecord.farmer_name}</a>
                </div>
                {renderBadge(selectedRecord.status)}
              </div>
              
              <div className="grid grid-cols-3 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-500">Crop Name</p>
                  <p className="font-medium text-slate-200">{selectedRecord.crop_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Total Committed</p>
                  <p className="font-medium text-slate-200 font-mono">{selectedRecord.committed_quantity} {selectedRecord.unit}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Expected Delivery</p>
                  <p className="font-medium text-slate-200">{new Date(selectedRecord.expected_delivery_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Progress visual */}
              <div className="bg-[#0d0d0d] p-5 rounded-lg border border-[#2a2a2a]">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-slate-300">Fulfillment Progress</span>
                  {selectedRecord.status !== 'Completed' && selectedRecord.status !== 'Cancelled' && (
                    <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" onClick={() => {
                      setDeliveryQty(''); setDeliveryDate(new Date().toISOString().substring(0, 10)); setDeliveryError(''); setDeliveryModalOpen(true);
                    }}>
                      Log Delivery
                    </Button>
                  )}
                </div>
                
                {(() => {
                  const progress = selectedRecord.committed_quantity > 0 ? (selectedRecord.delivered_quantity / selectedRecord.committed_quantity) * 100 : 0;
                  const remaining = selectedRecord.committed_quantity - selectedRecord.delivered_quantity;
                  return (
                    <>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-3 border border-[#2a2a2a] overflow-hidden mt-4 mb-2">
                        <div 
                          className={`h-3 rounded-full ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-slate-700'}`} 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span><strong className="text-slate-200">{selectedRecord.delivered_quantity} {selectedRecord.unit}</strong> delivered</span>
                        <span><strong className="text-slate-200">{remaining > 0 ? remaining : 0} {selectedRecord.unit}</strong> remaining</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Delivery History */}
              <div className="border-t border-[#2a2a2a] pt-4">
                <p className="text-slate-300 mb-3 text-sm font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" /> Delivery History
                </p>
                {selectedRecord.history.length === 0 ? (
                  <p className="text-sm text-slate-500 italic bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a]">No deliveries logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRecord.history.map(hist => (
                      <div key={hist.id} className="flex justify-between items-center bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a] text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">Delivered {hist.quantity} {selectedRecord.unit}</p>
                            <p className="text-xs text-slate-500">by {hist.recorded_by}</p>
                          </div>
                        </div>
                        <span className="text-slate-400">{new Date(hist.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
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
