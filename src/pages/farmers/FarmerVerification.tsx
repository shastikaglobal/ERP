import React, { useState, useEffect, useMemo } from 'react';
import { FarmerVerificationData } from './FarmerVerificationTypes';
import { VerificationDashboard } from './verification/VerificationDashboard';
import { VerificationTable } from './verification/VerificationTable';
import { VerificationModal } from './verification/VerificationModal';
import { toast } from 'sonner';
import { Users, ShieldCheck } from 'lucide-react';
import { useFarmerContext, WorkflowStatus } from '@/context/FarmerContext';

export const FarmerVerification: React.FC = () => {
  const { farmers, updateFarmerStatus } = useFarmerContext();
  const [localData, setLocalData] = useState<FarmerVerificationData[]>([]);
  
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerVerificationData | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'verify' | 'approve' | 'reject'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (farmers.length > 0) {
      const mapped: FarmerVerificationData[] = farmers.map(f => ({
        id: f.id,
        farmerId: f.code || f.id.substring(0, 8),
        farmerName: f.full_name,
        mobile: f.phone || '-',
        village: f.village || '-',
        district: f.district || '-',
        status: (['Unverified', 'Pending'].includes(f.workflow_status) ? 'Pending' : f.workflow_status) as any,
        aadhaarStatus: 'Pending',
        panStatus: 'Pending',
        bankStatus: 'Pending',
        locationStatus: 'Pending',
        landStatus: 'Pending',
        landArea: f.farm_area || 'Not Provided',
      }));
      setLocalData(mapped);
    }
  }, [farmers]);

  // Calculate dashboard stats
  const total = localData.length;
  const pending = localData.filter(d => d.status === 'Pending' || d.status === 'Unverified').length;
  const approved = localData.filter(d => d.status === 'Verified' || d.status === 'Approved').length;
  const rejected = localData.filter(d => d.status === 'Rejected').length;

  const handleAction = (action: 'view' | 'verify' | 'approve' | 'reject', farmer: FarmerVerificationData) => {
    setSelectedFarmer(farmer);
    setModalMode(action);
    setIsModalOpen(true);
  };

  const handleConfirmAction = async (remarks: string) => {
    if (!selectedFarmer) return;

    let newStatus = selectedFarmer.status;
    let successMsg = '';

    if (modalMode === 'verify') {
      newStatus = 'Under Review' as any;
      successMsg = 'Farmer marked as Under Review';
    } else if (modalMode === 'approve') {
      newStatus = 'Verified' as any;
      successMsg = 'Farmer Verification Approved';
    } else if (modalMode === 'reject') {
      newStatus = 'Rejected' as any;
      successMsg = 'Farmer Verification Rejected';
    }

    try {
      // Update Global Context
      let globalStatus: WorkflowStatus = 'Unverified';
      if (newStatus === 'Verified') globalStatus = 'KYC Pending'; // verified farmers move to KYC Pending
      updateFarmerStatus(selectedFarmer.id, globalStatus);

      const updatedData = localData.map(d => {
        if (d.id === selectedFarmer.id) {
          return {
            ...d,
            status: newStatus,
            remarks: remarks || d.remarks,
            verifiedBy: 'Current User',
            verificationDate: new Date().toISOString().split('T')[0]
          };
        }
        return d;
      });

      setLocalData(updatedData);
      setIsModalOpen(false);
      
      if (successMsg) {
        toast.success(successMsg, {
          description: `Status updated for ${selectedFarmer.farmerName}`
        });
      }
    } catch (err: any) {
      toast.error('Failed to update verification status: ' + err.message);
    }
  };

  const handleDownloadReport = (farmer: FarmerVerificationData) => {
    toast.success('Downloading Report...', {
      description: `Report for ${farmer.farmerName} is being generated.`
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-indigo-500" />
              Farmer Verification
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Manage and verify farmer registrations securely.</p>
          </div>
        </div>

        {/* Dashboard Cards */}
        <VerificationDashboard 
          total={total}
          pending={pending}
          approved={approved}
          rejected={rejected}
        />

        <VerificationTable 
          data={localData}
          onAction={handleAction}
          onDownloadReport={handleDownloadReport}
        />

        {/* Action Modal */}
        <VerificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          farmer={selectedFarmer}
          mode={modalMode}
          onConfirm={handleConfirmAction}
        />
      </div>
    </div>
  );
};

export default FarmerVerification;
