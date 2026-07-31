const fs = require('fs');

const contextPath = 'src/context/FarmerContext.tsx';

const newContextContent = `import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAuth, useIsAdminOrManager } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


// Common Types
export type WorkflowStatus = 'Unverified' | 'KYC Pending' | 'KYC Verified' | 'Visit Scheduled' | 'Visit Completed' | 'Contract Active' | 'Commitment Pending' | 'Collection Pending' | 'Payout Pending' | 'Completed';

export interface FarmerState {
  id: string;
  code: string;
  full_name: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  primary_crop: string;
  workflow_status: WorkflowStatus;
  farm_area?: string;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_by?: string;
  updated_by_name?: string;
  updated_at?: string;
}

export interface KYCRecord { id: string; farmer_id: string; aadhaar: string; pan: string; status: string; }
export interface FarmVisitRecord { id: string; farmer_id: string; date: string; status: string; notes: string; }
export interface ContractRecord { id: string; farmer_id: string; crop: string; status: string; }
export interface PayoutRecord { id: string; farmer_id: string; amount: number; status: string; }
export interface RatingRecord { id: string; farmer_id: string; score: number; review: string; }
export interface DocumentRecord { id: string; farmer_id: string; doc_name: string; doc_type: string; }
export interface TicketRecord { id: string; farmer_id: string; issue: string; status: string; }
export interface CommitmentRecord { id: string; farmer_id: string; crop: string; status: string; }
export interface CollectionRecord { id: string; farmer_id: string; crop: string; status: string; }

interface FarmerContextType {
  isLoading: boolean;
  farmers: FarmerState[];
  kycRecords: KYCRecord[];
  farmVisits: FarmVisitRecord[];
  contracts: ContractRecord[];
  commitments: CommitmentRecord[];
  collections: CollectionRecord[];
  payouts: PayoutRecord[];
  ratings: RatingRecord[];
  documents: DocumentRecord[];
  tickets: TicketRecord[];
  
  addFarmer: (f: FarmerState) => Promise<void>;
  updateFarmer: (id: string, updates: Partial<FarmerState>) => Promise<void>;
  updateFarmerStatus: (id: string, status: WorkflowStatus) => void;
  deleteFarmer: (id: string) => void;

  addKyc: (r: KYCRecord) => Promise<void>;
  updateKyc: (r: any) => Promise<void>;
  addVisit: (r: FarmVisitRecord) => void;
  addContract: (r: ContractRecord) => void;
  addCommitment: (r: CommitmentRecord) => void;
  addCollection: (r: CollectionRecord) => void;
  addPayout: (r: PayoutRecord) => void;
  addRating: (r: RatingRecord) => void;
  addDocument: (r: DocumentRecord) => void;
  addTicket: (r: TicketRecord) => void;
}

const FarmerContext = createContext<FarmerContextType | undefined>(undefined);

export const FarmerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, session } = useAuth();
  const isAdmin = useIsAdminOrManager();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;
  const token = session?.access_token;
  const headers = token ? { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  // -- FETCHERS --
  const { data: dbFarmers = [], isLoading: isFarmersLoading } = useQuery({
    queryKey: ['farmers_workflow_data', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch farmers from VPS');
      const data = await res.json();
      return data.map((f: any): FarmerState => ({
        id: f.id,
        code: f.code || f.id.slice(0,8),
        full_name: f.full_name || 'Unknown',
        phone: f.phone || '',
        village: f.village || '',
        district: f.district || '',
        state: f.state || '',
        primary_crop: f.primary_crops?.[0] || '',
        workflow_status: f.verification_status || 'Unverified',
        farm_area: f.farm_area?.toString(),
        created_by: f.created_by,
        created_by_name: f.created_by_name,
        created_at: f.created_at,
        updated_at: f.updated_at
      }));
    }
  });

  const { data: dbKycRecords = [] } = useQuery({
    queryKey: ['farmer_kyc', companyId],
    enabled: !!companyId && dbFarmers.length > 0,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/kyc?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch KYC records from VPS');
      const data = await res.json();
      
      const grouped = data.reduce((acc: any, row: any) => {
        if (!acc[row.farmer_id]) acc[row.farmer_id] = { id: row.farmer_id, farmer_id: row.farmer_id, aadhaar: '', pan: '', bank_account: '', ifsc: '', doc_urls: {}, status: row.status };
        if (row.document_type === 'Aadhaar') acc[row.farmer_id].aadhaar = row.document_number;
        if (row.document_type === 'PAN') acc[row.farmer_id].pan = row.document_number;
        if (row.document_type === 'Bank Account') acc[row.farmer_id].bank_account = row.document_number;
        if (row.document_type === 'IFSC') acc[row.farmer_id].ifsc = row.document_number;
        if (row.document_type === 'doc_urls') {
          try { acc[row.farmer_id].doc_urls = JSON.parse(row.document_number); } catch(e){}
        }
        if (row.status === 'Approved') acc[row.farmer_id].status = 'Completed';
        return acc;
      }, {});
      
      return Object.values(grouped) as KYCRecord[];
    }
  });

  const { data: dbVisits = [] } = useQuery({
    queryKey: ['farm_visits', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/visits?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch farm visits');
      return await res.json();
    }
  });

  const { data: dbContracts = [] } = useQuery({
    queryKey: ['contract_farming', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/contracts?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch contracts');
      return await res.json();
    }
  });

  const { data: commitments = [] } = useQuery({
    queryKey: ['commitments', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/commitments?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch commitments');
      return await res.json();
    }
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/collections?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch collections');
      return await res.json();
    }
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['payouts', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/payouts?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch payouts');
      return await res.json();
    }
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['farmer_ratings', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/ratings?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch ratings');
      return await res.json();
    }
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['farmer_documents', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/documents?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return await res.json();
    }
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['farmer_support', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(\`/api/farmers/tickets?company_id=\${companyId}\`, { headers });
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return await res.json();
    }
  });

  // -- MUTATIONS --
  const addFarmerMut = useMutation({
    mutationFn: async (f: FarmerState) => {
      const res = await fetch('/api/farmers', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          company_id: companyId,
          full_name: f.full_name,
          phone: f.phone,
          village: f.village,
          district: f.district,
          state: f.state,
          primary_crops: f.primary_crop ? [f.primary_crop] : [],
          verification_status: f.workflow_status,
          farm_area: f.farm_area ? parseFloat(f.farm_area) : null
        })
      });
      if (!res.ok) throw new Error('Failed to create farmer on VPS');
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmers_workflow_data'] })
  });

  const updateFarmerMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<FarmerState> }) => {
      const payload: any = {};
      if (updates.full_name) payload.full_name = updates.full_name;
      if (updates.phone) payload.phone = updates.phone;
      if (updates.village) payload.village = updates.village;
      if (updates.district) payload.district = updates.district;
      if (updates.state) payload.state = updates.state;
      if (updates.primary_crop) payload.primary_crops = [updates.primary_crop];
      if (updates.workflow_status) payload.verification_status = updates.workflow_status;
      if (updates.farm_area) payload.farm_area = parseFloat(updates.farm_area);
      
      const res = await fetch(\`/api/farmers/\${id}\`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update farmer on VPS');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmers_workflow_data'] })
  });

  const deleteFarmerMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(\`/api/farmers/\${id}\`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete farmer on VPS');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmers_workflow_data'] })
  });

  const addKycMut = useMutation({
    mutationFn: async (r: KYCRecord) => {
      const res = await fetch('/api/farmers/kyc', {
        method: 'POST',
        headers,
        body: JSON.stringify({ farmer_id: r.farmer_id, aadhaar: r.aadhaar, pan: r.pan, status: r.status })
      });
      if (!res.ok) throw new Error('Failed to add KYC on VPS');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer_kyc'] })
  });

  const updateKycMut = useMutation({
    mutationFn: async (r: any) => {
      const res = await fetch(\`/api/farmers/kyc/\${r.farmer_id}\`, { method: 'PUT', headers, body: JSON.stringify(r) });
      if (!res.ok) throw new Error('Failed to update KYC on VPS');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer_kyc'] })
  });

  // SUB-MODULE MUTATIONS
  const addVisitMut = useMutation({
    mutationFn: async (r: FarmVisitRecord) => {
      const res = await fetch('/api/farmers/visits', { method: 'POST', headers, body: JSON.stringify({ company_id: companyId, ...r }) });
      if (!res.ok) throw new Error('Failed to add visit');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farm_visits'] })
  });

  const addContractMut = useMutation({
    mutationFn: async (r: ContractRecord) => {
      const res = await fetch('/api/farmers/contracts', { method: 'POST', headers, body: JSON.stringify({ company_id: companyId, ...r }) });
      if (!res.ok) throw new Error('Failed to add contract');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contract_farming'] })
  });

  const addCommitmentMut = useMutation({
    mutationFn: async (r: CommitmentRecord) => {
      const res = await fetch('/api/farmers/commitments', { method: 'POST', headers, body: JSON.stringify({ company_id: companyId, ...r }) });
      if (!res.ok) throw new Error('Failed to add commitment');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['commitments'] })
  });

  const addCollectionMut = useMutation({
    mutationFn: async (r: CollectionRecord) => {
      const res = await fetch('/api/farmers/collections', { method: 'POST', headers, body: JSON.stringify({ company_id: companyId, ...r }) });
      if (!res.ok) throw new Error('Failed to add collection');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collections'] })
  });

  const addPayoutMut = useMutation({
    mutationFn: async (r: PayoutRecord) => {
      const res = await fetch('/api/farmers/payouts', { method: 'POST', headers, body: JSON.stringify({ company_id: companyId, ...r }) });
      if (!res.ok) throw new Error('Failed to add payout');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payouts'] })
  });

  const addRatingMut = useMutation({
    mutationFn: async (r: RatingRecord) => {
      const res = await fetch('/api/farmers/ratings', { method: 'POST', headers, body: JSON.stringify({ company_id: companyId, ...r }) });
      if (!res.ok) throw new Error('Failed to add rating');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer_ratings'] })
  });

  const addDocumentMut = useMutation({
    mutationFn: async (r: DocumentRecord) => {
      const res = await fetch('/api/farmers/documents', { method: 'POST', headers, body: JSON.stringify({ company_id: companyId, ...r }) });
      if (!res.ok) throw new Error('Failed to add document');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer_documents'] })
  });

  const addTicketMut = useMutation({
    mutationFn: async (r: TicketRecord) => {
      const res = await fetch('/api/farmers/tickets', { method: 'POST', headers, body: JSON.stringify({ company_id: companyId, ...r }) });
      if (!res.ok) throw new Error('Failed to add ticket');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmer_support'] })
  });

  // -- SYNCHRONOUS/ASYNC WRAPPERS --
  const addFarmer = async (f: FarmerState) => { await addFarmerMut.mutateAsync(f); };
  const updateFarmer = async (id: string, updates: Partial<FarmerState>) => { await updateFarmerMut.mutateAsync({ id, updates }); };
  const updateFarmerStatus = (id: string, status: WorkflowStatus) => { updateFarmerMut.mutate({ id, updates: { workflow_status: status } }); };
  const deleteFarmer = (id: string) => { deleteFarmerMut.mutate(id); };

  const addKyc = async (r: KYCRecord) => { await addKycMut.mutateAsync(r); };
  const updateKyc = async (r: any) => { await updateKycMut.mutateAsync(r); };
  const addVisit = (r: FarmVisitRecord) => { addVisitMut.mutate(r); };
  const addContract = (r: ContractRecord) => { addContractMut.mutate(r); };
  const addCommitment = (r: CommitmentRecord) => { addCommitmentMut.mutate(r); };
  const addCollection = (r: CollectionRecord) => { addCollectionMut.mutate(r); };
  const addPayout = (r: PayoutRecord) => { addPayoutMut.mutate(r); };
  const addRating = (r: RatingRecord) => { addRatingMut.mutate(r); };
  const addDocument = (r: DocumentRecord) => { addDocumentMut.mutate(r); };
  const addTicket = (r: TicketRecord) => { addTicketMut.mutate(r); };

  // Filter based on ownership for standard employees
  const filteredFarmers = useMemo(() => {
    if (isAdmin) return dbFarmers;
    if (!user) return [];
    return dbFarmers.filter(f => f.created_by === user.id);
  }, [dbFarmers, isAdmin, user]);

  const validIds = useMemo(() => new Set(filteredFarmers.map(f => f.id)), [filteredFarmers]);

  return (
    <FarmerContext.Provider value={{ 
      isLoading: isFarmersLoading,
      farmers: filteredFarmers,
      kycRecords: useMemo(() => dbKycRecords.filter(r => validIds.has(r.farmer_id)), [dbKycRecords, validIds]),
      farmVisits: useMemo(() => dbVisits.filter(r => validIds.has(r.farmer_id)), [dbVisits, validIds]),
      contracts: useMemo(() => dbContracts.filter(r => validIds.has(r.farmer_id)), [dbContracts, validIds]),
      commitments: useMemo(() => commitments.filter(r => validIds.has(r.farmer_id)), [commitments, validIds]),
      collections: useMemo(() => collections.filter(r => validIds.has(r.farmer_id)), [collections, validIds]),
      payouts: useMemo(() => payouts.filter(r => validIds.has(r.farmer_id)), [payouts, validIds]),
      ratings: useMemo(() => ratings.filter(r => validIds.has(r.farmer_id)), [ratings, validIds]),
      documents: useMemo(() => documents.filter(r => validIds.has(r.farmer_id)), [documents, validIds]),
      tickets: useMemo(() => tickets.filter(r => validIds.has(r.farmer_id)), [tickets, validIds]),
      addFarmer, updateFarmer, updateFarmerStatus, deleteFarmer,
      addKyc, addVisit, addContract, addCommitment, addCollection, addPayout, addRating, addDocument, addTicket
    }}>
      {children}
    </FarmerContext.Provider>
  );
};

export const useFarmerContext = () => {
  const context = useContext(FarmerContext);
  if (!context) throw new Error('useFarmerContext must be used within a FarmerProvider');
  return context;
};
`;

fs.writeFileSync(contextPath, newContextContent, 'utf8');
console.log('Successfully updated FarmerContext.tsx');
