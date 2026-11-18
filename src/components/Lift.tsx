// Inline SVG lift / building: floors 3 to -3, ground floor = 0. Used in Learn and re-teach.
import { fmt } from "@/engine/text";

export function Lift({ highlight = [], from = 3, to = -3 }: { highlight?: number[]; from?: number; to?: number }) {
  const floors: number[] = [];
  for (let f = from; f >= to; f--) floors.push(f);
  const H = 34;
  const top = 10;
  return (
    <svg viewBox={`0 0 220 ${floors.length * H + top + 10}`} className="mx-auto w-full max-w-[220px]" role="img" aria-label="lift floors">
      {floors.map((f, i) => {
        const y = top + i * H;
        const hi = highlight.includes(f);
        const under = f < 0;
        return (
          <g key={f}>
            <rect
              x="40"
              y={y}
              width="120"
              height={H - 4}
              rx="6"
              fill={hi ? (under ? "var(--neg)" : "var(--pos)") : under ? "var(--neg-soft)" : "var(--pos-soft)"}
              stroke="var(--border)"
              strokeWidth="2"
            />
            <text x="100" y={y + H / 2 + 3} textAnchor="middle" fontSize="15" fontWeight="800" fill={hi ? "var(--card)" : "var(--foreground)"}>
              {f === 0 ? "0 · Ground" : under ? `Basement ${fmt(f)}` : `Floor ${f}`}
            </text>
            <text x="22" y={y + H / 2 + 3} textAnchor="middle" fontSize="17" fontWeight="800" fill={under ? "var(--neg)" : f > 0 ? "var(--pos)" : "var(--zero)"}>
              {fmt(f)}
            </text>
          </g>
        );
      })}
      {/* ground line */}
      <line x1="30" x2="190" y1={top + floors.indexOf(0) * H + H - 2} y2={top + floors.indexOf(0) * H + H - 2} stroke="var(--zero)" strokeWidth="3" />
    </svg>
  );
}
