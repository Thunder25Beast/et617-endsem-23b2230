// Small shared pieces: coloured numbers, the key idea box, numbered steps, stars, icons.
import type { ReactNode } from "react";
import { fmt } from "@/engine/text";
import { cn } from "@/lib/utils";

/** A number coloured by its sign: blue for minus, saffron for plus. */
export function Num({ n, className }: { n: number; className?: string }) {
  const cls = n < 0 ? "num-neg" : n > 0 ? "num-pos" : "num-zero";
  return <span className={cn(cls, "tabular-nums", className)}>{fmt(n)}</span>;
}

/** Colour every number inside a sentence (e.g. "5 - (-3) = 8"). */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(-?\d+)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^-?\d+$/.test(p)) return <Num key={i} n={Number(p)} />;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function KeyBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="key-box p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary-deep">
        <BulbIcon /> {title}
      </div>
      <div className="text-lg font-bold leading-snug">{children}</div>
    </div>
  );
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 text-lg leading-snug">
          <span className="step-dot" aria-hidden>
            {i + 1}
          </span>
          <span className="pt-0.5">{it}</span>
        </li>
      ))}
    </ol>
  );
}

export function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} / ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <StarIcon key={i} filled={i < n} />
      ))}
    </span>
  );
}

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
        fill={filled ? "var(--primary)" : "none"}
        stroke="var(--primary-deep)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
      {dir === "left" ? (
        <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "neg" | "pos" | "warn" | "success" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    neg: "bg-neg-soft text-neg",
    pos: "bg-pos-soft text-pos",
    warn: "bg-warn-soft text-warn",
    success: "bg-success-soft text-success",
  } as const;
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", tones[tone])}>{children}</span>;
}
