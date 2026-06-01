"use client";

import { useState } from "react";
import {
  intelligence,
  formatUpdated,
  formatShort,
  daysSince,
  priorityRank,
  actionRank,
  normalizeStatus,
  type WatchlistItem,
  type InvestmentGoal,
  type HoldingCall,
  type HoldingAction,
} from "@/lib/intelligence";
import { peso } from "@/lib/format";
import PriorityLists from "./PriorityLists";

type Accent = "green" | "amber" | "red" | "blue" | "purple";

const ACCENT_VAR: Record<Accent, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  blue: "var(--blue)",
  purple: "var(--purple)",
};
const ACCENT_DIM: Record<Accent, string> = {
  green: "var(--green-dim)",
  amber: "var(--amber-dim)",
  red: "var(--red-dim)",
  blue: "var(--blue-dim)",
  purple: "var(--purple-dim)",
};

function Badge({ accent, children }: { accent: Accent; children: React.ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: "10px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: "4px",
        color: ACCENT_VAR[accent],
        background: ACCENT_DIM[accent],
        border: `1px solid ${ACCENT_VAR[accent]}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SubHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <div className="tag">{tag}</div>
      <h3 style={{ fontSize: "1.05rem", color: "var(--text)", marginTop: "0.15rem" }}>{title}</h3>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "0.68rem",
        padding: "2px 8px",
        borderRadius: "999px",
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        color: "var(--text2)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

const BUDGET: Record<WatchlistItem["budgetStatus"], { accent: Accent; label: string }> = {
  within: { accent: "green", label: "Within ₱5K" },
  stretch: { accent: "amber", label: "Stretch" },
  over: { accent: "red", label: "Over Budget" },
};
const PRIORITY: Record<WatchlistItem["priority"], Accent> = {
  high: "red",
  medium: "amber",
  low: "blue",
};

const GOAL_STATUS: Record<InvestmentGoal["status"], { accent: Accent; label: string }> = {
  "on-track": { accent: "green", label: "On Track" },
  "in-progress": { accent: "blue", label: "In Progress" },
  "not-started": { accent: "amber", label: "Not Started" },
  done: { accent: "green", label: "Done" },
};

function usd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

const ACTION_ACCENT: Record<HoldingAction, Accent> = {
  "SELL NOW": "red",
  "SELL IF OFFERED": "amber",
  WATCH: "blue",
  HOLD: "green",
  "HOLD STRONG": "green",
};

const STATUS_META: Record<"Holding" | "Collection" | "For Sale", { accent: Accent; label: string }> = {
  Holding: { accent: "blue", label: "Holding" },
  Collection: { accent: "purple", label: "Collection" },
  "For Sale": { accent: "amber", label: "For Sale" },
};

function HoldingsCard({ holdings }: { holdings: HoldingCall[] }) {
  const rows = [...holdings].sort((a, b) => actionRank(a.action) - actionRank(b.action));

  let holding = 0;
  let collection = 0;
  let forSale = 0;
  let sellSignals = 0;
  for (const h of holdings) {
    const s = normalizeStatus(h.status);
    if (s === "Collection") collection += 1;
    else if (s === "For Sale") forSale += 1;
    else holding += 1;
    if (h.action === "SELL NOW" || h.action === "SELL IF OFFERED") sellSignals += 1;
  }

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "0.85rem",
        }}
      >
        <SubHeader tag="YOUR HOLDINGS" title="Hold / sell call per owned card" />
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text3)" }}>
          {holding} holding · {collection} collection · {forSale} for sale · {sellSignals} sell signals
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "0.5rem" }}>
        {rows.map((h, i) => {
          const accent = ACTION_ACCENT[h.action];
          const canon = normalizeStatus(h.status);
          const statusMeta = canon ? STATUS_META[canon] : null;
          const gainPct =
            h.costPhp && h.costPhp > 0 && typeof h.valuePhp === "number"
              ? Math.round(((h.valuePhp - h.costPhp) / h.costPhp) * 100)
              : null;
          return (
            <div
              key={`${h.card}-${i}`}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: "0.5rem 0.75rem",
                alignItems: "start",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "0.6rem 0.75rem",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.84rem", color: "var(--text)" }}>{h.card}</span>
                  {statusMeta ? <Badge accent={statusMeta.accent}>{statusMeta.label}</Badge> : null}
                </div>
                <div style={{ color: "var(--text3)", fontSize: "0.72rem", lineHeight: 1.45, marginTop: "0.15rem" }}>
                  {h.reason}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", whiteSpace: "nowrap" }}>
                <Badge accent={accent}>{h.action}</Badge>
                <span className="mono" style={{ fontSize: "0.7rem", color: "var(--text3)" }}>
                  {typeof h.valuePhp === "number"
                    ? `${peso(h.valuePhp)}${gainPct !== null ? ` · ${gainPct >= 0 ? "+" : ""}${gainPct}%` : ""}`
                    : typeof h.costPhp === "number" && h.costPhp > 0
                      ? `cost ${peso(h.costPhp)}`
                      : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ color: "var(--text3)", fontSize: "0.68rem", lineHeight: 1.5, marginTop: "0.75rem" }}>
        Add a <strong style={{ color: "var(--text2)" }}>Status</strong> column to your INVENTORY tab with
        “Holding”, “Collection”, or “For Sale”. Collection cards are treated as keepsakes — no sell nudge,
        but flagged if a value spikes. Calls and values are refreshed by the 4 AM routine.
      </p>
    </div>
  );
}

function GoalCard({ goal }: { goal: InvestmentGoal }) {
  const status = GOAL_STATUS[goal.status];
  const accent = PRIORITY[goal.priority];
  const isSavings = goal.targetPhp > 0;
  const pct = isSavings ? Math.min(100, Math.round((goal.savedPhp / goal.targetPhp) * 100)) : 0;

  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${ACCENT_VAR[accent]}`,
        borderRadius: "12px",
        padding: "0.9rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.6rem" }}>
        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3 }}>
          {goal.title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-end" }}>
          <Badge accent={accent}>{goal.priority} priority</Badge>
          <Badge accent={status.accent}>{status.label}</Badge>
        </div>
      </div>

      {goal.linkedCard ? (
        <div className="mono" style={{ fontSize: "0.72rem", color: "var(--text2)" }}>
          → {goal.linkedCard}
        </div>
      ) : null}

      {isSavings ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
            <span className="mono" style={{ color: ACCENT_VAR[accent] }}>
              {peso(goal.savedPhp)} / {peso(goal.targetPhp)}
            </span>
            <span className="mono" style={{ color: "var(--text3)" }}>
              {pct}% · target {goal.targetDate}
            </span>
          </div>
          <div
            style={{
              height: "6px",
              borderRadius: "999px",
              background: "var(--surface)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: "999px",
                background: ACCENT_VAR[accent],
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mono" style={{ fontSize: "0.74rem", color: "var(--text3)" }}>
          Discipline goal · target {goal.targetDate}
        </div>
      )}

      <p style={{ color: "var(--text2)", fontSize: "0.76rem", lineHeight: 1.5 }}>{goal.why}</p>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: Accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", fontSize: "0.78rem" }}>
      <span style={{ color: "var(--text3)" }}>{label}</span>
      <span
        className="mono"
        style={{ color: accent ? ACCENT_VAR[accent] : "var(--text)", textAlign: "right" }}
      >
        {value}
      </span>
    </div>
  );
}

