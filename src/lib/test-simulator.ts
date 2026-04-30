// Deterministik test simülatörü.
// Frame-to-frame mantık: Hareket başlangıcından bir sonraki hareket başlangıcına kadar olan süre = çevrim süresi.
// Tek döngü içindeki kısa kesintiler (kuş, insan) doğal olarak yutulur — sadece çevrim
// süresi ölçülür. Eğer ölçülen çevrim süresi kalıbın min-max aralığındaysa: NORMAL ÇEVRİM.
// Aralık dışındaysa: DURUŞ.
//
// Uzun reflektör kaybı: kopma + sonraki N tam çevrim için toplam süre [N×min, N×max] aralığında
// olmalı. Sadece güvenilir kalıplar için telafi yapılır.

export type EventType =
  | "cycle" // Bir hareket tamamlandı (frame-to-frame). Süre, son olaydan beri geçen süre.
  | "noise" // Kısa süreli ROI engeli (kuş/insan). Tek başına anlamı yok; bir sonraki cycle ölçümünün içine girer.
  | "lost" // Reflektör görüntüsü koptu (uzun süreli)
  | "recovered"; // Reflektör geri geldi

export type DecisionTag =
  | "counted" // Çevrim normal aralıkta - sayıldı
  | "stop" // Çevrim aralık dışında - duruş
  | "ignored-noise" // Kısa kesinti - yok sayıldı
  | "lost-start" // Reflektör koptu, beklemede
  | "recovered" // Geri geldi
  | "compensated" // Kayıp süre telafi edildi
  | "rejected" // Telafi reddedildi
  | "untrusted-mold"; // Kalıp güvenilir değil, telafi yapılamaz

export type LogEntry = {
  id: string;
  timeSec: number;
  event: EventType;
  decision: DecisionTag;
  decisionLabel: string;
  detail: string;
};

export type Reliability = {
  score: number; // 0-100
  label: string; // "Güvenilir", "Orta", "Düşük"
  allowedMissedCycles: number; // telafi için izin verilen max kayıp döngü sayısı
  canCompensate: boolean;
  reason: string;
};

export type TestState = {
  // Kalıp parametreleri
  moldName: string;
  minCycleSeconds: number;
  maxCycleSeconds: number;

  // Simülasyon zamanı
  nowSec: number;

  // Reflektör durumu
  reflectorVisible: boolean;
  lostAtSec: number | null;
  lostDurationSec: number; // bekleyen kayıp süre (geri gelmeden önce yenisi başlarsa birikir)

  // Üretim
  countedCycles: number;
  compensatedCycles: number;
  stopCount: number;
  ignoredNoiseCount: number;
  lastEventAtSec: number; // son cycle/recovered olayının zamanı (frame-to-frame ölçüm referansı)

  log: LogEntry[];
};

export function computeReliability(min: number, max: number): Reliability {
  if (min <= 0 || max <= 0 || max <= min) {
    return {
      score: 0,
      label: "Geçersiz",
      allowedMissedCycles: 0,
      canCompensate: false,
      reason: "Min/Max çevrim süresi geçersiz.",
    };
  }
  const avg = (min + max) / 2;
  const spreadRatio = (max - min) / avg; // ne kadar küçükse o kadar tutarlı
  const consistency = Math.max(0, 1 - spreadRatio / 0.4); // %40 yayılım = 0 puan
  const lengthFactor = Math.min(1, avg / 20); // 20 sn üzeri tam puan
  const score = Math.round(consistency * 70 + lengthFactor * 30);

  // İzin verilen kayıp döngü: güvenilirlik ile orantılı, 0-30 arası
  const allowedMissedCycles = Math.max(0, Math.floor((score / 100) * 30));
  const canCompensate = score >= 40 && allowedMissedCycles >= 3;

  let label = "Düşük";
  if (score >= 75) label = "Yüksek";
  else if (score >= 50) label = "Orta";

  const reason = canCompensate
    ? `Tutarlılık %${Math.round(consistency * 100)}, ortalama ${avg.toFixed(1)} sn. Telafi güvenli.`
    : score < 40
      ? `Min-Max yayılımı çok geniş (%${Math.round(spreadRatio * 100)}). Kayıp süreden çevrim hesaplanamaz.`
      : `Çevrim çok kısa (${avg.toFixed(1)} sn). Kısa kayıplar bile çok çevrime denk gelir, hesap güvenilir değil.`;

  return { score, label, allowedMissedCycles, canCompensate, reason };
}

