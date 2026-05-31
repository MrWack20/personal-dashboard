export type ColumnType = "currency" | "number" | "percent" | "boolean" | "date" | "text";

export interface ColumnDef {
  index: number; // original column index in the sheet
  label: string;
  type: ColumnType;
  align: "left" | "right" | "center";
}

export interface Aggregate {
  label: string;
  display: string;
  accent: "green" | "blue" | "amber" | "purple" | "red";
}

export interface TableData {
  columns: ColumnDef[];
  rows: string[][]; // each row aligned to `columns` order
  rowCount: number;
  aggregates: Aggregate[];
  headerRow: number; // 0-based index of detected header in the raw matrix
  empty: boolean;
}

const TRUEY = new Set(["true", "yes", "y", "✓", "✔", "x", "1", "done", "owned", "collected"]);
const FALSEY = new Set(["false", "no", "n", "", "0", "—", "-"]);

function hasLetter(s: string): boolean {
  return /[A-Za-z]/.test(s);
}

function cleanNum(raw: string): number | null {
  if (raw == null) return null;
  const t = raw.replace(/[₱$€£,%\s]/g, "").replace(/[()]/g, "");
  if (t === "" || t === "-" || t === ".") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function looksCurrency(raw: string): boolean {
  const t = raw.trim();
  if (t === "") return false;
  if (/[₱$€£]/.test(t)) return true;
  // grouped thousands or explicit 2-decimal money, e.g. 1,250.00 or 5400.00
  return /^-?\d{1,3}(,\d{3})+(\.\d{2})?$/.test(t) || /^-?\d+\.\d{2}$/.test(t);
}

function looksPercent(raw: string): boolean {
  return /%\s*$/.test(raw.trim());
}

function looksBoolean(raw: string): boolean {
  const t = raw.trim().toLowerCase();
  return TRUEY.has(t) || FALSEY.has(t);
}

function isTruthy(raw: string): boolean {
  return TRUEY.has(raw.trim().toLowerCase());
}

function looksDate(raw: string): boolean {
  const t = raw.trim();
  if (t === "") return false;
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(t)) return true;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return true;
  if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(t) && /\d/.test(t)) return true;
  return false;
}

/** Score how much a row looks like a header (run of short text labels). */
function headerScore(row: string[]): number {
  let score = 0;
  for (const cell of row) {
    const t = (cell ?? "").trim();
    if (t.length === 0 || t.length > 45) continue;
    if (hasLetter(t) && cleanNum(t) === null && !looksBoolean(t)) score += 1;
  }
  return score;
}

function nonEmptyCount(row: string[]): number {
  return row.reduce((n, c) => n + ((c ?? "").trim() ? 1 : 0), 0);
}

function numericCount(row: string[]): number {
  return row.reduce((n, c) => {
    const t = (c ?? "").trim();
    return n + (t !== "" && cleanNum(t) !== null ? 1 : 0);
  }, 0);
}

/** A trailing "TOTAL" / "GRAND TOTAL" / "SUM" row baked into the sheet. */
function isTotalRow(row: string[]): boolean {
  const firstText = row.find((c) => (c ?? "").trim() !== "");
  if (!firstText) return false;
  return /^(total|grand[\s-]?total|sum|subtotal)$/i.test(firstText.trim());
}

/** Pick the row most likely to be the column header within the first rows. */
function detectHeaderRow(matrix: string[][]): number {
  const limit = Math.min(matrix.length, 15);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < limit; i++) {
    const score = headerScore(matrix[i]);
    // require at least one data-ish row to follow
    const hasFollowing = matrix.slice(i + 1, i + 4).some((r) => nonEmptyCount(r) >= 2);
    const adjusted = hasFollowing ? score : score - 100;
    if (adjusted > bestScore) {
      bestScore = adjusted;
      best = i;
    }
  }
  return best;
}

function inferType(values: string[]): ColumnType {
  const nonEmpty = values.filter((v) => (v ?? "").trim() !== "");
  if (nonEmpty.length === 0) return "text";

  const ratio = (pred: (s: string) => boolean) =>
    nonEmpty.filter(pred).length / nonEmpty.length;

  // booleans: most values are TRUE/FALSE-ish (treat blanks as false elsewhere)
  const boolish = values.filter((v) => looksBoolean(v)).length / values.length;
  if (boolish >= 0.8 && nonEmpty.some((v) => isTruthy(v))) return "boolean";

  if (ratio(looksPercent) >= 0.6) return "percent";
  if (ratio(looksCurrency) >= 0.6) return "currency";
  if (ratio((s) => cleanNum(s) !== null) >= 0.8) return "number";
  if (ratio(looksDate) >= 0.6) return "date";
  return "text";
}

