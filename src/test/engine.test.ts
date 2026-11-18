import { describe, expect, it } from "vitest";
import { BANK } from "@/data/questions";
import { grade, localExplain } from "@/engine/checker";
import { decide, instantiate } from "@/engine/selector";
import { emptyEngine } from "@/engine/storage";
import { profileFrom } from "@/screens/QuickCheckScreen";
import type { Attempt, EngineState, Question } from "@/engine/types";

const rng = () => 0.42;
const why = { hi: "", en: "" };
const q = (id: string): Question => instantiate(BANK.find((t) => t.id === id)!, { fresh: false, rng, why, lineAuto: false });

let t = 1000;
function att(over: Partial<Attempt> = {}): Attempt {
  t += 10;
  return {
    id: String(t), ts: t, qid: "q", templateId: "s1-cmp-1", skill: "S1", level: 1, format: "compare",
    correct: true, hints: 0, seconds: 10, tag: null, explainLabel: null, lineUsed: false, source: "bank",
    response: "", remediation: false, isTwin: false, sig: "", ...over,
  };
}
const base = (): EngineState => ({ ...emptyEngine("S1", 1), profile: { ...emptyEngine().profile, done: true } });

describe("checker", () => {
  it("5 - (-3) is 8 and answering 2 is tagged M2", () => {
    expect(grade(q("s3-num-5"), { kind: "number", value: 8 }).correct).toBe(true);
    expect(grade(q("s3-num-5"), { kind: "number", value: 2 }).tag).toBe("M2");
  });
  it("picking -8 as greater than -3 is tagged M1", () => {
    expect(grade(q("s1-cmp-1"), { kind: "number", value: -8 }).tag).toBe("M1");
  });
  it("ordering 4,-8,0,-3 as -3,-8,0,4 is tagged M1", () => {
    const r = grade(q("s1-ord-1"), { kind: "order", values: [-3, -8, 0, 4] });
    expect(r.correct).toBe(false);
    expect(r.tag).toBe("M1");
    expect(grade(q("s1-ord-1"), { kind: "order", values: [-8, -3, 0, 4] }).correct).toBe(true);
  });
  it("udhaar story: owe 5, pay 2 -> -3", () => {
    expect(grade(q("s2-story-1"), { kind: "number", value: -3 }).correct).toBe(true);
  });
  it("explanation with direction and a concept word is sound; agreeing with Raju is M1", () => {
    const e = q("s1-exp-1");
    expect(localExplain(e, "Raju सही नहीं है, number line पर -8 बाएँ है", false)).toBe("sound");
    expect(localExplain(e, "-8 is less than -3 because it is left of zero", false)).toBe("sound");
    expect(localExplain(e, "anything", true)).toBe("M1");
  });
});

describe("decision rule", () => {
  it("3 wrong in a row -> PREREQ with 2 easy tasks", () => {
    let s = base();
    s = decide(s, att({ correct: false }), null).state;
    s = decide(s, att({ correct: false }), null).state;
    const r = decide(s, att({ correct: false }), null);
    expect(r.decision.rule).toBe("PREREQ");
    expect(r.state.remediation?.remaining).toBe(2);
  });
  it("first M1 -> ALT, wrong twin with M1 -> PREREQ", () => {
    const first = decide(base(), att({ correct: false, tag: "M1" }), q("s1-cmp-1"));
    expect(first.decision.rule).toBe("ALT");
    expect(first.decision.rep).toBe("numberline");
    expect(decide(first.state, att({ correct: false, tag: "M1", isTwin: true }), null).decision.rule).toBe("PREREQ");
  });
  it("2 correct, <=1 hint, each under 45s -> HARDER", () => {
    const s = decide(base(), att({ hints: 1 }), null).state;
    const r = decide(s, att(), null);
    expect(r.decision.rule).toBe("HARDER");
    expect(r.state.current.level).toBe(2);
  });
  it("2 correct but one took 45s or more -> SAME", () => {
    const s = decide(base(), att(), null).state;
    expect(decide(s, att({ seconds: 45 }), null).decision.rule).toBe("SAME");
  });
  it("2 hints used -> SAME with the number line turned on", () => {
    const r = decide(base(), att({ hints: 2 }), null);
    expect(r.decision.rule).toBe("SAME");
    expect(r.decision.lineAuto).toBe(true);
  });
  it("quick check position gap -> PREREQ at session start", () => {
    const s = base();
    s.profile = { ...s.profile, positionGap: true };
    expect(decide(s, null, null).decision.rule).toBe("PREREQ");
  });
});

