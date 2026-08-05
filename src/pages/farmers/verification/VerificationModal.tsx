import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
      } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FarmerVerificationData } from '../FarmerVerificationTypes';
import { CheckCircle2, FileText, MapPin, Map, CreditCard, User, XCircle } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerVerificationData | null;
  mode: 'view' | 'verify' | 'approve' | 'reject';
  onConfirm: (remarks: string) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  farmer,
  mode,
  onConfirm
      }) => {
  const [remarks, setRemarks] = React.useState('');

  if (!farmer) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Verified</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</Badge>;
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'verify': return 'Verify Farmer Information';
      case 'approve': return 'Approve Farmer Verification';
      case 'reject': return 'Reject Farmer Verification';
      default: return 'Farmer Verification Details';
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-slate-950 border border-slate-800 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheckIcon mode={mode} />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {farmer.farmerName} ({farmer.farmerId}) - {farmer.village}, {farmer.district}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Contact & Address Section */}
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
            <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Contact & Address
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Mobile Status</span>
                {getStatusBadge(farmer.mobileStatus)}
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-1">Mobile Number</span>
                <Input value={farmer.mobile || 'Not provided'} readOnly className="bg-slate-900 border-slate-700" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-sm text-slate-500">Address Status</span>
                {getStatusBadge(farmer.addressStatus)}
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-1">Village</span>
                <Input value={farmer.village || 'Not provided'} readOnly className="bg-slate-900 border-slate-700" />
              </div>
            </div>
          </div>

          {/* Location & Land Section */}
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
            <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" /> Location & Land
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Location Status</span>
                {getStatusBadge(farmer.locationStatus)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Land Status</span>
                {getStatusBadge(farmer.landStatus)}
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-1">Land Area</span>
                <Input value={farmer.landArea || 'Unknown'} readOnly className="bg-slate-900 border-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Remarks / Notes</h3>
          <Textarea 
            placeholder={isReadOnly ? "No remarks provided" : "Enter verification remarks here..."}
            value={isReadOnly ? (farmer.remarks || '') : remarks}
            onChange={(e) => setRemarks(e.target.value)}
            readOnly={isReadOnly}
            className="min-h-[100px] bg-slate-900/50 border-slate-700 focus-visible:ring-indigo-500/50"
          />
        </div>

        <DialogFooter className="mt-6 border-t border-slate-800 pt-4 flex gap-2 sm:justify-end">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          
          {mode === 'verify' && (
            <Button onClick={() => onConfirm(remarks)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Mark as Under Review
            </Button>
          )}
          {mode === 'approve' && (
            <Button onClick={() => onConfirm(remarks)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Approve Verification
            </Button>
          )}
          {mode === 'reject' && (
            <Button onClick={() => onConfirm(remarks)} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
              Reject Verification
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ShieldCheckIcon = ({ mode }: { mode: string }) => {
  if (mode === 'approve') return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
  if (mode === 'reject') return <XCircle className="w-6 h-6 text-red-500" />;
  return <CheckCircle2 className="w-6 h-6 text-blue-500" />;
};
