import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ArrowLeft, Camera, CheckCircle2, Clock, Gauge, Sparkles, TimerReset } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/machine-monitor/metric-card";
import { StatusPill } from "@/components/machine-monitor/status-pill";
import { useSimulationTick } from "@/components/machine-monitor/use-simulation-tick";
import { formatSeconds, getMachineById, type PeriodKey } from "@/lib/machine-simulation";

export const Route = createFileRoute("/machines/$machineId")({
  head: () => ({
    meta: [
      { title: "Makine Detayı — Çevrim ve Duruş" },
      { name: "description", content: "Seçilen makine için çevrim trendi, çalışma oranı, duruş ve kalıp değişimi detayları." },
      { property: "og:title", content: "Makine Detayı — Çevrim ve Duruş" },
      { property: "og:description", content: "Makine bazında reflektör hareket analizi ve periyot özetleri." },
    ],
  }),
  component: MachineDetail,
  notFoundComponent: () => <div className="p-6">Makine bulunamadı.</div>,
});

const periodLabels: Record<PeriodKey, string> = {
  day: "Günlük",
  week: "Haftalık",
  month: "Aylık",
  year: "Yıllık",
};

function MachineDetail() {
  const { machineId } = Route.useParams();
  const tick = useSimulationTick();
  const machine = getMachineById(machineId, tick);

  if (!machine) throw notFound();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-lg border bg-panel p-5 shadow-sm">
        <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal">{machine.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Aktif kalıp: {machine.mold}</p>
          </div>
          <StatusPill status={machine.status} label={machine.statusLabel} className="w-fit" />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Son çevrim" value={formatSeconds(machine.cycleSeconds)} detail={`Hedef: ${formatSeconds(machine.targetCycleSeconds)}`} icon={<TimerReset className="h-5 w-5" />} />
        <MetricCard label="Ortalama çevrim" value={formatSeconds(machine.avgCycleSeconds)} detail="Son vardiya ortalaması" icon={<Gauge className="h-5 w-5" />} />
        <MetricCard label="Son örnek" value={`${machine.lastSampleSecondsAgo} sn`} detail={machine.reflectorDetected ? "Reflektör algılandı" : "Reflektör bekleniyor"} icon={<Camera className="h-5 w-5" />} />
        <MetricCard label="Kalıp tahmini" value={machine.suggestedMold.mold} detail={`%${machine.suggestedMold.confidence} eşleşme`} icon={<Sparkles className="h-5 w-5" />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Çevrim süresi trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ seconds: { label: "Çevrim", color: "var(--chart-1)" }, target: { label: "Hedef", color: "var(--chart-2)" } }} className="h-72 w-full">
              <LineChart data={machine.cycleTrend} margin={{ left: -16, right: 16, top: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={38} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="seconds" stroke="var(--color-seconds)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="target" stroke="var(--color-target)" strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Otomatik olay kayıtları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {machine.stops.map((event) => (
              <div key={event.id} className="rounded-md border bg-muted p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{event.type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{event.durationMin} dk</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Başlangıç: {event.start}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Geçmiş kalıp önerileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {machine.moldHistory.map((run) => (
              <div key={run.mold} className="rounded-md border bg-muted p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{run.mold}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Son çalışma: {run.lastSeen} • Ortalama kalıp değişimi {run.changeoverMin} dk</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">%{run.confidence}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Kalıp bazında performans</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ cycles: { label: "Çevrim", color: "var(--chart-4)" } }} className="h-72 w-full">
              <BarChart data={machine.moldSummary.day} margin={{ left: -16, right: 16, top: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mold" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={42} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cycles" fill="var(--color-cycles)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Çalışma özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="day">
            <TabsList className="grid w-full grid-cols-4 md:w-fit">
              {(Object.keys(periodLabels) as PeriodKey[]).map((period) => (
                <TabsTrigger key={period} value={period}>{periodLabels[period]}</TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(periodLabels) as PeriodKey[]).map((period) => {
              const summary = machine.summary[period];
              const chartData = [
                { label: "Çalışma", value: summary.uptime },
                { label: "Duruş", value: Math.max(0, 100 - summary.uptime) },
              ];
              return (
                <TabsContent key={period} value={period} className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <MetricCard label="Çalışma" value={`%${summary.uptime}`} />
                    <MetricCard label="Çevrim" value={summary.cycles.toLocaleString("tr-TR")} />
                    <MetricCard label="Ortalama" value={formatSeconds(summary.avgCycle)} />
                  </div>
                  <ChartContainer config={{ value: { label: "Oran", color: "var(--chart-3)" } }} className="h-56 w-full">
                    <AreaChart data={chartData} margin={{ left: 0, right: 16, top: 16, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={34} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Area dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
        <CheckCircle2 className="mr-2 inline h-4 w-4 text-status-running" /> Yeni kalıp çevrim paterni başladığında önceki uzun duruş otomatik olarak kalıp değişimi kabul edilir.
      </div>
    </div>
  );
}
