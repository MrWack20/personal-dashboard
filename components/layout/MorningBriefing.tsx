"use client";

import { useState } from "react";
import { briefing, type BriefingAccent, type BriefingModule } from "@/lib/briefing";
import { timeAgo } from "@/lib/format";

const ACCENT_VAR: Record<BriefingAccent, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  blue: "var(--blue)",
  purple: "var(--purple)",
};

function ModuleCard({ m }: { m: BriefingModule }) {
  const empty = m.metrics.length === 0 && m.alerts.length === 0;
  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "0.8rem 0.9rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.55rem",
        minWidth: 0,
        opacity: empty ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
        <span>{m.icon}</span>
        <span style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
          {m.label}
        </span>
      </div>
      <div style={{ color: "var(--text2)", fontSize: "0.76rem", lineHeight: 1.45 }}>{m.headline}</div>

      {m.metrics.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {m.metrics.map((mt, i) => (
            <div
              key={i}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.3rem 0.55rem",
                minWidth: 0,
              }}
            >
              <div className="tag" style={{ fontSize: "0.58rem" }}>
                {mt.label}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: mt.accent ? ACCENT_VAR[mt.accent] : "var(--text)",
                }}
              >
                {mt.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {m.alerts.length > 0 ? (
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {m.alerts.map((a, i) => (
            <li key={i} style={{ display: "flex", gap: "0.45rem", fontSize: "0.74rem", lineHeight: 1.45 }}>
              <span style={{ color: "var(--amber)" }}>›</span>
              <span style={{ color: "var(--text2)" }}>{a}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function MorningBriefing() {
  const [open, setOpen] = useState(false);
  const data = briefing;
  if (!data || !data.modules || data.modules.length === 0) return null;

  const totalAlerts = data.modules.reduce((n, m) => n + (m.alerts?.length ?? 0), 0);

  return (
    <div
      className="card"
      style={{ marginBottom: "1.25rem", padding: open ? "1rem 1.25rem" : "0.7rem 1rem" }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        role="button"
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="tag">☀️ MORNING BRIEFING</div>
          <div style={{ color: "var(--text2)", fontSize: "0.82rem", marginTop: "0.2rem", lineHeight: 1.4 }}>
            {data.summary}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexShrink: 0 }}>
          {totalAlerts > 0 ? (
            <span
              className="mono"
              style={{
                fontSize: "0.68rem",
                color: "var(--amber)",
                background: "var(--amber-dim)",
                border: "1px solid var(--amber)",
                borderRadius: "999px",
                padding: "0.15rem 0.5rem",
                whiteSpace: "nowrap",
              }}
            >
              {totalAlerts} alert{totalAlerts === 1 ? "" : "s"}
            </span>
          ) : null}
          <span className="mono" style={{ fontSize: "0.7rem", color: "var(--text3)", whiteSpace: "nowrap" }}>
            {open ? "Hide −" : "Show +"}
          </span>
        </div>
      </div>

      {open ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "0.75rem",
              marginTop: "0.9rem",
            }}
          >
            {data.modules.map((m) => (
              <ModuleCard key={m.moduleId} m={m} />
            ))}
          </div>
          <div className="mono" style={{ fontSize: "0.66rem", color: "var(--text3)", marginTop: "0.75rem" }}>
            Generated {timeAgo(data.generatedAt)} · refreshes nightly at 4 AM
          </div>
        </>
      ) : null}
    </div>
  );
}
