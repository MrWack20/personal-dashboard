import { cleanNum, type TableData, type ColumnType } from "./table";
import { peso } from "./format";

/** Accent palette for chart series (matches the dashboard theme). */
export const CHART_PALETTE = [
  "#3dffa0",
  "#5b9cf6",
  "#f5b942",
  "#c084fc",
  "#ff5f5f",
  "#46d6c4",
  "#ff9f6b",
  "#9b8cff",
  "#7ee787",
  "#f78fb3",
];

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}
export interface LinePoint {
  label: string;
  value: number;
}
export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export interface ChartPlan {
  line?: { title: string; points: LinePoint[]; format: (n: number) => string };
  bar?: { title: string; data: BarDatum[]; format: (n: number) => string };
  donut?: {
    title: string;
    data: DonutDatum[];
    format: (n: number) => string;
    total: number;
  };
}

/** Value formatter for a column type. */
export function makeFormatter(type: ColumnType): (n: number) => string {
  if (type === "currency") return (n) => peso(Math.round(n));
  if (type === "percent") return (n) => `${Math.round(n)}%`;
  return (n) => Math.round(n).toLocaleString("en-PH");
}

/** Compact number for axis ticks / donut center: 12345 → "12k". */
export function compactNum(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(Math.round(n));
}

const ID_RE = /(^|\b)(id|#|no\.?|index|dex|rank|year|sku)(\b|$)/i;
const TOTAL_RE = /^(total|grand[\s-]?total|sum|subtotal|overall|average|avg)$/i;

/**
 * Inspect a parsed table and decide which chart(s) best summarize it.
 * date + number → line; category + number → bar; small composition → donut.
 */
export function analyzeTable(table: TableData): ChartPlan {
  const plan: ChartPlan = {};
  const cols = table.columns;
  const rows = table.rows;
  if (cols.length === 0 || rows.length < 2) return plan;

  const isNum = (t: ColumnType) => t === "currency" || t === "number" || t === "percent";

  // Numeric columns (by position in row arrays), excluding id-like columns.
  const numeric = cols
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => isNum(c.type) && !ID_RE.test(c.label));
  if (numeric.length === 0) return plan;

  // Primary numeric = the one with the largest summed magnitude.
  let primary = numeric[0];
  let bestSum = -1;
  for (const nz of numeric) {
    const sum = rows.reduce((s, r) => s + Math.abs(cleanNum(r[nz.i]) ?? 0), 0);
    if (sum > bestSum) {
      bestSum = sum;
      primary = nz;
    }
  }
  const pIdx = primary.i;
  const pLabel = primary.c.label;
  const pType = primary.c.type;
  const format = makeFormatter(pType);

  let labelIdx = cols.findIndex((c) => c.type === "text");
  if (labelIdx < 0) labelIdx = 0;
  const labelName = cols[labelIdx]?.label ?? "category";

  const dateIdx = cols.findIndex((c) => c.type === "date");

  // LINE — a time series.
  if (dateIdx >= 0) {
    const pts = rows
      .map((r) => ({ label: (r[dateIdx] ?? "").trim(), value: cleanNum(r[pIdx]) }))
      .filter((p): p is LinePoint => !!p.label && p.value !== null);
    pts.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());
    if (pts.length >= 3) {
      plan.line = { title: `${pLabel} over time`, points: pts.slice(-40), format };
    }
  }

  // Aggregate by category for bar / donut.
  const byLabel = new Map<string, number>();
  for (const r of rows) {
    const label = (r[labelIdx] ?? "").trim();
    if (!label || TOTAL_RE.test(label)) continue;
    const v = cleanNum(r[pIdx]);
    if (v === null || v === 0) continue;
    byLabel.set(label, (byLabel.get(label) ?? 0) + v);
  }

  // BAR — top categories by value.
  const barData = [...byLabel.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 12)
    .map((d, i) => ({ ...d, color: CHART_PALETTE[i % CHART_PALETTE.length] }));
  if (barData.length >= 2) {
    plan.bar = {
      title: plan.line ? `Top ${labelName}` : `${pLabel} by ${labelName}`,
      data: barData,
      format,
    };
  }

  // DONUT — composition when there are only a few positive categories.
  if (pType === "currency" || pType === "number") {
    const positive = [...byLabel.entries()].filter(([, v]) => v > 0);
    if (positive.length >= 2 && positive.length <= 8) {
      const total = positive.reduce((s, [, v]) => s + v, 0);
      if (total > 0) {
        const donut = positive
          .sort((a, b) => b[1] - a[1])
          .map(([label, value], i) => ({
            label,
            value,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          }));
        plan.donut = { title: `${pLabel} share`, data: donut, format, total };
      }
    }
  }

  return plan;
}
