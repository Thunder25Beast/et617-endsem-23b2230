// Screen 5: Feedback and re-teach. Depending on the decision rule it shows:
// correct feedback, misconception feedback (M1/M2), an alternative explanation
// (number line jump / udhaar story / lift floors), or the prerequisite number line mini lesson.
import { STR, tr } from "@/data/i18n";
import { correctNumber } from "@/engine/checker";
import { useActiveLearner, useSettings } from "@/engine/storage";
import { fill, fmt, paren } from "@/engine/text";
import type { Lang, Question, Rep } from "@/engine/types";
import { go } from "@/lib/hash-route";
import { Btn } from "@/components/Btn";
import { KeyBox, RichText, Steps } from "@/components/Bits";
import { Highlight } from "@/components/Highlight";
import { Lift } from "@/components/Lift";
import { NumberLine } from "@/components/NumberLine";

export function FeedbackScreen() {
  const { lang } = useSettings();
  const learner = useActiveLearner();
  const fb = learner?.lastFeedback;
  if (!learner || !fb) {
    return (
      <section className="paper space-y-4 p-5">
        <p>{tr("fbNone", lang)}</p>
        <Btn onClick={() => go("practice")}>{tr("goPractice", lang)}</Btn>
      </section>
    );
  }
  const d = fb.decision;
  const correct = fb.attempt?.correct ?? false;

  return (
    <div className="space-y-4 animate-pop">
      {fb.attempt && fb.q && (
        <section className={`rounded-2xl border-2 p-4 ${correct ? "border-success/30 bg-success-soft" : "border-rethink/30 bg-rethink-soft"}`}>
          <h1 className={`text-2xl font-extrabold ${correct ? "text-success" : "text-rethink"}`}>
            {correct ? tr("fbTitleCorrect", lang) : tr("thinkAgain", lang)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("yourAnswer", lang)}: <RichText text={fb.response} />
          </p>
          {fb.text && (
            <p className="mt-2 text-lg">
              <RichText text={fb.text[lang]} />
            </p>
          )}
        </section>
      )}

      {d.rule === "PREREQ" && <MiniLesson lang={lang} />}
      {d.rule === "ALT" && fb.q && d.rep && <Reteach q={fb.q} rep={d.rep} lang={lang} />}

      <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">
        <span className="font-bold">{tr("why", lang)}</span> {d.reason[lang]}
      </p>
      {d.rule === "ALT" && <p className="font-bold">{tr("fbNextTwin", lang)}</p>}
      {d.rule === "PREREQ" && <p className="font-bold">{tr("fbNextS0", lang)}</p>}
      <Btn className="w-full" onClick={() => go("practice")}>
        {tr("nextQ", lang)} →
      </Btn>
    </div>
  );
}

function MiniLesson({ lang }: { lang: Lang }) {
  const s = (k: keyof typeof STR) => <Highlight text={STR[k][lang]} />;
  return (
    <section className="paper space-y-4 p-5">
      <h2 className="text-2xl font-extrabold">{tr("miniTitle", lang)}</h2>
      <p className="text-lg">{tr("letsSee", lang)}</p>
      <NumberLine range={[-5, 5]} markers={[{ value: 0, tone: "ghost", label: "0" }, { value: -3, tone: "neg", label: "-3" }, { value: 3, tone: "pos", label: "3" }]} />
      <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
        <Lift highlight={[0]} from={3} to={-3} />
        <Steps items={[s("mini_s1"), s("mini_s2"), s("mini_s3"), s("mini_s4")]} />
      </div>
      <KeyBox title={tr("keyIdea", lang)}>{s("mini_key")}</KeyBox>
    </section>
  );
}

