import React, { useState } from 'react';
import { Search, Eye, CheckCircle2, XCircle, Download, ShieldAlert } from 'lucide-react';
import { FarmerVerificationData, VerificationStatus } from '../FarmerVerificationTypes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
      } from '@/components/ui/table';

interface VerificationTableProps {
  data: FarmerVerificationData[];
  onAction: (action: 'view' | 'verify' | 'approve' | 'reject', farmer: FarmerVerificationData) => void;
  onDownloadReport: (farmer: FarmerVerificationData) => void;
}

export const VerificationTable: React.FC<VerificationTableProps> = ({ data, onAction, onDownloadReport }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(
    (item) =>
      item.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobile.includes(searchTerm) ||
      item.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Verified':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">Verified</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">Rejected</Badge>;
      case 'Under Review':
      case 'Pending':
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30">Under Review</Badge>;
      case 'Unverified':
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30">Unverified</Badge>;
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          Verification Queue
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search farmers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500/50 h-10 rounded-lg"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-950/40">
            <TableRow className="border-slate-700/50 hover:bg-transparent">
              <TableHead className="text-slate-400 font-medium">Farmer ID</TableHead>
              <TableHead className="text-slate-400 font-medium">Farmer Name</TableHead>
              <TableHead className="text-slate-400 font-medium">Mobile</TableHead>
              <TableHead className="text-slate-400 font-medium">District</TableHead>
              <TableHead className="text-slate-400 font-medium">Status</TableHead>
              <TableHead className="text-slate-400 font-medium">Verified By</TableHead>
              <TableHead className="text-slate-400 font-medium">Date</TableHead>
              <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow className="border-slate-700/50">
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No farmers found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((farmer) => (
                <TableRow key={farmer.id} className="border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                  <TableCell className="font-medium text-slate-300">{farmer.farmerId}</TableCell>
                  <TableCell className="text-slate-200">{farmer.farmerName}</TableCell>
                  <TableCell className="text-slate-400">{farmer.mobile}</TableCell>
                  <TableCell className="text-slate-400">{farmer.district}</TableCell>
                  <TableCell>{getStatusBadge(farmer.status)}</TableCell>
                  <TableCell className="text-slate-400">{farmer.verifiedBy || '-'}</TableCell>
                  <TableCell className="text-slate-400">{farmer.verificationDate || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAction('view', farmer)}
                        className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {farmer.status === 'Unverified' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAction('verify', farmer)}
                          className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 text-xs px-2"
                        >
                          Verify
                        </Button>
                      )}
                      {(farmer.status === 'Under Review' || farmer.status === 'Pending') && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onAction('approve', farmer)}
                            className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onAction('reject', farmer)}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownloadReport(farmer)}
                        className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                        title="Download Report"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
