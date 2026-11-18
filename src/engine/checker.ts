// The checker grades every answer LOCALLY. Correct answers are always computed here
// from the numbers of the question — we never trust an answer that came from the AI.
// It also spots the two misconceptions:
//   M1: ignores the minus sign ("-8 is greater than -3 because 8 > 3")
//   M2: thinks subtraction always makes a number smaller ("5 - (-3) = 2")

import type { ExplainLabel, MisTag, Question, Response } from "./types";

// ---------- correct answers ----------

/** The number answer for numberline / compare / numeric / story questions. */
export function correctNumber(q: Question): number {
  switch (q.format) {
    case "numberline":
      return q.a; // place the number a
    case "compare":
      return q.ask === "greater" ? Math.max(q.a, q.b) : Math.min(q.a, q.b);
    default:
      return q.op === "+" ? q.a + q.b : q.a - q.b;
  }
}

/** Ordering: smallest to largest. */
export function correctOrder(list: number[]): number[] {
  return [...list].sort((x, y) => x - y);
}

// ---------- misconception answers (what a learner with M1/M2 would say) ----------

/** M1 for compare: picks by the size of the digit, ignoring the sign. */
export function m1CompareChoice(q: Question): number {
  const absA = Math.abs(q.a);
  const absB = Math.abs(q.b);
  if (q.ask === "greater") return absA > absB ? q.a : q.b;
  return absA < absB ? q.a : q.b;
}

/** M1 orderings: (1) negatives sorted by digit size, e.g. -3, -8, 0, 4; (2) sort by digit size only. */
export function m1Orders(list: number[]): number[][] {
  const neg = list.filter((n) => n < 0).sort((x, y) => Math.abs(x) - Math.abs(y));
  const rest = list.filter((n) => n >= 0).sort((x, y) => x - y);
  const byDigit = [...list].sort((x, y) => Math.abs(x) - Math.abs(y) || x - y);
  return [[...neg, ...rest], byDigit];
}

/** M2 for a - (negative b): the learner subtracts the size of b, e.g. 5 - (-3) -> 2. */
export function m2Answer(q: Question): number | null {
  if (q.op === "-" && q.b < 0) return q.a - Math.abs(q.b);
  return null;
}

/** M1 for arithmetic: the sign is dropped somewhere. */
export function m1Answers(q: Question): number[] {
  const correct = correctNumber(q);
  const out = new Set<number>();
  if (correct !== 0) out.add(-correct); // right size, sign lost
  const absA = Math.abs(q.a);
  const absB = Math.abs(q.b);
  out.add(q.op === "+" ? absA + absB : absA - absB); // all minus signs ignored
  if (q.op === "+" && q.b < 0) out.add(q.a + absB); // minus on b ignored
  if (q.op === "+" && q.a < 0) out.add(absA + q.b); // minus on a ignored
  out.delete(correct);
  return [...out];
}

const same = (x: number[], y: number[]) => x.length === y.length && x.every((v, i) => v === y[i]);

export interface Grade {
  correct: boolean;
  tag: MisTag | null;
  label: ExplainLabel | null;
}

/** Grade a non-explain answer. Explanations are graded by gradeExplain below. */
export function grade(q: Question, r: Response): Grade {
  if (r.kind === "order") {
    const ok = same(r.values, correctOrder(q.list));
    const m1 = !ok && m1Orders(q.list).some((o) => same(o, r.values));
    return { correct: ok, tag: m1 ? "M1" : null, label: null };
  }
  if (r.kind === "number") {
    const want = correctNumber(q);
    if (r.value === want) return { correct: true, tag: null, label: null };
    let tag: MisTag | null = null;
    if (q.format === "compare") {
      if (r.value === m1CompareChoice(q)) tag = "M1";
    } else if (q.format === "numberline") {
      if (q.a !== 0 && r.value === -q.a) tag = "M1"; // placed on the wrong side of zero
    } else {
      const m2 = m2Answer(q);
      if (m2 !== null && r.value === m2) tag = "M2";
      else if (m1Answers(q).includes(r.value)) tag = "M1";
    }
    return { correct: false, tag, label: null };
  }
  // explain answers need text analysis
  const label = localExplain(q, r.text, r.agree);
  return explainGrade(q, r.agree, label);
}

/** Turn an explanation label into right/wrong + misconception tag. */
export function explainGrade(q: Question, agree: boolean, label: ExplainLabel): Grade {
  const claim = q.claim ?? "M1";
  if (agree) return { correct: false, tag: claim, label: label === "sound" ? "partial" : label };
  const correct = label === "sound" || label === "partial";
  const tag = label === "M1" || label === "M2" ? label : null;
  return { correct, tag, label };
}

// ---------- local explanation checker (keyword based) ----------