export function makeInitialState(): TestState {
  return {
    moldName: "Kalıp A",
    minCycleSeconds: 4.0,
    maxCycleSeconds: 5.5,
    nowSec: 0,
    reflectorVisible: true,
    lostAtSec: null,
    lostDurationSec: 0,
    countedCycles: 0,
    compensatedCycles: 0,
    stopCount: 0,
    ignoredNoiseCount: 0,
    lastEventAtSec: 0,
    log: [],
  };
}

let logId = 0;
function pushLog(state: TestState, event: EventType, decision: DecisionTag, decisionLabel: string, detail: string) {
  state.log.unshift({
    id: `l${++logId}`,
    timeSec: Number(state.nowSec.toFixed(2)),
    event,
    decision,
    decisionLabel,
    detail,
  });
  if (state.log.length > 200) state.log.pop();
}

export function applyEvent(prev: TestState, event: EventType, advanceSec: number): TestState {
  const state: TestState = { ...prev, log: [...prev.log] };
  state.nowSec = Number((state.nowSec + advanceSec).toFixed(3));

  switch (event) {
    case "cycle": {
      if (!state.reflectorVisible) {
        // Reflektör kapalı - bu olay yok sayılır (ölçüm yapılamaz)
        pushLog(state, event, "ignored-noise", "Reflektör kapalı", "Reflektör görünmüyorken çevrim ölçülemez.");
        break;
      }
      const cycleDuration = state.nowSec - state.lastEventAtSec;
      const inRange = cycleDuration >= state.minCycleSeconds && cycleDuration <= state.maxCycleSeconds;

      if (inRange) {
        state.countedCycles += 1;
        pushLog(
          state,
          event,
          "counted",
          "Normal çevrim",
          `${cycleDuration.toFixed(2)} sn — kalıp aralığında [${state.minCycleSeconds}-${state.maxCycleSeconds} sn]. Sayıldı.`,
        );
      } else {
        state.stopCount += 1;
        const why =
          cycleDuration < state.minCycleSeconds
            ? `çok hızlı (min ${state.minCycleSeconds} sn altında)`
            : `çok yavaş (max ${state.maxCycleSeconds} sn üstünde)`;
        pushLog(
          state,
          event,
          "stop",
          "Duruş kaydı",
          `${cycleDuration.toFixed(2)} sn — ${why}. Bu çevrim duruş olarak işaretlendi.`,
        );
      }
      state.lastEventAtSec = state.nowSec;
      break;
    }

    case "noise": {
      // Kuş/insan — frame-to-frame mantıkta çevrim ölçümünün içine girer; ayrı işlem yok.
      // Sadece bilgi amaçlı logla.
      state.ignoredNoiseCount += 1;
      pushLog(
        state,
        event,
        "ignored-noise",
        "Anlık kesinti",
        `${advanceSec.toFixed(2)} sn süreli ROI engeli. Çevrim süresinin içinde yutulur — ayrı duruş açılmaz.`,
      );
      break;
    }

    case "lost": {
      if (state.reflectorVisible) {
        state.reflectorVisible = false;
        state.lostAtSec = state.nowSec;
        pushLog(
          state,
          event,
          "lost-start",
          "Reflektör koptu",
          `Görüntü kayboldu. Geri dönünce kayıp süre + sonraki çevrimler kalıp aralığında mı kontrol edilecek.`,
        );
      }
      break;
    }

    case "recovered": {
      if (!state.reflectorVisible && state.lostAtSec !== null) {
        const missed = state.nowSec - state.lostAtSec;
        state.lostDurationSec += missed;
        state.reflectorVisible = true;
        state.lostAtSec = null;
        // Bir sonraki cycle ölçümü buradan başlar
        state.lastEventAtSec = state.nowSec;

        const reliability = computeReliability(state.minCycleSeconds, state.maxCycleSeconds);
        if (!reliability.canCompensate) {
          pushLog(
            state,
            event,
            "untrusted-mold",
            "Telafi devre dışı",
            `Reflektör ${missed.toFixed(1)} sn sonra geri geldi. Kalıp güvenilirliği düşük (%${reliability.score}). ${reliability.reason} Bu süre duruş sayılacak.`,
          );
          state.stopCount += 1;
          state.lostDurationSec = 0;
        } else {
          // Telafi mümkün — beklenen çevrim sayısını hesapla, ama henüz onaylama
          const expectedAvg = (state.minCycleSeconds + state.maxCycleSeconds) / 2;
          const estimatedCycles = Math.round(missed / expectedAvg);
          pushLog(
            state,
            event,
            "recovered",
            "Reflektör geri geldi",
            `Kayıp ${missed.toFixed(1)} sn ≈ ${estimatedCycles} çevrim. Onay için "Telafi kontrolü" tetikle (kalıp güvenilirliği %${reliability.score}, izin: ${reliability.allowedMissedCycles} çevrim).`,
          );
        }
      }
      break;
    }
  }

  return state;
}

