// The SELECTOR decides what happens after every attempt (the decision rule)
// and builds the next question from the local bank.
//
// Decision rule, checked in this order (thresholds in engine/config.ts):
//   1. PREREQUISITE  3 wrong in a row on the skill, OR the quick check showed a position gap,
//                    OR a wrong answer after an alternative explanation was already shown
//                    for the same misconception  -> number line mini lesson + 2 easy S0 tasks, then return.
//   2. ALTERNATIVE   wrong answer with M1/M2 for the 1st or 2nd time
//                    -> a different representation (number line, then udhaar, then lift) + a twin question.
//   3. HARDER        last 2 correct, hints <= 1, each under 45 s, explanation sound -> level up / next skill.
//   4. OTHERWISE     same level, new variant. 2 hints used (or Learn skipped) -> number line turns on.
//
// The three signals used:
//   profile     = quick check result (start skill, position gap, M1 suspected)
//   performance = right/wrong and misconception tag
//   interaction = hints used, seconds taken, Learn chunks skipped

import { BANK } from "@/data/questions";
import { REASONS, REP_NAMES, SKILL_NAMES, TAG_DESC } from "@/data/i18n";
import { CONFIG } from "./config";
import { correctNumber, correctOrder } from "./checker";
import { fill } from "./text";
import type {
  Attempt,
  Decision,
  EngineState,
  Format,
  ItemTemplate,
  L,
  Level,
  MisTag,
  Question,
  Range,
  Rep,
  SkillId,
} from "./types";

export const SKILLS: SkillId[] = ["S0", "S1", "S2", "S3"];
export const REPS: Rep[] = ["numberline", "udhaar", "lift"];

export type Rng = () => number;

const randInt = (rng: Rng, [lo, hi]: Range) => lo + Math.floor(rng() * (hi - lo + 1));

/** Which Learn chunk teaches which skill (used for the "skipped content" signal). */
export function chunkFor(skill: SkillId): "a" | "b" | "c" {
  return skill === "S0" ? "a" : skill === "S1" ? "b" : "c";
}

/** Build one bilingual sentence from several pieces with the same placeholders. */
function join(parts: L[], vars: Record<string, string | number>): L {
  return {
    hi: parts.map((p) => fill(p.hi, vars)).join(""),
    en: parts.map((p) => fill(p.en, vars)).join(""),
  };
}

/** Skill and level names inside a reason sentence need both languages. */
function skillVars(skill: SkillId, level: Level) {
  return { skillHi: SKILL_NAMES[skill].hi, skillEn: SKILL_NAMES[skill].en, level };
}

function withSkill(p: L, skill: SkillId, level: Level, extra: Record<string, string | number> = {}): L {
  const v = skillVars(skill, level);
  return {
    hi: fill(p.hi, { ...extra, skill: v.skillHi, level }),
    en: fill(p.en, { ...extra, skill: v.skillEn, level }),
  };
}

const concat = (...ls: L[]): L => ({ hi: ls.map((l) => l.hi).join(""), en: ls.map((l) => l.en).join("") });

// ---------------------------------------------------------------------------
// Decision rule
// ---------------------------------------------------------------------------

/** Attempts on the current skill that count for the current level (since the last level change). */
export function recentAttempts(state: EngineState): Attempt[] {
  return state.attempts.filter(
    (a) => !a.remediation && a.skill === state.current.skill && a.ts >= state.windowStart,
  );
}

function nextStep(skill: SkillId, level: Level): { skill: SkillId; level: Level; done: boolean } {
  if (level < 3) return { skill, level: (level + 1) as Level, done: false };
  const i = SKILLS.indexOf(skill);
  if (i < SKILLS.length - 1) return { skill: SKILLS[i + 1] as SkillId, level: 1, done: false };
  return { skill, level: 3, done: true };
}

