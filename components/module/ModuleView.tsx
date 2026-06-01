"use client";

import { useEffect, useState } from "react";
import SummaryCards from "./SummaryCards";
import DataTable from "./DataTable";
import StockBreakdown from "./StockBreakdown";
import SheetEditor from "./SheetEditor";
import AutoCharts from "@/components/charts/AutoCharts";
import type { ModuleData } from "@/lib/moduleData";

const SECRET_KEY = "dashboard-edit-secret";

export default function ModuleView({ data }: { data: ModuleData }) {
  const [active, setActive] = useState(0);
  const [secret, setSecret] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [pass, setPass] = useState("");

  // Restore a previously-entered passcode for this browser session.
  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY);
    if (saved) setSecret(saved);
  }, []);

  function startEditing() {
    if (secret) {
      setEditing(true);
    } else {
      setPromptOpen(true);
    }
  }

  function submitPass(e: React.FormEvent) {
    e.preventDefault();
    const value = pass.trim();
    if (!value) return;
    sessionStorage.setItem(SECRET_KEY, value);
    setSecret(value);
    setPass("");
    setPromptOpen(false);
    setEditing(true);
  }

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
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.9rem" }}>
          {!editing ? (
            <button
              onClick={startEditing}
              className="mono"
              style={{
                fontSize: "0.74rem",
                color: "var(--text)",
                background: "var(--surface2)",
                border: "1px solid var(--border2)",
                borderRadius: "8px",
                padding: "0.3rem 0.7rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              ✎ Edit
            </button>
          ) : (
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--blue)" }}>
              editing ↓
            </span>
          )}
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
      </div>

      {promptOpen ? (
        <form
          onSubmit={submitPass}
          className="card"
          style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.85rem" }}
        >
          <span className="mono" style={{ fontSize: "0.74rem", color: "var(--text2)" }}>
            Enter edit passcode:
          </span>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoFocus
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border2)",
              borderRadius: "8px",
              color: "var(--text)",
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.78rem",
              padding: "0.4rem 0.7rem",
            }}
          />
          <button
            type="submit"
            style={{
              background: "var(--green-dim)",
              border: "1px solid var(--green)",
              borderRadius: "8px",
              color: "var(--green)",
              fontSize: "0.78rem",
              padding: "0.4rem 0.9rem",
            }}
          >
            Unlock
          </button>
          <button
            type="button"
            onClick={() => setPromptOpen(false)}
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
        </form>
      ) : null}

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
          <AutoCharts table={tab.table} />
          <DataTable columns={tab.table.columns} rows={tab.table.rows} />
        </>
      ) : (
        <div className="card" style={{ color: "var(--text3)", fontSize: "0.85rem" }}>
          This tab has no tabular data.
        </div>
      )}

      {editing && secret ? (
        <SheetEditor
          key={tab.gid}
          moduleId={data.moduleId}
          gid={tab.gid}
          title={tab.title}
          secret={secret}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </div>
  );
}
