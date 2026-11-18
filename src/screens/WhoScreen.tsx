// Screen 1: Who is learning? Shared tablet: pick a nickname + emoji or add a new one.
import { useState } from "react";
import { tr } from "@/data/i18n";
import { addLearner, removeLearner, setData, useAppData, useSettings } from "@/engine/storage";
import { go } from "@/lib/hash-route";
import { Btn } from "@/components/Btn";
import { Stars } from "@/components/Bits";
import { LangToggle } from "@/components/Shell";
import { cn } from "@/lib/utils";

const EMOJIS = ["🦁", "🐯", "🦚", "🐘", "🌻", "⭐", "🚀", "🪁", "🏏", "🌈", "🐢", "🦋"];

export function WhoScreen() {
  const { lang } = useSettings();
  const data = useAppData();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0] as string);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const pick = (id: string) => {
    setData((d) => ({ ...d, activeId: id }));
    const l = data.learners.find((x) => x.id === id);
    go(l?.engine.profile.done ? "practice" : "check");
  };

  const add = () => {
    const nick = name.trim().slice(0, 20);
    if (!nick) return;
    addLearner(nick, emoji);
    setName("");
    go("check");
  };

  return (
    <div className="space-y-5 animate-pop">
      <section className="paper p-5">
        <h1 className="text-2xl font-extrabold">{tr("whoTitle", lang)}</h1>
        <p className="text-muted-foreground">{tr("whoSub", lang)}</p>
        {data.learners.length === 0 ? (
          <p className="mt-4 rounded-xl bg-muted p-4">{tr("whoNone", lang)}</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.learners.map((l) => {
              const stars = Object.values(l.engine.cleared).reduce((s, n) => s + n, 0);
              return (
                <li key={l.id} className="relative">
                  <button
                    type="button"
                    onClick={() => pick(l.id)}
                    className={cn(
                      "flex min-h-20 w-full items-center gap-3 rounded-xl border-2 bg-card p-3 text-left shadow-[var(--shadow-key)] active:translate-y-[2px] active:shadow-none",
                      data.activeId === l.id ? "border-secondary" : "border-input",
                    )}
                  >
                    <span className="text-4xl" aria-hidden>
                      {l.emoji}
                    </span>
                    <span>
                      <span className="block text-xl font-extrabold">{l.nickname}</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Stars n={Math.min(3, stars)} /> {stars} {tr("stars", lang)}
                      </span>
                    </span>
                  </button>
                  {confirmId === l.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-rethink-soft p-2 text-sm text-rethink">
                      {tr("removeConfirm", lang)}
                      <Btn size="sm" variant="outline" onClick={() => { removeLearner(l.id); setConfirmId(null); }}>
                        {tr("remove", lang)}
                      </Btn>
                      <Btn size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                        ✕
                      </Btn>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(l.id)}
                      className="absolute right-2 top-2 min-h-8 rounded-lg px-2 text-xs text-muted-foreground"
                    >
                      {tr("remove", lang)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="paper p-5">
        <h2 className="text-xl font-extrabold">{tr("addTitle", lang)}</h2>
        <label className="mt-3 block font-bold" htmlFor="nick">
          {tr("nickname", lang)}
        </label>
        <input
          id="nick"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder={tr("nicknamePh", lang)}
          className="mt-1 h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-xl outline-none focus:border-secondary"
          autoComplete="off"
        />
        <p className="mt-4 font-bold">{tr("pickEmoji", lang)}</p>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={cn(
                "flex h-14 items-center justify-center rounded-xl border-2 text-3xl",
                emoji === e ? "border-secondary bg-accent" : "border-input bg-card",
              )}
              aria-pressed={emoji === e}
            >
              {e}
            </button>
          ))}
        </div>
        <Btn className="mt-5 w-full" onClick={add} disabled={!name.trim()}>
          {emoji} {tr("addBtn", lang)}
        </Btn>
        <p className="mt-3 text-sm text-muted-foreground">{tr("noPassword", lang)}</p>
      </section>

      <div className="flex items-center justify-between">
        <LangToggle />
        <Btn variant="ghost" size="md" onClick={() => go("about")}>
          {tr("navAbout", lang)} →
        </Btn>
      </div>
    </div>
  );
}