// Kayıp süre + son N tam çevrim toplamı [N×min, N×max] aralığındaysa telafi et.
// Kullanıcı bunu manuel tetikleyebilir veya cycle eklerken otomatik kontrol edilir.
export function tryCompensate(prev: TestState, recentCycleDurations: number[]): TestState {
  const state: TestState = { ...prev, log: [...prev.log] };
  const reliability = computeReliability(state.minCycleSeconds, state.maxCycleSeconds);

  if (state.lostDurationSec <= 0) {
    pushLog(state, "recovered", "ignored-noise", "Telafi yok", "Bekleyen kayıp süre yok.");
    return state;
  }
  if (!reliability.canCompensate) {
    pushLog(state, "recovered", "untrusted-mold", "Telafi reddedildi", `Kalıp güvenilirliği yetersiz (%${reliability.score}).`);
    state.lostDurationSec = 0;
    return state;
  }

  const expectedAvg = (state.minCycleSeconds + state.maxCycleSeconds) / 2;
  const estimatedMissed = Math.round(state.lostDurationSec / expectedAvg);

  if (estimatedMissed > reliability.allowedMissedCycles) {
    pushLog(
      state,
      "recovered",
      "rejected",
      "Telafi reddedildi",
      `Tahmini kayıp ${estimatedMissed} çevrim, kalıp izninden (${reliability.allowedMissedCycles}) fazla. Süre duruş sayıldı.`,
    );
    state.stopCount += 1;
    state.lostDurationSec = 0;
    return state;
  }

  const N = recentCycleDurations.length;
  if (N === 0) {
    pushLog(state, "recovered", "ignored-noise", "Telafi bekliyor", "Önce reflektör geri geldikten sonra birkaç çevrim ekle.");
    return state;
  }

  const recentSum = recentCycleDurations.reduce((a, b) => a + b, 0);
  const totalSpan = state.lostDurationSec + recentSum;
  const expectedCount = estimatedMissed + N;
  const minTotal = expectedCount * state.minCycleSeconds;
  const maxTotal = expectedCount * state.maxCycleSeconds;

  if (totalSpan >= minTotal && totalSpan <= maxTotal) {
    state.compensatedCycles += estimatedMissed;
    pushLog(
      state,
      "recovered",
      "compensated",
      "Telafi yapıldı",
      `Kayıp ${state.lostDurationSec.toFixed(1)} sn + son ${N} çevrim ${recentSum.toFixed(1)} sn = ${totalSpan.toFixed(1)} sn. Beklenen ${expectedCount}×[${state.minCycleSeconds}-${state.maxCycleSeconds}] = [${minTotal.toFixed(1)}-${maxTotal.toFixed(1)} sn] ✓. +${estimatedMissed} çevrim eklendi.`,
    );
    state.lostDurationSec = 0;
  } else {
    pushLog(
      state,
      "recovered",
      "rejected",
      "Telafi reddedildi",
      `Toplam ${totalSpan.toFixed(1)} sn, beklenen [${minTotal.toFixed(1)}-${maxTotal.toFixed(1)} sn] dışında. Süre duruş sayıldı.`,
    );
    state.stopCount += 1;
    state.lostDurationSec = 0;
  }

  return state;
}

