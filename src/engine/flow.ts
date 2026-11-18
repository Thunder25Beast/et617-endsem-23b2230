// Glue between the screens and the engine: build the next question (AI first, local fallback),
// grade an answer (explanations: local keywords + optional AI cross-check), and save the attempt.

import { BANK } from "@/data/questions";
import { STR } from "@/data/i18n";
import { AI_FORMATS, aiEvaluate, aiGenerateQuestion, signature } from "./ai";
import { CONFIG } from "./config";
import { explainGrade, grade, labelGroup, localExplain, type Grade } from "./checker";
import { decide, nextFromBank, numbersKey } from "./selector";
import { getData, logEvent, newId, updateLearner, type FeedbackRecord, type Learner } from "./storage";
import { tq } from "./text";
import type { Attempt, Decision, L, Question, Response } from "./types";

const NO_AI_RULES = new Set(["ALT", "PREREQ", "REMEDIATION"]);

/** Real-life settings for AI story questions. Rotating them keeps stories from all sounding the same. */
const CONTEXTS = [
  "money: udhaar (debt) at a kirana shop",
  "a mall lift with basement floors",
  "temperature in a hill town at night",
  "points won and lost in a school quiz",
  "a diver or submarine below sea level",
  "runs and penalty runs in a gully cricket game",
  "steps forward and back on a number line game",
  "a bank balance with deposits and withdrawals",
];

function pickContext(l: Learner): string {
  const i = (l.engine.attempts.length + Math.floor(Math.random() * 3)) % CONTEXTS.length;
  return CONTEXTS[i] as string;
}

/** The first decision of a practice session (uses only the profile signal). */
export function startSession(l: Learner): Decision {
  const { decision, state } = decide(l.engine, null, null);
  updateLearner(l.id, (x) => ({ ...x, engine: state, plan: decision, decisions: [...x.decisions, decision] }));
  logEvent(l.id, "decision", { rule: decision.rule, reason: decision.reason.en, signals: decision.signals });
  if (decision.rule === "PREREQ") {
    updateLearner(l.id, (x) => ({
      ...x,
      lastFeedback: { q: null, attempt: null, decision, text: null, judgedBy: null, response: "" },
    }));
  }
  return decision;
}

/** Build the next question. Tries the AI for new variants; any failure -> local bank, silently. */
export async function buildNext(l: Learner, decision: Decision): Promise<Question> {
  const bankQ = nextFromBank(l.engine, decision, Math.random);
  if (NO_AI_RULES.has(decision.rule) || !AI_FORMATS.includes(bankQ.format)) return bankQ;

  const last = l.engine.attempts.slice(-CONFIG.NO_REPEAT_LAST);
  const allSigs = new Set(l.engine.attempts.map((a) => a.sig));
  const res = await aiGenerateQuestion(
    {
      skill: bankQ.skill,
      level: bankQ.level,
      format: bankQ.format,
      last5: last.map((a) => ({ f: a.format, ok: a.correct, tag: a.tag })),
      // the model sees the most recent ones; the validator checks against every one this session
      avoid: [...allSigs].slice(-CONFIG.AI_AVOID_SENT),
      misconception: last.at(-1)?.tag ?? null,
      context: pickContext(l),
    },
    decision.reason,
    allSigs,
  );
  logEvent(l.id, "ai_call", { action: "generate_question", ok: res.ok, reason: res.ok ? res.source : res.reason });
  if (!res.ok) return bankQ;
  const q = res.data;
  q.lineAuto = decision.lineAuto;
  q.showLine = q.showLine || decision.lineAuto;
  return q;
}

export interface Graded {
  grade: Grade;
  text: L;
  judgedBy: FeedbackRecord["judgedBy"];
}

/** Feedback text from the item for this result. */
export function itemFeedback(q: Question, g: Grade): L {
  const pick = g.correct ? q.feedback.correct : g.tag === "M1" ? (q.feedback.M1 ?? q.feedback.other) : g.tag === "M2" ? (q.feedback.M2 ?? q.feedback.other) : q.feedback.other;
  return { hi: tq(pick, "hi", q), en: tq(pick, "en", q) };
}