function PriceFreshness({ item }: { item: WatchlistItem }) {
  const age = daysSince(item.priceUpdated);
  const src = item.priceSource ? ` · ${item.priceSource}` : "";

  let accent: Accent;
  let mark: string;
  let text: string;
  if (!item.priceUpdated || age === null) {
    accent = "amber";
    mark = "≈";
    text = `Estimate — awaiting daily verification${src}`;
  } else if (age <= 2) {
    accent = "green";
    mark = "✓";
    text = `Verified ${formatShort(item.priceUpdated)}${src}`;
  } else {
    accent = "amber";
    mark = "⚠";
    text = `Last checked ${formatShort(item.priceUpdated)} (${age}d ago)${src}`;
  }

  return (
    <div
      className="mono"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        fontSize: "0.66rem",
        color: ACCENT_VAR[accent],
      }}
      title="Market price (USD) is the verified figure; PHP is a converted estimate."
    >
      <span aria-hidden>{mark}</span>
      <span>{text}</span>
    </div>
  );
}

function WatchCard({ item }: { item: WatchlistItem }) {
  const budget = BUDGET[item.budgetStatus];
  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "0.9rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.6rem" }}>
        <div>
          <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "0.98rem" }}>
            {item.name}{" "}
            <span className="mono" style={{ color: "var(--text3)", fontWeight: 400, fontSize: "0.8rem" }}>
              {item.cardNumber}
            </span>
          </div>
          <div style={{ color: "var(--text2)", fontSize: "0.74rem", marginTop: "0.1rem" }}>{item.set}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-end" }}>
          <Badge accent={budget.accent}>{budget.label}</Badge>
          <Badge accent={PRIORITY[item.priority]}>{item.priority}</Badge>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <Row label="Market (USD)" value={usd(item.usdPrice)} />
        <Row label="PHP (≈ converted)" value={peso(item.phpEstimate)} />
        <Row label="Hold" value={`${item.holdMonths} mo`} />
        <Row label="Sell Target" value={item.sellTarget} accent="green" />
      </div>

      <PriceFreshness item={item} />

      <p style={{ color: "var(--text2)", fontSize: "0.76rem", lineHeight: 1.5 }}>{item.notes}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {item.tags.map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>
    </div>
  );
}

