import { supabase } from "@/integrations/supabase/client";

export type EmployeeAttendanceRecord = {
  id: string;
  company_id: string;
  profile_id: string;
  date: string;
  status: "present" | "absent" | "late" | "remote";
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeAttendanceInput = {
  company_id: string;
  profile_id: string;
  date: string;
  status: "present" | "absent" | "late" | "remote";
  notes?: string | null;
};

export type EmployeeTaskRecord = {
  id: string;
  company_id: string;
  profile_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  completed: boolean;
  completed_at?: string | null;
  points: number;
  created_at: string;
  updated_at: string;
};

export type EmployeeTaskInput = {
  company_id: string;
  profile_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  completed?: boolean;
  completed_at?: string | null;
  points?: number;
};

// ── Attendance CRUD ─────────────────────────────────────────────────

export async function getEmployeeAttendanceData(
  companyId?: string
): Promise<EmployeeAttendanceRecord[]> {
  // Return static mock data without connecting to Supabase
  const mockData: EmployeeAttendanceRecord[] = [];
  const mockProfiles = ["EMP-001", "EMP-002", "EMP-003", "EMP-004", "EMP-005"];
  
  const statuses: ("present" | "absent" | "late" | "remote")[] = [
    "present", "present", "present", "present", "remote", 
    "present", "late", "present", "present", "absent"
  ];
  
  for (let pIdx = 0; pIdx < mockProfiles.length; pIdx++) {
    const profile_id = mockProfiles[pIdx];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const statusIdx = (pIdx * 14 + i) % statuses.length;
      
      mockData.push({
        id: `mock-att-${profile_id}-${i}`,
        company_id: "mock-company",
        profile_id,
        date: date.toISOString().slice(0, 10),
        status: statuses[statusIdx],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }
  
  return mockData;
}

export async function createEmployeeAttendance(
  input: EmployeeAttendanceInput
): Promise<EmployeeAttendanceRecord> {
  const { data, error } = await supabase
    .from("employee_attendance_records")
    .insert(input)
    .select(`
      id,
      company_id,
      profile_id,
      date,
      status,
      notes,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create attendance record: ${error.message}`);
  }

  return data as EmployeeAttendanceRecord;
}

export async function updateEmployeeAttendance(
  id: string,
  updates: Partial<EmployeeAttendanceInput>
): Promise<EmployeeAttendanceRecord> {
  const { data, error } = await supabase
    .from("employee_attendance_records")
    .update(updates)
    .eq("id", id)
    .select(`
      id,
      company_id,
      profile_id,
      date,
      status,
      notes,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update attendance record: ${error.message}`);
  }

  return data as EmployeeAttendanceRecord;
}

export async function deleteEmployeeAttendance(id: string): Promise<void> {
  const { error } = await supabase
    .from("employee_attendance_records")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete attendance record: ${error.message}`);
  }
}

// ── Task History CRUD ───────────────────────────────────────────────

export async function getEmployeeTaskHistory(
  companyId?: string
): Promise<EmployeeTaskRecord[]> {
  let query = supabase
    .from("employee_task_history")
    .select(`
      id,
      company_id,
      profile_id,
      title,
      description,
      due_date,
      completed,
      completed_at,
      points,
      created_at,
      updated_at
    `)
    .order("due_date", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load task history: ${error.message}`);
  }

  return (data ?? []) as EmployeeTaskRecord[];
}

export async function createEmployeeTask(
  input: EmployeeTaskInput
): Promise<EmployeeTaskRecord> {
  const insertPayload = {
    ...input,
    completed: input.completed ?? false,
    completed_at: input.completed ? input.completed_at ?? new Date().toISOString() : null,
    points: input.points ?? 0,
  };

  const { data, error } = await supabase
    .from("employee_task_history")
    .insert(insertPayload)
    .select(`
      id,
      company_id,
      profile_id,
      title,
      description,
      due_date,
      completed,
      completed_at,
      points,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data as EmployeeTaskRecord;
}

export async function updateEmployeeTask(
  id: string,
  updates: Partial<EmployeeTaskInput>
): Promise<EmployeeTaskRecord> {
  const { data, error } = await supabase
    .from("employee_task_history")
    .update(updates)
    .eq("id", id)
    .select(`
      id,
      company_id,
      profile_id,
      title,
      description,
      due_date,
      completed,
      completed_at,
      points,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return data as EmployeeTaskRecord;
}

export async function deleteEmployeeTask(id: string): Promise<void> {
  const { error } = await supabase
    .from("employee_task_history")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}
