import { createFileRoute } from "@tanstack/react-router";
import { Camera, Database, Gauge, Info, RadioTower, Router, Server, Wifi } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  NETWORK_TEST_MODE_LABELS,
  type NetworkTestMode,
  useNetworkTestMode,
} from "@/lib/network-test-mode";

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
  const [networkMode, setNetworkMode] = useNetworkTestMode();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-lg border bg-panel p-5 shadow-sm">
        <h1 className="text-3xl font-bold tracking-normal">Ayarlar</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Otomatik eşikler ve Raspberry Pi üretim sürümüne hazırlık parametreleri.</p>
      </header>

      <Card className="rounded-lg border-primary/20 bg-panel">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Ağ test modu (geliştirme)</CardTitle>
              <CardDescription className="mt-1.5">
                Gerçek cihazda hostapd / NetworkManager ile eşleşecek senaryoyu tarayıcıda işaretleyin. Seçim bu cihazda{" "}
                <span className="font-medium text-foreground">tarayıcı hafızasına</span> kaydedilir; Pi’ye otomatik komut
                gönderilmez.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            className="grid gap-4 sm:grid-cols-2"
            value={networkMode}
            onValueChange={(v: string) => setNetworkMode(v as NetworkTestMode)}
          >
            <label
              htmlFor="mode-sta"
              className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem id="mode-sta" value="sta" />
                <Router className="h-5 w-5 text-muted-foreground" aria-hidden />
                <span className="font-semibold">{NETWORK_TEST_MODE_LABELS.sta.title}</span>
              </div>
              <p className="pl-7 text-sm text-muted-foreground">
                Pi, modem/router ağına istemci olarak bağlı; telefon veya PC ile aynı yerel ağdasınız. Arayüze{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">http://&lt;Pi-LAN-IP&gt;:5173</code> ile
                girersiniz.
              </p>
            </label>
            <label
              htmlFor="mode-ap"
              className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem id="mode-ap" value="ap" />
                <RadioTower className="h-5 w-5 text-muted-foreground" aria-hidden />
                <span className="font-semibold">{NETWORK_TEST_MODE_LABELS.ap.title}</span>
              </div>
              <p className="pl-7 text-sm text-muted-foreground">
                Modem yok; Pi kendi SSID’sini yayınlar. Cihaz WiFi’sinden bu ağa bağlanıp genelde{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">http://192.168.4.1:5173</code> (veya Pi’nin AP
                IP’si) ile panele girersiniz.
              </p>
            </label>
          </RadioGroup>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Neden burada?</AlertTitle>
            <AlertDescription>
              Üretim yazılımı bu tercihi API ile okuyup ilk kurulum sihirbazını veya firewall kurallarını yönlendirecek.
              Şimdilik yalnızca arayüzde hangi test senaryosunda olduğunuzu gösterir; kenar çubuğunda da kısa etiket
              görünür.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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
