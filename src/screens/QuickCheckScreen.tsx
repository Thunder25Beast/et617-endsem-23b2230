// Screen 2: Quick check — 4 short questions. Sets the starting skill and level (the PROFILE signal)
// and flags a prerequisite gap.
import { useState } from "react";
import { QUICK_CHECK } from "@/data/questions";
import { SKILL_NAMES, STR, tr } from "@/data/i18n";
import { emptyEngine, logEvent, updateLearner, useActiveLearner, useSettings } from "@/engine/storage";
import { fill, fmt } from "@/engine/text";
import type { Level, Profile, SkillId } from "@/engine/types";
import { go } from "@/lib/hash-route";
import { Btn } from "@/components/Btn";
import { NumberLine } from "@/components/NumberLine";
import { Keypad } from "@/components/Keypad";
import { Num } from "@/components/Bits";

/** Turn the 4 answers into a starting point. Exported for tests. */
export function profileFrom(ans: { read: number; compare: number; whole: number; addNeg: number }): Profile {
  const positionGap = ans.read !== QUICK_CHECK.readMarker;
  const m1Suspected = ans.compare !== Math.max(...QUICK_CHECK.compare);
  const wholeNumberGap = ans.whole !== QUICK_CHECK.whole.a - QUICK_CHECK.whole.b;
  const addNegOk = ans.addNeg === QUICK_CHECK.addNeg.a + QUICK_CHECK.addNeg.b;
  let startSkill: SkillId = "S2";
  let startLevel: Level = 2;
  if (positionGap) [startSkill, startLevel] = ["S1", 1]; // + number line mini lesson first (PREREQ)
  else if (wholeNumberGap) [startSkill, startLevel] = ["S0", 1];
  else if (m1Suspected) [startSkill, startLevel] = ["S1", 1];
  else if (!addNegOk) [startSkill, startLevel] = ["S2", 1];
  return {
    done: true,
    positionGap,
    wholeNumberGap,
    m1Suspected,
    addNegOk,
    startSkill,
    startLevel,
    answers: [ans.read, ans.compare, ans.whole, ans.addNeg].map(fmt),
  };
}

export function QuickCheckScreen() {
  const { lang } = useSettings();
  const learner = useActiveLearner();
  const [step, setStep] = useState(0);
  const [read, setRead] = useState<number | null>(null);
  const [compare, setCompare] = useState<number | null>(null);
  const [whole, setWhole] = useState("");
  const [addNeg, setAddNeg] = useState("");
  const [result, setResult] = useState<Profile | null>(null);
  if (!learner) return null;

  const finish = () => {
    const p = profileFrom({ read: read ?? 0, compare: compare ?? 0, whole: Number(whole), addNeg: Number(addNeg) });
    const base = emptyEngine(p.startSkill, p.startLevel);
    // skills before the start skill count as already cleared (3 stars)
    const order: SkillId[] = ["S0", "S1", "S2", "S3"];
    const cleared = { ...base.cleared };
    for (const s of order) {
      if (order.indexOf(s) < order.indexOf(p.startSkill)) cleared[s] = 3;
    }
    cleared[p.startSkill] = p.startLevel - 1;
    updateLearner(learner.id, (l) => ({
      ...l,
      engine: { ...base, profile: p, cleared, attempts: l.engine.attempts, learnSkipped: l.engine.learnSkipped },
      plan: null,
      currentQ: null,
      lastFeedback: null,
    }));
    logEvent(learner.id, "quick_check", { ...p });
    setResult(p);
  };

  const options = [-3, 3, -2, -4];
  const canNext = [read !== null, compare !== null, whole !== "" && whole !== "-", addNeg !== "" && addNeg !== "-"][step];

  if (result) {
    return (
      <section className="paper space-y-4 p-5 animate-pop">
        <h1 className="text-2xl font-extrabold">{tr("qcDone", lang)}</h1>
        <p className="key-box p-4 text-lg font-bold">
          {fill(STR.qcStart[lang], { skill: SKILL_NAMES[result.startSkill][lang], level: result.startLevel })}
        </p>
        <ul className="list-disc space-y-1 pl-6">
          {result.positionGap && <li>{tr("qcGap", lang)}</li>}
          {result.wholeNumberGap && <li>{tr("qcWhole", lang)}</li>}
          {result.m1Suspected && <li>{tr("qcM1", lang)}</li>}
        </ul>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Btn className="flex-1" onClick={() => go("learn")}>
            {tr("qcGo", lang)}
          </Btn>
          <Btn className="flex-1" variant="outline" onClick={() => go("practice")}>
            {tr("qcSkipToPractice", lang)}
          </Btn>
        </div>
      </section>
    );
  }

  return (
    <section className="paper space-y-4 p-5 animate-pop">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{tr("qcTitle", lang)}</h1>
        <span className="text-sm font-bold text-muted-foreground">{fill(STR.qcOf[lang], { n: step + 1 })}</span>
      </div>
      {step === 0 && <p className="text-muted-foreground">{tr("qcIntro", lang)}</p>}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-secondary transition-all" style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-xl font-bold">{tr("qc1", lang)}</p>
          <NumberLine range={[-5, 5]} markers={[{ value: QUICK_CHECK.readMarker, tone: "pick", label: "?" }]} />
          <div className="grid grid-cols-4 gap-2">
            {options.map((o) => (
              <Btn key={o} variant={read === o ? "chosen" : "choice"} onClick={() => setRead(o)}>
                <Num n={o} />
              </Btn>
            ))}
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-xl font-bold">{tr("qc2", lang)}</p>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_CHECK.compare.map((o) => (
              <Btn key={o} className="min-h-20 text-3xl" variant={compare === o ? "chosen" : "choice"} onClick={() => setCompare(o)}>
                <Num n={o} />
              </Btn>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xl font-bold">{fill(STR.qc3[lang], QUICK_CHECK.whole)}</p>
          <Keypad value={whole} onChange={setWhole} />
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-xl font-bold">{fill(STR.qc4[lang], QUICK_CHECK.addNeg)}</p>
          <Keypad value={addNeg} onChange={setAddNeg} />
        </div>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <Btn variant="outline" onClick={() => setStep(step - 1)}>
            {tr("back", lang)}
          </Btn>
        )}
        <Btn className="flex-1" disabled={!canNext} onClick={() => (step < 3 ? setStep(step + 1) : finish())}>
          {tr("next", lang)} →
        </Btn>
      </div>
    </section>
  );
}
