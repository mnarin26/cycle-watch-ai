import { createFileRoute } from "@tanstack/react-router";
import { Activity, Camera, Factory, RefreshCw } from "lucide-react";
import { MachineCard } from "@/components/machine-monitor/machine-card";
import { MetricCard } from "@/components/machine-monitor/metric-card";
import { useSimulationTick } from "@/components/machine-monitor/use-simulation-tick";
import { getSimulatedMachines } from "@/lib/machine-simulation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Makine Çalışma Dashboardu" },
      { name: "description", content: "Reflektör hareketinden makine çalışma, çevrim ve duruş izleme demo dashboardu." },
      { property: "og:title", content: "Makine Çalışma Dashboardu" },
      { property: "og:description", content: "RPi ve IP kamera için simülasyon tabanlı makine izleme arayüzü." },
    ],
  }),
  component: Index,
});

function Index() {
  const tick = useSimulationTick();
  const machines = getSimulatedMachines(tick);
  const running = machines.filter((machine) => machine.status === "running").length;
  const uptime = machines.reduce((sum, machine) => sum + machine.uptime, 0) / machines.length;
  const cycles = machines.reduce((sum, machine) => sum + machine.cyclesToday, 0);
  const stops = machines.reduce((sum, machine) => sum + machine.stops.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-lg border bg-panel p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Camera className="h-3.5 w-3.5" /> 0.5 sn örnekleme simülasyonu
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">Makine çalışma dashboardu</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Reflektör ROI takibi, çevrim süresi, duruş ve kalıp değişimi kararları için demo kontrol paneli.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Veriler periyodik yenileniyor
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tanımlı makine" value={String(machines.length)} detail={`${running} makine çalışıyor`} icon={<Factory className="h-5 w-5" />} />
        <MetricCard label="Ortalama çalışma" value={`%${uptime.toFixed(1)}`} detail="Günlük vardiya görünümü" icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Toplam çevrim" value={cycles.toLocaleString("tr-TR")} detail="Bugünkü simülasyon adedi" />
        <MetricCard label="Olay kaydı" value={String(stops)} detail="Duruş ve kalıp değişimi" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {machines.map((machine) => (
          <MachineCard key={machine.id} machine={machine} />
        ))}
      </section>
    </div>
  );
}
