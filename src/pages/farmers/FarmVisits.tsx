import { apiFetch } from "@/lib/api";
import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, CalendarDays, CheckCircle, Clock, XCircle, FileSpreadsheet, FileText, Eye, Pencil, Trash2, Calendar, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useFarmerContext, FarmVisitRecord } from '@/context/FarmerContext';

// --- TYPES ---
export type VisitStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type VisitPurpose = 'Quality Check' | 'Harvest Inspection' | 'Onboarding Visit' | 'Dispute Resolution' | 'Other';

export interface FarmVisit {
  id: string;
  farmer_id: string;
  farmer_name: string;
  visit_date: string;
  visited_by: string;
  purpose: VisitPurpose;
  custom_purpose?: string;
  status: VisitStatus;
  notes: string;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

import { useAuth } from '@/hooks/useAuth';

export default function FarmVisits() {
  const { farmers, farmVisits, addVisit, updateFarmerStatus } = useFarmerContext();
  const { session } = useAuth();
  const loading = false;
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const token = session?.access_token;
        const res = await apiFetch('/api/employees', { headers: token ? { 'Authorization': `Bearer ${token }` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.map((d: any) => ({ id: d.id, name: d.full_name || 'Unknown User' })));
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    }
    loadEmployees();
  }, [session]);

