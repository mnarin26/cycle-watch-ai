export type MachineStatus = "running" | "idle" | "fault" | "mold-change";
export type PeriodKey = "day" | "week" | "month" | "year";

export type CyclePoint = {
  label: string;
  seconds: number;
  target: number;
};

export type StopEvent = {
  id: string;
  start: string;
  durationMin: number;
  type: "Kalıp değişimi" | "Arıza/duruş" | "Planlı duruş";
  note: string;
};

export type MoldRun = {
  mold: string;
  lastSeen: string;
  confidence: number;
  avgCycleSeconds: number;
  targetCycleSeconds: number;
  cycles: number;
  uptime: number;
  changeoverMin: number;
};

export type Machine = {
  id: string;
  name: string;
  mold: string;
  status: MachineStatus;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger" | "neutral";
  cycleSeconds: number;
  avgCycleSeconds: number;
  targetCycleSeconds: number;
  uptime: number;
  cyclesToday: number;
  lastStopMin: number;
  lastSampleSecondsAgo: number;
  reflectorDetected: boolean;
  roi: { x: number; y: number; width: number; height: number };
  cycleTrend: CyclePoint[];
  stops: StopEvent[];
  moldHistory: MoldRun[];
  suggestedMold: MoldRun;
  moldSummary: Record<PeriodKey, MoldRun[]>;
  summary: Record<PeriodKey, { uptime: number; cycles: number; stops: number; avgCycle: number }>;
};

const baseMachines: Omit<Machine, "cycleSeconds" | "uptime" | "cyclesToday" | "lastSampleSecondsAgo" | "reflectorDetected" | "cycleTrend" | "suggestedMold" | "moldSummary" | "summary">[] = [
  {
    id: "m1",
    name: "Makine 1",
    mold: "Kapak A-12",
    status: "running",
    statusLabel: "Çalışıyor",
    statusTone: "success",
    avgCycleSeconds: 18.4,
    targetCycleSeconds: 18,
    lastStopMin: 6,
    roi: { x: 18, y: 26, width: 28, height: 36 },
    stops: [
      { id: "s1", start: "08:42", durationMin: 34, type: "Kalıp değişimi", note: "Yeni çevrim paterni: Kapak A-12" },
      { id: "s2", start: "11:18", durationMin: 6, type: "Planlı duruş", note: "Operatör bekleme" },
    ],
    moldHistory: [
      { mold: "Kapak A-12", lastSeen: "Bugün", confidence: 96, avgCycleSeconds: 18.4, targetCycleSeconds: 18, cycles: 18420, uptime: 91.2, changeoverMin: 34 },
      { mold: "Kapak A-10", lastSeen: "3 gün önce", confidence: 82, avgCycleSeconds: 20.1, targetCycleSeconds: 20, cycles: 12680, uptime: 87.4, changeoverMin: 39 },
      { mold: "Conta A-07", lastSeen: "2 hafta önce", confidence: 68, avgCycleSeconds: 15.7, targetCycleSeconds: 16, cycles: 22140, uptime: 89.1, changeoverMin: 31 },
    ],
  },
  {
    id: "m2",
    name: "Makine 2",
    mold: "Gövde B-04",
    status: "mold-change",
    statusLabel: "Kalıp değişimi",
    statusTone: "warning",
    avgCycleSeconds: 24.8,
    targetCycleSeconds: 25,
    lastStopMin: 28,
    roi: { x: 57, y: 19, width: 25, height: 34 },
    stops: [
      { id: "s3", start: "09:05", durationMin: 48, type: "Kalıp değişimi", note: "Duruş yeni kalıp başlangıcına bağlandı" },
      { id: "s4", start: "13:26", durationMin: 12, type: "Planlı duruş", note: "Malzeme hazırlığı" },
    ],
    moldHistory: [
      { mold: "Gövde B-04", lastSeen: "Bugün", confidence: 93, avgCycleSeconds: 24.8, targetCycleSeconds: 25, cycles: 14210, uptime: 84.5, changeoverMin: 48 },
      { mold: "Gövde B-02", lastSeen: "6 gün önce", confidence: 76, avgCycleSeconds: 27.3, targetCycleSeconds: 27, cycles: 9870, uptime: 80.2, changeoverMin: 52 },
      { mold: "Kasa B-11", lastSeen: "1 ay önce", confidence: 64, avgCycleSeconds: 33.6, targetCycleSeconds: 34, cycles: 7420, uptime: 78.9, changeoverMin: 57 },
    ],
  },
  {
    id: "m3",
    name: "Makine 3",
    mold: "Klip C-21",
    status: "fault",
    statusLabel: "Arıza/duruş",
    statusTone: "danger",
    avgCycleSeconds: 13.6,
    targetCycleSeconds: 14,
    lastStopMin: 41,
    roi: { x: 21, y: 59, width: 24, height: 30 },
    stops: [
      { id: "s5", start: "10:14", durationMin: 41, type: "Arıza/duruş", note: "Beklenen çevrim eşiği aşıldı" },
      { id: "s6", start: "12:01", durationMin: 18, type: "Planlı duruş", note: "Vardiya geçişi" },
    ],
    moldHistory: [
      { mold: "Klip C-21", lastSeen: "Bugün", confidence: 88, avgCycleSeconds: 13.6, targetCycleSeconds: 14, cycles: 24180, uptime: 79.6, changeoverMin: 27 },
      { mold: "Klip C-18", lastSeen: "Dün", confidence: 73, avgCycleSeconds: 12.9, targetCycleSeconds: 13, cycles: 26310, uptime: 82.8, changeoverMin: 25 },
      { mold: "Mandallı C-03", lastSeen: "12 gün önce", confidence: 59, avgCycleSeconds: 17.8, targetCycleSeconds: 18, cycles: 17650, uptime: 76.4, changeoverMin: 33 },
    ],
  },
  {
    id: "m4",
    name: "Makine 4",
    mold: "Tapa D-08",
    status: "running",
    statusLabel: "Çalışıyor",
    statusTone: "success",
    avgCycleSeconds: 31.2,
    targetCycleSeconds: 30,
    lastStopMin: 3,
    roi: { x: 60, y: 58, width: 23, height: 31 },
    stops: [
      { id: "s7", start: "07:55", durationMin: 22, type: "Kalıp değişimi", note: "Yeni kalıp: Tapa D-08" },
      { id: "s8", start: "14:04", durationMin: 3, type: "Planlı duruş", note: "Kısa bekleme" },
    ],
    moldHistory: [
      { mold: "Tapa D-08", lastSeen: "Bugün", confidence: 91, avgCycleSeconds: 31.2, targetCycleSeconds: 30, cycles: 9160, uptime: 86.1, changeoverMin: 22 },
      { mold: "Tapa D-05", lastSeen: "4 gün önce", confidence: 78, avgCycleSeconds: 29.5, targetCycleSeconds: 29, cycles: 10440, uptime: 88.6, changeoverMin: 24 },
      { mold: "Kaplin D-14", lastSeen: "3 hafta önce", confidence: 62, avgCycleSeconds: 35.8, targetCycleSeconds: 36, cycles: 7180, uptime: 81.5, changeoverMin: 36 },
    ],
  },
];

