import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2 } from "lucide-react";
import { getEmployeeAttendanceData, type EmployeeAttendanceRecord } from "@/lib/employeeAttendance";

const dateLabels = Array.from({ length: 14 }, (_, i) => i + 1);

function groupAttendanceByProfile(records: EmployeeAttendanceRecord[]) {
  const grouped = new Map<string, { profile_id: string; records: EmployeeAttendanceRecord[] }>();

  for (const record of records) {
    if (!grouped.has(record.profile_id)) {
      grouped.set(record.profile_id, { profile_id: record.profile_id, records: [] });
    }
    grouped.get(record.profile_id)!.records.push(record);
  }

  return Array.from(grouped.values()).map((group) => {
    const attendanceMap = new Map(group.records.map((record) => [record.date, record]));
    const row = dateLabels.map((offset) => {
      const date = new Date();
      date.setDate(date.getDate() - (14 - offset));
      const key = date.toISOString().slice(0, 10);
      return attendanceMap.get(key) ?? null;
    });

    const presentCount = row.filter((record) => record?.status === "present" || record?.status === "remote").length;
    const percentage = row.length > 0 ? Math.round((presentCount / row.length) * 100) : 0;

    return {
      profileId: group.profile_id,
      row,
      percentage,
    };
  });
}

export default function Attendance() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["employee_attendance"],
    queryFn: () => getEmployeeAttendanceData(),
  });

  const groups = useMemo(() => (data ? groupAttendanceByProfile(data) : []), [data]);

  return (
    <div>
      <PageHeader title="Attendance" description="Past 14 days attendance log" breadcrumbs={[{ label: "Employees" }, { label: "Attendance" }]} />
      <Section>
        {isLoading ? (
          <div className="erp-card flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <EmptyState title="Unable to load attendance" description="There was a problem fetching attendance records." />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No attendance records" description="No employee attendance data is available yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs uppercase font-medium text-muted-foreground px-3 py-2">Employee ID</th>
                  {dateLabels.map((offset) => (
                    <th key={offset} className="text-center text-xs font-medium text-muted-foreground px-1 py-2">
                      {offset}
                    </th>
                  ))}
                  <th className="text-right text-xs uppercase font-medium text-muted-foreground px-3 py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.profileId} className="border-b last:border-0 border-border">
                    <td className="px-3 py-2"><div className="text-sm font-medium">{group.profileId}</div></td>
                    {group.row.map((record, index) => (
                      <td key={index} className="text-center px-1 py-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            record?.status === "present" || record?.status === "remote"
                              ? "bg-success"
                              : record?.status === "late"
                              ? "bg-warning"
                              : "bg-destructive/40"
                          }`}
                        />
                      </td>
                    ))}
                    <td className="text-right px-3 py-2 tabular-nums font-medium">{group.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
