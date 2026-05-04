import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { getEmployeeProductivityData, formatResponseTime, type EmployeeProductivityRow } from "@/lib/employeeProductivity";

function buildDisplayRows(rows: EmployeeProductivityRow[]) {
  return rows.slice(0, 6).map((r) => ({
    id: r.id,
    name: r.profile?.full_name || "Unknown",
    role: r.role,
    department: r.department,
    status: r.active ? "Active" : "Inactive",
    score: r.productivity_score,
  }));
}

function formatAverageAttendance(rows: EmployeeProductivityRow[]) {
  if (rows.length === 0) return "0%";
  const avg = rows.reduce((sum, row) => sum + row.attendance_pct, 0) / rows.length;
  return `${avg.toFixed(1)}%`;
}

function formatAverageResponse(rows: EmployeeProductivityRow[]) {
  if (rows.length === 0) return "0m";
  const avg = Math.round(rows.reduce((sum, row) => sum + row.avg_response_minutes, 0) / rows.length);
  return formatResponseTime(avg);
}

export default function EmployeeProductivity() {
  const { data, isLoading } = useQuery({
    queryKey: ["employee_productivity"],
    queryFn: getEmployeeProductivityData,
  });

  const rows = data ?? [];
  const activeEmployees = rows.filter((row) => row.active).length;
  const tasksCompleted = rows.reduce((sum, row) => sum + row.tasks_completed, 0);
  const avgAttendance = formatAverageAttendance(rows);
  const avgResponse = formatAverageResponse(rows);
  const performers = buildDisplayRows(rows);

  return (
    <div>
      <PageHeader title="Employee Productivity" description="Activity, attendance and performance" breadcrumbs={[{ label: "Dashboards" }, { label: "Employees" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Employees" value={`${activeEmployees}`} />
        <StatCard label="Avg Attendance" value={avgAttendance} />
        <StatCard label="Tasks Completed" value={`${tasksCompleted}`} />
        <StatCard label="Avg Response" value={avgResponse} />
      </div>
      <Section title="Top Performers">
        {isLoading ? (
          <div className="erp-card flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : performers.length === 0 ? (
          <EmptyState
            title="No productivity data yet"
            description="Employee productivity metrics will appear here once data is available in Supabase."
          />
        ) : (
          <DataTable
            data={performers}
            searchKeys={["name", "role", "department"]}
            columns={[
              {
                key: "name",
                header: "Employee",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary-muted text-primary flex items-center justify-center text-xs font-semibold">
                      {r.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </div>
                ),
              },
              { key: "role", header: "Role", render: (r) => <span className="text-sm">{r.role}</span> },
              { key: "department", header: "Department", render: (r) => <span className="text-sm text-muted-foreground">{r.department}</span> },
              { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        )}
      </Section>
    </div>
  );
}
