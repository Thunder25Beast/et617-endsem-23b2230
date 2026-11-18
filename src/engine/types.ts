// Shared types for the tutor. Kept in one place so every part of the app
// (questions, checker, decision rule, screens) talks about the same things.

export type Lang = "hi" | "en";

/** A piece of text in both languages. */
export type L = { hi: string; en: string };

/** S0 = read/place on number line, S1 = order & compare, S2 = add, S3 = subtract. */
export type SkillId = "S0" | "S1" | "S2" | "S3";
export type Level = 1 | 2 | 3;

export type Format = "numberline" | "compare" | "order" | "numeric" | "story" | "explain";

/** M1 = ignores the minus sign ("-8 > -3"). M2 = "subtraction always makes smaller" (5-(-3)=2). */
export type MisTag = "M1" | "M2";

export type ExplainLabel = "sound" | "M1" | "M2" | "partial" | "unclear";

/** The three ways we can re-explain an idea. */
export type Rep = "numberline" | "udhaar" | "lift";

export type Op = "+" | "-";

export type Range = [number, number];

/** How to make fresh numbers for a "twin" question with the same structure. */
export interface Gen {
  a?: Range;
  b?: Range;
  /** for ordering questions: one range per number in the list */
  list?: Range[];
}

/** An authored item in the local bank (src/data/questions.ts). */
export interface ItemTemplate {
  id: string;
  skill: SkillId;
  level: Level;
  format: Format;
  a?: number;
  b?: number;
  op?: Op;
  list?: number[];
  /** compare questions: ask for the greater or the smaller number */
  ask?: "greater" | "smaller";
  /** explain questions: which wrong claim the story character makes */
  claim?: MisTag;
  gen: Gen;
  /** text may use placeholders like {a} {b} {bp} {absA} {ans} — see engine/text.ts */
  stem: L;
  hints: [L, L];
  /** which misconception this item's typical wrong answer reveals */
  pattern: MisTag | null;
  feedback: { correct: L; M1?: L; M2?: L; other: L };
  /** the correct reasoning, sent to the AI when it judges an explanation */
  rubric?: L;
}

/** Where a question came from. */
export type Source = "bank" | "ai" | "demo";

/** A concrete question shown to the learner (bank item with numbers, or AI generated). */
export interface Question {
  uid: string;
  templateId: string;
  skill: SkillId;
  level: Level;
  format: Format;
  a: number;
  b: number;
  op: Op;
  list: number[];
  ask: "greater" | "smaller";
  claim: MisTag | null;
  stem: L;
  hints: [L, L];
  pattern: MisTag | null;
  feedback: { correct: L; M1?: L; M2?: L; other: L };
  rubric: L | null;
  source: Source;
  /** number line visible from the start? */
  showLine: boolean;
  /** true when the line was switched on by the decision rule (2 hints / skipped lesson) */
  lineAuto: boolean;
  range: Range;
  /** the decision that picked this question, shown in "Why this question?" */
  why: L;
  isTwin: boolean;
  remediation: boolean;
}

export type Response =
  | { kind: "number"; value: number }
  | { kind: "order"; values: number[] }
  | { kind: "explain"; agree: boolean; text: string };

export interface Attempt {
  id: string;
  ts: number;
  qid: string;
  templateId: string;
  skill: SkillId;
  level: Level;
  format: Format;
  correct: boolean;
  hints: number;
  seconds: number;
  tag: MisTag | null;
  explainLabel: ExplainLabel | null;
  lineUsed: boolean;
  source: Source;
  response: string;
  remediation: boolean;
  isTwin: boolean;
  /** e.g. "numeric:5-3", used so the AI does not repeat recent questions */
  sig: string;
  /** numbersKey(a, b, list): the bank does not show the same numbers on an item twice */
  nums?: string;
}

export type RuleId = "START" | "PREREQ" | "ALT" | "HARDER" | "SAME" | "REMEDIATION" | "RETURN";

export interface Decision {
  ts: number;
  rule: RuleId;
  reason: L;
  /** where the learner goes next */
  skill: SkillId;
  level: Level;
  /** which representation the re-teach screen shows (ALT / PREREQ) */
  rep: Rep | null;
  tag: MisTag | null;
  lineAuto: boolean;
  /** next question should be a twin of this question (ALT) */
  twinOf: Question | null;
  /** the three signals we looked at, for the log and the viva */
  signals: { profile: string; performance: string; interaction: string };
}

/** Result of the 4-question quick check. */
export interface Profile {
  done: boolean;
  positionGap: boolean;
  wholeNumberGap: boolean;
  m1Suspected: boolean;
  addNegOk: boolean;
  startSkill: SkillId;
  startLevel: Level;
  answers: string[];
}

export interface Remediation {
  remaining: number;
  returnTo: { skill: SkillId; level: Level };
}

/** Everything the decision rule needs to know about one learner. */
export interface EngineState {
  current: { skill: SkillId; level: Level };
  /** attempts before this time do not count for the current level (reset on level change) */
  windowStart: number;
  attempts: Attempt[];
  profile: Profile;
  altCount: Record<MisTag, number>;
  /** set right after an ALT explanation: the next (twin) attempt is checked against it */
  altPendingTag: MisTag | null;
  remediation: Remediation | null;
  gapLessonDone: boolean;
  learnSkipped: Partial<Record<"a" | "b" | "c", boolean>>;
  cleared: Record<SkillId, number>;
}
