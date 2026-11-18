// Screen 7: About — identity token, card, persona, what the AI does and what happens when it fails,
// "Simulate slow network" switch, demo mode, libraries used.
import { IDENTITY, tr, type StrKey } from "@/data/i18n";
import { bankSize } from "@/engine/flow";
import { setSession, setSettings, useSettings } from "@/engine/storage";
import { cn } from "@/lib/utils";

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 border-input bg-card px-4 text-left font-bold"
    >
      <span>{label}</span>
      <span className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", on ? "bg-secondary" : "bg-muted")}>
        <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-all", on ? "left-7" : "left-1")} />
      </span>
    </button>
  );
}

export function AboutScreen() {
  const s = useSettings();
  const t = (k: StrKey) => tr(k, s.lang);
  return (
    <div className="space-y-4 animate-pop">
      <section className="paper space-y-3 p-5">
        <h1 className="text-2xl font-extrabold">{t("aboutTitle")}</h1>
        <p className="text-sm font-bold text-muted-foreground">{t("aboutToken")}</p>
        <p className="key-box p-3 text-center font-mono text-lg font-extrabold">{IDENTITY}</p>
        <p className="text-sm font-bold text-muted-foreground">{t("aboutCard")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["cardP", "cardT", "cardL", "cardC"] as StrKey[]).map((k) => (
            <div key={k} className="rounded-xl border-2 border-border bg-muted/50 p-3 text-sm font-bold">{t(k)}</div>
          ))}
        </div>
      </section>

      <section className="paper space-y-2 p-5">
        <h2 className="text-xl font-extrabold">{t("personaTitle")}</h2>
        <p>{t("persona1")}</p>
        <p>{t("persona2")}</p>
        <p>{t("persona3")}</p>
      </section>

      <section className="paper space-y-2 p-5">
        <h2 className="text-xl font-extrabold">{t("aiTitle")}</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("ai1")}</li>
          <li>{t("ai2")}</li>
          <li>{t("ai3")}</li>
        </ul>
        <h2 className="pt-2 text-xl font-extrabold">{t("aiFailTitle")}</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("aiFail1")}</li>
          <li>{t("aiFail2")}</li>
          <li>{s.lang === "hi" ? `सेव किए हुए सवाल: ${bankSize}` : `Saved questions: ${bankSize}`}</li>
        </ul>
        <div className="space-y-2 pt-2">
          <Switch
            on={s.simulateSlow}
            label={t("simSlow")}
            onChange={(v) => {
              setSettings({ simulateSlow: v });
              setSession({ fallbackActive: v, slowNet: v, skipLeft: 0 });
            }}
          />
          <Switch on={s.demoMode} label={t("demoMode")} onChange={(v) => setSettings({ demoMode: v })} />
          <p className="text-sm text-muted-foreground">{t("demoNote")}</p>
        </div>
      </section>

      <section className="paper space-y-2 p-5">
        <h2 className="text-xl font-extrabold">{t("offlineTitle")}</h2>
        <p>{t("offlineText")}</p>
        <h2 className="pt-2 text-xl font-extrabold">{t("libsTitle")}</h2>
        <p>{t("libs")}</p>
      </section>
    </div>
  );
}
