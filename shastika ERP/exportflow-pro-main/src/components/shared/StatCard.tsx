import { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon,
  hint,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive?: boolean };
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="erp-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              delta.positive ? "text-success" : "text-destructive"
            )}
          >
            {delta.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
