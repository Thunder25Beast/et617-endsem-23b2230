// Screen 6: My progress — bars for 3 skills, stars, last 10 decisions with reasons, log download.
import { RULE_NAMES, SKILL_NAMES, STR, tr } from "@/data/i18n";
import { recentAttempts } from "@/engine/selector";
import { useActiveLearner, useSettings } from "@/engine/storage";
import { fill } from "@/engine/text";
import type { Decision, RuleId, SkillId } from "@/engine/types";
import { go } from "@/lib/hash-route";
import { Btn } from "@/components/Btn";
import { Stars, Tag } from "@/components/Bits";

const SHOWN: SkillId[] = ["S1", "S2", "S3"];

function DecisionBarChart({ decisions, lang }: { decisions: Decision[]; lang: "hi" | "en" }) {
  const recent = decisions.slice(-5);
  if (recent.length === 0) return null;

  const ruleColors: Record<string, { bg: string; fill: string; text: string }> = {
    HARDER: { bg: "bg-emerald-500", fill: "#10b981", text: "text-emerald-700" },
    SAME: { bg: "bg-sky-500", fill: "#0ea5e9", text: "text-sky-700" },
    ALT: { bg: "bg-amber-500", fill: "#f59e0b", text: "text-amber-700" },
    PREREQ: { bg: "bg-rose-500", fill: "#f43f5e", text: "text-rose-700" },
    REMEDIATION: { bg: "bg-purple-500", fill: "#a855f7", text: "text-purple-700" },
    START: { bg: "bg-slate-400", fill: "#94a3b8", text: "text-slate-700" },
    RETURN: { bg: "bg-indigo-500", fill: "#6366f1", text: "text-indigo-700" },
  };

  const fallbackColor = { bg: "bg-slate-400", fill: "#94a3b8", text: "text-slate-700" };
  const counts: Record<string, number> = {};
  for (const d of recent) {
    counts[d.rule] = (counts[d.rule] || 0) + 1;
  }

  const heightByRule: Record<string, number> = {
    HARDER: 100,
    SAME: 65,
    START: 40,
    RETURN: 70,
    REMEDIATION: 50,
    ALT: 35,
    PREREQ: 20,
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-muted/30 p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
          <span>{lang === "hi" ? "पिछले 5 फैसलों का क्रम (Timeline)" : "Last 5 Decisions Timeline"}</span>
          <span className="tabular-nums">{recent.length} {lang === "hi" ? "फैसले" : "decisions"}</span>
        </div>
        {/* Step-by-step Column Bars */}
        <div className="h-28 flex items-end gap-2 sm:gap-3 pt-4 px-2 pb-1 border-b-2 border-border">
          {recent.map((d, idx) => {
            const h = heightByRule[d.rule] ?? 50;
            const c = ruleColors[d.rule] ?? fallbackColor;
            const label = RULE_NAMES[d.rule]?.[lang] ?? d.rule;
            return (
              <div
                key={d.ts + "-" + idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                title={`${label} (${new Date(d.ts).toLocaleTimeString()}): ${d.reason[lang]}`}
              >
                <div
                  className={`w-full max-w-16 rounded-t-lg transition-all duration-300 ${c.bg} group-hover:opacity-90 min-h-[16px] shadow-sm`}
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs font-bold text-muted-foreground mt-1 tabular-nums">{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution Summary Horizontal Bars */}
      <div className="space-y-1.5 pt-1">
        <p className="text-xs font-bold text-muted-foreground">
          {lang === "hi" ? "फैसलों का विभाजन (Breakdown)" : "Decisions Breakdown"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(counts).map(([rule, count]) => {
            const c = ruleColors[rule] ?? fallbackColor;
            const pct = Math.round((count / recent.length) * 100);
            const name = RULE_NAMES[rule as RuleId]?.[lang] ?? rule;
            return (
              <div key={rule} className="rounded-lg bg-card border border-border/80 px-2.5 py-1.5">
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                    <span>{name}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${c.bg}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ProgressScreen() {
  const { lang } = useSettings();
  const l = useActiveLearner();
  if (!l) return null;
  const e = l.engine;
  const attempts = e.attempts;
  const correct = attempts.filter((a) => a.correct).length;
  const totalStars = Object.values(e.cleared).reduce((s, n) => s + n, 0);
  const inLevel = recentAttempts(e).filter((a) => a.correct).length;

  const pct = (s: SkillId) => {
    const base = (e.cleared[s] / 3) * 100;
    const partial = s === e.current.skill && e.cleared[s] < 3 ? (Math.min(inLevel, 2) / 2) * (100 / 3) : 0;
    return Math.min(100, Math.round(base + partial));
  };

  const download = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            learner: { nickname: l.nickname, emoji: l.emoji, createdAt: new Date(l.createdAt).toISOString() },
            profile: e.profile,
            current: e.current,
            attempts,
            decisions: l.decisions.map(({ twinOf, ...d }) => ({ ...d, twinOf: twinOf?.templateId ?? null })),
            events: l.events,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ank-saathi-${l.nickname}-log.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4 animate-pop">
      <section className="paper space-y-4 p-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>{l.emoji}</span>
          <div>
            <h1 className="text-2xl font-extrabold">{tr("progTitle", lang)}</h1>
            <p className="text-sm text-muted-foreground">
              {fill(STR.attemptsDone[lang], { n: attempts.length, c: correct })} · {fill(STR.starsEarned[lang], { n: totalStars })}
            </p>
          </div>
        </div>
        <p className="font-bold">{fill(STR.nowAt[lang], { skill: SKILL_NAMES[e.current.skill][lang], level: e.current.level })}</p>
        {SHOWN.map((s) => (
          <div key={s}>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold">{SKILL_NAMES[s][lang]}</span>
              <Stars n={e.cleared[s]} />
            </div>
            <div className="h-5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct(s)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${pct(s)}%` }} />
            </div>
            <p className="mt-0.5 text-right text-xs text-muted-foreground">{pct(s)}%</p>
          </div>
        ))}
      </section>

      <section className="paper space-y-3 p-5">
        <h2 className="text-xl font-extrabold">{tr("lastDecisions", lang)}</h2>
        {l.decisions.length === 0 ? (
          <p className="text-muted-foreground">{tr("noDecisions", lang)}</p>
        ) : (
          <>
            <DecisionBarChart decisions={l.decisions.slice(-10)} lang={lang} />
            <ol className="space-y-2 mt-3">
              {[...l.decisions].reverse().slice(0, 10).map((d) => (
                <li key={d.ts} className="rounded-xl border-2 border-border bg-card p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone={d.rule === "HARDER" ? "success" : d.rule === "PREREQ" || d.rule === "ALT" ? "neg" : "muted"}>{RULE_NAMES[d.rule][lang]}</Tag>
                    <span className="text-xs text-muted-foreground">{new Date(d.ts).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 text-sm">{d.reason[lang]}</p>
                </li>
              ))}
            </ol>
          </>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Btn variant="secondary" className="flex-1" onClick={download}>
            ⬇ {tr("download", lang)}
          </Btn>
          <Btn variant="outline" onClick={() => go("check")}>
            {tr("redoCheck", lang)}
          </Btn>
        </div>
      </section>
    </div>
  );
}
