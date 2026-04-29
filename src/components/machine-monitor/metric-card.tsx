import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, detail, icon, className }: { label: string; value: string; detail?: string; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold leading-none text-foreground">{value}</p>
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </div>
      {detail ? <p className="mt-3 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