function signals(state: EngineState, last: Attempt | null) {
  const p = state.profile;
  return {
    profile: p.done
      ? `start ${p.startSkill}L${p.startLevel}; positionGap=${p.positionGap}; M1 suspected=${p.m1Suspected}`
      : "no quick check",
    performance: last
      ? `${last.correct ? "correct" : "wrong"}${last.tag ? ` (${last.tag})` : ""}${last.explainLabel ? `, explanation=${last.explainLabel}` : ""}`
      : "no attempt yet",
    interaction: last
      ? `hints=${last.hints}, ${last.seconds}s, line=${last.lineUsed ? "used" : "not used"}, learn skipped=${Boolean(state.learnSkipped[chunkFor(state.current.skill)])}`
      : `learn skipped=${Boolean(state.learnSkipped[chunkFor(state.current.skill)])}`,
  };
}

function baseDecision(state: EngineState, last: Attempt | null): Omit<Decision, "rule" | "reason"> {
  return {
    ts: Date.now(),
    skill: state.current.skill,
    level: state.current.level,
    rep: null,
    tag: null,
    lineAuto: false,
    twinOf: null,
    signals: signals(state, last),
  };
}

/**
 * Run the decision rule.
 * - attempt = null means "start of practice" (only the profile signal is available).
 * - Returns the decision and the updated engine state. Pure function: easy to test.
 */
