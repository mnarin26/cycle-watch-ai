// Deterministik test simülatörü.
// Rastgele veri üretmez. Olayları sen tetiklersin, sistem nasıl tepki verdiğini görürsün.

export type EventType =
  | "cycle" // normal çevrim tamamlandı (reflektör hareketi sayıldı)
  | "bird" // anlık geçiş (kuş): çok kısa, çevrim sayılmaz
  | "person" // insan geçişi: kısa süre kapatma, çevrim sayılmaz
  | "lost" // reflektör görüntüsü koptu
  | "recovered"; // reflektör geri geldi

export type DecisionTag = "counted" | "ignored-noise" | "lost-start" | "recovered" | "compensated" | "rejected";

export type LogEntry = {
  id: string;
  timeSec: number; // simülasyon başından itibaren saniye
  event: EventType;
  decision: DecisionTag;
  decisionLabel: string;
  detail: string;
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
  lostAtSec: number | null; // ne zaman kayboldu
  // Geri geldikten sonra ilk N çevrimi doğrulama amaçlı izle
  pendingValidation: number[]; // henüz doğrulamaya alınmamış çevrim süreleri
  pendingMissedSec: number; // doğrulama beklerken arada geçen kayıp süre

  // Üretim
  countedCycles: number;
  compensatedCycles: number;
  rejectedNoiseCount: number;
  lastCycleAtSec: number; // son sayılan çevrimin zamanı

  // Loglar
  log: LogEntry[];
};

export function makeInitialState(): TestState {
  return {
    moldName: "Kapak A-12",
    minCycleSeconds: 4.0,
    maxCycleSeconds: 5.5,
    nowSec: 0,
    reflectorVisible: true,
    lostAtSec: null,
    pendingValidation: [],
    pendingMissedSec: 0,
    countedCycles: 0,
    compensatedCycles: 0,
    rejectedNoiseCount: 0,
    lastCycleAtSec: 0,
    log: [],
  };
}

let logId = 0;
function pushLog(state: TestState, event: EventType, decision: DecisionTag, decisionLabel: string, detail: string) {
  state.log.unshift({
    id: `l${++logId}`,
    timeSec: Number(state.nowSec.toFixed(1)),
    event,
    decision,
    decisionLabel,
    detail,
  });
  if (state.log.length > 80) state.log.pop();
}

const VALIDATION_CYCLES = 10;