/** Grade any answer. Explanations go through the local checker, then (optionally) the AI. */
export async function gradeAnswer(l: Learner, q: Question, r: Response): Promise<Graded> {
  if (r.kind !== "explain") {
    const g = grade(q, r);
    return { grade: g, text: itemFeedback(q, g), judgedBy: "local" };
  }
  const local = localExplain(q, r.text, r.agree);
  const localGrade = explainGrade(q, r.agree, local);
  if (r.agree || r.text.trim().length < 4) return { grade: localGrade, text: itemFeedback(q, localGrade), judgedBy: "local" };

  const res = await aiEvaluate(tq(q.stem, "en", q), q.rubric ? tq(q.rubric, "en", q) : "", r.text, local);
  logEvent(l.id, "ai_call", { action: "evaluate_explanation", ok: res.ok, reason: res.ok ? res.source : res.reason });
  if (!res.ok || res.data.confidence < CONFIG.AI_MIN_CONFIDENCE) {
    return { grade: localGrade, text: itemFeedback(q, localGrade), judgedBy: "local" };
  }
  // Cross-check with the local keyword checker. Disagreement -> neutral message, no judgement.
  if (labelGroup(res.data.label) !== labelGroup(local)) {
    return {
      grade: { correct: !r.agree, tag: null, label: "unclear" },
      text: { hi: STR.askDidi.hi, en: STR.askDidi.en },
      judgedBy: "neutral",
    };
  }
  const g = explainGrade(q, r.agree, res.data.label);
  const fallback = itemFeedback(q, g);
  return {
    grade: g,
    text: { hi: res.data.feedback_hi, en: res.data.feedback_en ?? fallback.en },
    judgedBy: res.source === "demo" ? "demo" : "ai",
  };
}

export function responseString(r: Response): string {
  if (r.kind === "number") return String(r.value);
  if (r.kind === "order") return r.values.join(", ");
  return `${r.agree ? "agree" : "disagree"}: ${r.text}`;
}

/** Save the attempt, run the decision rule, log everything. Returns the decision. */
export function commitAttempt(
  learnerId: string,
  q: Question,
  r: Response,
  graded: Graded,
  meta: { hints: number; seconds: number; lineUsed: boolean },
): Decision {
  const l = getData().learners.find((x) => x.id === learnerId);
  if (!l) throw new Error("learner missing");
  const attempt: Attempt = {
    id: newId(),
    ts: Date.now(),
    qid: q.uid,
    templateId: q.templateId,
    skill: q.skill,
    level: q.level,
    format: q.format,
    correct: graded.grade.correct,
    hints: meta.hints,
    seconds: meta.seconds,
    tag: graded.grade.tag,
    explainLabel: graded.grade.label,
    lineUsed: meta.lineUsed,
    source: q.source,
    response: responseString(r),
    remediation: q.remediation,
    isTwin: q.isTwin,
    sig: signature(q.format, q.a, q.b, q.op),
    nums: numbersKey(q.a, q.b, q.list),
  };
  const { decision, state } = decide(l.engine, attempt, q);
  const record: FeedbackRecord = { q, attempt, decision, text: graded.text, judgedBy: graded.judgedBy, response: attempt.response };
  updateLearner(learnerId, (x) => ({
    ...x,
    engine: state,
    plan: decision,
    decisions: [...x.decisions, decision],
    lastFeedback: record,
    qCount: x.qCount + 1,
  }));
  logEvent(learnerId, "submit", { ...attempt, question: { a: q.a, b: q.b, op: q.op, list: q.list, format: q.format } });
  logEvent(learnerId, "decision", { rule: decision.rule, reason: decision.reason.en, signals: decision.signals, next: `${decision.skill}L${decision.level}` });
  return decision;
}

export const bankSize = BANK.length;
