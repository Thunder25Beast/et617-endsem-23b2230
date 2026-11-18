// Screen 4: Practice — one task at a time. Hint button (2 levels), number line tool,
// "Why this question?" chip, feedback below the task. Every submit logs an event.
import { useEffect, useRef, useState } from "react";
import { STARTERS, STR, SKILL_NAMES, tr } from "@/data/i18n";
import { CONFIG } from "@/engine/config";
import { buildNext, commitAttempt, gradeAnswer, startSession } from "@/engine/flow";
import { getData, logEvent, updateLearner, useActiveLearner, useSession, useSettings } from "@/engine/storage";
import { fill, tq } from "@/engine/text";
import type { Question, Response } from "@/engine/types";
import { go } from "@/lib/hash-route";
import { cn } from "@/lib/utils";
import { Btn } from "@/components/Btn";
import { BulbIcon, Num, RichText, Tag } from "@/components/Bits";
import { Keypad } from "@/components/Keypad";
import { NumberLineTool } from "@/components/NumberLineTool";

export function PracticeScreen() {
  const { lang } = useSettings();
  const learner = useActiveLearner();
  const building = useRef(false);
  const [loading, setLoading] = useState(false);

  // Make sure there is a question on screen: start a session or turn the plan into a question.
  useEffect(() => {
    if (!learner || learner.currentQ || building.current) return;
    building.current = true;
    (async () => {
      let plan = learner.plan;
      if (!plan) {
        plan = startSession(learner);
        if (plan.rule === "PREREQ") {
          building.current = false;
          go("feedback"); // mini lesson first
          return;
        }
      }
      setLoading(true);
      const fresh = getData().learners.find((x) => x.id === learner.id) ?? learner;
      const q = await buildNext(fresh, plan);
      updateLearner(learner.id, (x) => ({ ...x, currentQ: q, plan: null }));
      logEvent(learner.id, "question_shown", { qid: q.uid, template: q.templateId, source: q.source, skill: q.skill, level: q.level, format: q.format });
      setLoading(false);
      building.current = false;
    })();
  }, [learner]);

  if (!learner) return null;
  const q = learner.currentQ;
  if (!q || loading) {
    return (
      <div className="paper flex min-h-60 items-center justify-center p-6 text-lg font-bold text-muted-foreground" aria-busy>
        {tr("preparing", lang)}
      </div>
    );
  }
  return <Task key={q.uid} q={q} learnerId={learner.id} qCount={learner.qCount} />;
}