function alignFor(type: ColumnType): ColumnDef["align"] {
  if (type === "currency" || type === "number" || type === "percent") return "right";
  if (type === "boolean") return "center";
  return "left";
}

function colLetter(i: number): string {
  let s = "";
  i += 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

function peso(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Pick an accent for a labelled KPI / metric based on its meaning. */
function accentForLabel(label: string): Aggregate["accent"] {
  const l = label.toLowerCase();
  if (/capital|cash|gcash|bank|balance|budget|invested/.test(l)) return "blue";
  if (/cost|cogs|expense|spent|withdraw|loss/.test(l)) return "red";
  if (/profit|margin|gross|net|earn|income|gain/.test(l)) return "green";
  if (/revenue|sales|sold|received/.test(l)) return "green";
  if (/stock|active|qty|item|order|unit|count|remaining|on hand/.test(l)) return "purple";
  return "amber";
}

/** Title-case an ALL-CAPS label; leave mixed-case labels untouched. */
function titleCase(s: string): string {
  if (s.length > 1 && s === s.toUpperCase() && /[A-Z]/.test(s)) {
    return s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  }
  return s;
}

/** Normalize a single KPI value cell for display. */
function formatKpiValue(raw: string): string {
  const t = raw.trim();
  if (looksPercent(t)) return t;
  if (looksCurrency(t)) {
    const n = cleanNum(t);
    return n === null ? t : peso(n);
  }
  return t;
}

/**
 * Many of these sheets carry a pre-computed KPI block at the top: one row of
 * text labels directly above one row of numbers (e.g. "Total Revenue" over
 * "₱10,949.98"). When present these authoritative summaries are far more
 * meaningful than generic column sums, so we surface them as the aggregates.
 */
function extractKpis(matrix: string[][]): Aggregate[] {
  const limit = Math.min(matrix.length - 1, 10);
  let best: Aggregate[] = [];

  for (let i = 0; i < limit; i++) {
    const labels = matrix[i] ?? [];
    const values = matrix[i + 1] ?? [];
    const after = matrix[i + 2] ?? [];

    const vNum = numericCount(values);
    if (vNum < 3) continue;
    // Reject ordinary data rows: a real table keeps going with another numeric
    // row, a KPI block is followed by blanks / legend / a title.
    if (numericCount(after) >= vNum * 0.6) continue;

    const kpis: Aggregate[] = [];
    const width = Math.max(labels.length, values.length);
    for (let c = 0; c < width; c++) {
      const label = (labels[c] ?? "").trim().replace(/\s+/g, " ");
      const val = (values[c] ?? "").trim();
      if (!label || !hasLetter(label) || label.length > 40 || cleanNum(label) !== null) continue;
      if (val === "" || cleanNum(val) === null) continue;
      kpis.push({ label: titleCase(label), display: formatKpiValue(val), accent: accentForLabel(label) });
    }

    if (kpis.length >= 3 && kpis.length > best.length) best = kpis;
  }

  return best.slice(0, 8);
}

/** Find a column by (whitespace/case-insensitive) header label. */
export function columnIndex(table: TableData, label: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const target = norm(label);
  return table.columns.findIndex((c) => norm(c.label) === target);
}

/** Build a normalized, typed table from a raw CSV matrix. */
export function buildTable(matrix: string[][]): TableData {
  const cleaned = matrix.filter((r) => r.length > 0);
  if (cleaned.length === 0) {
    return { columns: [], rows: [], rowCount: 0, aggregates: [], headerRow: 0, empty: true };
  }

  const headerRow = detectHeaderRow(cleaned);
  const header = cleaned[headerRow] ?? [];
  const dataRows = cleaned.slice(headerRow + 1);
  const width = Math.max(header.length, ...dataRows.map((r) => r.length), 0);

  // Determine active columns. Skip stray summary/stat cells (numeric "headers"
  // like 14 / 155 / 84.88) and empty columns; keep real data and labeled columns.
  const isNumericLabel = (s: string) =>
    s !== "" && !hasLetter(s) && (cleanNum(s) !== null || /%\s*$/.test(s));

  const active: number[] = [];
  for (let c = 0; c < width; c++) {
    const headerCell = (header[c] ?? "").trim();
    if (isNumericLabel(headerCell)) continue;
    const filled = dataRows.reduce((n, r) => n + ((r[c] ?? "").trim() ? 1 : 0), 0);
    const ratio = dataRows.length ? filled / dataRows.length : 0;
    const labeledText = hasLetter(headerCell);
    if (ratio >= 0.15 || (labeledText && filled >= 1)) active.push(c);
  }

  const cols = active.length > 0 ? active : header.map((_, c) => c);

  const STAT_LABEL = /^(remaining|percentage|total|left|count|status|pokemon)$/i;

  const columns: ColumnDef[] = cols.map((c) => {
    const values = dataRows.map((r) => r[c] ?? "");
    const type = inferType(values);
    let label = (header[c] ?? "").trim().replace(/:\s*$/, "").replace(/\s+/g, " ");
    // A boolean column labeled with a stray stat word is really a checklist flag.
    if (type === "boolean" && (label === "" || STAT_LABEL.test(label))) {
      label = "Collected";
    }
    if (!label) label = `Col ${colLetter(c)}`;
    return { index: c, label, type, align: alignFor(type) };
  });

  const rows = dataRows
    .map((r) => cols.map((c) => (r[c] ?? "").trim()))
    .filter((r) => r.some((v) => v !== ""));

  // Prefer a real, pre-computed KPI block from the top of the sheet; otherwise
  // derive sensible aggregates from the data columns (ignoring any baked-in
  // TOTAL row so sums aren't double-counted).
  const kpis = extractKpis(cleaned);
  const aggregates =
    kpis.length >= 3 ? kpis : buildAggregates(columns, rows.filter((r) => !isTotalRow(r)));

  return {
    columns,
    rows,
    rowCount: rows.length,
    aggregates,
    headerRow,
    empty: rows.length === 0,
  };
}

function buildAggregates(columns: ColumnDef[], rows: string[][]): Aggregate[] {
  const out: Aggregate[] = [];

  // Row count is always useful.
  out.push({ label: "Rows", display: String(rows.length), accent: "blue" });

  // "Total Amount" -> "Total Amount" (not "Total Total Amount").
  const totalLabel = (label: string) =>
    /^(total|sum|grand)\b/i.test(label.trim()) ? label : `Total ${label}`;

  // Per-unit / threshold / rate columns sum to meaningless figures — skip them.
  const SKIP_SUM =
    /per\s*(bag|unit|piece|pack|item)|unit price|price each|\beach\b|threshold|\bwarn\b|\bcritical\b|tub cost|plastic|sticker|\bavg\b|average|\brate\b|\bmargin\b/i;

  for (let i = 0; i < columns.length && out.length < 5; i++) {
    const col = columns[i];
    const vals = rows.map((r) => r[i] ?? "");

    if (col.type === "boolean") {
      const total = rows.length;
      const done = vals.filter((v) => isTruthy(v)).length;
      const pct = total ? Math.round((done / total) * 1000) / 10 : 0;
      out.push({
        label: `${col.label} complete`,
        display: `${done}/${total} · ${pct}%`,
        accent: "green",
      });
    } else if (col.type === "currency") {
      if (SKIP_SUM.test(col.label)) continue;
      const sum = vals.reduce((s, v) => s + (cleanNum(v) ?? 0), 0);
      out.push({ label: totalLabel(col.label), display: peso(sum), accent: accentForLabel(col.label) });
    } else if (col.type === "number") {
      // Only surface number sums that look meaningful (skip id-like & per-unit columns)
      const looksId = /id|#|no\.?|index|pok[eé]dex/i.test(col.label);
      if (looksId || SKIP_SUM.test(col.label)) continue;
      const nums = vals.map((v) => cleanNum(v)).filter((n): n is number => n !== null);
      const sum = nums.reduce((s, n) => s + n, 0);
      if (nums.length > 0) {
        out.push({ label: totalLabel(col.label), display: sum.toLocaleString("en-PH"), accent: accentForLabel(col.label) });
      }
    }
  }

  return out.slice(0, 5);
}

/** Display formatting for a cell given its column type. */
export function formatCell(value: string, type: ColumnType): string {
  if (value === "") return type === "boolean" ? "—" : "";
  if (type === "currency") {
    const n = cleanNum(value);
    return n === null ? value : peso(n);
  }
  if (type === "boolean") {
    return isTruthy(value) ? "✓" : "—";
  }
  return value;
}

export { isTruthy, cleanNum };
