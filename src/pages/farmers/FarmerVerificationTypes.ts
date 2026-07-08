export type VerificationStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export interface FarmerVerificationData {
  id: string;
  farmerId: string;
  farmerName: string;
  mobile: string;
  village: string;
  district: string;
  status: VerificationStatus;
  verifiedBy?: string;
  verificationDate?: string;
  mobileStatus: 'Pending' | 'Verified' | 'Rejected';
  addressStatus: 'Pending' | 'Verified' | 'Rejected';
  locationStatus: 'Pending' | 'Verified' | 'Rejected';
  landStatus: 'Pending' | 'Verified' | 'Rejected';
  landArea?: string;
  remarks?: string;
}

export const mockVerificationData: FarmerVerificationData[] = [
  {
    id: 'VER-001',
    farmerId: 'FMR-1023',
    farmerName: 'Ramesh Kumar',
    mobile: '+91 9876543210',
    village: 'Palampur',
    district: 'Kangra',
    status: 'Pending',
    mobileStatus: 'Pending',
    addressStatus: 'Pending',
    locationStatus: 'Pending',
    landStatus: 'Pending',
    landArea: '5 Acres',
  },
  {
    id: 'VER-002',
    farmerId: 'FMR-1024',
    farmerName: 'Suresh Singh',
    mobile: '+91 9988776655',
    village: 'Rampur',
    district: 'Shimla',
    status: 'Under Review',
    verifiedBy: 'Admin User',
    verificationDate: '2026-07-06',
    mobileStatus: 'Verified',
    addressStatus: 'Verified',
    locationStatus: 'Verified',
    landStatus: 'Pending',
  },
  {
    id: 'VER-003',
    farmerId: 'FMR-1025',
    farmerName: 'Anita Devi',
    mobile: '+91 9123456789',
    village: 'Manali',
    district: 'Kullu',
    status: 'Approved',
    verifiedBy: 'Admin User',
    verificationDate: '2026-07-05',
    mobileStatus: 'Verified',
    addressStatus: 'Verified',
    locationStatus: 'Verified',
    landStatus: 'Verified',
    remarks: 'Farm location and land documents verified physically.',
  },
  {
    id: 'VER-004',
    farmerId: 'FMR-1026',
    farmerName: 'Vijay Patel',
    mobile: '+91 9898989898',
    village: 'Solan',
    district: 'Solan',
    status: 'Rejected',
    verifiedBy: 'Admin User',
    verificationDate: '2026-07-04',
    mobileStatus: 'Verified',
    addressStatus: 'Rejected',
    locationStatus: 'Verified',
    landStatus: 'Pending',
    remarks: 'Address mismatch with provided proofs.',
  },
];
