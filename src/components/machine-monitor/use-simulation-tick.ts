import { useEffect, useState } from "react";

export function useSimulationTick(intervalMs = 3000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);

  return tick;
}
