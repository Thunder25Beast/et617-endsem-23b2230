// Screen 3: Learn — 3 short chunks, one idea each, numbered steps, key idea in a box.
// Skipping a chunk is recorded (INTERACTION signal used by the decision rule).
import { useState } from "react";
import { STR, tr } from "@/data/i18n";
import { logEvent, updateLearner, useActiveLearner, useSettings } from "@/engine/storage";
import { fill } from "@/engine/text";
import { go } from "@/lib/hash-route";
import { Btn } from "@/components/Btn";
import { KeyBox, Steps } from "@/components/Bits";
import { Highlight } from "@/components/Highlight";
import { Lift } from "@/components/Lift";
import { NumberLine } from "@/components/NumberLine";

type Chunk = "a" | "b" | "c";
const CHUNKS: Chunk[] = ["a", "b", "c"];

export function LearnScreen() {
  const { lang } = useSettings();
  const learner = useActiveLearner();
  const [i, setI] = useState(0);
  if (!learner) return null;
  const chunk = CHUNKS[i] as Chunk;

  const mark = (how: "viewed" | "skipped") => {
    updateLearner(learner.id, (l) => ({
      ...l,
      learn: { ...l.learn, [chunk]: l.learn[chunk] === "viewed" ? "viewed" : how },
      engine: { ...l.engine, learnSkipped: { ...l.engine.learnSkipped, [chunk]: how === "skipped" && l.learn[chunk] !== "viewed" } },
    }));
    logEvent(learner.id, how === "viewed" ? "learn_view" : "learn_skip", { chunk });
  };

  const advance = (how: "viewed" | "skipped") => {
    mark(how);
    if (i < 2) setI(i + 1);
    else go("practice");
  };

  const s = (k: keyof typeof STR) => <Highlight text={STR[k][lang]} />;

  return (
    <section className="paper space-y-5 p-5 animate-pop" key={chunk}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground">{fill(STR.chunkOf[lang], { n: i + 1 })}</span>
        <div className="flex gap-1.5" aria-hidden>
          {CHUNKS.map((c, j) => (
            <span key={c} className={`h-2.5 w-8 rounded-full ${j <= i ? "bg-secondary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {chunk === "a" && (
        <>
          <h1 className="text-2xl font-extrabold">{tr("la_title", lang)}</h1>
          <p className="text-lg">
            {tr("letsSee", lang)} {s("la_intro")}
          </p>
          <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
            <Lift highlight={[-1, -2]} from={2} to={-3} />
            <Steps items={[s("la_s1"), s("la_s2"), s("la_s3")]} />
          </div>
          <NumberLine range={[-5, 5]} markers={[{ value: -1, tone: "neg", label: "-1" }, { value: -2, tone: "neg", label: "-2" }]} />
          <KeyBox title={tr("keyIdea", lang)}>{s("la_key")}</KeyBox>
        </>
      )}

      {chunk === "b" && (
        <>
          <h1 className="text-2xl font-extrabold">{tr("lb_title", lang)}</h1>
          <p className="text-lg">
            {tr("letsSee", lang)} {s("lb_intro")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border-2 border-neg/40 bg-neg-soft p-3 text-center">
              <div className="text-3xl font-extrabold text-neg">-8</div>
              <div className="font-bold">₹8 {lang === "hi" ? "उधार" : "debt"} 😟</div>
            </div>
            <div className="rounded-xl border-2 border-neg/20 bg-card p-3 text-center">
              <div className="text-3xl font-extrabold text-neg">-3</div>
              <div className="font-bold">₹3 {lang === "hi" ? "उधार" : "debt"} 🙂</div>
            </div>
          </div>
          <Steps items={[s("lb_s1"), s("lb_s2"), s("lb_s3")]} />
          <NumberLine range={[-10, 10]} markers={[{ value: -8, tone: "neg", label: "-8" }, { value: -3, tone: "pick", label: "-3" }]} />
          <KeyBox title={tr("keyIdea", lang)}>{s("lb_key")}</KeyBox>
        </>
      )}

      {chunk === "c" && (
        <>
          <h1 className="text-2xl font-extrabold">{tr("lc_title", lang)}</h1>
          <p className="text-lg">
            {tr("letsSee", lang)} {s("lc_intro")}
          </p>
          <Steps items={[s("lc_s1"), s("lc_s2"), s("lc_s3"), s("lc_s4")]} />
          <NumberLine range={[-2, 10]} markers={[{ value: 5, tone: "ghost", label: "5" }, { value: 8, tone: "pos", label: "8" }]} jumps={[{ from: 5, to: 8 }]} />
          <KeyBox title={tr("keyIdea", lang)}>{s("lc_key")}</KeyBox>
        </>
      )}

      <div className="flex gap-3">
        {i > 0 && (
          <Btn variant="outline" onClick={() => setI(i - 1)}>
            {tr("back", lang)}
          </Btn>
        )}
        <Btn variant="ghost" onClick={() => advance("skipped")}>
          {tr("skip", lang)}
        </Btn>
        <Btn className="flex-1" onClick={() => advance("viewed")}>
          {i < 2 ? `${tr("next", lang)} →` : tr("toPractice", lang)}
        </Btn>
      </div>
    </section>
  );
}
