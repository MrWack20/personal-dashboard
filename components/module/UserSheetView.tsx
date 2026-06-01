"use client";

import { useCallback, useEffect, useState } from "react";
import SummaryCards from "./SummaryCards";
import DataTable from "./DataTable";
import AutoCharts from "@/components/charts/AutoCharts";
import { getUserSheetLabel } from "@/lib/userSheets";
import { timeAgo } from "@/lib/format";
import type { SheetData } from "@/lib/moduleData";

export default function UserSheetView({ id }: { id: string }) {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [label, setLabel] = useState("Sheet");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/sheet?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setData(json as SheetData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sheet.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setActive(0);
    setLabel(getUserSheetLabel(id) ?? "Sheet");
    load();
  }, [id, load]);

  // Keep it fresh: refetch when you return to the tab and on a slow interval.
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const iv = setInterval(load, 60000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(iv);
    };
  }, [load]);

  if (loading && !data) {
    return (
      <div className="card" style={{ color: "var(--text3)", fontSize: "0.85rem" }}>
        <span className="spin" style={{ display: "inline-block", marginRight: "0.4rem" }}>
          ↻
        </span>
        Loading {label}…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card" style={{ background: "var(--red-dim)", border: "1px solid var(--red)" }}>
        <div style={{ color: "var(--red)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.2rem" }}>
          Couldn’t load this sheet
        </div>
        <div style={{ color: "var(--text2)", fontSize: "0.8rem", lineHeight: 1.5, marginBottom: "0.6rem" }}>
          {error}
        </div>
        <div style={{ color: "var(--text3)", fontSize: "0.74rem", lineHeight: 1.5, marginBottom: "0.7rem" }}>
          Open the sheet in Google Sheets → <strong>Share</strong> → General access →{" "}
          <strong>Anyone with the link</strong> (Viewer). Then retry.
        </div>
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border2)",
            borderRadius: "8px",
            color: "var(--text)",
            fontSize: "0.78rem",
            padding: "0.4rem 0.9rem",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const tabs = data.tabs;
  const tab = tabs[Math.min(active, tabs.length - 1)];

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div className="tag">📄 Added sheet</div>
        <h2 style={{ fontSize: "1.3rem", color: "var(--text)", marginTop: "0.2rem" }}>{label}</h2>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text3)" }}>
          Updated {timeAgo(data.lastFetched)} · auto-refreshes
        </span>
      </div>

      {tabs.length > 1 ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {tabs.map((t, i) => {
            const isActive = i === active;
            return (
              <button
                key={t.gid}
                onClick={() => setActive(i)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  background: isActive ? "var(--surface2)" : "transparent",
                  border: `1px solid ${isActive ? "var(--border2)" : "transparent"}`,
                  color: isActive ? "var(--text)" : "var(--text2)",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {t.title}
                {t.table && !t.error ? (
                  <span className="mono" style={{ marginLeft: "0.45rem", color: "var(--text3)", fontSize: "0.7rem" }}>
                    {t.table.rowCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "1rem",
          marginBottom: "0.85rem",
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ fontSize: "1.05rem", color: "var(--text)" }}>{tab.title}</h3>
        <a
          href={tab.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mono"
          style={{ fontSize: "0.74rem", color: "var(--blue)" }}
        >
          Open in Google Sheets ↗
        </a>
      </div>

      {tab.error ? (
        <div className="card" style={{ background: "var(--red-dim)", border: "1px solid var(--red)", color: "var(--text2)", fontSize: "0.82rem" }}>
          Couldn’t load this tab: {tab.error}
        </div>
      ) : tab.table && !tab.table.empty ? (
        <>
          <SummaryCards aggregates={tab.table.aggregates} />
          <AutoCharts table={tab.table} />
          <DataTable columns={tab.table.columns} rows={tab.table.rows} />
        </>
      ) : (
        <div className="card" style={{ color: "var(--text3)", fontSize: "0.85rem" }}>
          This tab has no tabular data.
        </div>
      )}
    </div>
  );
}
