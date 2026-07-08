-- 1. Add manager_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Alter leave_requests table
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS number_of_days numeric(5,2);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS manager_status text DEFAULT 'Pending';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS hr_status text DEFAULT 'Pending';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS hr_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year integer NOT NULL,
  leave_type text NOT NULL,
  allocated numeric(5,2) DEFAULT 0,
  used numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, year, leave_type)
);
