// Screen 6: My progress — bars for 3 skills, stars, last 10 decisions with reasons, log download.
import { RULE_NAMES, SKILL_NAMES, STR, tr } from "@/data/i18n";
import { recentAttempts } from "@/engine/selector";
import { useActiveLearner, useSettings } from "@/engine/storage";
import { fill } from "@/engine/text";
import type { SkillId } from "@/engine/types";
import { go } from "@/lib/hash-route";
import { Btn } from "@/components/Btn";
import { Stars, Tag } from "@/components/Bits";

const SHOWN: SkillId[] = ["S1", "S2", "S3"];

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
          <ol className="space-y-2">
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
