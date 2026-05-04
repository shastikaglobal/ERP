-- EMPLOYEE ATTENDANCE AND TASK HISTORY TABLES

create table if not exists public.employee_attendance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'remote')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, profile_id, date)
);

create index if not exists idx_employee_attendance_company on public.employee_attendance_records(company_id);
create index if not exists idx_employee_attendance_profile on public.employee_attendance_records(profile_id);

drop trigger if exists trg_employee_attendance_updated_at on public.employee_attendance_records;
create trigger trg_employee_attendance_updated_at
  before update on public.employee_attendance_records
  for each row execute function public.update_updated_at_column();

alter table public.employee_attendance_records enable row level security;

drop policy if exists employee_attendance_select on public.employee_attendance_records;
create policy employee_attendance_select on public.employee_attendance_records
  for select using (company_id = public.current_company_id());

drop policy if exists employee_attendance_insert on public.employee_attendance_records;
create policy employee_attendance_insert on public.employee_attendance_records
  for insert with check (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );

drop policy if exists employee_attendance_update on public.employee_attendance_records;
create policy employee_attendance_update on public.employee_attendance_records
  for update using (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );

drop policy if exists employee_attendance_delete on public.employee_attendance_records;
create policy employee_attendance_delete on public.employee_attendance_records
  for delete using (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );

create table if not exists public.employee_task_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employee_task_history_company on public.employee_task_history(company_id);
create index if not exists idx_employee_task_history_profile on public.employee_task_history(profile_id);

drop trigger if exists trg_employee_task_history_updated_at on public.employee_task_history;
create trigger trg_employee_task_history_updated_at
  before update on public.employee_task_history
  for each row execute function public.update_updated_at_column();

alter table public.employee_task_history enable row level security;

drop policy if exists employee_task_history_select on public.employee_task_history;
create policy employee_task_history_select on public.employee_task_history
  for select using (company_id = public.current_company_id());

drop policy if exists employee_task_history_insert on public.employee_task_history;
create policy employee_task_history_insert on public.employee_task_history
  for insert with check (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );

drop policy if exists employee_task_history_update on public.employee_task_history;
create policy employee_task_history_update on public.employee_task_history
  for update using (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );

drop policy if exists employee_task_history_delete on public.employee_task_history;
create policy employee_task_history_delete on public.employee_task_history
  for delete using (
    company_id = public.current_company_id()
    and public.has_permission(auth.uid(), 'employees.manage')
  );
