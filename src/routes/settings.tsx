import { createFileRoute } from "@tanstack/react-router";
import { Camera, Database, Gauge, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ayarlar — Simülasyon" },
      { name: "description", content: "RPi demo arayüzü için örnekleme, ROI ve otomatik eşik ayarları." },
      { property: "og:title", content: "Ayarlar — Simülasyon" },
      { property: "og:description", content: "Makine izleme demo ayarları ve gerçek entegrasyon notları." },
    ],
  }),
  component: SettingsPage,
});

const settings = [
  { label: "Frame alma aralığı", value: "0.5 sn", detail: "IP kamera görüntüsü canlı akış yerine periyodik alınır.", icon: Camera },
  { label: "Çevrim toleransı", value: "%15", detail: "Hedef çevrimden sapma trend sınıflandırmasına girer.", icon: Gauge },
  { label: "Duruş eşiği", value: "3× çevrim", detail: "Beklenen hareket yoksa duruş adayı üretilir.", icon: Server },
  { label: "Veri modu", value: "Demo", detail: "Bu sürümde kalıcı kamera/veritabanı bağlantısı yoktur.", icon: Database },
];

function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-lg border bg-panel p-5 shadow-sm">
        <h1 className="text-3xl font-bold tracking-normal">Ayarlar</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Otomatik eşikler ve Raspberry Pi üretim sürümüne hazırlık parametreleri.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <Card key={item.label} className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle className="text-base">{item.label}</CardTitle>
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{item.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
