"use client";

import { useState } from "react";
import SummaryCards from "./SummaryCards";
import DataTable from "./DataTable";
import StockBreakdown from "./StockBreakdown";
import type { ModuleData } from "@/lib/moduleData";

export default function ModuleView({ data }: { data: ModuleData }) {
  const [active, setActive] = useState(0);

  if (data.tabs.length === 0) {
    return (
      <div className="card" style={{ color: "var(--text3)" }}>
        No tabs found for this sheet.
      </div>
    );
  }

  const tab = data.tabs[Math.min(active, data.tabs.length - 1)];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        {data.tabs.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.gid}
              onClick={() => setActive(i)}
              title={t.priority === "low" ? "Archived / low priority" : t.title}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                fontSize: "0.8rem",
                background: isActive ? "var(--surface2)" : "transparent",
                border: `1px solid ${isActive ? "var(--border2)" : "transparent"}`,
                color: isActive ? "var(--text)" : "var(--text2)",
                fontWeight: isActive ? 700 : 400,
                opacity: t.priority === "low" && !isActive ? 0.55 : 1,
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
        <h2 style={{ fontSize: "1.15rem", color: "var(--text)" }}>{tab.title}</h2>
        <a
          href={tab.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mono"
          style={{
            fontSize: "0.74rem",
            color: "var(--blue)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          Open in Google Sheets ↗
        </a>
      </div>

      {tab.error ? (
        <div
          className="card"
          style={{
            background: "var(--red-dim)",
            border: "1px solid var(--red)",
            color: "var(--text2)",
            fontSize: "0.82rem",
          }}
        >
          Couldn’t load this tab: {tab.error}
        </div>
      ) : tab.table && !tab.table.empty ? (
        <>
          <SummaryCards aggregates={tab.table.aggregates} />
          {tab.breakdown ? <StockBreakdown data={tab.breakdown} /> : null}
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