export function decide(
  stateIn: EngineState,
  attempt: Attempt | null,
  question: Question | null,
): { decision: Decision; state: EngineState } {
  const state: EngineState = {
    ...stateIn,
    altCount: { ...stateIn.altCount },
    cleared: { ...stateIn.cleared },
    attempts: attempt ? [...stateIn.attempts, attempt] : stateIn.attempts,
  };
  const now = attempt ? attempt.ts + 1 : Date.now();
  const base = baseDecision(state, attempt);

  // ---- Start of a practice session ----
  if (!attempt) {
    if (state.profile.positionGap && !state.gapLessonDone) {
      state.gapLessonDone = true;
      state.remediation = { remaining: CONFIG.PREREQ_EASY_TASKS, returnTo: { ...state.current } };
      return {
        decision: { ...base, rule: "PREREQ", rep: "lift", skill: "S0", level: 1, lineAuto: true, reason: REASONS.prereqGap },
        state,
      };
    }
    const lineAuto = Boolean(state.learnSkipped[chunkFor(state.current.skill)]);
    let reason = withSkill(state.profile.done ? REASONS.start : REASONS.startNoCheck, state.current.skill, state.current.level);
    if (state.profile.m1Suspected && state.current.skill === "S1") reason = concat(reason, REASONS.profileM1);
    if (lineAuto) reason = concat(reason, REASONS.autoLineSkipped);
    return { decision: { ...base, rule: "START", lineAuto, reason }, state };
  }

  // ---- Inside the prerequisite detour: count the easy S0 tasks, then return ----
  if (attempt.remediation && state.remediation) {
    const remaining = state.remediation.remaining - 1;
    if (remaining > 0) {
      state.remediation = { ...state.remediation, remaining };
      const n = CONFIG.PREREQ_EASY_TASKS - remaining + 1;
      return {
        decision: {
          ...base,
          rule: "REMEDIATION",
          skill: "S0",
          level: 1,
          lineAuto: true,
          reason: join([REASONS.remediation], { n, total: CONFIG.PREREQ_EASY_TASKS }),
        },
        state,
      };
    }
    const back = state.remediation.returnTo;
    state.remediation = null;
    state.current = { ...back };
    state.windowStart = now; // fresh start at the old level
    return {
      decision: { ...base, rule: "RETURN", skill: back.skill, level: back.level, reason: withSkill(REASONS.returned, back.skill, back.level) },
      state,
    };
  }

  const recent = recentAttempts(state).slice(-CONFIG.WINDOW);
  const pendingAlt = state.altPendingTag;
  state.altPendingTag = null; // the twin question has now been answered (or another task came)

  // ---- 1. PREREQUISITE ----
  const wrongRun = CONFIG.WRONG_IN_A_ROW_FOR_PREREQ;
  const threeWrong = recent.length >= wrongRun && recent.slice(-wrongRun).every((a) => !a.correct);
  const afterAlt =
    !attempt.correct &&
    attempt.tag !== null &&
    (pendingAlt === attempt.tag || state.altCount[attempt.tag] >= CONFIG.MAX_ALT_PER_MISCONCEPTION);
  if (threeWrong || afterAlt) {
    state.remediation = { remaining: CONFIG.PREREQ_EASY_TASKS, returnTo: { ...state.current } };
    const reason = threeWrong
      ? join([REASONS.prereq3], { n: wrongRun })
      : join([REASONS.prereqAfterAlt], { tag: attempt.tag ?? "" });
    return {
      decision: { ...base, rule: "PREREQ", rep: "lift", tag: attempt.tag, skill: "S0", level: 1, lineAuto: true, reason },
      state,
    };
  }

  // ---- 2. ALTERNATIVE EXPLANATION ----
  if (!attempt.correct && attempt.tag) {
    const tag: MisTag = attempt.tag;
    const rep = REPS[state.altCount[tag] % REPS.length] as Rep;
    state.altCount[tag] += 1;
    state.altPendingTag = tag;
    const reason: L = {
      hi: fill(REASONS.alt.hi, { tag, desc: TAG_DESC[tag].hi, rep: REP_NAMES[rep].hi }),
      en: fill(REASONS.alt.en, { tag, desc: TAG_DESC[tag].en, rep: REP_NAMES[rep].en }),
    };
    return {
      decision: { ...base, rule: "ALT", rep, tag, twinOf: question, lineAuto: true, reason },
      state,
    };
  }

  // ---- 3. HARDER ----
  const need = CONFIG.CORRECT_FOR_HARDER;
  const lastN = recent.slice(-need);
  const hints = lastN.reduce((s, a) => s + a.hints, 0);
  const allCorrect = lastN.length === need && lastN.every((a) => a.correct);
  const allFast = lastN.every((a) => a.seconds < CONFIG.FAST_SECONDS);
  const explained = lastN.filter((a) => a.explainLabel !== null);
  const explainOk = explained.every((a) => a.explainLabel === "sound");
  if (allCorrect && hints <= CONFIG.MAX_HINTS_FOR_HARDER && allFast && explainOk) {
    const step = nextStep(state.current.skill, state.current.level);
    state.cleared[state.current.skill] = Math.max(state.cleared[state.current.skill], state.current.level);
    state.current = { skill: step.skill, level: step.level };
    state.windowStart = now;
    const secs = lastN.map((a) => `${a.seconds}s`).join(", ");
    let reason = join([REASONS.harder], { n: need, h: hints, secs });
    if (explained.length > 0) reason = concat(reason, REASONS.harderSound);
    if (step.done) reason = concat(reason, REASONS.allDone);
    else if (step.skill !== attempt.skill) reason = concat(reason, withSkill(REASONS.nextSkill, step.skill, step.level));
    else reason = concat(reason, withSkill(REASONS.levelUp, step.skill, step.level));
    return { decision: { ...base, rule: "HARDER", skill: step.skill, level: step.level, reason }, state };
  }

  // ---- 4. OTHERWISE ----
  const byHints = attempt.hints >= CONFIG.HINTS_FOR_AUTO_LINE;
  const bySkip = !attempt.correct && Boolean(state.learnSkipped[chunkFor(state.current.skill)]);
  let reason: L = REASONS.same;
  if (attempt.correct && !allCorrect) reason = concat(reason, REASONS.sameNotYet);
  if (attempt.seconds >= CONFIG.FAST_SECONDS) reason = concat(reason, join([REASONS.sameSlow], { s: attempt.seconds }));
  if (attempt.explainLabel && attempt.explainLabel !== "sound") reason = concat(reason, REASONS.sameExplain);
  if (byHints) reason = concat(reason, REASONS.autoLineHints);
  else if (bySkip) reason = concat(reason, REASONS.autoLineSkipped);
  return { decision: { ...base, rule: "SAME", lineAuto: byHints || bySkip, reason }, state };
}

// ---------------------------------------------------------------------------
// Building questions
// ---------------------------------------------------------------------------

