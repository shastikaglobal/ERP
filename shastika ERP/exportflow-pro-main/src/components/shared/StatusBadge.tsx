import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "destructive" | "info" | "muted" | "primary";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info-muted text-info",
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary-muted text-primary",
};

const statusMap: Record<string, Tone> = {
  // Generic
  active: "success", paid: "success", completed: "success", delivered: "success", approved: "success", "in stock": "success",
  pending: "warning", processing: "warning", "in transit": "warning", "in review": "warning", draft: "muted", warm: "warning",
  cancelled: "destructive", overdue: "destructive", rejected: "destructive", failed: "destructive", "out of stock": "destructive", lost: "destructive",
  hot: "destructive",
  new: "info", shipped: "info", "low stock": "warning",
  cold: "muted", inactive: "muted", closed: "muted",
};

export function StatusBadge({ status, tone, label }: { status: string; tone?: Tone; label?: string }) {
  const t = tone ?? statusMap[status.toLowerCase()] ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
        toneClasses[t]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t === "success" ? "bg-success" : t === "warning" ? "bg-warning" : t === "destructive" ? "bg-destructive" : t === "info" ? "bg-info" : t === "primary" ? "bg-primary" : "bg-muted-foreground")} />
      {label ?? status}
    </span>
  );
}