function wave(seed: number, tick: number, spread: number) {
  return Math.sin(tick / 4 + seed) * spread + Math.cos(tick / 7 + seed) * (spread / 2);
}

function makeTrend(target: number, tick: number, seed: number): CyclePoint[] {
  return Array.from({ length: 14 }, (_, index) => {
    const value = target + wave(seed + index * 0.6, tick + index, target * 0.08);
    return {
      label: `${String(index + 1).padStart(2, "0")}`,
      seconds: Number(Math.max(1, value).toFixed(1)),
      target,
    };
  });
}

export function getSimulatedMachines(tick = 0): Machine[] {
  return baseMachines.map((machine, index) => {
    const trend = makeTrend(machine.targetCycleSeconds, tick, index + 1);
    const statusOffset = machine.status === "running" ? 0 : machine.status === "mold-change" ? 0.35 : 0.7;
    const uptime = Math.max(18, Math.min(99, 84 - index * 7 + wave(index + 2, tick, 3.8) - statusOffset * 22));
    const cycles = Math.round(310 + tick * (index + 2) + index * 74 + wave(index + 4, tick, 16));

    return {
      ...machine,
      cycleSeconds: trend[trend.length - 1].seconds,
      uptime: Number(uptime.toFixed(1)),
      cyclesToday: cycles,
      lastSampleSecondsAgo: tick % 2 === 0 ? 0.5 : 1,
      reflectorDetected: machine.status !== "fault" || tick % 4 !== 0,
      cycleTrend: trend,
      summary: {
        day: { uptime: Number(uptime.toFixed(1)), cycles, stops: machine.stops.length, avgCycle: machine.avgCycleSeconds },
        week: { uptime: Number(Math.max(15, uptime - 2).toFixed(1)), cycles: cycles * 5 + 180, stops: machine.stops.length + 7, avgCycle: machine.avgCycleSeconds + 0.4 },
        month: { uptime: Number(Math.max(12, uptime - 5).toFixed(1)), cycles: cycles * 22 + 940, stops: machine.stops.length + 31, avgCycle: machine.avgCycleSeconds + 0.7 },
        year: { uptime: Number(Math.max(10, uptime - 8).toFixed(1)), cycles: cycles * 250 + 12000, stops: machine.stops.length + 360, avgCycle: machine.avgCycleSeconds + 1.1 },
      },
    };
  });
}

export function getMachineById(machineId: string, tick = 0) {
  return getSimulatedMachines(tick).find((machine) => machine.id === machineId);
}

export function formatSeconds(value: number) {
  return `${value.toFixed(1)} sn`;
}
