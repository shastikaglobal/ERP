import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, FileText, CheckCircle, Clock, FileSpreadsheet, Eye, Pencil, Trash2, Truck, Package, Printer, FileSignature, Calendar } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useFarmerContext, CollectionRecord } from '@/context/FarmerContext';

// --- TYPES ---
export type CollectionStatus = 'Pending' | 'In Transit' | 'Received';

export interface GoodsCollection {
  id: string;
  farmer_id: string;
  farmer_name: string;
  contract_id: string;
  crop_name: string;
  collected_quantity: number; // in Kg
  collection_date: string;
  collection_center: string;
  vehicle_number: string;
  driver_name: string;
  status: CollectionStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export default function GoodsCollectionPage() {
  const { farmers, collections, addCollection, updateFarmerStatus } = useFarmerContext();
  const loading = false;

  const data: GoodsCollection[] = useMemo(() => {
    return collections.map(d => {
      const f = farmers.find(x => x.id === d.farmer_id);
      return {
        id: d.id,
        farmer_id: d.farmer_id,
        farmer_name: f?.full_name || 'Unknown Farmer',
        contract_id: `CNTR-2026-${d.id.slice(-3)}`,
        crop_name: f?.primary_crop || 'Mixed',
        collected_quantity: d.qty,
        collection_date: new Date().toISOString(),
        collection_center: 'Main Hub',
        vehicle_number: 'MH-12-AB-1234',
        driver_name: 'Driver',
        status: d.status as CollectionStatus,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'Admin',
        updated_by: 'Admin'
      };
    });
  }, [collections, farmers]);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CollectionStatus | 'All'>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof GoodsCollection; direction: 'asc' | 'desc' }>({ key: 'collection_date', direction: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal/Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GoodsCollection | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<GoodsCollection>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});



