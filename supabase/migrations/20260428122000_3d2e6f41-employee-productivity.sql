-- EMPLOYEE PRODUCTIVITY METRICS
create table if not exists public.employee_productivity_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  role text not null default 'Employee',
  department text not null default 'General',
  attendance_pct real not null default 0 check (attendance_pct >= 0 and attendance_pct <= 100),
  tasks_completed int not null default 0,
  avg_response_minutes int not null default 0,
  productivity_score int not null default 0,
  performance_label text not null default 'Average',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, profile_id)
);

create index if not exists idx_employee_productivity_company on public.employee_productivity_metrics(company_id);
create index if not exists idx_employee_productivity_profile on public.employee_productivity_metrics(profile_id);

drop trigger if exists trg_employee_productivity_updated_at on public.employee_productivity_metrics;
create trigger trg_employee_productivity_updated_at
  before update on public.employee_productivity_metrics
  for each row execute function public.update_updated_at_column();

alter table public.employee_productivity_metrics enable row level security;

drop policy if exists employee_productivity_select on public.employee_productivity_metrics;
create policy employee_productivity_select on public.employee_productivity_metrics
  for select using (company_id = public.current_company_id());

drop policy if exists employee_productivity_insert on public.employee_productivity_metrics;
create policy employee_productivity_insert on public.employee_productivity_metrics
  for insert with check (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );

drop policy if exists employee_productivity_update on public.employee_productivity_metrics;
create policy employee_productivity_update on public.employee_productivity_metrics
  for update using (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );

drop policy if exists employee_productivity_delete on public.employee_productivity_metrics;
create policy employee_productivity_delete on public.employee_productivity_metrics
  for delete using (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );
