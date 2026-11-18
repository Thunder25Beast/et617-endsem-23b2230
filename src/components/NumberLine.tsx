// Inline SVG number line (no images). Negative side is blue, positive side is saffron.
// Can show markers and jump arrows, and can be tapped to place a marker.
import { useRef } from "react";
import type { Range } from "@/engine/types";
import { fmt } from "@/engine/text";

export interface Marker {
  value: number;
  tone?: "pick" | "neg" | "pos" | "ghost";
  label?: string;
}

interface Props {
  range: Range;
  markers?: Marker[];
  jumps?: { from: number; to: number }[];
  onPick?: (n: number) => void;
  ariaLabel?: string;
}

const W = 680;
const PAD = 26;
const Y = 70;

export function NumberLine({ range, markers = [], jumps = [], onPick, ariaLabel }: Props) {
  const [min, max] = range;
  const span = max - min;
  const x = (n: number) => PAD + ((n - min) / span) * (W - 2 * PAD);
  const svgRef = useRef<SVGSVGElement>(null);
  const labelEvery = span <= 20 ? 1 : 5;
  const ticks = Array.from({ length: span + 1 }, (_, i) => min + i);

  function pick(clientX: number) {
    if (!onPick || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const vx = ((clientX - r.left) / r.width) * W;
    const n = Math.round(min + ((vx - PAD) / (W - 2 * PAD)) * span);
    onPick(Math.max(min, Math.min(max, n)));
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} 120`}
      className="w-full select-none touch-manipulation"
      role={onPick ? "slider" : "img"}
      aria-label={ariaLabel ?? `number line ${min} to ${max}`}
      aria-valuemin={min}
      aria-valuemax={max}
      onPointerDown={(e) => pick(e.clientX)}
      style={{ cursor: onPick ? "pointer" : "default" }}
    >
      {/* coloured halves: left of zero = minus, right of zero = plus */}
      <line x1={x(min)} y1={Y} x2={x(0)} y2={Y} stroke="var(--neg)" strokeWidth="5" strokeLinecap="round" />
      <line x1={x(0)} y1={Y} x2={x(max)} y2={Y} stroke="var(--pos)" strokeWidth="5" strokeLinecap="round" />
      {/* arrow heads at both ends */}
      <path d={`M${x(min) - 12} ${Y} l12 -8 v16 z`} fill="var(--neg)" />
      <path d={`M${x(max) + 12} ${Y} l-12 -8 v16 z`} fill="var(--pos)" />

      {ticks.map((n) => {
        const major = n % labelEvery === 0 || n === 0;
        return (
          <g key={n}>
            <line
              x1={x(n)}
              x2={x(n)}
              y1={Y - (n === 0 ? 14 : major ? 9 : 5)}
              y2={Y + (n === 0 ? 14 : major ? 9 : 5)}
              stroke={n === 0 ? "var(--zero)" : "var(--foreground)"}
              strokeWidth={n === 0 ? 3 : 1.6}
            />
            {major && (
              <text
                x={x(n)}
                y={Y + 34}
                textAnchor="middle"
                fontSize={span <= 20 ? 19 : 18}
                fontWeight={n === 0 ? 800 : 600}
                fill={n < 0 ? "var(--neg)" : n > 0 ? "var(--pos)" : "var(--zero)"}
              >
                {fmt(n)}
              </text>
            )}
          </g>
        );
      })}

      {jumps.map((j, i) => {
        const x1 = x(j.from);
        const x2 = x(j.to);
        const mid = (x1 + x2) / 2;
        const h = Math.min(48, 18 + Math.abs(x2 - x1) / 6);
        const dir = x2 > x1 ? 1 : -1;
        return (
          <g key={`j${i}`}>
            <path
              d={`M${x1} ${Y - 6} Q${mid} ${Y - 6 - h * 2} ${x2} ${Y - 6}`}
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
            <path d={`M${x2} ${Y - 6} l${-10 * dir} -10 l${4 * dir} 12 z`} fill="var(--secondary)" />
          </g>
        );
      })}

      {markers.map((m, i) => {
        const fill =
          m.tone === "ghost" ? "var(--muted-foreground)" : m.tone === "neg" ? "var(--neg)" : m.tone === "pos" ? "var(--pos)" : "var(--secondary)";
        return (
          <g key={`m${i}`} opacity={m.tone === "ghost" ? 0.55 : 1}>
            <circle cx={x(m.value)} cy={Y} r="11" fill={fill} stroke="var(--card)" strokeWidth="3" />
            <path d={`M${x(m.value)} ${Y - 14} l-9 -14 h18 z`} fill={fill} />
            {m.label && (
              <text x={x(m.value)} y={Y - 34} textAnchor="middle" fontSize="18" fontWeight="800" fill={fill}>
                {m.label}
              </text>
            )}
          </g>
        );
      })}

      {/* big invisible tap area */}
      {onPick && <rect x="0" y="0" width={W} height="120" fill="transparent" />}
    </svg>
  );
}
