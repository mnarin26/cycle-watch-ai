import { useCallback, useEffect, useState } from "react";

/** Test: cihaz ev ağına istemci (STA) mi, yoksa kendi AP’sini mi yayınlıyor? */
export type NetworkTestMode = "sta" | "ap";

const STORAGE_KEY = "cycle-watch-ai-network-test-mode";

export const NETWORK_TEST_MODE_LABELS: Record<NetworkTestMode, { title: string; short: string }> = {
  sta: { title: "Yerel ağa bağlan (STA)", short: "Yerel ağ" },
  ap: { title: "Kendi ağını yayın (AP)", short: "Pi AP" },
};

export function getNetworkTestMode(): NetworkTestMode {
  if (typeof window === "undefined") return "sta";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "ap" ? "ap" : "sta";
}

export function setNetworkTestMode(mode: NetworkTestMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
}

export function useNetworkTestMode(): [NetworkTestMode, (mode: NetworkTestMode) => void] {
  const [mode, setModeState] = useState<NetworkTestMode>("sta");

  useEffect(() => {
    setModeState(getNetworkTestMode());
  }, []);

  const setMode = useCallback((next: NetworkTestMode) => {
    setModeState(next);
    setNetworkTestMode(next);
  }, []);

  return [mode, setMode];
}