describe("quick check", () => {
  it("choosing -8 as greater flags M1 and starts at S1 level 1", () => {
    const p = profileFrom({ read: -3, compare: -8, whole: 5, addNeg: 3 });
    expect(p.m1Suspected).toBe(true);
    expect([p.startSkill, p.startLevel]).toEqual(["S1", 1]);
  });
});

// ---- variety and clarity (repeat + vague question fixes) ----
import { clarityProblem, validateQuestion } from "@/engine/ai";
import { DEMO_QUESTIONS } from "@/data/demoAi";
import { nextFromBank, numbersKey, pickTemplate } from "@/engine/selector";

describe("question variety", () => {
  it("picks the least recently used item instead of repeating one", () => {
    const pool = BANK.filter((x) => x.skill === "S2" && x.level === 1);
    const lastUsed = new Map([[pool[0]!.id, 5]]);
    const t = pickTemplate("S2", 1, { avoidIds: [], lastFormat: null, rng: () => 0, lastUsed });
    expect(t.id).not.toBe(pool[0]!.id);
  });

  it("does not reuse numbers already seen on the same item", () => {
    let s = base();
    const seen = new Set<string>();
    let r = 0;
    const seq = () => ((r = (r * 9301 + 49297) % 233280), r / 233280);
    for (let i = 0; i < 6; i++) {
      const { decision } = decide(s, null, null);
      const qq = nextFromBank(s, { ...decision, rule: "SAME" }, seq);
      const key = `${qq.templateId}|${numbersKey(qq.a, qq.b, qq.list)}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      s = { ...s, attempts: [...s.attempts, att({ templateId: qq.templateId, format: qq.format, nums: numbersKey(qq.a, qq.b, qq.list) })] };
    }
  });
});

describe("AI question clarity", () => {
  it("rejects compare questions that ask for the smaller number", () => {
    expect(clarityProblem("compare", "Which is smaller: -9 or -2?", -9, -2, "+")).not.toBeNull();
    expect(clarityProblem("compare", "Which is greater: -9 or -2?", -9, -2, "+")).toBeNull();
  });
  it("rejects stories that ask for a size instead of a signed value", () => {
    expect(clarityProblem("story", "You owe 9. You pay 4. How much do you owe now?", -9, 4, "+")).not.toBeNull();
    expect(clarityProblem("story", "Your balance is -9. You pay 4. What is your balance now?", -9, 4, "+")).toBeNull();
  });
  it("rejects text missing a number or giving the answer", () => {
    expect(clarityProblem("numeric", "Solve: 4 + ? = ?", 4, -6, "+")).not.toBeNull();
    expect(clarityProblem("numeric", "Solve: 4 + (-6) = -2?", 4, -6, "+")).not.toBeNull();
    expect(clarityProblem("numeric", "Solve: 4 + (-6) = ?", 4, -6, "+")).toBeNull();
  });
  it("every recorded demo question passes the stricter checks", () => {
    for (const raw of DEMO_QUESTIONS) {
      const r = raw as { format: string; stem_en: string; numbers: { a: number; b: number; operation: string } };
      expect(clarityProblem(r.format as never, r.stem_en, r.numbers.a, r.numbers.b, r.numbers.operation === "-" ? "-" : "+"), r.stem_en).toBeNull();
    }
  });
  it("rejects an AI question already seen this session", () => {
    const raw = DEMO_QUESTIONS[0];
    const want = { skill: "S2" as const, level: 1 as const, format: "numeric" as const, last5: [], avoid: [], misconception: null };
    expect(validateQuestion(raw, want, why)).not.toBeNull();
    expect(validateQuestion(raw, want, why, new Set(["numeric:-4+7"]))).toBeNull();
  });
});