const LESS = "छोटा|छोटी|कम|less|smaller|lower|बाएँ|बाएं|बायें|left|नीचे|worse";
const MORE = "बड़ा|बड़ी|बडा|ज़्यादा|ज्यादा|greater|bigger|larger|more|दाएँ|दाएं|दायें|right side|ऊपर|higher";
const DISAGREE = /(ग़लत|गलत|wrong|सही नहीं|not right|is not right|isn'?t right|नहीं है सही)/;

/** Concept words that show real reasoning (spec: left, right, zero, number line, owe, udhaar, minus, बड़ा, छोटा, उधार). */
export const CONCEPT_WORDS = [
  "number line",
  "नंबर लाइन",
  "left",
  "बाएँ",
  "बाएं",
  "बायें",
  "right",
  "दाएँ",
  "दाएं",
  "दायें",
  "zero",
  "शून्य",
  "ज़ीरो",
  "जीरो",
  "owe",
  "debt",
  "udhaar",
  "udhar",
  "उधार",
  "कर्ज",
  "क़र्ज़",
  "minus",
  "माइनस",
  "lift",
  "basement",
  "नीचे",
  "ऊपर",
  "plus",
  "जोड़",
];

export function conceptHits(text: string): string[] {
  const t = text.toLowerCase();
  return CONCEPT_WORDS.filter((w) => t.includes(w));
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Find comparisons like "-8 is less than -3", "-3, -8 से बड़ा है", "-8 < -3" and say if each is true. */
function statedComparisons(t: string): Array<{ x: number; y: number; holds: boolean }> {
  const out: Array<{ x: number; y: number; holds: boolean }> = [];
  const num = "(-?\\s?\\d+)";
  const toN = (s: string) => Number(s.replace(/\s/g, ""));
  // English: X is greater/less than Y
  const en = new RegExp(`${num}\\s*(?:is\\s*)?(greater|bigger|larger|more|less|smaller|lower)\\s*(?:than)?\\s*${num}`, "g");
  for (const m of t.matchAll(en)) {
    const x = toN(m[1] ?? "");
    const y = toN(m[3] ?? "");
    const greater = /greater|bigger|larger|more/.test(m[2] ?? "");
    out.push({ x, y, holds: greater ? x > y : x < y });
  }
  // Hindi: X, Y से बड़ा/छोटा है
  const hi = new RegExp(`${num}\\s*,?\\s*${num}\\s*से\\s*(${MORE}|${LESS})`, "g");
  for (const m of t.matchAll(hi)) {
    const x = toN(m[1] ?? "");
    const y = toN(m[2] ?? "");
    const greater = new RegExp(MORE).test(m[3] ?? "");
    out.push({ x, y, holds: greater ? x > y : x < y });
  }
  // Symbols: X > Y or X < Y
  for (const m of t.matchAll(new RegExp(`${num}\\s*([<>])\\s*${num}`, "g"))) {
    const x = toN(m[1] ?? "");
    const y = toN(m[3] ?? "");
    out.push({ x, y, holds: m[2] === ">" ? x > y : x < y });
  }
  return out;
}

const hasNumber = (t: string, n: number) =>
  n < 0
    ? new RegExp(`-\\s?${Math.abs(n)}(?!\\d)`).test(t)
    : new RegExp(`(^|[^\\d-])${n}(?!\\d)`).test(t);

/**
 * Local explanation checker. Returns sound / partial / M1 / M2 / unclear.
 *  - "sound": the right direction (e.g. "-8 is smaller", "Raju is wrong") AND a concept word (number line, left, udhaar...)
 *  - "partial": only one of the two
 *  - "M1"/"M2": the learner repeats the wrong idea
 *  - "unclear": too short or nothing we can recognise
 */
export function localExplain(q: Question, rawText: string, agree: boolean): ExplainLabel {
  const t = normalise(rawText);
  const claim = q.claim ?? "M1";
  if (agree) return claim;
  if (t.replace(/[^\p{L}\p{N}]/gu, "").length < 4) return "unclear";

  const concepts = conceptHits(t).length;
  const disagree = DISAGREE.test(t);
  let good = disagree;
  let wrongIdea = false;

  if (claim === "M1") {
    // Raju claims q.a > q.b where q.a is the more negative number.
    const lo = Math.min(q.a, q.b);
    const hi = Math.max(q.a, q.b);
    for (const c of statedComparisons(t)) {
      const aboutUs = [lo, hi].includes(c.x) && [lo, hi].includes(c.y) && c.x !== c.y;
      if (!aboutUs) continue;
      if (c.holds) good = true;
      else wrongIdea = true;
    }
    if (new RegExp(`-\\s?${Math.abs(lo)}\\s*(?:है|is)?\\s*(?:${LESS})`).test(t)) good = true;
    if (new RegExp(`-\\s?${Math.abs(hi)}\\s*(?:है|is)?\\s*(?:${MORE})`).test(t)) good = true;
    // "-8 बड़ा है" on its own repeats Raju's idea
    if (new RegExp(`-\\s?${Math.abs(lo)}\\s*(?:है|is)?\\s*(?:${MORE})`).test(t)) wrongIdea = true;
    if (new RegExp(`${Math.abs(lo)}[^.।]{0,25}(उधार|udhaar|udhar|owe|debt|कर्ज)`).test(t)) good = true;
  } else {
    // Meena claims a - (negative b) = a - |b|. The right answer is a + |b|.
    const right = q.a - q.b;
    const wrong = q.a - Math.abs(q.b);
    if (hasNumber(t, right)) good = true;
    if (/(plus|जोड़|add|बढ़|increase|minus minus|दो minus|double minus|two minus|उधार हट|debt (is )?removed|हट गया)/.test(t)) good = true;
    if (hasNumber(t, wrong) && !hasNumber(t, right) && !disagree) wrongIdea = true;
  }

  if (wrongIdea && !good) return claim;
  if (good && concepts >= 1) return "sound";
  if (good || concepts >= 1) return "partial";
  return "unclear";
}

/** Group labels so we can compare the AI judgement with the local one. */
export function labelGroup(l: ExplainLabel): "good" | "M1" | "M2" | "unclear" {
  return l === "sound" || l === "partial" ? "good" : l;
}
