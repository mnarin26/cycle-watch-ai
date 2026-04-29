import { Activity, AlertTriangle, Clock, RefreshCcw } from "lucide-react";
import type { ComponentType } from "react";
import type { MachineStatus } from "@/lib/machine-simulation";
import { cn } from "@/lib/utils";

const iconMap = {
  running: Activity,
  idle: Clock,
  fault: AlertTriangle,
  "mold-change": RefreshCcw,
} satisfies Record<MachineStatus, ComponentType<{ className?: string }>>;

const toneMap = {
  running: "border-status-running/30 bg-status-running/10 text-status-running",
  idle: "border-status-idle/30 bg-status-idle/10 text-status-idle",
  fault: "border-status-fault/30 bg-status-fault/10 text-status-fault",
  "mold-change": "border-status-mold/30 bg-status-mold/10 text-status-mold",
} satisfies Record<MachineStatus, string>;

export function StatusPill({ status, label, className }: { status: MachineStatus; label: string; className?: string }) {
  const Icon = iconMap[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", toneMap[status], className)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
