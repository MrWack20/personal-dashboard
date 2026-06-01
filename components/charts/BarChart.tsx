import { compactNum, type BarDatum } from "@/lib/chart";

export default function BarChart({
  data,
  format,
  height = 260,
}: {
  data: BarDatum[];
  format: (n: number) => string;
  height?: number;
}) {
  const W = 600;
  const H = height;
  const padL = 46;
  const padR = 12;
  const padT = 22;
  const padB = 50;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = data.length;
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 0);
  if (n === 0 || max <= 0) return null;

  const band = plotW / n;
  const barW = Math.min(band * 0.62, 64);
  const baseY = padT + plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const showValues = n <= 10;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", fontFamily: "var(--font-dm-mono), monospace" }}
    >
      {ticks.map((t, i) => {
        const y = padT + plotH * (1 - t);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text3)">
              {compactNum(max * t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (Math.abs(d.value) / max) * plotH;
        const x = padL + band * i + (band - barW) / 2;
        const y = baseY - h;
        const color = d.color ?? "var(--green)";
        const label = d.label.length > 11 ? d.label.slice(0, 10) + "…" : d.label;
        return (
          <g key={i}>
            <title>{`${d.label}: ${format(d.value)}`}</title>
            <rect x={x} y={y} width={barW} height={h} rx={3} fill={color} opacity={0.92} />
            {showValues ? (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill="var(--text2)">
                {compactNum(d.value)}
              </text>
            ) : null}
            <text x={x + barW / 2} y={baseY + 14} textAnchor="middle" fontSize="9" fill="var(--text3)">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