function lineRange(nums: number[]): Range {
  const ok = nums.every((n) => n >= CONFIG.LEVEL1_MIN && n <= CONFIG.LEVEL1_MAX);
  return ok ? [CONFIG.LEVEL1_MIN, CONFIG.LEVEL1_MAX] : [CONFIG.NUMBER_MIN, CONFIG.NUMBER_MAX];
}

/** Every number the learner will see or reach, so the number line is wide enough. */
export function numbersOf(q: Pick<Question, "format" | "a" | "b" | "op" | "list">): number[] {
  if (q.format === "order") return q.list;
  if (q.format === "numberline") return [q.a];
  if (q.format === "compare") return [q.a, q.b];
  return [q.a, q.b, q.op === "+" ? q.a + q.b : q.a - q.b];
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Key of one concrete number set, used to avoid showing the same numbers twice. */
export const numbersKey = (a: number, b: number, list: number[]) => `${a},${b},${list.join(" ")}`;

/** Fresh numbers with the same structure (used for variants and twin questions).
 *  `seen` holds numbersKey()s already used on this item; we try hard not to repeat them. */
export function freshNumbers(t: ItemTemplate, rng: Rng, avoid?: { a: number; b: number; list: number[] }, seen?: Set<string>) {
  for (let tries = 0; tries < 60; tries++) {
    const a = t.gen.a ? randInt(rng, t.gen.a) : (t.a ?? 0);
    const b = t.gen.b ? randInt(rng, t.gen.b) : (t.b ?? 0);
    let list = t.gen.list ? t.gen.list.map((r) => randInt(rng, r)) : (t.list ?? []);
    if (new Set(list).size !== list.length) continue; // numbers must be different
    if (list.length > 0) {
      list = shuffle(list, rng);
      if (list.every((v, i) => v === correctOrder(list)[i])) continue; // not already sorted
    }
    if (t.format === "compare" && a === b) continue;
    const same = avoid && a === avoid.a && b === avoid.b && list.join() === avoid.list.join();
    if (same) continue;
    // the first 40 tries also skip number sets the learner already saw (small ranges may run out)
    if (seen && tries < 40 && seen.has(numbersKey(a, b, list))) continue;
    return { a, b, list };
  }
  return { a: t.a ?? 0, b: t.b ?? 0, list: t.list ?? [] };
}

export interface BuildOpts {
  fresh: boolean;
  rng: Rng;
  why: L;
  lineAuto: boolean;
  isTwin?: boolean;
  remediation?: boolean;
  avoid?: { a: number; b: number; list: number[] };
  /** number sets already shown on this item */
  seen?: Set<string>;
}

/** Turn a bank item into a concrete question. */
export function instantiate(t: ItemTemplate, o: BuildOpts): Question {
  const nums = o.fresh ? freshNumbers(t, o.rng, o.avoid, o.seen) : { a: t.a ?? 0, b: t.b ?? 0, list: t.list ?? [] };
  const op = t.op ?? "+";
  const q: Question = {
    uid: `${t.id}-${Date.now().toString(36)}-${Math.floor(o.rng() * 1e6).toString(36)}`,
    templateId: t.id,
    skill: t.skill,
    level: t.level,
    format: t.format,
    a: nums.a,
    b: nums.b,
    op,
    list: nums.list,
    ask: t.ask ?? "greater",
    claim: t.claim ?? null,
    stem: t.stem,
    hints: t.hints,
    pattern: t.pattern,
    feedback: t.feedback,
    rubric: t.rubric ?? null,
    source: "bank",
    showLine: false,
    lineAuto: o.lineAuto,
    range: [CONFIG.LEVEL1_MIN, CONFIG.LEVEL1_MAX],
    why: o.why,
    isTwin: Boolean(o.isTwin),
    remediation: Boolean(o.remediation),
  };
  q.range = lineRange(numbersOf(q));
  // Level 1 shows the number line; level 2-3 make it optional. Number line tasks always need it.
  q.showLine = q.format === "numberline" || q.level === 1 || o.lineAuto;
  // sanity: the answer must exist inside the allowed range
  void correctNumber(q);
  return q;
}

/** Choose a bank item for a skill + level, avoiding the last few items and the last format. */
export function pickTemplate(
  skill: SkillId,
  level: Level,
  opts: {
    avoidIds: string[];
    lastFormat: Format | null;
    prefer?: Format[] | undefined;
    only?: Format[] | undefined;
    rng: Rng;
    /** templateId -> when it was last used; the least recently used item wins */
    lastUsed?: Map<string, number>;
  },
): ItemTemplate {
  let pool = BANK.filter((t) => t.skill === skill && t.level === level);
  if (opts.only) {
    const only = pool.filter((t) => opts.only?.includes(t.format));
    if (only.length) pool = only;
  }
  if (pool.length === 0) pool = BANK.filter((t) => t.skill === skill);
  const fresh = pool.filter((t) => !opts.avoidIds.includes(t.id));
  if (fresh.length) pool = fresh;
  const otherFormat = pool.filter((t) => t.format !== opts.lastFormat);
  if (otherFormat.length) pool = otherFormat;
  if (opts.prefer?.length) {
    const preferred = pool.filter((t) => opts.prefer?.includes(t.format));
    if (preferred.length) pool = preferred;
  }
  // Least recently used first (never-used items count as oldest), random among ties.
  // With only 1-5 items per level this stops the same item text coming back again and again.
  if (opts.lastUsed && pool.length > 1) {
    const when = (t: ItemTemplate) => opts.lastUsed?.get(t.id) ?? -1;
    const oldest = Math.min(...pool.map(when));
    pool = pool.filter((t) => when(t) === oldest);
  }
  return pool[Math.floor(opts.rng() * pool.length)] as ItemTemplate;
}

/** Which format we want next (sent to the AI as "wanted format"). */
export function wantedFormat(state: EngineState, rng: Rng): Format[] | undefined {
  if (state.profile.m1Suspected && state.current.skill === "S1") return ["compare", "order"];
  void rng;
  return undefined;
}

/** Build the next question from the bank, following the decision. */
export function nextFromBank(state: EngineState, decision: Decision, rng: Rng): Question {
  const seenIds = new Set(state.attempts.map((a) => a.templateId));
  const lastIds = state.attempts.slice(-CONFIG.NO_REPEAT_LAST).map((a) => a.templateId);
  const lastFormat = state.attempts.at(-1)?.format ?? null;
  const lastUsed = new Map<string, number>();
  state.attempts.forEach((a, i) => lastUsed.set(a.templateId, i));
  /** number sets this learner already saw on one item */
  const seenOn = (id: string) => new Set(state.attempts.filter((a) => a.templateId === id && a.nums).map((a) => a.nums as string));

  // ALT: twin question = same item, same structure, new numbers
  if (decision.rule === "ALT" && decision.twinOf) {
    const src = decision.twinOf;
    const t =
      BANK.find((x) => x.id === src.templateId) ??
      pickTemplate(src.skill, src.level, { avoidIds: [], lastFormat: null, only: [src.format], rng });
    return instantiate(t, {
      fresh: true,
      rng,
      why: decision.reason,
      lineAuto: true,
      isTwin: true,
      avoid: { a: src.a, b: src.b, list: src.list },
      seen: seenOn(t.id),
    });
  }

  // PREREQ / REMEDIATION: easy S0 number line tasks
  if (decision.rule === "PREREQ" || decision.rule === "REMEDIATION") {
    const t = pickTemplate("S0", 1, { avoidIds: lastIds, lastFormat: null, rng, lastUsed });
    return instantiate(t, { fresh: true, rng, why: decision.reason, lineAuto: true, remediation: true, seen: seenOn(t.id) });
  }

  const t = pickTemplate(decision.skill, decision.level, {
    avoidIds: lastIds,
    lastFormat,
    prefer: wantedFormat(state, rng),
    rng,
    lastUsed,
  });
  // first time an item is seen we use its authored numbers (e.g. the classic 5 - (-3)); later new numbers
  return instantiate(t, { fresh: seenIds.has(t.id), rng, why: decision.reason, lineAuto: decision.lineAuto, seen: seenOn(t.id) });
}
