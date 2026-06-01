"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toA1, colLetter } from "@/lib/a1";

type Status = "saving" | "saved" | "error";

const STATUS_COLOR: Record<Status, string> = {
  saving: "var(--amber)",
  saved: "var(--green)",
  error: "var(--red)",
};

function pad(rows: string[][], width: number): string[][] {
  return rows.map((r) => {
    const c = r.slice();
    while (c.length < width) c.push("");
    return c;
  });
}

export default function SheetEditor({
  moduleId,
  gid,
  title,
  secret,
  onClose,
}: {
  moduleId: string;
  gid: string;
  title: string;
  secret: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [grid, setGrid] = useState<string[][]>([]);
  const [saved, setSaved] = useState<string[][]>([]);
  const [cols, setCols] = useState(1);
  const [sheetTitle, setSheetTitle] = useState(title);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cellState, setCellState] = useState<Record<string, Status>>({});
  const [newRow, setNewRow] = useState<string[] | null>(null);
  const [appending, setAppending] = useState(false);

  const post = useCallback(
    (payload: Record<string, unknown>) =>
      fetch("/api/sheets/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, gid, secret, ...payload }),
      }),
    [moduleId, gid, secret],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await post({ action: "grid" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        if (cancelled) return;
        const values: string[][] = data.values ?? [];
        const width = Math.max(1, ...values.map((r) => r.length));
        const padded = pad(values, width);
        setCols(width);
        setGrid(padded);
        setSaved(padded.map((r) => r.slice()));
        if (data.title) setSheetTitle(data.title);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load sheet.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post]);

  function setCell(r: number, c: number, v: string) {
    setGrid((g) => {
      const n = g.map((row) => row.slice());
      n[r][c] = v;
      return n;
    });
  }

  async function commitCell(r: number, c: number) {
    const value = grid[r]?.[c] ?? "";
    if ((saved[r]?.[c] ?? "") === value) return; // unchanged — skip the write
    const a1 = toA1(r, c);
    const key = `${r},${c}`;
    setCellState((s) => ({ ...s, [key]: "saving" }));
    try {
      const res = await post({ action: "updateCell", a1, value });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setSaved((s) => {
        const n = s.map((row) => row.slice());
        if (!n[r]) n[r] = [];
        n[r][c] = value;
        return n;
      });
      setCellState((s) => ({ ...s, [key]: "saved" }));
      setTimeout(() => {
        setCellState((s) => {
          if (s[key] !== "saved") return s;
          const n = { ...s };
          delete n[key];
          return n;
        });
      }, 1500);
      router.refresh();
    } catch (e) {
      setCellState((s) => ({ ...s, [key]: "error" }));
      setError(e instanceof Error ? e.message : "Failed to save cell.");
    }
  }

  async function saveNewRow() {
    if (!newRow) return;
    setAppending(true);
    setError(null);
    try {
      const res = await post({ action: "appendRow", values: newRow });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setGrid((g) => [...g, newRow.slice()]);
      setSaved((s) => [...s, newRow.slice()]);
      setNewRow(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add row.");
    } finally {
      setAppending(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    minWidth: "90px",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: "4px",
    color: "var(--text)",
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: "0.78rem",
    padding: "0.3rem 0.4rem",
  };

  return (
    <div
      className="card"
      style={{ marginTop: "1rem", border: "1px solid var(--blue)", padding: "0.9rem 1rem" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <div>
          <div className="tag" style={{ color: "var(--blue)" }}>
            EDIT MODE · WRITES TO GOOGLE SHEETS
          </div>
          <h3 style={{ fontSize: "1rem", color: "var(--text)", marginTop: "0.15rem" }}>{sheetTitle}</h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border2)",
            borderRadius: "8px",
            color: "var(--text)",
            fontSize: "0.78rem",
            padding: "0.4rem 0.8rem",
          }}
        >
          Done editing
        </button>
      </div>

      {error ? (
        <div
          style={{
            background: "var(--red-dim)",
            border: "1px solid var(--red)",
            borderRadius: "8px",
            color: "var(--text2)",
            fontSize: "0.78rem",
            padding: "0.5rem 0.7rem",
            marginBottom: "0.75rem",
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mono" style={{ color: "var(--text3)", fontSize: "0.82rem", padding: "1rem 0" }}>
          <span className="spin" style={{ display: "inline-block", marginRight: "0.4rem" }}>
            ↻
          </span>
          Loading the live grid…
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr>
                  <th
                    className="mono"
                    style={{
                      position: "sticky",
                      left: 0,
                      background: "var(--surface2)",
                      color: "var(--text3)",
                      fontSize: "0.62rem",
                      padding: "0.3rem 0.5rem",
                      borderBottom: "1px solid var(--border2)",
                    }}
                  >
                    #
                  </th>
                  {Array.from({ length: cols }, (_, c) => (
                    <th
                      key={c}
                      className="mono"
                      style={{
                        background: "var(--surface2)",
                        color: "var(--text3)",
                        fontSize: "0.62rem",
                        padding: "0.3rem 0.5rem",
                        borderBottom: "1px solid var(--border2)",
                        textAlign: "left",
                      }}
                    >
                      {colLetter(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, r) => (
                  <tr key={r}>
                    <td
                      className="mono"
                      style={{
                        position: "sticky",
                        left: 0,
                        background: "var(--surface)",
                        color: "var(--text3)",
                        fontSize: "0.62rem",
                        padding: "0.2rem 0.5rem",
                        borderBottom: "1px solid var(--border)",
                        textAlign: "right",
                      }}
                    >
                      {r + 1}
                    </td>
                    {Array.from({ length: cols }, (_, c) => {
                      const key = `${r},${c}`;
                      const st = cellState[key];
                      return (
                        <td key={c} style={{ borderBottom: "1px solid var(--border)", padding: "1px" }}>
                          <input
                            value={row[c] ?? ""}
                            onChange={(e) => setCell(r, c, e.target.value)}
                            onBlur={() => commitCell(r, c)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                            style={{
                              ...inputBase,
                              borderColor: st ? STATUS_COLOR[st] : "transparent",
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add a row */}
          <div style={{ marginTop: "0.85rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
            {newRow ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className="tag">NEW ROW</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {newRow.map((v, c) => (
                    <input
                      key={c}
                      value={v}
                      placeholder={colLetter(c)}
                      onChange={(e) =>
                        setNewRow((nr) => {
                          if (!nr) return nr;
                          const n = nr.slice();
                          n[c] = e.target.value;
                          return n;
                        })
                      }
                      style={{
                        ...inputBase,
                        width: "120px",
                        border: "1px solid var(--border2)",
                        background: "var(--surface2)",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={saveNewRow}
                    disabled={appending}
                    style={{
                      background: "var(--green-dim)",
                      border: "1px solid var(--green)",
                      borderRadius: "8px",
                      color: "var(--green)",
                      fontSize: "0.78rem",
                      padding: "0.4rem 0.9rem",
                      opacity: appending ? 0.6 : 1,
                    }}
                  >
                    {appending ? "Adding…" : "Save row"}
                  </button>
                  <button
                    onClick={() => setNewRow(null)}
                    disabled={appending}
                    style={{
                      background: "var(--surface2)",
                      border: "1px solid var(--border2)",
                      borderRadius: "8px",
                      color: "var(--text2)",
                      fontSize: "0.78rem",
                      padding: "0.4rem 0.9rem",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setNewRow(Array.from({ length: cols }, () => ""))}
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border2)",
                  borderRadius: "8px",
                  color: "var(--text)",
                  fontSize: "0.78rem",
                  padding: "0.4rem 0.9rem",
                }}
              >
                + Add row
              </button>
            )}
          </div>

          <p className="mono" style={{ color: "var(--text3)", fontSize: "0.66rem", lineHeight: 1.5, marginTop: "0.85rem" }}>
            Edits save to Google Sheets when you leave a cell (or press Enter). Green border = saved,
            amber = saving, red = failed. Values are entered exactly as typed (formulas and numbers parse
            like normal Sheets input).
          </p>
        </>
      )}
    </div>
  );
}
