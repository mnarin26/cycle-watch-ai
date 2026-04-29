import { Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowRight, Clock, Gauge, Sparkles, TimerReset } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { Machine } from "@/lib/machine-simulation";
import { formatSeconds } from "@/lib/machine-simulation";
import { StatusPill } from "./status-pill";

export function MachineCard({ machine }: { machine: Machine }) {
  return (
    <Card className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{machine.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Kalıp: {machine.mold}</p>
          </div>
          <StatusPill status={machine.status} label={machine.statusLabel} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-2 text-muted-foreground"><TimerReset className="h-4 w-4" /> Son çevrim</div>
            <p className="mt-1 font-bold">{formatSeconds(machine.cycleSeconds)}</p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-2 text-muted-foreground"><Gauge className="h-4 w-4" /> Çalışma</div>
            <p className="mt-1 font-bold">%{machine.uptime}</p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Son duruş</div>
            <p className="mt-1 font-bold">{machine.lastStopMin} dk</p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Çevrim adedi</div>
            <p className="mt-1 font-bold">{machine.cyclesToday.toLocaleString("tr-TR")}</p>
          </div>
        </div>

        <div className="rounded-md border bg-muted p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Sparkles className="h-4 w-4" /> Kalıp önerisi</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-bold">{machine.suggestedMold.mold}</p>
            <span className="text-xs font-semibold text-muted-foreground">%{machine.suggestedMold.confidence}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Son çalışma: {machine.suggestedMold.lastSeen}</p>
        </div>

        <ChartContainer
          config={{ seconds: { label: "Çevrim", color: "var(--chart-1)" } }}
          className="h-28 w-full"
        >
          <AreaChart data={machine.cycleTrend} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} hide />
            <YAxis tickLine={false} axisLine={false} width={30} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Area type="monotone" dataKey="seconds" stroke="var(--color-seconds)" fill="var(--color-seconds)" fillOpacity={0.18} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>

        <Link
          to="/machines/$machineId"
          params={{ machineId: machine.id }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Detayları gör <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
