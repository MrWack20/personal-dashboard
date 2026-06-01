import { compactNum, type DonutDatum } from "@/lib/chart";

export default function Donut({
  data,
  format,
  total,
  centerLabel = "total",
}: {
  data: DonutDatum[];
  format: (n: number) => string;
  total: number;
  centerLabel?: string;
}) {
  const size = 180;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const sum = total > 0 ? total : data.reduce((s, d) => s + d.value, 0);
  if (sum <= 0) return null;

  let offset = 0;

  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flex: "0 0 auto" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface2)" strokeWidth={stroke} />
        {data.map((d, i) => {
          const frac = d.value / sum;
          const len = frac * C;
          const seg = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            >
              <title>{`${d.label}: ${format(d.value)} (${Math.round(frac * 100)}%)`}</title>
            </circle>
          );
          offset += len;
          return seg;
        })}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize="16"
          fill="var(--text)"
          style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700 }}
        >
          {compactNum(sum)}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text3)"
          style={{ fontFamily: "var(--font-dm-mono), monospace" }}
        >
          {centerLabel}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: 0, flex: "1 1 150px" }}>
        {data.map((d, i) => {
          const frac = d.value / sum;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.74rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flex: "0 0 auto" }} />
              <span
                style={{ color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={d.label}
              >
                {d.label}
              </span>
              <span className="mono" style={{ marginLeft: "auto", color: "var(--text)", whiteSpace: "nowrap" }}>
                {format(d.value)}
              </span>
              <span className="mono" style={{ color: "var(--text3)", width: 34, textAlign: "right" }}>
                {Math.round(frac * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
