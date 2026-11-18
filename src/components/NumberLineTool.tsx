// The learner's number line tool: tap to place a marker, arrow buttons to jump 1 step.
// Used as the answer input for "number line tap" questions and as a helper for all others.
import type { Range } from "@/engine/types";
import { useSettings } from "@/engine/storage";
import { tr } from "@/data/i18n";
import { NumberLine } from "./NumberLine";
import { Btn } from "./Btn";
import { ArrowIcon, Num } from "./Bits";

interface Props {
  range: Range;
  value: number | null;
  onChange: (n: number) => void;
  startHint?: number | null;
}

export function NumberLineTool({ range, value, onChange, startHint }: Props) {
  const { lang } = useSettings();
  const move = (d: number) => {
    const base = value ?? startHint ?? 0;
    onChange(Math.max(range[0], Math.min(range[1], base + d)));
  };
  return (
    <div className="rounded-xl border-2 border-dashed border-secondary/50 bg-card p-2 sm:p-3">
      <NumberLine range={range} markers={value === null ? [] : [{ value, tone: "pick", label: String(value) }]} onPick={onChange} />
      <div className="mt-1 flex items-center justify-between gap-2">
        <Btn variant="outline" size="icon" onClick={() => move(-1)} aria-label={tr("left", lang)}>
          <ArrowIcon dir="left" />
        </Btn>
        <div className="text-center text-sm text-muted-foreground">
          {value === null ? (
            tr("lineTap", lang)
          ) : (
            <span className="text-base">
              {tr("marker", lang)}: <Num n={value} className="text-2xl" />
            </span>
          )}
        </div>
        <Btn variant="outline" size="icon" onClick={() => move(1)} aria-label={tr("right", lang)}>
          <ArrowIcon dir="right" />
        </Btn>
      </div>
    </div>
  );
}
