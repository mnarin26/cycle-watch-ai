import { Link, useRouterState } from "@tanstack/react-router";
import { Gauge, PlusSquare, Settings, Factory, FlaskConical, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { useNetworkTestMode, NETWORK_TEST_MODE_LABELS } from "@/lib/network-test-mode";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/test", label: "Filtre Testi", icon: FlaskConical },
  { to: "/setup", label: "Makine Tanıtımı", icon: PlusSquare },
  { to: "/settings", label: "Ayarlar", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const [networkTestMode] = useNetworkTestMode();
  const modeLabel = NETWORK_TEST_MODE_LABELS[networkTestMode].short;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t bg-sidebar/95 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-20 md:border-r md:border-t-0 lg:w-64">
        <div className="hidden h-20 items-center gap-3 px-5 md:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Factory className="h-5 w-5" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-bold">Reflektör İzleme</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Wifi className="h-3 w-3" aria-hidden />
              Test: {modeLabel}
            </p>
          </div>
        </div>
        <nav className="grid h-16 grid-cols-3 px-2 md:h-auto md:grid-cols-1 md:gap-2 md:px-3">
          {navItems.map((item) => {
            const active = item.to === "/" ? currentPath === "/" : currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:justify-start lg:text-sm",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="pb-20 md:pb-0 md:pl-20 lg:pl-64">
        <div className="flex items-center justify-center gap-1.5 border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] font-medium text-muted-foreground md:hidden">
          <Wifi className="h-3 w-3 shrink-0" aria-hidden />
          Test ağı: {modeLabel}
        </div>
        {children}
      </main>
    </div>
  );
}
