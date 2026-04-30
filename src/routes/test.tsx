import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, PlayCircle, RotateCcw, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  computeReliability,
  makeInitialState,
  runScript,
  type DecisionTag,
  type TestState,
} from "@/lib/test-simulator";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Filtre Testi - Reflektör İzleme" },
      {
        name: "description",
        content: "Script tabanlı senaryolarla çevrim, kesinti ve telafi mantığını test et.",
      },
    ],
  }),
  component: TestPage,
});

const decisionTone: Record<DecisionTag, string> = {
  counted: "border-status-running/30 bg-status-running/10 text-status-running",
  stop: "border-status-fault/30 bg-status-fault/10 text-status-fault",
  "ignored-noise": "border-muted-foreground/30 bg-muted text-muted-foreground",
  "lost-start": "border-status-fault/30 bg-status-fault/10 text-status-fault",
  recovered: "border-status-mold/30 bg-status-mold/10 text-status-mold",
  compensated: "border-status-running/30 bg-status-running/10 text-status-running",
  rejected: "border-status-fault/30 bg-status-fault/10 text-status-fault",
  "untrusted-mold": "border-status-fault/30 bg-status-fault/10 text-status-fault",
};

const SCENARIOS: Record<string, { label: string; script: string }> = {
  normal: {
    label: "Senaryo 1: Normal çalışma + kuş geçişi",
    script: `mold Kapak A-12 4.0 5.5
cycles 5 4.5-5.0
noise 0.3
cycle 5.1
cycle 4.7
cycle 4.9`,
  },
  shortLoss: {
    label: "Senaryo 2: Kısa kalıp + kayıp (telafi reddedilmeli)",
    script: `mold Klip C 4.0 5.5
cycles 3 4.5-5.0
lost 180
cycles 10 4.5-5.0
compensate`,
  },
  longLoss: {
    label: "Senaryo 3: Uzun kalıp + kayıp (telafi yapılmalı)",
    script: `mold Tapa D 9.0 10.0
cycles 3 9.2-9.8
lost 47
cycle 9.5
cycle 9.4
cycle 9.6
cycle 9.5
cycle 9.5
compensate`,
  },
  badPattern: {
    label: "Senaryo 4: Kayıp sonrası anormal çevrim",
    script: `mold Tapa D 9.0 10.0
cycles 2 9.4-9.6
lost 30
cycle 14.0
cycle 8.0
cycle 9.5
compensate`,
  },
  inCycleNoise: {
    label: "Senaryo 5: Çevrim içi engel (yutulur)",
    script: `mold Kapak 4.0 5.5
cycle 4.8
# 4.5 sn'lik bir çevrimin ortasında kuş geçer:
noise 0.4
cycle 4.5
cycle 5.0`,
  },
};

