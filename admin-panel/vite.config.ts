import tailwindcss from "@tailwindcss/vite";
import { execFileSync } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";

const panelDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(panelDir, "..");

/** Sadece bu adreste dinle — Wi-Fi arayüzünden doğrudan erişim olmasın */
const ADMIN_BIND_ADDRESS = process.env.ADMIN_BIND_ADDRESS ?? "0.0.0.0";
const ADMIN_PORT = Number(process.env.ADMIN_PORT ?? "5274");
const CW_AP_SSID = process.env.CW_AP_SSID ?? "pi-wifi";
const CW_AP_PASSWORD = process.env.CW_AP_PASSWORD ?? "123456789";
const CW_ANALYSIS_PORT = Number(process.env.CW_ANALYSIS_PORT ?? "5173");

const AP_ANALYSIS_PATH = "/api/ap-analysis-url.json";

function wlan0Inet4(): string | null {
  if (process.platform === "win32") return null;
  for (const bin of ["/usr/sbin/ip", "/sbin/ip"]) {
    try {
      const out = execFileSync(bin, ["-4", "addr", "show", "wlan0"], {
        encoding: "utf8",
      });
      const m = /\binet\s+(\d+\.\d+\.\d+\.\d+)/.exec(out);
      if (m) return m[1];
    } catch {
      /* dene sıradaki */
    }
  }
  return null;
}

function attachApAnalysisUrlMiddleware(analysisPort: number) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const u = req.url?.split("?")[0] ?? "";
    if (u !== AP_ANALYSIS_PATH) {
      next();
      return;
    }
    const ip = wlan0Inet4();
    const payload = ip
      ? { ok: true, wlanIpv4: ip, port: analysisPort, url: `http://${ip}:${analysisPort}` }
      : {
          ok: false,
          wlanIpv4: null as string | null,
          port: analysisPort,
          url: null as string | null,
          hint:
            "wlan0 üzerinde IPv4 yok — hotspot/AP kapalı veya yüz yanlış. nm-ap-only-visible-ssid.sh veya enable-ap.sh ile aç.",
        };
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
  };
}

function apAnalysisUrlApiPlugin(analysisPort: number): Plugin {
  return {
    name: "cyclewatch-ap-analysis-url",
    configureServer(server) {
      server.middlewares.use(attachApAnalysisUrlMiddleware(analysisPort));
    },
    configurePreviewServer(server) {
      server.middlewares.use(attachApAnalysisUrlMiddleware(analysisPort));
    },
  };
}

export default defineConfig({
  root: panelDir,
  publicDir: false,
  define: {
    __ADMIN_PANEL_BIND__: JSON.stringify(ADMIN_BIND_ADDRESS),
    __ADMIN_PANEL_PORT__: JSON.stringify(String(ADMIN_PORT)),
    __CW_AP_SSID__: JSON.stringify(CW_AP_SSID),
    __CW_AP_PASSWORD__: JSON.stringify(CW_AP_PASSWORD),
    __CW_ANALYSIS_PORT__: JSON.stringify(String(CW_ANALYSIS_PORT)),
  },
  plugins: [
    viteReact(),
    tsconfigPaths({ projects: [resolve(panelDir, "tsconfig.json")] }),
    tailwindcss(),
    apAnalysisUrlApiPlugin(CW_ANALYSIS_PORT),
  ],
  resolve: {
    alias: {
      "@": resolve(repoRoot, "src"),
      "@admin": resolve(panelDir, "src"),
    },
  },
  server: {
    host: ADMIN_BIND_ADDRESS,
    port: ADMIN_PORT,
    strictPort: true,
  },
  preview: {
    host: ADMIN_BIND_ADDRESS,
    port: ADMIN_PORT,
    strictPort: true,
  },
  build: {
    outDir: resolve(panelDir, "dist"),
    emptyOutDir: true,
  },
});
