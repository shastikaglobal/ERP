-- Create crm_tasks table
CREATE TABLE IF NOT EXISTS public.crm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_number SERIAL,
    title TEXT NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'To Do', -- 'To Do', 'In Progress', 'Completed'
    priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
    due_date TIMESTAMP WITH TIME ZONE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view tasks in their company" ON public.crm_tasks;
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "BDEs can update their assigned tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "BDEs can view their assigned tasks" ON public.crm_tasks;

-- Create Policies

-- Admin can do everything
CREATE POLICY "Admins can manage tasks"
ON public.crm_tasks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.slug IN ('admin', 'manager')
    )
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.slug IN ('admin', 'manager')
    )
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- BDEs can view tasks assigned to them OR if they created the lead (simplifying to just assigned for now, or if it's their company)
-- Wait, let's allow everyone to view tasks in their company for transparency, but only assignee or admin can edit.
CREATE POLICY "Users can view tasks in their company"
ON public.crm_tasks
FOR SELECT
TO authenticated
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- BDEs can insert tasks for their company
CREATE POLICY "Users can insert tasks"
ON public.crm_tasks
FOR INSERT
TO authenticated
WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- BDEs can update tasks assigned to them
CREATE POLICY "BDEs can update assigned tasks"
ON public.crm_tasks
FOR UPDATE
TO authenticated
USING (
    assigned_to = auth.uid() 
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    assigned_to = auth.uid() 
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_tasks;
