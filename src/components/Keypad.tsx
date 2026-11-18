// On-screen number pad with a big minus key. Android number keyboards often hide the minus sign,
// so learners type with this instead of the system keyboard.
import { useSettings } from "@/engine/storage";
import { tr } from "@/data/i18n";
import { Btn } from "./Btn";

export function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lang } = useSettings();
  const press = (k: string) => {
    if (k === "back") return onChange(value.slice(0, -1));
    if (k === "minus") return onChange(value.startsWith("-") ? value.slice(1) : `-${value}`);
    if (value.replace("-", "").length >= 3) return;
    onChange(value + k);
  };
  const shown = value === "" ? "?" : value === "-" ? "-" : value;
  const neg = value.startsWith("-");
  return (
    <div className="mx-auto w-full max-w-sm">
      <div
        className={`mb-3 flex h-16 items-center justify-center rounded-xl border-2 bg-card text-4xl font-extrabold tabular-nums ${neg ? "text-neg border-neg/40" : "text-foreground border-input"}`}
        aria-live="polite"
        aria-label={tr("yourAnswer", lang)}
      >
        {shown}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <Btn key={k} variant="choice" size="lg" onClick={() => press(k)}>
            {k}
          </Btn>
        ))}
        <Btn variant="secondary" size="lg" onClick={() => press("minus")} aria-label="minus">
          {tr("minus", lang)}
        </Btn>
        <Btn variant="choice" size="lg" onClick={() => press("0")}>
          0
        </Btn>
        <Btn variant="outline" size="lg" onClick={() => press("back")} aria-label={tr("clear", lang)}>
          ⌫
        </Btn>
      </div>
    </div>
  );
}
