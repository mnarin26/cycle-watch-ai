import { useEffect, useState } from "react";

export type ApAnalysisPayload = {
  ok: boolean;
  wlanIpv4: string | null;
  port: number;
  url: string | null;
  hint?: string;
};

export function useApAnalysisUrl(refreshMs = 8000) {
  const [data, setData] = useState<ApAnalysisPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    const pull = async () => {
      try {
        const r = await fetch("/api/ap-analysis-url.json", { cache: "no-store" });
        const j = (await r.json()) as ApAnalysisPayload;
        // #region agent log
        fetch("http://127.0.0.1:7392/ingest/ff666263-9ce3-460e-abac-8cb3be4692fd", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6ade23",
          },
          body: JSON.stringify({
            sessionId: "6ade23",
            hypothesisId: "H3",
            location: "useApAnalysisUrl.ts:pull",
            message: "ap-analysis-url response",
            data: {
              ok: j.ok,
              wlanIpv4: j.wlanIpv4,
              hasUrl: Boolean(j.url),
              hint: j.hint?.slice(0, 120),
            },
            timestamp: Date.now(),
            runId: "pre-fix",
          }),
        }).catch(() => {});
        // #endregion
        if (!cancelled) setData(j);
      } catch {
        if (!cancelled) {
          setData({
            ok: false,
            wlanIpv4: null,
            port: 5173,
            url: null,
            hint: "Özet adresi istenemedi — bu panel yerel olarak Pi/Vite ile mi çalışıyor kontrol et.",
          });
        }
      }
    };

    void pull();
    const id = setInterval(() => void pull(), refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshMs]);

  return data;
}
