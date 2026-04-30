import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Bird, Eye, EyeOff, PlayCircle, RotateCcw, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  applyEvent,
  makeInitialState,
  type DecisionTag,
  type EventType,
  type TestState,
} from "@/lib/test-simulator";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Filtre Testi - Reflektör İzleme" },
      {
        name: "description",
        content: "Kuş, insan, görüntü kopması ve normal çevrim senaryolarını manuel tetikleyerek filtre davranışını test et.",
      },
    ],
  }),
  component: TestPage,
});

const decisionTone: Record<DecisionTag, string> = {
  counted: "border-status-running/30 bg-status-running/10 text-status-running",
  "ignored-noise": "border-muted-foreground/30 bg-muted text-muted-foreground",
  "lost-start": "border-status-fault/30 bg-status-fault/10 text-status-fault",
  recovered: "border-status-mold/30 bg-status-mold/10 text-status-mold",
  compensated: "border-status-running/30 bg-status-running/10 text-status-running",
  rejected: "border-status-fault/30 bg-status-fault/10 text-status-fault",
};

function TestPage() {
  const [state, setState] = useState<TestState>(() => makeInitialState());
  const [advanceSec, setAdvanceSec] = useState(5);

  const trigger = (event: EventType, customAdvance?: number) => {
    setState((prev) => applyEvent(prev, event, customAdvance ?? advanceSec));
  };

  const reset = () => setState(makeInitialState());

  const updateMold = (patch: Partial<Pick<TestState, "moldName" | "minCycleSeconds" | "maxCycleSeconds">>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const validationProgress = state.pendingValidation.length;
  const inValidation = validationProgress > 0 || (state.pendingMissedSec > 0 && state.reflectorVisible);

  const avgPending = useMemo(() => {
    if (state.pendingValidation.length === 0) return 0;
    return state.pendingValidation.reduce((a, b) => a + b, 0) / state.pendingValidation.length;
  }, [state.pendingValidation]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-lg border bg-panel p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard'a dön
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
            Filtre testi
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Olayları sen tetikle, sistemin nasıl tepki verdiğini gör. Rastgele veri yok - tamamen
            kontrollü.
          </p>
        </div>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Sıfırla
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Sol kolon - Kontroller ve durum */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kalıp parametreleri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="moldName" className="text-xs">Kalıp adı</Label>
                <Input
                  id="moldName"
                  value={state.moldName}
                  onChange={(e) => updateMold({ moldName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="min" className="text-xs">Min çevrim (sn)</Label>
                <Input
                  id="min"
                  type="number"
                  step="0.1"
                  value={state.minCycleSeconds}
                  onChange={(e) => updateMold({ minCycleSeconds: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max" className="text-xs">Max çevrim (sn)</Label>
                <Input
                  id="max"
                  type="number"
                  step="0.1"
                  value={state.maxCycleSeconds}
                  onChange={(e) => updateMold({ maxCycleSeconds: Number(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Olay tetikle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="advance" className="text-xs">
                  Bu olaydan önce geçecek süre (sn)
                </Label>
                <Input
                  id="advance"
                  type="number"
                  step="0.1"
                  value={advanceSec}
                  onChange={(e) => setAdvanceSec(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Örn: normal çevrim için 4-5.5 sn, kopma sonrası dön mek için 600 sn (10 dk).
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={() => trigger("cycle")} className="gap-2 justify-start">
                  <PlayCircle className="h-4 w-4" /> Normal çevrim
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => trigger("bird", 0.3)}
                  className="gap-2 justify-start"
                >
                  <Bird className="h-4 w-4" /> Kuş geçişi (0.3 sn)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => trigger("person", 1.5)}
                  className="gap-2 justify-start"
                >
                  <User className="h-4 w-4" /> İnsan geçişi (1.5 sn)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => trigger("cycle", 2)}
                  className="gap-2 justify-start"
                >
                  <Zap className="h-4 w-4" /> Hızlı titreşim (2 sn)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => trigger("lost")}
                  className="gap-2 justify-start"
                >
                  <EyeOff className="h-4 w-4" /> Reflektör koptu
                </Button>
                <Button
                  variant="default"
                  onClick={() => trigger("recovered")}
                  className="gap-2 justify-start"
                >
                  <Eye className="h-4 w-4" /> Reflektör geri geldi
                </Button>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Hazır senaryo:</p>
                <p>
                  1) Birkaç kez "Normal çevrim" (5 sn) → sayılır
                  <br />
                  2) "Kuş" / "İnsan" → sayılmaz, duruş açmaz
                  <br />
                  3) "Reflektör koptu" → sonraki olaydan önce 600 sn yaz → "Reflektör geri geldi"
                  <br />
                  4) Üst üste 10 normal çevrim (5 sn) → telafi yapılır
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anlık durum</CardTitle>
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
              <Stat label="Filtrelenen gürültü" value={String(state.rejectedNoiseCount)} />
              <Stat
                label="Doğrulama"
                value={inValidation ? `${validationProgress}/10` : "–"}
                tone={inValidation ? "warning" : "neutral"}
              />
              {state.pendingMissedSec > 0 && (
                <Stat
                  label="Bekleyen kayıp süre"
                  value={`${state.pendingMissedSec.toFixed(0)} sn`}
                  tone="warning"
                />
              )}
              {state.pendingValidation.length > 0 && (
                <Stat
                  label="Doğrulama ortalaması"
                  value={`${avgPending.toFixed(2)} sn`}
                  tone={
                    avgPending >= state.minCycleSeconds && avgPending <= state.maxCycleSeconds
                      ? "success"
                      : "warning"
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ kolon - Olay logu */}
        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Olay günlüğü (en yeni üstte)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[70vh] overflow-y-auto">
            {state.log.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz olay yok. Sol taraftan bir buton tıkla.
              </p>
            ) : (
              <ul className="space-y-2">
                {state.log.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-md border bg-card p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={decisionTone[entry.decision]}
                      >
                        {entry.decisionLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        t = {entry.timeSec} sn
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{entry.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const toneCls =
    tone === "success"
      ? "text-status-running"
      : tone === "warning"
        ? "text-status-mold"
        : tone === "danger"
          ? "text-status-fault"
          : "text-foreground";
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold ${toneCls}`}>{value}</p>
    </div>
  );
}