// ---- Script parser ----
// Komutlar:
//   cycle <sn>                       → tek çevrim (advance = sn)
//   cycles <n> <min>-<max>           → n çevrim, her biri min-max arası rastgele DETERMİNİSTİK
//   noise <sn>                       → kısa kesinti (kuş/insan)
//   lost <sn>                        → reflektör koptu, bekle sn
//   recovered                        → reflektör geri geldi (advance = 0)
//   compensate                       → son N çevrime göre telafi kontrolü
//   wait <sn>                        → sadece zaman ilerlet
//   mold <ad> <min> <max>            → kalıp parametrelerini ayarla
export type ScriptResult = { state: TestState; errors: string[] };

export function runScript(initial: TestState, script: string): ScriptResult {
  let state = initial;
  const errors: string[] = [];
  const lines = script.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  let prng = 1234;
  const rand = () => {
    prng = (prng * 16807) % 2147483647;
    return prng / 2147483647;
  };
  const recentCycles: number[] = []; // recovered sonrası eklenen çevrimler

  for (const line of lines) {
    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    try {
      if (cmd === "mold") {
        const min = Number(parts[parts.length - 2]);
        const max = Number(parts[parts.length - 1]);
        const name = parts.slice(1, -2).join(" ") || "Kalıp";
        state = { ...state, moldName: name, minCycleSeconds: min, maxCycleSeconds: max };
      } else if (cmd === "cycle") {
        const sec = Number(parts[1]);
        const wasLost = state.lostDurationSec > 0;
        state = applyEvent(state, "cycle", sec);
        if (wasLost) recentCycles.push(sec);
      } else if (cmd === "cycles") {
        const n = Number(parts[1]);
        const range = parts[2].split("-").map(Number);
        const [lo, hi] = range;
        for (let i = 0; i < n; i++) {
          const sec = lo + rand() * (hi - lo);
          const wasLost = state.lostDurationSec > 0;
          state = applyEvent(state, "cycle", Number(sec.toFixed(2)));
          if (wasLost) recentCycles.push(Number(sec.toFixed(2)));
        }
      } else if (cmd === "noise") {
        state = applyEvent(state, "noise", Number(parts[1]));
      } else if (cmd === "lost") {
        const sec = Number(parts[1]);
        state = applyEvent(state, "lost", 0);
        state = applyEvent(state, "recovered", sec); // birleşik: kopuk kaldı sn, sonra geri geldi
        recentCycles.length = 0;
      } else if (cmd === "recovered") {
        state = applyEvent(state, "recovered", Number(parts[1] ?? 0));
        recentCycles.length = 0;
      } else if (cmd === "compensate") {
        state = tryCompensate(state, recentCycles.slice());
        recentCycles.length = 0;
      } else if (cmd === "wait") {
        state = { ...state, nowSec: Number((state.nowSec + Number(parts[1])).toFixed(3)) };
      } else {
        errors.push(`Bilinmeyen komut: ${line}`);
      }
    } catch (e) {
      errors.push(`Hata: ${line} → ${(e as Error).message}`);
    }
  }
  return { state, errors };
}
