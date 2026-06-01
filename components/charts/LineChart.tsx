import { compactNum, type LinePoint } from "@/lib/chart";

function shortDate(s: string): string {
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return `${d.getMonth() + 1}/${d.getDate()}`;
  return s.length > 8 ? s.slice(0, 8) : s;
}

export default function LineChart({
  data,
  format,
  height = 260,
}: {
  data: LinePoint[];
  format: (n: number) => string;
  height?: number;
}) {
  const W = 600;
  const H = height;
  const padL = 46;
  const padR = 14;
  const padT = 18;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = data.length;
  if (n < 2) return null;

  const values = data.map((d) => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  min -= range * 0.08;
  max += range * 0.08;

  const x = (i: number) => padL + plotW * (n === 1 ? 0.5 : i / (n - 1));
  const y = (v: number) => padT + plotH * (1 - (v - min) / (max - min));

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${x(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.ceil(n / 6);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", fontFamily: "var(--font-dm-mono), monospace" }}
    >
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const yy = padT + plotH * (1 - t);
        const v = min + (max - min) * t;
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="var(--border)" strokeWidth={1} />
            <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize="9" fill="var(--text3)">
              {compactNum(v)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#lc-fill)" />
      <path d={line} fill="none" stroke="var(--green)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {n <= 24
        ? data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.value)} r={2.4} fill="var(--green)">
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </circle>
          ))
        : null}
      {data.map((d, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <text key={"l" + i} x={x(i)} y={padT + plotH + 14} textAnchor="middle" fontSize="8.5" fill="var(--text3)">
            {shortDate(d.label)}
          </text>
        ) : null,
      )}
    </svg>
  );
}
