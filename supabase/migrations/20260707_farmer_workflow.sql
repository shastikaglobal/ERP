-- Create Farmer Documents Table
CREATE TABLE IF NOT EXISTS public.farmer_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Farmer KYC Table
CREATE TABLE IF NOT EXISTS public.farmer_kyc (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    verified_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Farm Visits Table
CREATE TABLE IF NOT EXISTS public.farm_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    visited_by TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Contract Farming Table
CREATE TABLE IF NOT EXISTS public.contract_farming (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    contract_number TEXT UNIQUE NOT NULL,
    crop_name TEXT NOT NULL,
    agreed_quantity NUMERIC NOT NULL,
    agreed_price NUMERIC NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed', 'Cancelled')),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Supply Commitments Table
CREATE TABLE IF NOT EXISTS public.supply_commitments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contract_farming(id) ON DELETE SET NULL,
    crop_name TEXT NOT NULL,
    committed_quantity NUMERIC NOT NULL,
    delivered_quantity NUMERIC DEFAULT 0,
    unit TEXT NOT NULL,
    expected_delivery_date DATE NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Goods Collections Table
CREATE TABLE IF NOT EXISTS public.goods_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contract_farming(id) ON DELETE SET NULL,
    commitment_id UUID REFERENCES public.supply_commitments(id) ON DELETE SET NULL,
    crop_name TEXT NOT NULL,
    collected_quantity NUMERIC NOT NULL,
    collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    collection_center TEXT NOT NULL,
    vehicle_number TEXT,
    driver_name TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Transit', 'Received')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Payouts Table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contract_farming(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES public.goods_collections(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    bank_account TEXT,
    ifsc TEXT,
    transaction_ref TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Completed', 'Failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Farmer Ratings Table
CREATE TABLE IF NOT EXISTS public.farmer_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    quality_score NUMERIC NOT NULL,
    delivery_score NUMERIC NOT NULL,
    reliability_score NUMERIC NOT NULL,
    overall_rating NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('Excellent', 'Good', 'Average', 'Poor')),
    notes TEXT,
    evaluated_date TIMESTAMP WITH TIME ZONE NOT NULL,
    evaluated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Farmer Support Table
CREATE TABLE IF NOT EXISTS public.farmer_support (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    issue_category TEXT NOT NULL,
    priority TEXT DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High')),
    description TEXT NOT NULL,
    assigned_staff TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    internal_notes TEXT,
    resolution_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optional: Alter existing farmers table to add verification_status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmers' AND column_name='verification_status') THEN
        ALTER TABLE public.farmers ADD COLUMN verification_status TEXT DEFAULT 'Unverified' CHECK (verification_status IN ('Unverified', 'Pending', 'Verified', 'Rejected'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmers' AND column_name='kyc_status') THEN
        ALTER TABLE public.farmers ADD COLUMN kyc_status TEXT DEFAULT 'Pending' CHECK (kyc_status IN ('Pending', 'Completed', 'Rejected'));
    END IF;
END $$;
