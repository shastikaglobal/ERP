import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ActivityLog {
  id: string;
  company_id: string;
  actor_id: string | null;
  actor_name: string;
  entity: string;
  action: string;
  created_at: string;
}

const getEntityBadge = (entity: string) => {
  const styles: Record<string, string> = {
    QUOTATION: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10",
    LEAD: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
    INVOICE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10",
    SHIPMENT: "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/10",
    PO: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/10",
    CRM_ACTIVITY: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10",
  };

  const style = styles[entity.toUpperCase()] || "bg-muted text-muted-foreground border-transparent";
  const displayName = entity === "CRM_ACTIVITY" ? "CRM Task" : entity;
  return (
    <Badge variant="outline" className={`font-mono text-[10px] font-bold uppercase ${style}`}>
      {displayName}
    </Badge>
  );
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const channelId = `activity-logs-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_logs" },
        () => fetchLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <PageHeader 
        title="Activity Logs" 
        description="Full audit trail of system actions" 
        breadcrumbs={[{ label: "System" }, { label: "Logs" }]} 
      />
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          data={logs}
          searchKeys={["actor_name", "action", "entity"]}
          columns={[
            { 
              key: "created_at", 
              header: "Time", 
              render: (r) => <span className="text-xs font-mono text-muted-foreground">{format(new Date(r.created_at), "PPp")}</span> 
            },
            { 
              key: "actor_name", 
              header: "Actor", 
              render: (r) => <span className="font-medium text-foreground">{r.actor_name}</span> 
            },
            { 
              key: "entity", 
              header: "Entity", 
              render: (r) => getEntityBadge(r.entity) 
            },
            { 
              key: "action", 
              header: "Action", 
              render: (r) => <span className="text-sm text-muted-foreground">{r.action}</span> 
            },
          ]}
        />
      )}
    </div>
  );
}