function TestPage() {
  const [state, setState] = useState<TestState>(() => makeInitialState());
  const [script, setScript] = useState<string>(SCENARIOS.normal.script);
  const [errors, setErrors] = useState<string[]>([]);

  const reliability = useMemo(
    () => computeReliability(state.minCycleSeconds, state.maxCycleSeconds),
    [state.minCycleSeconds, state.maxCycleSeconds],
  );

  const run = () => {
    const fresh = {
      ...makeInitialState(),
      moldName: state.moldName,
      minCycleSeconds: state.minCycleSeconds,
      maxCycleSeconds: state.maxCycleSeconds,
    };
    const result = runScript(fresh, script);
    setState(result.state);
    setErrors(result.errors);
  };

  const reset = () => {
    setState(makeInitialState());
    setErrors([]);
  };

  const loadScenario = (key: string) => {
    setScript(SCENARIOS[key].script);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-lg border bg-panel p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard'a dön
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
            Filtre testi (script tabanlı)
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Senaryoyu yaz, çalıştır, sistemin her olaya nasıl tepki verdiğini gör.
          </p>
        </div>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Sıfırla
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kalıp parametreleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="moldName" className="text-xs">Kalıp adı</Label>
                  <Input
                    id="moldName"
                    value={state.moldName}
                    onChange={(e) => setState((s) => ({ ...s, moldName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="min" className="text-xs">Min (sn)</Label>
                  <Input
                    id="min"
                    type="number"
                    step="0.1"
                    value={state.minCycleSeconds}
                    onChange={(e) => setState((s) => ({ ...s, minCycleSeconds: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="max" className="text-xs">Max (sn)</Label>
                  <Input
                    id="max"
                    type="number"
                    step="0.1"
                    value={state.maxCycleSeconds}
                    onChange={(e) => setState((s) => ({ ...s, maxCycleSeconds: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="rounded-md border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Kalıp güvenilirliği</span>
                  <Badge
                    variant="outline"
                    className={
                      reliability.score >= 75
                        ? "border-status-running/30 bg-status-running/10 text-status-running"
                        : reliability.score >= 50
                          ? "border-status-mold/30 bg-status-mold/10 text-status-mold"
                          : "border-status-fault/30 bg-status-fault/10 text-status-fault"
                    }
                  >
                    {reliability.label} · %{reliability.score}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{reliability.reason}</p>
                <p className="mt-1 text-xs">
                  <span className="text-muted-foreground">Telafi için izin verilen kayıp döngü: </span>
                  <span className="font-semibold text-foreground">
                    {reliability.canCompensate ? `${reliability.allowedMissedCycles} çevrim` : "telafi devre dışı"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCode className="h-4 w-4" /> Senaryo scripti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(SCENARIOS).map(([key, s]) => (
                  <Button key={key} size="sm" variant="secondary" onClick={() => loadScenario(key)}>
                    {s.label}
                  </Button>
                ))}
              </div>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
              <div className="flex items-center gap-2">
                <Button onClick={run} className="gap-2">
                  <PlayCircle className="h-4 w-4" /> Çalıştır
                </Button>
                <p className="text-xs text-muted-foreground">
                  Komutlar: <code>cycle 5</code>, <code>cycles 10 4.8-5.2</code>, <code>noise 0.3</code>,{" "}
                  <code>lost 30</code>, <code>compensate</code>, <code>wait 5</code>, <code>mold ad min max</code>
                </p>
              </div>
              {errors.length > 0 && (
                <div className="rounded-md border border-status-fault/30 bg-status-fault/10 p-2 text-xs text-status-fault">
                  {errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sonuç</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Stat label="Simülasyon zamanı" value={`${state.nowSec.toFixed(1)} sn`} />
              <Stat
                label="Reflektör"
                value={state.reflectorVisible ? "Görünüyor" : "Kayıp"}
                tone={state.reflectorVisible ? "success" : "danger"}
              />
              <Stat label="Sayılan çevrim" value={String(state.countedCycles)} tone="success" />
              <Stat label="Telafi edilen" value={`+${state.compensatedCycles}`} tone="success" />
              <Stat label="Duruş sayısı" value={String(state.stopCount)} tone="danger" />
              <Stat label="Yutulan kesinti" value={String(state.ignoredNoiseCount)} />
              {state.lostDurationSec > 0 && (
                <Stat label="Bekleyen kayıp" value={`${state.lostDurationSec.toFixed(1)} sn`} tone="warning" />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Olay günlüğü (en yeni üstte)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[80vh] overflow-y-auto">
            {state.log.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz çalıştırılmadı. Sol taraftan bir senaryo seç ve "Çalıştır"a bas.
              </p>
            ) : (
              <ul className="space-y-2">
                {state.log.map((entry) => (
                  <li key={entry.id} className="rounded-md border bg-card p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={decisionTone[entry.decision]}>
                        {entry.decisionLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">t = {entry.timeSec} sn</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{entry.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />
      <div className="rounded-lg border bg-panel p-5 text-sm text-muted-foreground">
        <h2 className="mb-2 text-base font-semibold text-foreground">Mantık özeti</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Frame-to-frame ölçüm:</b> Hareket başı–biti arasındaki süre = çevrim. Aralıkta ise normal, dışında ise duruş.</li>
          <li><b>Çevrim içi kesinti:</b> Kuş/insan gibi kısa engeller çevrim süresinin içinde yutulur — ayrı duruş açılmaz.</li>
          <li><b>Uzun kayıp:</b> <code>kayıp süresi + sonraki N çevrim toplamı</code> ∈ <code>[(missed+N)×min, (missed+N)×max]</code> ise telafi yapılır.</li>
          <li><b>Güvenilirlik:</b> Min-Max yayılımı dar ve ortalama uzunsa skor yüksek → daha çok kayıp döngü telafi edilebilir. Düşükse telafi devre dışı.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "success" | "warning" | "danger" | "neutral" }) {
  const toneCls =
    tone === "success" ? "text-status-running"
      : tone === "warning" ? "text-status-mold"
        : tone === "danger" ? "text-status-fault"
          : "text-foreground";
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold ${toneCls}`}>{value}</p>
    </div>
  );
}
