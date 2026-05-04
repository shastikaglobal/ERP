import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { activityLogs } from "@/data/mock";

export default function ActivityLogs() {
  return (
    <div>
      <PageHeader title="Activity Logs" description="Full audit trail of system actions" breadcrumbs={[{ label: "System" }, { label: "Logs" }]} />
      <DataTable
        data={activityLogs}
        searchKeys={["actor", "action"]}
        columns={[
          { key: "time", header: "Time", render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.time}</span> },
          { key: "actor", header: "Actor", render: (r) => <span className="font-medium">{r.actor}</span> },
          { key: "entity", header: "Entity", render: (r) => <span className="text-xs uppercase tracking-wider text-muted-foreground">{r.entity}</span> },
          { key: "action", header: "Action", render: (r) => <span className="text-sm">{r.action}</span> },
        ]}
      />
    </div>
  );
}
