import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, FileText, FileSpreadsheet, Eye, Pencil, Trash2, Star, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormGrid, FormRow } from "@/components/shared/FormShell";
import { useFarmerContext, RatingRecord } from '@/context/FarmerContext';

// --- TYPES ---
export interface FarmerRating {
  id: string;
  farmer_id: string;
  farmer_name: string;
  quality_score: number; // out of 5
  delivery_score: number; // out of 5
  reliability_score: number; // out of 5
  overall_rating: number; // computed average
  status: 'Excellent' | 'Good' | 'Average' | 'Poor';
  notes: string;
  evaluated_date: string;
  created_at: string;
  updated_at: string;
  evaluated_by: string;
}

export default function FarmerRatingPage() {
  const { farmers, ratings, addRating, updateFarmerStatus } = useFarmerContext();
  const loading = false;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FarmerRating | null>(null);

  const [formData, setFormData] = useState<Partial<FarmerRating>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const data: FarmerRating[] = useMemo(() => {
    return ratings.map(d => {
      const f = farmers.find(x => x.id === d.farmer_id);
      return {
        id: d.id,
        farmer_id: d.farmer_id,
        score: d.overall_rating || d.score || d.rating || 0,
        review: d.review || d.notes || '',
        farmer_name: f?.full_name || 'Unknown Farmer',
        quality_score: d.quality_score ?? d.score,
        delivery_score: d.delivery_score ?? d.score,
        reliability_score: d.reliability_score ?? d.score,
        overall_rating: d.overall_rating ?? d.score,
        status: (d.overall_rating || d.score) >= 4.5 ? 'Excellent' : (d.overall_rating || d.score) >= 3.5 ? 'Good' : (d.overall_rating || d.score) >= 2.5 ? 'Average' : 'Poor',
        notes: d.review,
        evaluated_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        evaluated_by: 'Admin User'
      };
    });
  }, [ratings, farmers]);

  const stats = useMemo(() => {
    const avgScore = data.length ? (data.reduce((acc, curr) => acc + (Number(curr.overall_rating) || 0), 0) / data.length).toFixed(1) : 0;
    return {
      totalEvaluated: data.length,
      averageRating: avgScore,
      excellent: data.filter(d => d.status === 'Excellent').length,
      needsImprovement: data.filter(d => d.status === 'Poor' || d.status === 'Average').length
      };
  }, [data]);

  const filteredData = useMemo(() => {
    let result = data;
    if (statusFilter !== 'All') result = result.filter(d => d.status === statusFilter);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(d => d.farmer_name.toLowerCase().includes(lower) || d.farmer_id.toLowerCase().includes(lower));
    }
    return result;
  }, [data, searchTerm, statusFilter]);

  const openAddModal = () => {
    setSelectedRecord(null);
    setFormData({ quality_score: 5, delivery_score: 5, reliability_score: 5 });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (record: FarmerRating) => {
    setSelectedRecord(record);
    setFormData({ ...record });
    setFormErrors({});
    setModalOpen(true);
  };

  const calculateStatus = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    return 'Poor';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.farmer_id) errors.farmer_id = "Farmer is required";
    
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const computedOverall = Number(((Number(formData.quality_score) + Number(formData.delivery_score) + Number(formData.reliability_score)) / 3).toFixed(1));

    try {
      await addRating({
        id: selectedRecord ? selectedRecord.id : `rtg-${Date.now()}`,
        farmer_id: formData.farmer_id || '',
        score: computedOverall,
        review: formData.notes || ''
      });
      toast.success("Rating saved");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save rating');
    }
  };

  const confirmDelete = () => {
    toast.success("Rating deleted");
    setDeleteDialogOpen(false);
  };

  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(filteredData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Ratings");
    xlsx.writeFile(wb, "Farmer_Ratings.xlsx");
  };

  const renderBadge = (status: string) => {
    switch (status) {
      case 'Excellent': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Excellent</Badge>;
      case 'Good': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Good</Badge>;
      case 'Average': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Average</Badge>;
      case 'Poor': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Poor</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-1 text-amber-400">
        <Star className="w-4 h-4 fill-current" />
        <span className="text-sm font-semibold text-slate-200">{(score || 0).toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Farmer Rating & Performance"
        description="Evaluate and track farmer quality, delivery timelines, and reliability."
        breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Ratings" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={exportExcel} className="bg-slate-900 border border-slate-800 text-emerald-500 hover:bg-slate-800">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-1.5" /> Evaluate Farmer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Evaluated Farmers', value: stats.totalEvaluated, icon: ShieldCheck, color: 'text-indigo-400' },
          { label: 'Avg System Rating', value: stats.averageRating, icon: Star, color: 'text-amber-400' },
          { label: 'Excellent Performers', value: stats.excellent, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Needs Improvement', value: stats.needsImprovement, icon: AlertTriangle, color: 'text-red-400' },
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

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input placeholder="Search farmers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#0d0d0d] border border-[#2a2a2a] text-sm rounded-md px-3 h-9 text-slate-300 outline-none">
            <option value="All">All Categories</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
              <tr>
                <th className="px-4 py-3">ID / Farmer</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Reliability</th>
                <th className="px-4 py-3">Overall Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No ratings found</td></tr>
              ) : (
                filteredData.map(record => (
                  <tr key={record.id} className="hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3">
                      <span className="block font-medium text-slate-200">{record.farmer_name}</span>
                      <span className="block text-xs font-mono text-slate-500">{record.farmer_id}</span>
                    </td>
                    <td className="px-4 py-3">{renderStars(record.quality_score)}</td>
                    <td className="px-4 py-3">{renderStars(record.delivery_score)}</td>
                    <td className="px-4 py-3">{renderStars(record.reliability_score)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#0d0d0d] h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${record.overall_rating >= 4 ? 'bg-emerald-500' : record.overall_rating >= 3 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${(record.overall_rating / 5) * 100}%` }}></div>
                        </div>
                        <span className="font-bold text-slate-200">{record.overall_rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{renderBadge(record.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400" onClick={() => { setSelectedRecord(record); setViewDrawerOpen(true); }}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400" onClick={() => openEditModal(record)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => { setSelectedRecord(record); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-slate-200">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{selectedRecord ? 'Edit Rating' : 'Evaluate Farmer'}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <FormRow label="Select Farmer" required>
                  {farmers.length === 0 ? (
                    <div className="flex h-10 w-full items-center rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-amber-500">
                      No eligible farmers to rate.
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
                            {f.code || f.id?.substring(0,8)} - {f.full_name}
                          </option>
                        ))}
                    </select>
                  )}
                {formErrors.farmer_id && <span className="text-xs text-red-500">{formErrors.farmer_id}</span>}
              </FormRow>

              <div className="grid grid-cols-3 gap-4">
                <FormRow label="Quality Score (1-5)">
                  <Input type="number" min="1" max="5" step="0.1" value={formData.quality_score || ''} onChange={e => setFormData(f => ({ ...f, quality_score: Number(e.target.value) }))} className="bg-[#0d0d0d] border-[#2a2a2a]" />
                </FormRow>
                <FormRow label="Delivery Score (1-5)">
                  <Input type="number" min="1" max="5" step="0.1" value={formData.delivery_score || ''} onChange={e => setFormData(f => ({ ...f, delivery_score: Number(e.target.value) }))} className="bg-[#0d0d0d] border-[#2a2a2a]" />
                </FormRow>
                <FormRow label="Reliability (1-5)">
                  <Input type="number" min="1" max="5" step="0.1" value={formData.reliability_score || ''} onChange={e => setFormData(f => ({ ...f, reliability_score: Number(e.target.value) }))} className="bg-[#0d0d0d] border-[#2a2a2a]" />
                </FormRow>
              </div>

              <FormRow label="Review Notes">
                <textarea 
                  className="flex w-full rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm outline-none min-h-[80px]"
                  value={formData.notes || ''}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                />
              </FormRow>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-[#2a2a2a] bg-[#0d0d0d] text-slate-300">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Evaluation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
