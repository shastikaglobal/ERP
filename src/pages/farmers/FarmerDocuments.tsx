import React, { useState } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileBox, Upload, FileText, Download, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useFarmerContext } from '@/context/FarmerContext';

export default function FarmerDocuments() {
  const { farmers, documents } = useFarmerContext();
  const [searchTerm, setSearchTerm] = useState('');

  const enrichedDocuments = documents.map(d => {
    const f = farmers.find(x => x.id === d.farmer_id);
    return {
      id: d.id,
      farmer_name: f?.full_name || 'Unknown Farmer',
      type: d.doc_type,
      file_name: d.doc_name,
      size: '2.0 MB',
      date: new Date().toLocaleDateString()
    };
  });

  const filtered = enrichedDocuments.filter(d => 
    d.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Farmer Documents"
        description="Centralized repository for all KYC documents, land records, contracts, and certificates."
        breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: "Documents" }]}
        actions={
          <Button size="sm"><Upload className="w-4 h-4 mr-2" /> Upload Document</Button>
        }
      />

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input placeholder="Search documents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] h-9 text-sm" />
          </div>
          <select className="bg-[#0d0d0d] border border-[#2a2a2a] text-sm rounded-md px-3 h-9 text-slate-300 outline-none">
            <option value="All">All Types</option>
            <option value="KYC">KYC</option>
            <option value="Contract">Contracts</option>
            <option value="Certificate">Certificates</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0d0d0d] text-slate-400 text-xs uppercase border-b border-[#2a2a2a]">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded On</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-[#222]">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="font-medium text-slate-200">{doc.file_name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{doc.farmer_name}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="border-slate-700 text-slate-400">{doc.type}</Badge></td>
                  <td className="px-4 py-3 text-slate-500">{doc.size}</td>
                  <td className="px-4 py-3 text-slate-500">{doc.date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-400"><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No documents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
