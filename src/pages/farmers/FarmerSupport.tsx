import { apiFetch } from "@/lib/api";
import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, FileText, CheckCircle, Clock, FileSpreadsheet, Eye, Pencil, Trash2, Headphones, AlertTriangle, Printer, Paperclip } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useFarmerContext, TicketRecord } from '@/context/FarmerContext';


// --- TYPES ---
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface SupportTicket {
  id: string;
  farmer_id: string;
  farmer_name: string;
  mobile_number: string;
  issue_category: string;
  priority: TicketPriority;
  description: string;
  assigned_staff: string;
  status: TicketStatus;
  internal_notes: string;
  attachments: string[]; // mock file names
  created_at: string;
  resolution_date: string | null;
  updated_at: string;
  created_by: string;
}

export default function FarmerSupportPage() {
  const { farmers, tickets, addTicket } = useFarmerContext();
  const loading = false;
  const [employees, setEmployees] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    async function loadEmployees() {
      const res = await apiFetch('/api/employees', { credentials: 'include' });
      const data = await res.json();
      if (data) {
        setEmployees(data.map(d => ({ id: d.id, name: d.full_name || 'Unknown User' })));
      }
    }
    loadEmployees();
  }, []);

  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All'>('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof SupportTicket; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SupportTicket | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SupportTicket>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const ISSUE_CATEGORIES = ['Payment Delay', 'Quality Dispute', 'Contract Query', 'App Assistance', 'General Inquiry', 'Pickup Scheduling'];

  const data: SupportTicket[] = useMemo(() => {
    return tickets.map(d => {
      const f = farmers.find(x => x.id === d.farmer_id);
      return {
        id: d.id,
        farmer_id: d.farmer_id,
        farmer_name: f?.full_name || 'Unknown Farmer',
        mobile_number: f?.mobile_number || '+91 XXXXX',
        issue_category: d.issue,
        priority: 'Medium',
        description: d.issue,
        assigned_staff: 'Tech Support',
        status: d.status as TicketStatus,
        internal_notes: '',
        attachments: [],
        created_at: new Date().toISOString(),
        resolution_date: null,
        updated_at: new Date().toISOString(),
        created_by: 'Admin'
      };
    });
  }, [tickets, farmers]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      open: data.filter(d => d.status === 'Open').length,
      inProgress: data.filter(d => d.status === 'In Progress').length,
      resolved: data.filter(d => d.status === 'Resolved' || d.status === 'Closed').length
      };
  }, [data]);

  const filteredData = useMemo(() => {
    let result = data;
    if (statusFilter !== 'All') result = result.filter(d => d.status === statusFilter);
    if (priorityFilter !== 'All') result = result.filter(d => d.priority === priorityFilter);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.farmer_name.toLowerCase().includes(lower) ||
        d.id.toLowerCase().includes(lower) ||
        d.issue_category.toLowerCase().includes(lower)
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
  }, [data, searchTerm, statusFilter, priorityFilter, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: keyof SupportTicket) => {
    setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const openAddModal = () => {
    setSelectedRecord(null);
    setFormData({ status: 'Open', priority: 'Low', assigned_staff: 'Tech Support' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (record: SupportTicket) => {
    setSelectedRecord(record);
    setFormData({ ...record });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.farmer_id) errors.farmer_id = "Farmer is required";
    if (!formData.issue_category) errors.issue_category = "Category is required";
    if (!formData.description) errors.description = "Description is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFarmerChange = (farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId);
    if (farmer) {
      setFormData(prev => ({ ...prev, farmer_id: farmerId, farmer_name: farmer.full_name, mobile_number: farmer.mobile_number }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    addTicket({
      id: selectedRecord ? selectedRecord.id : `tkt-${Date.now()}`,
      farmer_id: formData.farmer_id || '',
      issue: formData.issue_category || '',
      status: formData.status || 'Open'
    });

    toast.success("Ticket saved successfully");
    setModalOpen(false);
  };

  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(filteredData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Tickets");
    xlsx.writeFile(wb, "Support_Tickets.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Farmer Support Tickets", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['ID', 'Farmer', 'Category', 'Priority', 'Status']],
      body: filteredData.map(d => [d.id, d.farmer_name, d.issue_category, d.priority, d.status])
      });
    doc.save("Support_Tickets.pdf");
  };

  const renderStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Resolved':
      case 'Closed': return <Badge className="bg-emerald-500/10 text-emerald-500">Resolved</Badge>;
      case 'In Progress': return <Badge className="bg-blue-500/10 text-blue-400">In Progress</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500">Open</Badge>;
    }
  };

  const renderPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'High': return <Badge variant="outline" className="text-red-500 border-red-500/30">High</Badge>;
      case 'Medium': return <Badge variant="outline" className="text-amber-500 border-amber-500/30">Medium</Badge>;
      default: return <Badge variant="outline" className="text-slate-400 border-slate-700">Low</Badge>;
    }
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Farmer Support"
          description="Manage farmer queries, grievances, and support tickets."
          breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Support" }]}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                <Button variant="ghost" size="sm" onClick={exportExcel} className="rounded-none border-r border-slate-800 h-9 px-3 text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Excel
                </Button>
                <Button variant="ghost" size="sm" onClick={exportPDF} className="rounded-none h-9 px-3 text-slate-300">
                  <FileText className="w-4 h-4 mr-2 text-red-500" /> PDF
                </Button>
              </div>
              <Button size="sm" onClick={openAddModal}><Plus className="h-4 w-4 mr-1.5" /> New Ticket</Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Tickets', value: stats.total, icon: Headphones, color: 'text-indigo-400' },
            { label: 'Open Tickets', value: stats.open, icon: AlertTriangle, color: 'text-amber-400' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-blue-400' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-emerald-400' },
          ].map((card, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400 mb-1">{card.label}</p>
                <h3 className="text-2xl font-bold text-slate-100">{card.value}</h3>
              </div>
              <div className={`p-3 bg-[#222] rounded-full ${card.color}`}><card.icon className="w-6 h-6" /></div>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#2a2a2a] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm" />
            </div>
            <div className="flex gap-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-[#0d0d0d] border border-[#2a2a2a] text-sm rounded-md px-3 h-9 text-slate-300 outline-none">
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)} className="bg-[#0d0d0d] border border-[#2a2a2a] text-sm rounded-md px-3 h-9 text-slate-300 outline-none">
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('id')}>Ticket ID</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('farmer_name')}>Farmer</th>
                  <th className="px-4 py-3">Category & Details</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('priority')}>Priority</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('status')}>Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No tickets found</td></tr>
                ) : (
                  paginatedData.map(record => (
                    <tr key={record.id} className="hover:bg-[#222] transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">{record.id}</td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-slate-200">{record.farmer_name}</span>
                        <span className="text-xs text-slate-500">{record.mobile_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-indigo-400">{record.issue_category}</span>
                        <span className="block text-xs text-slate-400 truncate max-w-xs">{record.description}</span>
                      </td>
                      <td className="px-4 py-3">{renderPriorityBadge(record.priority)}</td>
                      <td className="px-4 py-3 text-slate-300">{record.assigned_staff}</td>
                      <td className="px-4 py-3">{renderStatusBadge(record.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400" onClick={() => { setSelectedRecord(record); setViewDrawerOpen(true); }}><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400" onClick={() => openEditModal(record)}><Pencil className="w-4 h-4" /></Button>
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
              <div>Showing Page {currentPage} of {totalPages}</div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#0d0d0d] border-[#2a2a2a]" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>{'<'}</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#0d0d0d] border-[#2a2a2a]" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>{'>'}</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedRecord ? 'Edit Support Ticket' : 'Create Support Ticket'}</DialogTitle>
              <DialogDescription>Log a grievance or query.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <FormGrid cols={2}>
                <FormRow label="Farmer" required>
                  <select className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 text-sm outline-none" value={formData.farmer_id || ''} onChange={(e) => handleFarmerChange(e.target.value)} disabled={!!selectedRecord}>
                    <option value="">Select Farmer</option>
                    {farmers.map(f => <option key={f.id} value={f.id}>{f.code || f.id.substring(0, 8)} - {f.full_name}</option>)}
                  </select>
                  {formErrors.farmer_id && <span className="text-xs text-red-500">{formErrors.farmer_id}</span>}
                </FormRow>
                <FormRow label="Mobile Number">
                  <Input value={formData.mobile_number || ''} onChange={(e) => setFormData(f => ({ ...f, mobile_number: e.target.value }))} className="bg-[#0d0d0d] border-[#2a2a2a]" />
                </FormRow>
                <FormRow label="Issue Category" required>
                  <select className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 text-sm outline-none" value={formData.issue_category || ''} onChange={(e) => setFormData(f => ({ ...f, issue_category: e.target.value }))}>
                    <option value="">Select Category</option>
                    {ISSUE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErrors.issue_category && <span className="text-xs text-red-500">{formErrors.issue_category}</span>}
                </FormRow>
                <FormRow label="Priority">
                  <select className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 text-sm outline-none" value={formData.priority || 'Low'} onChange={(e) => setFormData(f => ({ ...f, priority: e.target.value as TicketPriority }))}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </FormRow>
              </FormGrid>
              <FormRow label="Description" required>
                <textarea className="flex w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm outline-none min-h-[80px]" value={formData.description || ''} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
                {formErrors.description && <span className="text-xs text-red-500">{formErrors.description}</span>}
              </FormRow>
              <FormGrid cols={2}>
                <FormRow label="Assign To Staff">
                  <select className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 text-sm outline-none" value={formData.assigned_staff || ''} onChange={(e) => setFormData(f => ({ ...f, assigned_staff: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {employees.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </FormRow>
                <FormRow label="Status">
                  <select className="flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 text-sm outline-none" value={formData.status || 'Open'} onChange={(e) => setFormData(f => ({ ...f, status: e.target.value as TicketStatus }))}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </FormRow>
              </FormGrid>
              <FormRow label="Internal Notes / Resolution Info">
                <textarea className="flex w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm outline-none min-h-[60px]" value={formData.internal_notes || ''} onChange={e => setFormData(f => ({ ...f, internal_notes: e.target.value }))} />
              </FormRow>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          {selectedRecord && (
            <div>
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center">
                  <span>Ticket Details: {selectedRecord.id}</span>
                  {renderStatusBadge(selectedRecord.status)}
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Farmer</p>
                    <p className="font-semibold">{selectedRecord.farmer_name}</p>
                    <p className="text-sm text-slate-500">{selectedRecord.mobile_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Category & Priority</p>
                    <p className="font-semibold">{selectedRecord.issue_category}</p>
                    <p className="text-sm">{renderPriorityBadge(selectedRecord.priority)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Assigned Staff</p>
                    <p className="font-semibold">{selectedRecord.assigned_staff}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Created At</p>
                    <p className="font-semibold">{new Date(selectedRecord.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-3 rounded-md">
                  <p className="text-xs text-slate-400 mb-2">Description / Query</p>
                  <p className="text-sm">{selectedRecord.description}</p>
                </div>
                <div className="bg-[#222] border border-[#2a2a2a] p-3 rounded-md">
                  <p className="text-xs text-slate-400 mb-2">Internal Notes</p>
                  <p className="text-sm">{selectedRecord.internal_notes || 'No internal notes provided.'}</p>
                </div>
                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Attachments</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedRecord.attachments.map(att => (
                        <div key={att} className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-1.5 rounded-full text-xs">
                          <Paperclip className="w-3 h-3 text-indigo-400" />
                          <span>{att}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
