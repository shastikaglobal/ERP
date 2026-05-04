import { supabase } from "@/integrations/supabase/client";

export type EmployeeProductivityRow = {
  id: string;
  profile_id: string;
  active: boolean;
  role: string;
  department: string;
  attendance_pct: number;
  tasks_completed: number;
  avg_response_minutes: number;
  productivity_score: number;
  performance_label: string;
  updated_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    requested_role: string | null;
  } | null;
};

export type EmployeeProductivityInput = {
  company_id: string;
  profile_id: string;
  active?: boolean;
  role: string;
  department: string;
  attendance_pct: number;
  tasks_completed: number;
  avg_response_minutes: number;
  productivity_score: number;
  performance_label: string;
};

function isMissingTableError(message: string | null | undefined) {
  if (!message) return false;
  return message.includes("Could not find the table") || message.includes("schema cache") || message.includes("employee_productivity_metrics");
}

export async function getEmployeeProductivityData(): Promise<EmployeeProductivityRow[]> {
  // Use mock data for frontend
  const mockProfiles = [
    { id: "EMP-001", name: "Alice Johnson", role: "Manager", dept: "Sales" },
    { id: "EMP-002", name: "Bob Smith", role: "Developer", dept: "IT" },
    { id: "EMP-003", name: "Charlie Davis", role: "Designer", dept: "Marketing" },
    { id: "EMP-004", name: "Diana Prince", role: "HR Specialist", dept: "HR" },
    { id: "EMP-005", name: "Evan Wright", role: "Support", dept: "Customer Service" }
  ];

  return mockProfiles.map((p, index) => ({
    id: `prod-${p.id}`,
    profile_id: p.id,
    active: true,
    role: p.role,
    department: p.dept,
    attendance_pct: 85 + (index % 15),
    tasks_completed: 120 + (index * 15),
    avg_response_minutes: 15 + (index * 5),
    productivity_score: 80 + (index % 20),
    performance_label: "Good",
    updated_at: new Date().toISOString(),
    profile: {
      full_name: p.name,
      email: `${p.name.split(" ")[0].toLowerCase()}@example.com`,
      phone: "555-0100",
      status: "approved",
      requested_role: p.role,
    },
  })) as EmployeeProductivityRow[];
}

async function getProfilesAsProductivity(): Promise<EmployeeProductivityRow[]> {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, status, requested_role")
    .order("created_at", { ascending: false });

  if (profileError) {
    throw new Error(`Failed to load employee productivity data: ${profileError.message}`);
  }

  return (profiles ?? []).map((profile: any) => ({
    id: profile.id,
    profile_id: profile.id,
    active: profile.status === "approved",
    role: profile.requested_role ?? "—",
    department: "—",
    attendance_pct: 0,
    tasks_completed: 0,
    avg_response_minutes: 0,
    productivity_score: 0,
    performance_label: "New",
    updated_at: new Date().toISOString(),
    profile: {
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      status: profile.status,
      requested_role: profile.requested_role,
    },
  })) as EmployeeProductivityRow[];
}

export async function createEmployeeProductivity(input: EmployeeProductivityInput): Promise<EmployeeProductivityRow> {
  const { data, error } = await supabase
    .from("employee_productivity_metrics")
    .insert(input)
    .select(`
      id,
      company_id,
      profile_id,
      active,
      role,
      department,
      attendance_pct,
      tasks_completed,
      avg_response_minutes,
      productivity_score,
      performance_label,
      created_at,
      updated_at,
      profile:profiles(full_name,email,phone,status,requested_role)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create productivity record: ${error.message}`);
  }

  return data as unknown as EmployeeProductivityRow;
}

export async function updateEmployeeProductivity(
  id: string,
  updates: Partial<EmployeeProductivityInput>
): Promise<EmployeeProductivityRow> {
  const { data, error } = await supabase
    .from("employee_productivity_metrics")
    .update(updates)
    .eq("id", id)
    .select(`
      id,
      company_id,
      profile_id,
      active,
      role,
      department,
      attendance_pct,
      tasks_completed,
      avg_response_minutes,
      productivity_score,
      performance_label,
      created_at,
      updated_at,
      profile:profiles(full_name,email,phone,status,requested_role)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update productivity record: ${error.message}`);
  }

  return data as unknown as EmployeeProductivityRow;
}

export async function deleteEmployeeProductivity(id: string): Promise<void> {
  const { error } = await supabase
    .from("employee_productivity_metrics")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete productivity record: ${error.message}`);
  }
}

export function formatResponseTime(minutes: number) {
  if (!minutes) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }

  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}
