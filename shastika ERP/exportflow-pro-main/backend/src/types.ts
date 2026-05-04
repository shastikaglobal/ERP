export type EmployeeProductivityInput = {
  company_id: string;
  profile_id: string;
  active: boolean;
  role: string;
  department: string;
  attendance_pct: number;
  tasks_completed: number;
  avg_response_minutes: number;
  productivity_score: number;
  performance_label: string;
};

export type EmployeeProductivityMetric = EmployeeProductivityInput & {
  id: string;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    requested_role: string | null;
  };
};

export type EmployeeAttendanceInput = {
  company_id: string;
  profile_id: string;
  date: string;
  status: "present" | "absent" | "late" | "remote";
  notes?: string | null;
};

export type EmployeeAttendanceRecord = EmployeeAttendanceInput & {
  id: string;
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

export type EmployeeTaskRecord = EmployeeTaskInput & {
  id: string;
  completed: boolean;
  points: number;
  created_at: string;
  updated_at: string;
};
