// AI client. AI is OPTIONAL: every call has an 8 second timeout, a body under 2 KB and NO retry.
// If anything goes wrong (offline, slow, error, bad JSON, invalid content) we return { ok: false }
// and the caller silently uses the local fallback. The banner is switched on here.
//
// The endpoint is api/ai.ts (a Vercel serverless function). It does not exist in the Lovable
// preview, so there the fallback path runs — exactly what a learner on a bad connection sees.

import { DEMO_EVALUATIONS, DEMO_QUESTIONS } from "@/data/demoAi";
import { GENERIC_FEEDBACK } from "@/data/i18n";
import { CONFIG } from "./config";
import { correctNumber } from "./checker";
import { numbersOf } from "./selector";
import { getData, getSession, setSession } from "./storage";
import type { ExplainLabel, Format, L, Level, MisTag, Question, SkillId, Source } from "./types";

export type AiResult<T> = { ok: true; data: T; source: Source } | { ok: false; reason: string };

const enc = new TextEncoder();
const byteLen = (s: string) => enc.encode(s).length;

function fail<T>(reason: string, opts: { slow?: boolean; banner?: boolean } = {}): AiResult<T> {
  const banner = opts.banner ?? true;
  console.warn("[Ank Saathi AI Fallback]:", reason);
  if (banner) setSession({ fallbackActive: true, skipLeft: CONFIG.AI_SKIP_AFTER_FAIL, slowNet: opts.slow ?? getSession().slowNet });
  return { ok: false, reason };
}

/** One AI call. `demo` returns a recorded sample when Demo mode is on. */
async function callAI<T>(
  action: "generate_question" | "evaluate_explanation",
  payload: Record<string, unknown>,
  validate: (raw: unknown) => T | null,
  demo: () => unknown[],
): Promise<AiResult<T>> {
  const { settings } = getData();
  const s = getSession();

  // About -> "Simulate slow network" forces the fallback.
  if (settings.simulateSlow) return fail("simulated slow network", { slow: true });

  // Demo mode: recorded outputs, no network, still validated.
  if (settings.demoMode) {
    for (const raw of demo()) {
      const v = validate(raw);
      if (v) return { ok: true, data: v, source: "demo" };
    }
    return fail("no matching demo response", { banner: false });
  }

  // After a failure we stay offline for a few questions (saves time and data).
  if (s.skipLeft > 0) {
    setSession({ skipLeft: s.skipLeft - 1 });
    return { ok: false, reason: "cooling down after a failure" };
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) return fail("offline");

  const body = JSON.stringify({ action, payload });
  const size = byteLen(body);
  if (size > CONFIG.AI_MAX_PAYLOAD_BYTES) return fail("payload too big", { banner: false });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.AI_TIMEOUT_MS);
  const started = Date.now();
  setSession({ bytes: getSession().bytes + size, aiCalls: getSession().aiCalls + 1 });
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: ctrl.signal,
    });
    const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
    if (!res.ok || !isJson) return fail(`http ${res.status}`);
    const text = await res.text();
    setSession({ bytes: getSession().bytes + byteLen(text) });
    const ms = Date.now() - started;
    const parsed = JSON.parse(text) as { ok?: boolean; data?: unknown };
    const v = validate(parsed.data ?? parsed);
    if (!v) return fail("invalid AI output", { slow: ms > CONFIG.SLOW_MS });
    setSession({ fallbackActive: false, slowNet: ms > CONFIG.SLOW_MS });
    return { ok: true, data: v, source: "ai" };
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === "AbortError";
    return fail(timedOut ? "timeout" : "network error", { slow: timedOut });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 1. generate_question
// ---------------------------------------------------------------------------

export const AI_FORMATS: Format[] = ["numberline", "compare", "numeric", "story"];

export interface GenRequest {
  skill: SkillId;
  level: Level;
  format: Format;
  last5: { f: Format; ok: boolean; tag: MisTag | null }[];
  avoid: string[]; // signatures of the last 5 questions, e.g. "numeric:-3+5"
  misconception: MisTag | null;
}

export const signature = (format: Format, a: number, b: number, op: string) => `${format}:${a}${op}${b}`;

const isInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);
const str = (x: unknown, max = 300): x is string => typeof x === "string" && x.trim().length > 2 && x.length <= max;

/** Does a question with these numbers belong to this skill and level? */
export function fitsLevel(skill: SkillId, level: Level, format: Format, a: number, b: number, op: "+" | "-"): boolean {
  const nums = numbersOf({ format, a, b, op, list: [] });
  if (!nums.every((n) => n >= CONFIG.NUMBER_MIN && n <= CONFIG.NUMBER_MAX)) return false;
  const small = nums.every((n) => n >= CONFIG.LEVEL1_MIN && n <= CONFIG.LEVEL1_MAX);
  if (skill === "S0") return format === "numberline" && a < 0 && (level < 3 ? small : true);
  if (skill === "S1") return format === "compare" && a !== b && (a < 0 || b < 0) && (level === 1 ? small : true);
  if (skill === "S2" && op !== "+") return false;
  if (skill === "S3" && op !== "-") return false;
  if (format !== "numeric" && format !== "story") return false;
  if (level === 1) return small && (a < 0 || b < 0 || nums[2]! < 0);
  if (level === 2) return a < 0 !== b < 0 || (a < 0 && b < 0);
  // level 3: subtracting a negative, or a story problem
  return (op === "-" && b < 0) || format === "story" || skill === "S2";
}

