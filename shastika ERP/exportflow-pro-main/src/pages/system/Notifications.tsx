import { Bell, AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { notifications } from "@/data/mock";

const iconMap = { info: Info, warning: AlertTriangle, destructive: AlertCircle, success: CheckCircle2 } as const;
const colorMap = { info: "info", warning: "warning", destructive: "destructive", success: "success" } as const;

export default function Notifications() {
  return (
    <div>
      <PageHeader title="Notifications" description="System events and alerts" breadcrumbs={[{ label: "System" }, { label: "Notifications" }]} />
      <Section>
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconMap[n.type as keyof typeof iconMap] ?? Bell;
            const color = colorMap[n.type as keyof typeof colorMap] ?? "info";
            return (
              <div key={n.id} className={`flex items-start gap-3 p-3 border border-border rounded-md ${!n.read ? "bg-muted/30" : ""}`}>
                <div className={`h-9 w-9 rounded-md bg-${color}-muted text-${color} flex items-center justify-center shrink-0`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{n.time}</div>
                </div>
                {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