type IntelTab = "goals" | "holdings" | "watchlist" | "buylists" | "playbook";

export default function InvestmentIntelligence() {
  const data = intelligence;
  const [tab, setTab] = useState<IntelTab>("goals");

  const goals = [...data.goals].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const watchlist = [...data.watchlist].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const holdings = data.holdings ?? [];
  const hasHoldings = holdings.length > 0;

  const tabs: { id: IntelTab; label: string; badge?: number }[] = [
    { id: "goals", label: "Goals", badge: goals.length },
    ...(hasHoldings ? [{ id: "holdings" as IntelTab, label: "Holdings", badge: holdings.length }] : []),
    { id: "watchlist", label: "Watchlist", badge: watchlist.length },
    { id: "buylists", label: "Buy Lists" },
    { id: "playbook", label: "Playbook" },
  ];

  return (
    <section style={{ marginTop: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div className="tag">INVESTMENT INTELLIGENCE</div>
          <h2 style={{ fontSize: "1.3rem", color: "var(--text)", marginTop: "0.15rem" }}>
            Buy, Hold &amp; Sell Playbook
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="mono" style={{ fontSize: "0.74rem", color: "var(--text3)", display: "block" }}>
            Updated {formatUpdated(data.lastUpdated)} · $1 ≈ ₱{data.usdToPhp}
          </span>
          <span className="mono" style={{ fontSize: "0.66rem", color: "var(--green)", display: "block", marginTop: "0.15rem" }}>
            ✓ Prices auto-verified daily at 4 AM
          </span>
        </div>
      </div>

      {/* Section nav — one panel at a time to keep scrolling short */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.9rem",
                fontSize: "0.78rem",
                borderRadius: "8px",
                background: active ? "var(--green-dim)" : "var(--surface2)",
                color: active ? "var(--green)" : "var(--text2)",
                border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
                fontWeight: active ? 700 : 400,
              }}
            >
              {t.label}
              {typeof t.badge === "number" ? (
                <span style={{ color: active ? "var(--green)" : "var(--text3)", fontSize: "0.7rem", opacity: 0.85 }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Goals */}
      {tab === "goals" ? (
        <div className="card">
          <SubHeader tag="GOALS" title="Stay on track — priority order" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "0.85rem",
            }}
          >
            {goals.map((goal) => (
              <GoalCard key={goal.title} goal={goal} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Holdings (hold/sell calls) */}
      {tab === "holdings" && hasHoldings ? <HoldingsCard holdings={holdings} /> : null}

      {/* Watchlist */}
      {tab === "watchlist" ? (
        <div className="card">
          <SubHeader tag="WATCHLIST" title="Cards to find in PH" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "0.85rem",
            }}
          >
            {watchlist.map((item) => (
              <WatchCard key={`${item.name}-${item.cardNumber}`} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Buy Lists — nested priority lists with their own Full / 5K-7K sub-tabs */}
      {tab === "buylists" ? <PriorityLists embedded /> : null}

      {/* Playbook — sealed rules, checklist, avoid, notes */}
      {tab === "playbook" ? (
        <>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <SubHeader tag="SEALED PRODUCTS" title="Hold &amp; sell rules" />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.sealedRules.map((rule) => (
                <div
                  key={rule.product}
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.6fr 1fr 1fr 1.4fr 0.8fr",
                      gap: "0.6rem",
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{rule.product}</span>
                    <Row label="Cost" value={peso(rule.costPhp)} />
                    <Row label="Min Hold" value={`${rule.minHoldMonths} mo`} />
                    <Row label="Sell Target" value={peso(rule.sellTargetPhp)} />
                    <span
                      className="mono"
                      style={{ color: "var(--green)", textAlign: "right", fontSize: "0.85rem", fontWeight: 500 }}
                    >
                      +{rule.sellTriggerPct}%
                    </span>
                  </div>
                  <p style={{ color: "var(--text3)", fontSize: "0.74rem", lineHeight: 1.5, marginTop: "0.35rem" }}>
                    {rule.riskNote}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <SubHeader tag="CHECKLIST" title="Run this before every purchase" />
            <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.buyChecklist.map((item, i) => (
                <li
                  key={i}
                  className="mono"
                  style={{ display: "flex", gap: "0.6rem", fontSize: "0.8rem", color: "var(--text2)", lineHeight: 1.5 }}
                >
                  <span style={{ color: "var(--green)", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="dashboard-split">
            <div className="card">
              <SubHeader tag="AVOID" title="Avoid these" />
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data.avoidList.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--red)" }}>✕</span>
                    <span style={{ color: "var(--text2)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <SubHeader tag="NOTES" title="General notes" />
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data.generalNotes.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--blue)" }}>›</span>
                    <span style={{ color: "var(--text2)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