export function validateQuestion(raw: unknown, want: GenRequest, why: L): Question | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const format = String(r["format"] ?? "").trim() as Format;
  if (!AI_FORMATS.includes(format) || format !== want.format) return null;
  if (!str(r["stem_hi"]) || !str(r["stem_en"]) || !str(r["hint1"], 200) || !str(r["hint2"], 200)) return null;
  const n = r["numbers"] as Record<string, unknown> | undefined;
  if (!n) return null;
  const rawA = n["a"];
  const rawB = n["b"];
  const a = typeof rawA === "number" ? Math.round(rawA) : typeof rawA === "string" ? parseInt(rawA, 10) : NaN;
  const b = typeof rawB === "number" ? Math.round(rawB) : typeof rawB === "string" ? parseInt(rawB, 10) : NaN;
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const op = n["operation"] === "-" ? "-" : "+";
  if (!fitsLevel(want.skill, want.level, format, a, b, op)) return null;
  if (want.avoid.includes(signature(format, a, b, op))) return null; // no repeats of the last 5

  const hint1_en = typeof r["hint1_en"] === "string" ? (r["hint1_en"] as string) : (r["hint1"] as string);
  const hint2_en = typeof r["hint2_en"] === "string" ? (r["hint2_en"] as string) : (r["hint2"] as string);
  const pattern: MisTag = want.skill === "S3" && b < 0 ? "M2" : "M1";
  const q: Question = {
    uid: `ai-${Date.now().toString(36)}`,
    templateId: `ai-${want.skill}-${format}`,
    skill: want.skill,
    level: want.level,
    format,
    a,
    b,
    op,
    list: [],
    ask: "greater",
    claim: null,
    stem: { hi: r["stem_hi"] as string, en: r["stem_en"] as string },
    hints: [
      { hi: r["hint1"] as string, en: hint1_en },
      { hi: r["hint2"] as string, en: hint2_en },
    ],
    pattern,
    feedback: GENERIC_FEEDBACK,
    rubric: null,
    source: "ai",
    showLine: format === "numberline" || want.level === 1,
    lineAuto: false,
    range: numbersOf({ format, a, b, op, list: [] }).every((x) => Math.abs(x) <= 10) ? [-10, 10] : [-20, 20],
    why,
    isTwin: false,
    remediation: false,
  };
  // The app computes the answer itself (never from AI). Must stay inside the range.
  const ans = correctNumber(q);
  if (ans < CONFIG.NUMBER_MIN || ans > CONFIG.NUMBER_MAX) return null;
  return q;
}

export async function aiGenerateQuestion(want: GenRequest, why: L): Promise<AiResult<Question>> {
  const res = await callAI(
    "generate_question",
    { ...want },
    (raw) => validateQuestion(raw, want, why),
    () => DEMO_QUESTIONS,
  );
  if (res.ok) res.data.source = res.source;
  return res;
}

// ---------------------------------------------------------------------------
// 2. evaluate_explanation
// ---------------------------------------------------------------------------

export interface EvalResult {
  label: ExplainLabel;
  confidence: number;
  feedback_hi: string;
  feedback_en: string | null;
}

const LABELS: ExplainLabel[] = ["sound", "M1", "M2", "partial", "unclear"];

export function validateEval(raw: unknown): EvalResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const label = r["label"] as ExplainLabel;
  const confidence = r["confidence"];
  const fb = r["feedback_hi"];
  if (!LABELS.includes(label)) return null;
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) return null;
  if (typeof fb !== "string" || fb.trim().length === 0 || fb.trim().split(/\s+/).length > 25) return null;
  const en = typeof r["feedback_en"] === "string" ? (r["feedback_en"] as string) : null;
  return { label, confidence, feedback_hi: fb, feedback_en: en };
}

export async function aiEvaluate(
  question: string,
  rubric: string,
  text: string,
  localLabel: ExplainLabel,
): Promise<AiResult<EvalResult>> {
  const learnerText = text.slice(0, CONFIG.EXPLANATION_MAX_CHARS);
  return callAI(
    "evaluate_explanation",
    { question: question.slice(0, 400), rubric: rubric.slice(0, 300), text: learnerText },
    validateEval,
    // demo: the recorded reply closest to what the tablet already thinks
    () => [...DEMO_EVALUATIONS].sort((x) => ((x as { label: string }).label === localLabel ? -1 : 1)),
  );
}
