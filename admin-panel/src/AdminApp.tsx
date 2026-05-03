import { useState } from "react";
import {
  ArrowLeftRight,
  Cable,
  Factory,
  KeyRound,
  Network,
  Settings2,
  Shield,
  Gauge,
  HardDriveDownload,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NETWORK_TEST_MODE_LABELS,
  getNetworkTestMode,
  type NetworkTestMode,
  setNetworkTestMode,
} from "@/lib/network-test-mode";
import { useApAnalysisUrl, type ApAnalysisPayload } from "@admin/useApAnalysisUrl";

const navSections: { id: AdminSectionId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Özet", icon: Gauge },
  { id: "network", label: "Ağ", icon: Network },
  { id: "services", label: "Servisler", icon: HardDriveDownload },
  { id: "bridge", icon: ArrowLeftRight, label: "Mod & köprü" },
];

export type AdminSectionId = "overview" | "network" | "services" | "bridge";

export default function AdminApp() {
  const [section, setSection] = useState<AdminSectionId>("overview");
  const [netMode, setNetModeState] = useState<NetworkTestMode>(() =>
    typeof window !== "undefined" ? getNetworkTestMode() : "sta",
  );
  const analysis = useApAnalysisUrl();

  const bindHint = __ADMIN_PANEL_BIND__;
  const portHint = __ADMIN_PANEL_PORT__;
  const apSsid = __CW_AP_SSID__;
  const apPassword = __CW_AP_PASSWORD__;
  const analysisPort = __CW_ANALYSIS_PORT__;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t bg-sidebar/95 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-20 md:border-r md:border-t-0 lg:w-56">
        <div className="hidden h-[4.75rem] items-center gap-3 px-5 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/90 text-destructive-foreground">
            <Shield className="h-5 w-5" aria-hidden />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-bold">Yönetici</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ethernet</p>
          </div>
        </div>
        <nav className="grid h-14 grid-cols-4 px-1 md:h-auto md:grid-cols-1 md:gap-1 md:px-2 lg:gap-2">
          {navSections.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex-row md:justify-start md:gap-2 md:px-3 md:text-xs lg:text-sm",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0 md:h-5" />
                <span className="md:inline lg:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mx-3 mb-4 hidden lg:block lg:rounded-md lg:border lg:border-sidebar-border lg:bg-muted/30 lg:p-2">
          <p className="text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
            Dinleme
          </p>
          <code className="mt-1 block truncate text-[11px] text-foreground">
            {bindHint}:{portHint}
          </code>
          <Cable className="mt-2 h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      </aside>

      <main className="pb-[4.25rem] md:pb-0 md:pl-20 lg:pl-56">
        <header className="border-b bg-panel px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-[11px] font-semibold text-destructive">
              <Shield className="h-3.5 w-3.5" />
              Kablo üzerinden yönetim
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{titleForSection(section)}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Bu panel Vite yapılandırmasında isteğe bağlı olarak{" "}
              <strong className="text-foreground">yalnızca Ethernet adresinde</strong> bağlanır. Wi-Fi IP üzerinden
              bu porta istek yapılmaz (sunucu o arayüzde dinlemez).
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {section === "overview" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard icon={Cable} title="Ethernet hedefi" value={`${bindHint}`} subtitle="ADMIN_BIND_ADDRESS" />
              <MetricCard
                icon={Factory}
                title="Analiz HTTP portu"
                value={`${analysisPort}`}
                subtitle="Özet + kablosuz: bu port sabit yapılandırmalı"
              />
              <OverviewWifiAnalysisCard analysis={analysis} apSsid={apSsid} />
            </div>
          )}
          {section === "network" && (
            <AdminNetwork analysis={analysis} apSsid={apSsid} apPassword={apPassword} analysisPort={analysisPort} />
          )}
          {section === "services" && <PlaceholderCard title="Servisler" body="İleride systemd / API ile canlı durum bağlanır." />}
          {section === "bridge" && (
            <BridgeSection
              mode={netMode}
              setMode={(m) => {
                setNetworkTestMode(m);
                setNetModeState(m);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function titleForSection(s: AdminSectionId) {
  const n = navSections.find((x) => x.id === s);
  return n ? `${n.label} — yönetim` : "Yönetici paneli";
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card className="rounded-lg border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function OverviewWifiAnalysisCard({
  analysis,
  apSsid,
}: {
  analysis: ApAnalysisPayload | null;
  apSsid: string;
}) {
  const urlDisplay = analysis?.url ?? "—";
  const sub =
    analysis?.ok === true
      ? `Tarayıcı: ${analysis.url}`
      : analysis?.hint ?? (analysis === null ? "Adres çekiliyor…" : "Hotspot henüz yok ya da wlan0 IP okunmadı.");

  return (
    <MetricCard
      icon={Wifi}
      title="Kablosuz analiz adresi"
      value={analysis?.ok === true ? urlDisplay : analysis === null ? "…" : "—"}
      subtitle={`SSID ${apSsid} • ${sub}`}
    />
  );
}

function AdminNetwork({
  analysis,
  apSsid,
  apPassword,
  analysisPort,
}: {
  analysis: ApAnalysisPayload | null;
  apSsid: string;
  apPassword: string;
  analysisPort: string;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-primary/25 bg-primary/[0.04]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wifi className="h-5 w-5 text-primary" />
            Pi yayınlı Wi‑Fi — analiz arayüzü adresi
          </CardTitle>
          <CardDescription>
            Telefon/tablet Pi&apos;nin kendi yayına (<strong className="text-foreground">{apSsid}</strong>) bağlandığında
            tarayıcıya yapıştıracağınız adres. Pi üzerinden <code className="rounded bg-muted px-1">wlan0</code> gerçek
            zamanlı okunur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SSID</dt>
              <dd className="mt-1 font-mono text-foreground">{apSsid}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <KeyRound className="h-3 w-3" aria-hidden />
                Parola
              </dt>
              <dd className="mt-1 font-mono text-foreground">{apPassword}</dd>
            </div>
          </dl>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tarayıcı adresi (analiz HTTP {analysisPort})
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="max-w-full break-all rounded-lg border bg-muted px-3 py-2 text-sm font-medium text-foreground">
                {analysis?.url ?? (analysis === null ? "yükleniyor…" : "—")}
              </code>
              {analysis?.url ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => copyToClipboard(analysis!.url!)}>
                  Kopyala
                </Button>
              ) : null}
            </div>
            {!analysis?.ok && analysis?.hint ? (
              <p className="mt-3 text-xs text-muted-foreground">{analysis.hint}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="h-5 w-5" />
            Ethernet yönetimi
          </CardTitle>
          <CardDescription>
            Statik IP ve kablolu erişim burada özetlenir. Gerçek nmcli / DHCP değişiklikleri ileride API veya betiklerle
            bağlanacak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Örnek: Pi <code className="rounded bg-muted px-1">eth-static</code> ile{" "}
            <code className="rounded bg-muted px-1">192.168.50.1/24</code>; PC{" "}
            <code className="rounded bg-muted px-1">192.168.50.2</code>.
          </p>
          <p className="text-xs">
            Güvenlik için üretimde bu paneli{" "}
            <strong className="text-foreground">sadece bu bind adresinde</strong> çalıştırın (
            <code className="text-foreground">npm run dev:admin</code> ve systemd ortamı).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* sessiz — tarayıcı izni yok */
  }
}

function PlaceholderCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
    </Card>
  );
}

function BridgeSection({
  mode,
  setMode,
}: {
  mode: NetworkTestMode;
  setMode: (m: NetworkTestMode) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowLeftRight className="h-5 w-5" />
          Operasyonel mod eşlemesi
        </CardTitle>
        <CardDescription>
          Ana uygulamadaki &quot;ağ test modu&quot; ile aynı localStorage anahtarı; iki arayüz tutarlı bilgi gösterir.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">{NETWORK_TEST_MODE_LABELS[mode].title}</p>
          <p className="text-muted-foreground">Ana dashboard: Yerel/Wi‑Fi kullanıcı trafiği (ör. port 5173).</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant={mode === "sta" ? "default" : "outline"} onClick={() => setMode("sta")}>
            Yerel STA
          </Button>
          <Button type="button" variant={mode === "ap" ? "default" : "outline"} onClick={() => setMode("ap")}>
            Kendi AP
          </Button>
        </div>
      </CardContent>
      <CardContent className="border-t pt-4">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Settings2 className="mt-0.5 h-4 w-4 shrink-0" />
          Gerçek hostapd/AP veya ethernet profili değiştirmek için <code className="mx-1 rounded bg-muted px-1">pi/ap-mode/</code>
          ve NetworkManager kullanın; burası yönetişim yüzüdür.
        </p>
      </CardContent>
    </Card>
  );
}
