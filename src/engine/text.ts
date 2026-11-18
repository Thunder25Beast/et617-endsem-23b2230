// Small text helpers: show numbers with their sign and fill {placeholders} in question text.

import type { L, Lang, Question } from "./types";
import { correctNumber, correctOrder, m2Answer } from "./checker";

/** -3 stays "-3", 4 stays "4". */
export const fmt = (n: number): string => (n < 0 ? `-${Math.abs(n)}` : String(n));

/** Negative numbers get brackets after an operator: 5 - (-3). */
export const paren = (n: number): string => (n < 0 ? `(${fmt(n)})` : fmt(n));

/** Replace {key} with values. Unknown keys stay as they are. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
}

/** All placeholder values for one question. */
export function qVars(q: Question): Record<string, string | number> {
  const isArith = q.format === "numeric" || q.format === "story" || q.format === "explain";
  const ans = q.format === "order" ? correctOrder(q.list).map(fmt).join(", ") : fmt(correctNumber(q));
  const m2 = m2Answer(q);
  return {
    a: fmt(q.a),
    b: fmt(q.b),
    bp: paren(q.b),
    op: q.op,
    absA: Math.abs(q.a),
    absB: Math.abs(q.b),
    ans,
    absAns: q.format === "order" ? "" : Math.abs(correctNumber(q)),
    sum: isArith ? fmt(q.a - q.b) : "",
    m2: m2 === null ? "" : fmt(m2),
    lo: fmt(Math.min(q.a, q.b)),
    hi: fmt(Math.max(q.a, q.b)),
    absLo: Math.abs(Math.min(q.a, q.b)),
    absHi: Math.abs(Math.max(q.a, q.b)),
    list: q.list.map(fmt).join(", "),
  };
}

/** Pick the language and fill the placeholders for a question. */
export function tq(text: L, lang: Lang, q: Question): string {
  return fill(text[lang], qVars(q));
}
