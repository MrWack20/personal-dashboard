"use client";

import { useMemo, useState } from "react";
import { formatCell, isTruthy, type ColumnDef, type ColumnType } from "@/lib/table";

type SortDir = "asc" | "desc";

function sortValue(value: string, type: ColumnType): number | string {
  const v = (value ?? "").trim();
  if (type === "boolean") return isTruthy(v) ? 1 : 0;
  if (type === "currency" || type === "number" || type === "percent") {
    const n = Number(v.replace(/[₱$€£,%\s]/g, "").replace(/[()]/g, ""));
    return Number.isFinite(n) ? n : -Infinity;
  }
  if (type === "date") {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? -Infinity : t;
  }
  return v.toLowerCase();
}

const cellColor = (value: string, type: ColumnType): string | undefined => {
  if (type === "boolean") return isTruthy(value) ? "var(--green)" : "var(--text3)";
  return undefined;
};

export default function DataTable({
  columns,
  rows,
}: {
  columns: ColumnDef[];
  rows: string[][];
}) {
  const [sort, setSort] = useState<{ col: number; dir: SortDir } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const { col, dir } = sort;
    const type = columns[col]?.type ?? "text";
    const factor = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sortValue(a[col] ?? "", type);
      const bv = sortValue(b[col] ?? "", type);
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  }, [rows, sort, columns]);

  function toggleSort(col: number) {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="card" style={{ color: "var(--text3)", fontSize: "0.85rem" }}>
        No rows to display.
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr>
              {columns.map((c, i) => {
                const active = sort?.col === i;
                return (
                  <th
                    key={i}
                    onClick={() => toggleSort(i)}
                    style={{
                      textAlign: c.align,
                      padding: "0.6rem 0.8rem",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      userSelect: "none",
                      position: "sticky",
                      top: 0,
                      background: "var(--surface2)",
                      borderBottom: "1px solid var(--border2)",
                      color: active ? "var(--green)" : "var(--text2)",
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.68rem",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                    }}
                  >
                    {c.label}
                    <span style={{ marginLeft: "0.3rem", opacity: active ? 1 : 0.25 }}>
                      {active ? (sort!.dir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, r) => (
              <tr key={r} className="holding-row" style={{ borderBottom: "1px solid var(--border)" }}>
                {columns.map((c, i) => (
                  <td
                    key={i}
                    style={{
                      textAlign: c.align,
                      padding: "0.5rem 0.8rem",
                      whiteSpace: "nowrap",
                      color: cellColor(row[i] ?? "", c.type) ?? "var(--text)",
                      fontFamily:
                        c.type === "currency" || c.type === "number" || c.type === "percent"
                          ? "var(--font-dm-mono), monospace"
                          : "inherit",
                    }}
                  >
                    {formatCell(row[i] ?? "", c.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