export function applyEvent(prev: TestState, event: EventType, advanceSec: number): TestState {
  const state: TestState = {
    ...prev,
    pendingValidation: [...prev.pendingValidation],
    log: [...prev.log],
  };
  state.nowSec = Number((state.nowSec + advanceSec).toFixed(2));

  switch (event) {
    case "cycle": {
      const cycleDuration = state.nowSec - state.lastCycleAtSec;

      if (!state.reflectorVisible) {
        // Reflektör görünmüyor; gerçek bir çevrim olamaz, gör mez sayılır
        pushLog(state, event, "ignored-noise", "Reflektör kapalı", "Reflektör görünmüyorken çevrim eklenemez.");
        break;
      }

      // Reflektör görünüyor. Doğrulama modunda mıyız?
      if (state.pendingValidation.length < VALIDATION_CYCLES && state.lostAtSec === null && state.pendingMissedSec === 0) {
        // Normal çalışma - direkt say
        if (cycleDuration >= state.minCycleSeconds * 0.6) {
          state.countedCycles += 1;
          state.lastCycleAtSec = state.nowSec;
          pushLog(state, event, "counted", "Çevrim sayıldı", `Çevrim süresi: ${cycleDuration.toFixed(2)} sn`);
        } else {
          state.rejectedNoiseCount += 1;
          pushLog(state, event, "ignored-noise", "Gürültü", `Çok hızlı (${cycleDuration.toFixed(2)} sn) - gerçek çevrim değil.`);
        }
        break;
      }

      // Doğrulama modundayız (kopmadan sonra)
      if (cycleDuration < state.minCycleSeconds * 0.6) {
        state.rejectedNoiseCount += 1;
        pushLog(state, event, "ignored-noise", "Gürültü", `Çok hızlı (${cycleDuration.toFixed(2)} sn) - sayılmadı.`);
        break;
      }

      state.pendingValidation.push(cycleDuration);
      state.lastCycleAtSec = state.nowSec;
      const n = state.pendingValidation.length;

      if (n < VALIDATION_CYCLES) {
        pushLog(
          state,
          event,
          "counted",
          `Doğrulama ${n}/${VALIDATION_CYCLES}`,
          `Çevrim ${cycleDuration.toFixed(2)} sn - kopma sonrası doğrulanıyor.`,
        );
        // Bu çevrim de sayılır ama henüz telafi yapılmaz
        state.countedCycles += 1;
        break;
      }

      // 10 çevrim tamamlandı - değerlendir
      const avg = state.pendingValidation.reduce((a, b) => a + b, 0) / n;
      const allInRange = state.pendingValidation.every(
        (d) => d >= state.minCycleSeconds && d <= state.maxCycleSeconds,
      );
      const avgInRange = avg >= state.minCycleSeconds && avg <= state.maxCycleSeconds;

      // Bu çevrim zaten countedCycles'a eklendi (yukarıda son else'te değil; tekrar ekleyelim)
      state.countedCycles += 1;

      if (allInRange && avgInRange) {
        // Telafi et
        const expectedCycle = (state.minCycleSeconds + state.maxCycleSeconds) / 2;
        const compensated = Math.max(0, Math.floor(state.pendingMissedSec / expectedCycle));
        state.compensatedCycles += compensated;
        pushLog(
          state,
          event,
          "compensated",
          "Telafi yapıldı",
          `İlk 10 çevrim ortalaması ${avg.toFixed(2)} sn (kalıp ${state.minCycleSeconds}-${state.maxCycleSeconds} sn aralığında). Kayıp ${state.pendingMissedSec.toFixed(0)} sn için ${compensated} çevrim üretime eklendi.`,
        );
      } else {
        pushLog(
          state,
          event,
          "rejected",
          "Telafi reddedildi",
          `İlk 10 çevrim ortalaması ${avg.toFixed(2)} sn kalıp normaline (${state.minCycleSeconds}-${state.maxCycleSeconds} sn) uymuyor. Kayıp süre üretime eklenmedi.`,
        );
      }
      // Doğrulamayı sıfırla
      state.pendingValidation = [];
      state.pendingMissedSec = 0;
      break;
    }

    case "bird": {
      state.rejectedNoiseCount += 1;
      pushLog(
        state,
        event,
        "ignored-noise",
        "Kuş geçişi",
        "Çok kısa süreli görüntü değişimi - duruş veya çevrim sayılmadı.",
      );
      break;
    }

    case "person": {
      state.rejectedNoiseCount += 1;
      pushLog(
        state,
        event,
        "ignored-noise",
        "İnsan geçişi",
        "Kısa süreli ROI engeli - gürültü filtresinde elendi, duruş açılmadı.",
      );
      break;
    }

    case "lost": {
      if (state.reflectorVisible) {
        state.reflectorVisible = false;
        state.lostAtSec = state.nowSec;
        pushLog(state, event, "lost-start", "Reflektör koptu", "Görüntü kayboldu - duruş henüz açılmadı, geri dönüşte kalıp paterni kontrol edilecek.");
      }
      break;
    }

    case "recovered": {
      if (!state.reflectorVisible && state.lostAtSec !== null) {
        const missed = state.nowSec - state.lostAtSec;
        state.pendingMissedSec += missed;
        state.reflectorVisible = true;
        state.lostAtSec = null;
        state.pendingValidation = [];
        state.lastCycleAtSec = state.nowSec; // bir sonraki çevrim buradan ölçülsün
        pushLog(
          state,
          event,
          "recovered",
          "Reflektör geri geldi",
          `Kayıp süre: ${missed.toFixed(0)} sn. İlk ${VALIDATION_CYCLES} çevrim kalıp paterniyle karşılaştırılacak.`,
        );
      }
      break;
    }
  }

  return state;
}