function Task({ q, learnerId, qCount }: { q: Question; learnerId: string; qCount: number }) {
  const { lang } = useSettings();
  const learner = useActiveLearner();
  const session = useSession();
  const started = useRef(Date.now());
  const [hints, setHints] = useState(0);
  const [lineOpen, setLineOpen] = useState(q.showLine);
  const [lineUsed, setLineUsed] = useState(q.showLine && q.format === "numberline");
  const [whyOpen, setWhyOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // answer state for each format
  const [pick, setPick] = useState<number | null>(null); // numberline + compare
  const [scratch, setScratch] = useState<number | null>(null); // helper line marker
  const [typed, setTyped] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [agree, setAgree] = useState<boolean | null>(null);
  const [text, setText] = useState("");

  const fb = learner?.lastFeedback;
  const answered = fb?.attempt?.qid === q.uid ? fb : null;
  const n = answered ? qCount : qCount + 1;

  const response: Response | null = (() => {
    switch (q.format) {
      case "numberline":
      case "compare":
        return pick === null ? null : { kind: "number", value: pick };
      case "order":
        return order.length === q.list.length ? { kind: "order", values: order } : null;
      case "explain":
        return agree === null || (agree === false && text.trim().length < 4) ? null : { kind: "explain", agree, text };
      default:
        return typed === "" || typed === "-" ? null : { kind: "number", value: Number(typed) };
    }
  })();

  const showHint = () => {
    const next = Math.min(2, hints + 1);
    setHints(next);
    logEvent(learnerId, "hint", { qid: q.uid, level: next });
  };

  const toggleLine = () => {
    setLineOpen((o) => !o);
    if (!lineOpen) setLineUsed(true);
    logEvent(learnerId, "line_toggle", { qid: q.uid, on: !lineOpen });
  };

  const submit = async () => {
    if (!response || busy) return;
    setBusy(true);
    try {
      const seconds = Math.max(1, Math.round((Date.now() - started.current) / 1000));
      const l = getData().learners.find((x) => x.id === learnerId);
      if (!l) return;
      const graded = await gradeAnswer(l, q, response);
      commitAttempt(learnerId, q, response, graded, { hints, seconds, lineUsed: lineUsed || scratch !== null });
    } finally {
      // never leave the Check button stuck on "Checking…"
      setBusy(false);
    }
  };

  const next = () => {
    const rule = answered?.decision.rule;
    updateLearner(learnerId, (x) => ({ ...x, currentQ: null }));
    if (rule === "ALT" || rule === "PREREQ") go("feedback");
  };

  const stem = tq(q.stem, lang, q);
  const locked = Boolean(answered);

  return (
    <div className="space-y-4 animate-pop">
      {/* top row: question number, skill, source, why chip */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-extrabold">{fill(STR.qNum[lang], { n })}</span>
        <Tag>
          {SKILL_NAMES[q.skill][lang]} · {tr("level", lang)} {q.level}
        </Tag>
        {q.source === "ai" && <Tag tone="success">{tr("aiMade", lang)}</Tag>}
        {q.source === "demo" && <Tag tone="warn">{tr("demoResponse", lang)}</Tag>}
        {q.source === "bank" && session.fallbackActive && <Tag tone="warn">{tr("savedQ", lang)}</Tag>}
        {q.isTwin && <Tag tone="neg">{tr("twinTag", lang)}</Tag>}
        {q.remediation && <Tag tone="neg">{tr("remediationTag", lang)}</Tag>}
        <button
          type="button"
          onClick={() => setWhyOpen((o) => !o)}
          className="ml-auto min-h-10 rounded-full border-2 border-secondary/40 bg-accent px-3 text-sm font-bold text-accent-foreground"
          aria-expanded={whyOpen}
        >
          {tr("why", lang)}
        </button>
      </div>
      {whyOpen && <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">{q.why[lang]}</p>}

      <section className="paper space-y-4 p-4 sm:p-5">
        <p className="text-xl font-bold leading-snug sm:text-2xl">
          <RichText text={stem} />
        </p>

        {/* ---- answer area ---- */}
        {q.format === "numberline" && (
          <NumberLineTool
            range={q.range}
            value={pick}
            onChange={(v) => {
              if (!locked) {
                setPick(v);
                setLineUsed(true);
              }
            }}
          />
        )}

        {q.format === "compare" && (
          <div className="grid grid-cols-2 gap-3">
            {[q.a, q.b].map((v) => (
              <Btn key={v} className="min-h-20 text-4xl" variant={pick === v ? "chosen" : "choice"} disabled={locked} onClick={() => setPick(v)}>
                <Num n={v} />
              </Btn>
            ))}
          </div>
        )}

        {q.format === "order" && <OrderInput list={q.list} value={order} onChange={setOrder} locked={locked} />}

        {(q.format === "numeric" || q.format === "story") && !locked && <Keypad value={typed} onChange={setTyped} />}
        {(q.format === "numeric" || q.format === "story") && locked && (
          <p className="text-center text-3xl font-extrabold">
            <RichText text={typed} />
          </p>
        )}

        {q.format === "explain" && (
          <ExplainInput q={q} agree={agree} setAgree={setAgree} text={text} setText={setText} locked={locked} />
        )}

        {/* ---- helpers: hints + number line tool ---- */}
        {!locked && (
          <div className="flex flex-wrap gap-2">
            <Btn variant="soft" size="md" onClick={showHint} disabled={hints >= 2}>
              <BulbIcon /> {hints >= 2 ? tr("noMoreHints", lang) : hints === 0 ? tr("hint1", lang) : tr("hint2", lang)}
            </Btn>
            {q.format !== "numberline" && (
              <Btn variant="outline" size="md" onClick={toggleLine} aria-pressed={lineOpen}>
                {lineOpen ? tr("lineOff", lang) : tr("lineOn", lang)}
              </Btn>
            )}
          </div>
        )}
        {hints > 0 && (
          <ol className="space-y-2">
            {q.hints.slice(0, hints).map((h, i) => (
              <li key={i} className="flex gap-2 rounded-xl bg-warn-soft p-3 text-warn">
                <span className="font-extrabold">{i + 1}.</span>
                <span>
                  <RichText text={tq(h, lang, q)} />
                </span>
              </li>
            ))}
          </ol>
        )}
        {q.format !== "numberline" && lineOpen && (
          <div className="space-y-1">
            {q.lineAuto && <p className="text-sm font-bold text-secondary">{tr("lineAutoNote", lang)}</p>}
            <NumberLineTool range={q.range} value={scratch} onChange={(v) => { setScratch(v); setLineUsed(true); }} startHint={q.a} />
          </div>
        )}

        {!locked && (
          <Btn className="w-full" onClick={submit} disabled={!response || busy}>
            {busy ? tr("checking", lang) : tr("check", lang)}
          </Btn>
        )}
      </section>

      {/* ---- feedback below the task ---- */}
      {answered && (
        <section
          className={cn(
            "rounded-2xl border-2 p-4 animate-pop",
            answered.attempt?.correct ? "border-success/30 bg-success-soft" : "border-rethink/30 bg-rethink-soft",
          )}
          aria-live="polite"
        >
          <h2 className={cn("text-xl font-extrabold", answered.attempt?.correct ? "text-success" : "text-rethink")}>
            {answered.attempt?.correct ? `★ ${tr("wellDone", lang)}` : tr("thinkAgain", lang)}
          </h2>
          {answered.text && (
            <p className="mt-1 text-lg text-foreground">
              <RichText text={answered.text[lang]} />
            </p>
          )}
          {q.format === "explain" && answered.judgedBy && (
            <p className="mt-2">
              <Tag tone={answered.judgedBy === "demo" ? "warn" : "muted"}>
                {answered.judgedBy === "ai"
                  ? tr("aiJudged", lang)
                  : answered.judgedBy === "demo"
                    ? tr("demoResponse", lang)
                    : answered.judgedBy === "neutral"
                      ? "AI ≠ tablet"
                      : tr("localJudged", lang)}
              </Tag>
            </p>
          )}
          <p className="mt-3 rounded-lg bg-card/70 p-2 text-sm text-muted-foreground">
            <span className="font-bold">{tr("why", lang)}</span> {answered.decision.reason[lang]}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {answered.decision.rule === "ALT" || answered.decision.rule === "PREREQ" ? (
              <Btn className="flex-1" variant="secondary" onClick={next}>
                {tr("reteachGo", lang)} →
              </Btn>
            ) : (
              <>
                <Btn className="flex-1" onClick={next}>
                  {tr("nextQ", lang)} →
                </Btn>
                <Btn variant="outline" onClick={() => go("feedback")}>
                  {tr("seeFeedback", lang)}
                </Btn>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderInput({ list, value, onChange, locked }: { list: number[]; value: number[]; onChange: (v: number[]) => void; locked: boolean }) {
  const { lang } = useSettings();
  const left = list.filter((n) => !value.includes(n));
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{tr("orderTap", lang)}</p>
      <div className="flex min-h-16 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/50 p-2">
        {value.map((v, i) => (
          <button
            key={v}
            type="button"
            disabled={locked}
            onClick={() => onChange(value.filter((x) => x !== v))}
            className="flex h-14 min-w-14 items-center justify-center gap-1 rounded-xl border-2 border-secondary bg-accent px-3 text-2xl"
          >
            <span className="text-xs text-muted-foreground">{i + 1}.</span>
            <Num n={v} />
          </button>
        ))}
        {value.length > 0 && !locked && left.length > 0 && <span className="text-muted-foreground">→</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {left.map((v) => (
          <Btn key={v} variant="choice" className="min-w-16" disabled={locked} onClick={() => onChange([...value, v])}>
            <Num n={v} />
          </Btn>
        ))}
        {value.length > 0 && !locked && (
          <Btn variant="ghost" size="md" onClick={() => onChange([])}>
            {tr("orderReset", lang)}
          </Btn>
        )}
      </div>
    </div>
  );
}

function ExplainInput({
  q,
  agree,
  setAgree,
  text,
  setText,
  locked,
}: {
  q: Question;
  agree: boolean | null;
  setAgree: (b: boolean) => void;
  text: string;
  setText: (s: string) => void;
  locked: boolean;
}) {
  const { lang } = useSettings();
  const starters = STARTERS[q.claim ?? "M1"];
  const add = (s: string) => setText((text + (text && !text.endsWith(" ") ? " " : "") + s).slice(0, CONFIG.EXPLANATION_MAX_CHARS));
  return (
    <div className="space-y-3">
      <p className="font-bold">{tr("agreeQ", lang)}</p>
      <div className="grid grid-cols-2 gap-2">
        <Btn variant={agree === true ? "chosen" : "choice"} className="text-lg" disabled={locked} onClick={() => setAgree(true)}>
          {tr("agreeYes", lang)}
        </Btn>
        <Btn variant={agree === false ? "chosen" : "choice"} className="text-lg" disabled={locked} onClick={() => setAgree(false)}>
          {tr("agreeNo", lang)}
        </Btn>
      </div>
      <label className="block font-bold" htmlFor="why-text">
        {tr("writeWhy", lang)}
      </label>
      <textarea
        id="why-text"
        value={text}
        disabled={locked}
        maxLength={CONFIG.EXPLANATION_MAX_CHARS}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-xl border-2 border-input bg-card p-3 text-lg outline-none focus:border-secondary"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{tr("starters", lang)}</span>
        <span>{fill(STR.chars[lang], { n: text.length })}</span>
      </div>
      {!locked && (
        <div className="flex flex-wrap gap-2">
          {starters.map((s) => (
            <Btn key={s.en} variant="soft" size="md" onClick={() => add(s[lang])}>
              {s[lang]}…
            </Btn>
          ))}
        </div>
      )}
    </div>
  );
}
