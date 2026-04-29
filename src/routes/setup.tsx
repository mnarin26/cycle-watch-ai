import { createFileRoute } from "@tanstack/react-router";
import { Camera, CheckCircle2, Move, Plus, ScanLine, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/machine-monitor/metric-card";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Makine Tanıtımı — ROI Ayarı" },
      { name: "description", content: "Büyük reflektör ve 5x5 cm reflektör ile otomatik ROI tanıtım ekranı." },
      { property: "og:title", content: "Makine Tanıtımı — ROI Ayarı" },
      { property: "og:description", content: "IP kamera görüntüsü üzerinde otomatik ROI önerisi ve kullanıcı düzeltmesi." },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const [roi, setRoi] = useState({ x: 22, y: 18, width: 52, height: 58 });
  const [saved, setSaved] = useState(false);
  const reflector = useMemo(() => ({ x: roi.x + roi.width / 2 - 2.5, y: roi.y + roi.height / 2 - 2.5 }), [roi]);

  function adjust(field: keyof typeof roi, amount: number) {
    setSaved(false);
    setRoi((current) => {
      const next = { ...current, [field]: current[field] + amount };
      next.x = Math.max(4, Math.min(80, next.x));
      next.y = Math.max(4, Math.min(78, next.y));
      next.width = Math.max(20, Math.min(72, next.width));
      next.height = Math.max(20, Math.min(72, next.height));
      return next;
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-lg border bg-panel p-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          <ScanLine className="h-3.5 w-3.5" /> Otomatik bul + kullanıcı düzeltmesi
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-normal">Makine tanıtımı</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Demo kamera görüntüsünde büyük reflektör alanı ROI olarak önerilir; kutu ayarlarıyla ince düzeltme yapılır.
        </p>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Kamera tanıtım alanı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-camera-feed">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="absolute left-[8%] top-[12%] h-[18%] w-[18%] rounded-md border border-muted-foreground/20 bg-muted/40" />
              <div className="absolute bottom-[10%] right-[7%] h-[22%] w-[24%] rounded-md border border-muted-foreground/20 bg-muted/30" />

              <div
                className="absolute border-2 border-roi bg-roi/10 shadow-[0_0_0_999px_color-mix(in_oklab,var(--background)_58%,transparent)]"
                style={{ left: `${roi.x}%`, top: `${roi.y}%`, width: `${roi.width}%`, height: `${roi.height}%` }}
              >
                <div className="absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-status-mold bg-background/70" />
                <div
                  className="absolute h-[5%] w-[5%] rounded-sm border border-primary bg-primary shadow-[0_0_18px_var(--primary)]"
                  style={{ left: `${((reflector.x - roi.x) / roi.width) * 100}%`, top: `${((reflector.y - roi.y) / roi.height) * 100}%` }}
                />
                <span className="absolute -top-7 left-0 rounded bg-roi px-2 py-1 text-xs font-bold text-primary-foreground">ROI önerisi</span>
              </div>

              <div className="absolute left-3 top-3 rounded-md bg-background/80 px-3 py-2 text-xs font-semibold backdrop-blur">
                Büyük reflektör bulundu • 5x5 reflektör merkezde
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> ROI düzeltme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                ["x", "Sol"],
                ["y", "Üst"],
                ["width", "Genişlik"],
                ["height", "Yükseklik"],
              ] as const).map(([field, label]) => (
                <div key={field} className="rounded-md border bg-muted p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold">{label}</span>
                    <span className="text-muted-foreground">%{Math.round(roi[field])}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => adjust(field, -2)}>-</Button>
                    <Button variant="outline" size="sm" onClick={() => adjust(field, 2)}>+</Button>
                  </div>
                </div>
              ))}
              <Button className="w-full" onClick={() => setSaved(true)}><Plus className="h-4 w-4" /> Makineyi demo analizlere ekle</Button>
              {saved ? <p className="text-sm font-semibold text-status-running"><CheckCircle2 className="mr-1 inline h-4 w-4" /> ROI kaydedildi, yeni makine dashboard akışına hazır.</p> : null}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard label="Tanıtım yöntemi" value="Otomatik" detail="Büyük reflektör ROI, küçük reflektör merkez doğrulama" icon={<Move className="h-5 w-5" />} />
            <MetricCard label="Analiz alanı" value={`${Math.round(roi.width)} × ${Math.round(roi.height)}%`} detail="Hareket algılama yalnızca ROI içinde yapılır" />
          </div>
        </div>
      </section>
    </div>
  );
}