  const data: FarmVisit[] = useMemo(() => {
    return farmVisits.map(v => {
      const f = farmers.find(fm => fm.id === v.farmer_id);
      return {
        id: v.id,
        farmer_id: v.farmer_id,
        farmer_name: f?.full_name || 'Unknown Farmer',
        visit_date: v.date,
        visited_by: 'Admin User',
        purpose: 'Quality Check',
        status: v.status as VisitStatus,
        notes: v.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'System'
      };
    });
  }, [farmVisits, farmers]);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'All'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof FarmVisit; direction: 'asc' | 'desc' }>({ key: 'visit_date', direction: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal/Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FarmVisit | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<FarmVisit>>({});
  const [completionNotes, setCompletionNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});



  // Compute stats
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      total: data.length,
      scheduled: data.filter(d => d.status === 'Scheduled' && new Date(d.visit_date) >= now).length,
      completedThisMonth: data.filter(d => {
        if (d.status !== 'Completed') return false;
        const dDate = new Date(d.visit_date);
        return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
      }).length,
      cancelled: data.filter(d => d.status === 'Cancelled').length
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
        d.farmer_name.toLowerCase().includes(lower)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter(d => new Date(d.visit_date).getTime() >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo).getTime();
      result = result.filter(d => new Date(d.visit_date).getTime() <= to);
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
  }, [data, searchTerm, statusFilter, dateFrom, dateTo, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: keyof FarmVisit) => {
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
    setFormData({ status: 'Scheduled', purpose: 'Quality Check' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (record: FarmVisit) => {
    setSelectedRecord(record);
    setFormData({ ...record, visit_date: record.visit_date.substring(0, 16) }); // format for datetime-local
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.farmer_id) errors.farmer_id = "Please select a farmer";
    if (!formData.visit_date) errors.visit_date = "Visit date is required";
    else if (!selectedRecord && new Date(formData.visit_date) < new Date()) errors.visit_date = "Visit date must be in the future";
    if (!formData.visited_by) errors.visited_by = "Please select an employee";
    if (!formData.purpose) errors.purpose = "Purpose is required";
    if (formData.purpose === 'Other' && !formData.custom_purpose) errors.custom_purpose = "Please specify purpose";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await addVisit({
        id: selectedRecord ? selectedRecord.id : `v-${Date.now()}`,
        farmer_id: formData.farmer_id || '',
        date: new Date(formData.visit_date!).toISOString(),
        status: formData.status || 'Scheduled',
        notes: formData.notes || ''
      });

      if (formData.status === 'Completed') {
        updateFarmerStatus(formData.farmer_id || '', 'Visit Completed');
      } else {
        updateFarmerStatus(formData.farmer_id || '', 'Visit Scheduled');
      }

      toast.success("Visit scheduled");
      setModalOpen(false);
    } catch(err: any) {
      toast.error(err.message || 'Failed to schedule visit');
    }
  };

  const confirmComplete = async () => {
    if (!completionNotes.trim()) {
      toast.error("Completion notes are required");
      return;
    }
    if (selectedRecord) {
      try {
        await addVisit({
          id: selectedRecord.id,
          farmer_id: selectedRecord.farmer_id,
          date: selectedRecord.visit_date,
          status: 'Completed',
          notes: completionNotes
        });
        updateFarmerStatus(selectedRecord.farmer_id, 'Visit Completed');
        toast.success("Visit marked as completed");
      } catch(err: any) {
        toast.error(err.message || 'Failed to complete visit');
      }
    }
    setCompleteModalOpen(false);
  };

  const confirmCancel = () => {
    if (selectedRecord) {
      setData(prev => prev.map(d => {
        if (d.id === selectedRecord.id) {
          return { ...d, status: 'Cancelled', updated_at: new Date().toISOString() };
        }
        return d;
      }));
      toast.success("Visit cancelled");
    }
    setCancelDialogOpen(false);
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      setData(prev => prev.filter(d => d.id !== selectedRecord.id));
      toast.success("Visit deleted");
    }
    setDeleteDialogOpen(false);
  };

  // Exports
  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(filteredData.map(d => ({
      'Farmer': d.farmer_name,
      'Visit Date': new Date(d.visit_date).toLocaleString(),
      'Visited By': d.visited_by,
      'Purpose': d.purpose === 'Other' ? d.custom_purpose : d.purpose,
      'Status': d.status,
      'Notes': d.notes,
      'Completion Notes': d.completion_notes || ''
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Farm Visits");
    xlsx.writeFile(wb, "Farm_Visits.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Farm Visits Report", 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['Farmer', 'Date', 'Visited By', 'Purpose', 'Status']],
      body: filteredData.map(d => [
        d.farmer_name, 
        new Date(d.visit_date).toLocaleDateString(), 
        d.visited_by,
        d.purpose === 'Other' ? d.custom_purpose : d.purpose,
        d.status
      ])
      });
    
    doc.save("Farm_Visits.pdf");
  };

  // Render Helpers
  const renderBadge = (status: VisitStatus) => {
    switch (status) {
      case 'Completed': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Completed</Badge>;
      case 'Cancelled': return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Cancelled</Badge>;
      default: return <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">Scheduled</Badge>;
    }
  };

  return (
    <div>
      <PageHeader
        title="Farm Visits"
        description="Schedule and track farm visits for verification and quality checks"
        breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Farm Visits" }]}
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
              <Plus className="h-4 w-4 mr-1.5" /> Schedule New Visit
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Visits', value: stats.total, icon: CalendarDays, color: 'text-indigo-400' },
          { label: 'Upcoming', value: stats.scheduled, icon: Clock, color: 'text-blue-400' },
          { label: 'Completed (This Month)', value: stats.completedThisMonth, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-400' },
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
              placeholder="Search by farmer name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-slate-400 whitespace-nowrap">From:</span>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-slate-400 whitespace-nowrap">To:</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm" />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#0d0d0d] border border-[#2a2a2a] text-sm rounded-md px-3 h-9 text-slate-300 w-full sm:w-auto outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('farmer_name')}>Farmer Name</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('visit_date')}>Visit Date</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('visited_by')}>Visited By</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{searchTerm || dateFrom || dateTo || statusFilter !== 'All' ? 'No visits match your filters' : 'No farm visits found'}</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map(record => (
                  <tr key={record.id} className="hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{record.farmer_name}</td>
                    <td className="px-4 py-3 text-slate-300">{new Date(record.visit_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3 text-slate-300">{record.visited_by}</td>
                    <td className="px-4 py-3 text-slate-300">{record.purpose === 'Other' ? record.custom_purpose : record.purpose}</td>
                    <td className="px-4 py-3">{renderBadge(record.status)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px]">
                      <span className="truncate block" title={record.notes}>
                        {record.notes.length > 40 ? `${record.notes.substring(0, 40)}...` : record.notes || '—'}
                      </span>
                      {record.notes.length > 40 && (
                        <button className="text-indigo-400 hover:underline mt-1" onClick={() => { setSelectedRecord(record); setViewDrawerOpen(true); }}>View</button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {record.status === 'Scheduled' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-400" title="Mark Completed" onClick={() => { setSelectedRecord(record); setCompletionNotes(''); setCompleteModalOpen(true); }}>
                              <CheckSquare className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" title="Cancel Visit" onClick={() => { setSelectedRecord(record); setCancelDialogOpen(true); }}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400" title="Edit" onClick={() => openEditModal(record)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400" title="View Details" onClick={() => { setSelectedRecord(record); setViewDrawerOpen(true); }}>
                          <Eye className="w-4 h-4" />
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

      {/* Schedule / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedRecord ? 'Edit Visit' : 'Schedule New Visit'}</DialogTitle>
              <DialogDescription>Plan a farm visit and assign it to an employee.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <FormGrid cols={2}>
                <FormRow label="Select Farmer" required>
                  {farmers.length === 0 ? (
                    <div className="flex h-10 w-full items-center rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-amber-500">
                      No farmers available.
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
                            {f.code || f.id.substring(0,8)} - {f.full_name} | {f.village} | {f.primary_crop || 'Mixed'}
                          </option>
                        ))}
                    </select>
                  )}
                  {formErrors.farmer_id && <span className="text-xs text-red-500">{formErrors.farmer_id}</span>}
                  
                  {/* Automatically load profile info */}
                  {formData.farmer_id && (
                    <div className="mt-3 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md flex flex-col gap-1 text-sm text-slate-300">
                      {(() => {
                        const selF = farmers.find(f => f.id === formData.farmer_id);
                        if (!selF) return null;
                        return (
                          <>
                            <div><span className="text-slate-500">Contact:</span> {selF.phone || 'N/A'}</div>
                            <div><span className="text-slate-500">Location:</span> {selF.village}, {selF.district}, {selF.state}</div>
                            <div><span className="text-slate-500">Primary Crop:</span> {selF.primary_crop || 'N/A'}</div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </FormRow>
                
                <FormRow label="Visit Date & Time" required>
                  <Input type="datetime-local" value={formData.visit_date || ''} onChange={e => setFormData(f => ({ ...f, visit_date: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a] dark:[color-scheme:dark]" />
                  {formErrors.visit_date && <span className="text-xs text-red-500">{formErrors.visit_date}</span>}
                </FormRow>
                
                <FormRow label="Visited By" required>
                  <select 
                    className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none"
                    value={formData.visited_by || ''}
                    onChange={(e) => setFormData(f => ({ ...f, visited_by: e.target.value }))}
                  >
                    <option value="">-- Assign to --</option>
                    {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                  </select>
                  {formErrors.visited_by && <span className="text-xs text-red-500">{formErrors.visited_by}</span>}
                </FormRow>

                <FormRow label="Purpose" required>
                  <select 
                    className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none"
                    value={formData.purpose || ''}
                    onChange={(e) => setFormData(f => ({ ...f, purpose: e.target.value as VisitPurpose }))}
                  >
                    <option value="">-- Select Purpose --</option>
                    <option value="Quality Check">Quality Check</option>
                    <option value="Harvest Inspection">Harvest Inspection</option>
                    <option value="Onboarding Visit">Onboarding Visit</option>
                    <option value="Dispute Resolution">Dispute Resolution</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.purpose && <span className="text-xs text-red-500">{formErrors.purpose}</span>}
                </FormRow>

                {formData.purpose === 'Other' && (
                  <div className="col-span-2">
                    <FormRow label="Specify Purpose" required>
                      <Input value={formData.custom_purpose || ''} onChange={e => setFormData(f => ({ ...f, custom_purpose: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a]" />
                      {formErrors.custom_purpose && <span className="text-xs text-red-500">{formErrors.custom_purpose}</span>}
                    </FormRow>
                  </div>
                )}
                
                <div className="col-span-2">
                  <FormRow label="Notes (Optional)">
                    <textarea 
                      className="flex w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none min-h-[80px]"
                      value={formData.notes || ''}
                      onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Add any instructions or details..."
                    />
                  </FormRow>
                </div>
              </FormGrid>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Visit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Modal */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle>Mark Visit Completed</DialogTitle>
            <DialogDescription>Add completion notes for the visit with {selectedRecord?.farmer_name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <FormRow label="Completion Notes" required>
                <textarea 
                  className="flex w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm ring-offset-background outline-none min-h-[100px]"
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="Summarize the outcome of the visit..."
                />
             </FormRow>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
            <Button onClick={confirmComplete} className="bg-emerald-600 hover:bg-emerald-700 text-white">Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-red-500">Cancel Visit</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the scheduled visit with <strong>{selectedRecord?.farmer_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">No, keep it</Button>
            <Button variant="destructive" onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">Yes, Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Visit Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this visit record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Dialog open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-400" />
              Visit Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center bg-[#0d0d0d] p-4 rounded-lg border border-[#2a2a2a]">
                <div>
                  <p className="text-xs text-slate-500 font-mono">Farmer</p>
                  <a href={`/farmers/${selectedRecord.farmer_id}`} className="text-lg font-semibold text-indigo-400 hover:underline">{selectedRecord.farmer_name}</a>
                </div>
                {renderBadge(selectedRecord.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-500">Visit Date & Time</p>
                  <p className="font-medium text-slate-200">{new Date(selectedRecord.visit_date).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Visited By</p>
                  <p className="font-medium text-slate-200">{selectedRecord.visited_by}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Purpose</p>
                  <p className="font-medium text-slate-200">{selectedRecord.purpose === 'Other' ? selectedRecord.custom_purpose : selectedRecord.purpose}</p>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-4">
                <p className="text-slate-500 mb-2 text-sm">Notes & Instructions</p>
                <div className="text-sm bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a] whitespace-pre-wrap">
                  {selectedRecord.notes || <span className="text-slate-500 italic">No notes provided.</span>}
                </div>
              </div>

              {selectedRecord.completion_notes && (
                 <div className="border-t border-[#2a2a2a] pt-4">
                   <p className="text-slate-500 mb-2 text-sm text-emerald-400">Completion Notes</p>
                   <div className="text-sm bg-[#0d0d0d] p-3 rounded border border-emerald-900/50 whitespace-pre-wrap text-slate-300">
                     {selectedRecord.completion_notes}
                   </div>
                 </div>
              )}

              <div className="border-t border-[#2a2a2a] pt-4">
                <p className="text-slate-500 mb-3 text-sm">Timeline</p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                     <div className="flex flex-col items-center">
                       <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                       {selectedRecord.status !== 'Scheduled' && <div className="w-0.5 h-full bg-slate-700 mt-1"></div>}
                     </div>
                     <div className="-mt-1.5 pb-2">
                       <p className="text-sm text-slate-300">Scheduled on {new Date(selectedRecord.created_at).toLocaleDateString()}</p>
                       <p className="text-xs text-slate-500">by {selectedRecord.updated_by}</p>
                     </div>
                  </div>
                  
                  {selectedRecord.status !== 'Scheduled' && (
                     <div className="flex gap-3">
                       <div className="flex flex-col items-center">
                         <div className={`w-2 h-2 rounded-full ${selectedRecord.status === 'Completed' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                       </div>
                       <div className="-mt-1.5 pb-2">
                         <p className="text-sm text-slate-300">{selectedRecord.status} on {new Date(selectedRecord.updated_at).toLocaleDateString()}</p>
                         <p className="text-xs text-slate-500">by {selectedRecord.status === 'Completed' ? selectedRecord.visited_by : selectedRecord.updated_by}</p>
                       </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDrawerOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