/** Alternative explanation using the numbers of the question that was missed. */
function Reteach({ q, rep, lang }: { q: Question; rep: Rep; lang: Lang }) {
  const arith = q.format === "numeric" || q.format === "story" || (q.format === "explain" && q.claim === "M2");
  const t = (k: string, v: Record<string, string | number>) => fill((STR as Record<string, { hi: string; en: string }>)[k]?.[lang] ?? k, v);

  if (!arith) {
    // comparing: pick the two numbers to compare
    let lo = Math.min(q.a, q.b);
    let hi = Math.max(q.a, q.b);
    if (q.format === "order") {
      const s = [...q.list].sort((x, y) => x - y);
      lo = s[0] ?? -8;
      hi = s[1] ?? -3;
    }
    if (q.format === "numberline") {
      lo = -Math.abs(q.a);
      hi = Math.abs(q.a);
    }
    const hiMeaning = hi < 0 ? t("owingPrefix", { n: Math.abs(hi) }) : hi > 0 ? t("havingPrefix", { n: hi }) : t("nothing", {});
    const v = { lo: fmt(lo), hi: fmt(hi), absLo: Math.abs(lo), absHi: Math.abs(hi), hiMeaning };
    const range: [number, number] = Math.abs(lo) > 10 || Math.abs(hi) > 10 ? [-20, 20] : [-10, 10];
    return (
      <section className="paper space-y-4 p-5">
        <h2 className="text-2xl font-extrabold">{t(`rc_${rep}_title`, v)}</h2>
        {rep === "lift" ? (
          <Lift highlight={[Math.max(lo, -3), Math.max(Math.min(hi, 3), -3)]} />
        ) : (
          <NumberLine range={range} markers={[{ value: lo, tone: "neg", label: fmt(lo) }, { value: hi, tone: "pick", label: fmt(hi) }]} />
        )}
        <Steps items={[1, 2, 3].map((i) => <Highlight key={i} text={t(`rc_${rep}_s${i}`, v)} />)} />
        <KeyBox title={tr("keyIdea", lang)}>
          <Highlight text={t(`rc_${rep}_key`, v)} />
        </KeyBox>
      </section>
    );
  }

  const ans = correctNumber({ ...q, format: "numeric" });
  const n = Math.abs(q.b);
  const right = (q.op === "+" && q.b > 0) || (q.op === "-" && q.b < 0);
  const move = q.op === "-" && q.b < 0 ? t("moveSubNeg", { n }) : right ? t("moveRight", { n }) : t("moveLeft", { n });
  const action =
    q.op === "+" ? (q.b > 0 ? t("actGet", { n }) : t("actBorrow", { n })) : q.b > 0 ? t("actSpend", { n }) : t("actRemoveDebt", { n });
  const liftMove = q.op === "-" && q.b < 0 ? t("liftCancelDown", { n }) : right ? t("liftUp", { n }) : t("liftDown", { n });
  const start = q.a < 0 ? t("owingPrefix", { n: Math.abs(q.a) }) : t("havingPrefix", { n: q.a });
  const v = { a: fmt(q.a), b: fmt(q.b), bp: paren(q.b), ans: fmt(ans), move, action, liftMove, start };
  const range: [number, number] = [q.a, q.b, ans].some((x) => Math.abs(x) > 10) ? [-20, 20] : [-10, 10];
  return (
    <section className="paper space-y-4 p-5">
      <h2 className="text-2xl font-extrabold">{t(`ra_${rep}_title`, v)}</h2>
      <p className="text-center text-2xl font-extrabold">
        <RichText text={`${fmt(q.a)} ${q.op} ${paren(q.b)} = ${fmt(ans)}`} />
      </p>
      {rep === "lift" ? (
        <Lift highlight={[Math.max(-3, Math.min(3, q.a)), Math.max(-3, Math.min(3, ans))]} />
      ) : (
        <NumberLine range={range} markers={[{ value: q.a, tone: "ghost", label: fmt(q.a) }, { value: ans, tone: "pick", label: fmt(ans) }]} jumps={[{ from: q.a, to: ans }]} />
      )}
      <Steps items={[1, 2, 3].map((i) => <Highlight key={i} text={t(`ra_${rep}_s${i}`, v)} />)} />
      <KeyBox title={tr("keyIdea", lang)}>
        <Highlight text={t(q.op === "+" ? "ra_key_add" : "ra_key_sub", v)} />
      </KeyBox>
    </section>
  );
}