  // Compute stats
  const stats = useMemo(() => {
    const now = new Date();
    const isToday = (dateString: string) => {
      const d = new Date(dateString);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    return {
      total: data.length,
      today: data.filter(d => isToday(d.collection_date)).length,
      pending: data.filter(d => d.status === 'Pending').length,
      completed: data.filter(d => d.status === 'Received').length
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
        d.contract_id.toLowerCase().includes(lower)
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

  const handleSort = (key: keyof GoodsCollection) => {
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
    setFormData({ status: 'Pending', collection_date: new Date().toISOString().substring(0, 16) });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (record: GoodsCollection) => {
    setSelectedRecord(record);
    setFormData({ 
      ...record, 
      collection_date: record.collection_date.substring(0, 16)
      });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.farmer_id) errors.farmer_id = "Please select a farmer";
    if (!formData.contract_id) errors.contract_id = "Contract is required";
    if (!formData.collected_quantity || formData.collected_quantity <= 0) errors.collected_quantity = "Valid quantity is required";
    if (!formData.collection_date) errors.collection_date = "Collection date is required";
    if (!formData.collection_center) errors.collection_center = "Center is required";
    if (!formData.vehicle_number) errors.vehicle_number = "Vehicle number is required";
    if (!formData.driver_name) errors.driver_name = "Driver name is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    addCollection({
      id: selectedRecord ? selectedRecord.id : `col-${Date.now()}`,
      farmer_id: formData.farmer_id || '',
      qty: Number(formData.collected_quantity),
      status: formData.status || 'Pending'
    });

    if (formData.status === 'Received') {
      updateFarmerStatus(formData.farmer_id || '', 'Payout Pending');
    }

    toast.success("Collection saved");
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      toast.success("Collection deleted");
    }
    setDeleteDialogOpen(false);
  };

  // Exports
  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(filteredData.map(d => ({
      'Collection ID': d.id,
      'Farmer Name': d.farmer_name,
      'Contract ID': d.contract_id,
      'Crop': d.crop_name,
      'Qty (Kg)': d.collected_quantity,
      'Date': new Date(d.collection_date).toLocaleString(),
      'Center': d.collection_center,
      'Vehicle': d.vehicle_number,
      'Status': d.status
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Collections");
    xlsx.writeFile(wb, "Goods_Collections.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Goods Collections Report", 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['ID', 'Farmer', 'Crop', 'Qty (Kg)', 'Date', 'Status']],
      body: filteredData.map(d => [
        d.id, 
        d.farmer_name, 
        d.crop_name,
        d.collected_quantity,
        new Date(d.collection_date).toLocaleDateString(),
        d.status
      ])
      });
    
    doc.save("Goods_Collections.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  // Render Helpers
  const renderBadge = (status: CollectionStatus) => {
    switch (status) {
      case 'Received': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Received</Badge>;
      case 'In Transit': return <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">In Transit</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pending</Badge>;
    }
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Goods Collection"
          description="Manage crop collections, vehicle dispatches, and warehouse receipts."
          breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Goods Collection" }]}
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
                <Plus className="h-4 w-4 mr-1.5" /> New Collection
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Collections', value: stats.total, icon: Package, color: 'text-indigo-400' },
            { label: "Today's Collections", value: stats.today, icon: Calendar, color: 'text-blue-400' },
            { label: 'Pending / Transit', value: stats.pending, icon: Truck, color: 'text-amber-400' },
            { label: 'Received', value: stats.completed, icon: CheckCircle, color: 'text-emerald-400' },
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
                placeholder="Search ID, farmer or contract..." 
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
                <option value="In Transit">In Transit</option>
                <option value="Received">Received</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('id')}>ID</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('farmer_name')}>Farmer</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('contract_id')}>Contract</th>
                  <th className="px-4 py-3">Crop & Qty</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('collection_date')}>Date</th>
                  <th className="px-4 py-3">Logistics</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                      ))}
                    </tr>
                  ))
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>{searchTerm || statusFilter !== 'All' ? 'No collections match your filters' : 'No goods collections found'}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(record => (
                    <tr key={record.id} className="hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300">{record.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{record.farmer_name}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{record.contract_id}</td>
                      <td className="px-4 py-3">
                        <span className="block text-slate-200">{record.crop_name}</span>
                        <span className="text-xs text-indigo-400 font-mono font-medium">{record.collected_quantity} Kg</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(record.collection_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        <span className="block">{record.vehicle_number}</span>
                        <span className="block text-slate-500">{record.driver_name}</span>
                      </td>
                      <td className="px-4 py-3">{renderBadge(record.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400" title="View/Print Details" onClick={() => { setSelectedRecord(record); setViewDrawerOpen(true); }}>
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
      </div>

      {/* Schedule / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedRecord ? 'Edit Collection' : 'New Goods Collection'}</DialogTitle>
              <DialogDescription>Record a new farm gate or hub collection.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-4 rounded-md space-y-4">
                <h4 className="text-sm font-semibold text-slate-300">Farmer & Contract Info</h4>
                <FormGrid cols={2}>
                  <FormRow label="Select Farmer" required>
                    {farmers.length === 0 ? (
                    <div className="flex h-10 w-full items-center rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-amber-500">
                      No farmers pending collection.
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
                            {f.code || f.id.substring(0,8)} - {f.full_name} | {f.primary_crop || 'Mixed'}
                          </option>
                        ))}
                    </select>
                  )}
                    {formErrors.farmer_id && <span className="text-xs text-red-500">{formErrors.farmer_id}</span>}
                  </FormRow>

                  <FormRow label="Contract ID" required>
                    <select 
                      className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm ring-offset-background outline-none"
                      value={formData.contract_id || ''}
                      onChange={(e) => setFormData(f => ({ ...f, contract_id: e.target.value }))}
                    >
                      <option value="">-- Link Contract --</option>
                      {/* Placeholder for contracts */}
                    </select>
                    {formErrors.contract_id && <span className="text-xs text-red-500">{formErrors.contract_id}</span>}
                  </FormRow>
                </FormGrid>
              </div>

              <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-4 rounded-md space-y-4">
                <h4 className="text-sm font-semibold text-slate-300">Collection Details</h4>
                <FormGrid cols={2}>
                  <FormRow label="Collected Quantity (Kg)" required>
                    <Input type="number" min="0" step="0.1" value={formData.collected_quantity || ''} onChange={e => setFormData(f => ({ ...f, collected_quantity: Number(e.target.value) }))} className="bg-[#1a1a1a] border-[#2a2a2a]" />
                    {formErrors.collected_quantity && <span className="text-xs text-red-500">{formErrors.collected_quantity}</span>}
                  </FormRow>
                  
                  <FormRow label="Collection Date & Time" required>
                    <Input type="datetime-local" value={formData.collection_date || ''} onChange={e => setFormData(f => ({ ...f, collection_date: e.target.value }))} className="bg-[#1a1a1a] border-[#2a2a2a] dark:[color-scheme:dark]" />
                    {formErrors.collection_date && <span className="text-xs text-red-500">{formErrors.collection_date}</span>}
                  </FormRow>
                </FormGrid>
              </div>

              <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-4 rounded-md space-y-4">
                <h4 className="text-sm font-semibold text-slate-300">Logistics Info</h4>
                <FormGrid cols={2}>
                  <FormRow label="Collection Center" required>
                    <Input value={formData.collection_center || ''} onChange={e => setFormData(f => ({ ...f, collection_center: e.target.value }))} className="bg-[#1a1a1a] border-[#2a2a2a]" placeholder="e.g. North Hub" />
                    {formErrors.collection_center && <span className="text-xs text-red-500">{formErrors.collection_center}</span>}
                  </FormRow>
                  <FormRow label="Vehicle Number" required>
                    <Input value={formData.vehicle_number || ''} onChange={e => setFormData(f => ({ ...f, vehicle_number: e.target.value.toUpperCase() }))} className="bg-[#1a1a1a] border-[#2a2a2a]" placeholder="MH-12-AB-1234" />
                    {formErrors.vehicle_number && <span className="text-xs text-red-500">{formErrors.vehicle_number}</span>}
                  </FormRow>
                  <FormRow label="Driver Name" required>
                    <Input value={formData.driver_name || ''} onChange={e => setFormData(f => ({ ...f, driver_name: e.target.value }))} className="bg-[#1a1a1a] border-[#2a2a2a]" />
                    {formErrors.driver_name && <span className="text-xs text-red-500">{formErrors.driver_name}</span>}
                  </FormRow>
                  <FormRow label="Status">
                    <select 
                      className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm ring-offset-background outline-none"
                      value={formData.status || 'Pending'}
                      onChange={(e) => setFormData(f => ({ ...f, status: e.target.value as CollectionStatus }))}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Received">Received</option>
                    </select>
                  </FormRow>
                </FormGrid>
              </div>

              <FormRow label="Remarks / Notes">
                <textarea 
                  className="flex w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none min-h-[60px]"
                  value={formData.notes || ''}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any damages or issues?"
                />
              </FormRow>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Collection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this collection record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Print Drawer */}
      <Dialog open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <DialogContent className="sm:max-w-[800px] bg-white text-black p-0 overflow-hidden print:static print:w-full print:h-full print:max-w-none print:shadow-none border-0 print:m-0 print:p-8">
          {selectedRecord && (
            <div className="h-full flex flex-col">
              <div className="p-6 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:hidden">
                <h2 className="text-lg font-bold text-slate-800">Collection Slip</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewDrawerOpen(false)}>Close</Button>
                  <Button size="sm" onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Printer className="w-4 h-4 mr-2" /> Print Slip</Button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="p-8 bg-white print:p-0">
                <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-200">
                   <div>
                     <h1 className="text-3xl font-black text-slate-900 tracking-tight">AGRI EXPORT ERP</h1>
                     <p className="text-slate-500 mt-1">Goods Collection Receipt</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xl font-bold text-slate-800 mb-1">{selectedRecord.id}</p>
                     <p className="text-sm font-semibold text-slate-600">Date: {new Date(selectedRecord.collection_date).toLocaleDateString()}</p>
                     <Badge className="mt-2 bg-slate-100 text-slate-800 border-slate-300">{selectedRecord.status}</Badge>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Farmer Details</h3>
                    <p className="font-bold text-lg text-slate-800">{selectedRecord.farmer_name}</p>
                    <p className="text-slate-600 mt-1">ID: {selectedRecord.farmer_id}</p>
                    <p className="text-slate-600 mt-1">Contract: {selectedRecord.contract_id}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Logistics Details</h3>
                    <p className="font-medium text-slate-800"><span className="text-slate-500 w-24 inline-block">Center:</span> {selectedRecord.collection_center}</p>
                    <p className="font-medium text-slate-800 mt-1"><span className="text-slate-500 w-24 inline-block">Vehicle:</span> {selectedRecord.vehicle_number}</p>
                    <p className="font-medium text-slate-800 mt-1"><span className="text-slate-500 w-24 inline-block">Driver:</span> {selectedRecord.driver_name}</p>
                  </div>
                </div>

                <div className="mb-8">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Collection Particulars</h3>
                   <table className="w-full text-left border border-slate-200">
                     <thead className="bg-slate-100 border-b border-slate-200">
                       <tr>
                         <th className="p-3 font-semibold text-slate-700">Crop / Commodity</th>
                         <th className="p-3 font-semibold text-slate-700 text-right">Quantity Received</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr>
                         <td className="p-3 text-slate-800 font-medium">{selectedRecord.crop_name}</td>
                         <td className="p-3 text-slate-900 font-bold text-right text-lg">{selectedRecord.collected_quantity} Kg</td>
                       </tr>
                     </tbody>
                   </table>
                </div>

                <div className="mb-12">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Remarks</h3>
                   <div className="p-3 bg-slate-50 border border-slate-200 rounded min-h-[60px] text-slate-700">
                     {selectedRecord.notes || 'None'}
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-12 border-t border-slate-200 text-center">
                  <div>
                    <div className="border-b border-slate-300 w-full mb-2"></div>
                    <p className="text-sm font-medium text-slate-600">Farmer Signature</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-300 w-full mb-2"></div>
                    <p className="text-sm font-medium text-slate-600">Driver Signature</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-300 w-full mb-2"></div>
                    <p className="text-sm font-medium text-slate-600">Authorized Officer</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedRecord.created_by}</p>
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
