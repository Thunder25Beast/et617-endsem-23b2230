// Header (name, learner, network chip, language), banner, bottom navigation and footer.
// The footer with the identity token is on every screen.
import { useEffect, useState, type ReactNode } from "react";
import { IDENTITY, tr } from "@/data/i18n";
import { setSettings, useActiveLearner, useSession, useSettings } from "@/engine/storage";
import { go, type Route } from "@/lib/hash-route";
import { cn } from "@/lib/utils";

type Net = "online" | "slow" | "offline";

/** Online / Slow / Offline from the browser, the "simulate slow" switch and the last AI call. */
export function useNetStatus(): Net {
  const { simulateSlow } = useSettings();
  const { slowNet } = useSession();
  const [online, setOnline] = useState(true);
  const [weak, setWeak] = useState(false);
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      const c = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
      setWeak(Boolean(c && (c.effectiveType === "slow-2g" || c.effectiveType === "2g")));
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!online) return "offline";
  if (simulateSlow || slowNet || weak) return "slow";
  return "online";
}

function StatusChip() {
  const { lang } = useSettings();
  const net = useNetStatus();
  const tone = {
    online: "bg-success-soft text-success",
    slow: "bg-warn-soft text-warn",
    offline: "bg-rethink-soft text-rethink",
  }[net];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", tone)} title={tr("netStatus", lang)}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {tr(net, lang)}
    </span>
  );
}

export function LangToggle() {
  const { lang } = useSettings();
  return (
    <button
      type="button"
      onClick={() => setSettings({ lang: lang === "hi" ? "en" : "hi" })}
      className="min-h-10 rounded-full border-2 border-input bg-card px-3 text-sm font-bold"
      aria-label={tr("langSwitchLabel", lang)}
    >
      {tr("langSwitch", lang)}
    </button>
  );
}

function Header() {
  const { lang } = useSettings();
  const learner = useActiveLearner();
  return (
    <header className="sticky top-0 z-20 border-b-2 border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => go("who")} className="flex min-h-10 items-center gap-2 text-left">
          <Logo />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold">{tr("appName", lang)}</span>
            <span className="hidden text-xs text-muted-foreground sm:block">{tr("appTag", lang)}</span>
          </span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <StatusChip />
          {learner && (
            <span className="hidden items-center gap-1 rounded-full bg-muted px-2 py-1 text-sm font-bold sm:inline-flex">
              <span aria-hidden>{learner.emoji}</span>
              {learner.nickname}
            </span>
          )}
          <LangToggle />
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <rect x="1" y="1" width="34" height="34" rx="10" fill="var(--primary)" />
      <line x1="7" y1="20" x2="29" y2="20" stroke="var(--primary-foreground)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="14" x2="18" y2="26" stroke="var(--primary-foreground)" strokeWidth="2.5" />
      <circle cx="11" cy="20" r="3.4" fill="var(--neg)" />
      <circle cx="25" cy="20" r="3.4" fill="var(--pos)" />
    </svg>
  );
}

/** Banner shown whenever an AI call failed and we are using saved questions. */
export function FallbackBanner() {
  const { lang } = useSettings();
  const { fallbackActive } = useSession();
  if (!fallbackActive) return null;
  return (
    <div role="status" className="mx-auto mt-3 max-w-3xl px-3">
      <div className="rounded-xl border-2 border-warn/30 bg-warn-soft px-4 py-2 text-warn">
        <p className="font-bold">{tr("bannerHi", "hi")}</p>
        {lang === "en" && <p className="text-sm">{tr("bannerEn", "en")}</p>}
      </div>
    </div>
  );
}

const TABS: { route: Route; key: "navLearn" | "navPractice" | "navProgress" | "navAbout"; icon: ReactNode }[] = [
  { route: "learn", key: "navLearn", icon: <path d="M4 5h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4zM20 5h-6" /> },
  { route: "practice", key: "navPractice", icon: <path d="M4 12h16M12 4v16" /> },
  { route: "progress", key: "navProgress", icon: <path d="M5 19V11M12 19V5M19 19v-6" /> },
  { route: "about", key: "navAbout", icon: <path d="M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /> },
];

function BottomNav({ route }: { route: Route }) {
  const { lang } = useSettings();
  const learner = useActiveLearner();
  if (!learner) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-border bg-card">
      <div className="mx-auto grid max-w-3xl grid-cols-4">
        {TABS.map((t) => {
          const active = route === t.route || (t.route === "practice" && route === "feedback");
          return (
            <button
              key={t.route}
              type="button"
              onClick={() => go(t.route)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-bold",
                active ? "text-secondary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {t.icon}
              </svg>
              {tr(t.key, lang)}
              {active && <span className="h-1 w-8 rounded-full bg-secondary" aria-hidden />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Footer() {
  const { lang } = useSettings();
  const { bytes } = useSession();
  return (
    <footer className="mx-auto max-w-3xl px-3 pb-24 pt-6 text-center text-xs text-muted-foreground">
      <p className="font-mono font-bold text-foreground/80">{IDENTITY}</p>
      <p className="mt-1">
        {tr("dataUsed", lang)}: <span className="font-bold tabular-nums">{(bytes / 1024).toFixed(1)} KB</span>
      </p>
    </footer>
  );
}

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <FallbackBanner />
      <main className="mx-auto max-w-3xl px-3 pt-4">{children}</main>
      <Footer />
      <BottomNav route={route} />
    </div>
  );
}
