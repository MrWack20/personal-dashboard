"use client";

import { useState } from "react";
import {
  priorityList,
  momentumMeta,
  BUDGET_TIER_META,
  TIER_META,
  type Accent,
  type FullListItem,
  type BudgetListItem,
} from "@/lib/priority";
import { peso } from "@/lib/format";
import { formatUpdated } from "@/lib/intelligence";

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

function Badge({
  accent,
  filled = false,
  children,
}: {
  accent: Accent;
  filled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className="mono"
      style={{
        fontSize: "10px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: "4px",
        color: filled ? "var(--bg)" : ACCENT_VAR[accent],
        background: filled ? ACCENT_VAR[accent] : ACCENT_DIM[accent],
        border: `1px solid ${ACCENT_VAR[accent]}`,
        fontWeight: filled ? 700 : 400,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
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

function Row({ label, value, accent }: { label: string; value: string; accent?: Accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
      <span className="tag">{label}</span>
      <span
        className="mono"
        style={{ fontSize: "0.82rem", color: accent ? ACCENT_VAR[accent] : "var(--text)" }}
      >
        {value}
      </span>
    </div>
  );
}

function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function Momentum({ momentum }: { momentum: string }) {
  const { accent, mark } = momentumMeta(momentum);
  return (
    <div
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        fontSize: "0.7rem",
        color: ACCENT_VAR[accent],
      }}
    >
      <span aria-hidden>{mark}</span>
      <span>{momentum}</span>
    </div>
  );
}

function MaxBuy({ maxBuyPhp }: { maxBuyPhp: number }) {
  return maxBuyPhp > 0 ? (
    <Row label="Max Buy" value={peso(maxBuyPhp)} accent="green" />
  ) : (
    <Row label="Max Buy" value="Save toward this" accent="purple" />
  );
}

/** Shared card chrome for both lists. `rankColor` tints the big rank number. */
function PriorityCard({
  rank,
  rankColor,
  name,
  cardNumber,
  set,
  topRight,
  momentum,
  usdPrice,
  phpEstimate,
  holdMonths,
  maxBuyPhp,
  sellTarget,
  notes,
  tags,
}: {
  rank: number;
  rankColor: string;
  name: string;
  cardNumber: string;
  set: string;
  topRight: React.ReactNode;
  momentum: string;
  usdPrice: number;
  phpEstimate: number;
  holdMonths: string;
  maxBuyPhp: number;
  sellTarget: string;
  notes: string;
  tags: string[];
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "1rem 1.1rem",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "0 1rem",
        alignItems: "start",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: "2rem",
          lineHeight: 1,
          color: rankColor,
          width: "2.2rem",
          textAlign: "center",
        }}
      >
        {rank}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.6rem" }}>
          <div style={{ minWidth: 0 }}>
            <Momentum momentum={momentum} />
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 700,
                fontSize: "1.02rem",
                lineHeight: 1.25,
                marginTop: "0.2rem",
              }}
            >
              {name}
            </div>
            <div className="mono" style={{ color: "var(--text3)", fontSize: "0.72rem", marginTop: "0.1rem" }}>
              {cardNumber} · {set}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-end" }}>
            {topRight}
          </div>
        </div>

        <p style={{ color: "var(--text2)", fontSize: "0.76rem", lineHeight: 1.5 }}>{notes}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
            gap: "0.6rem",
            borderTop: "1px solid var(--border)",
            paddingTop: "0.7rem",
          }}
        >
          <Row label="US Price" value={usdPrice > 0 ? usd(usdPrice) : "TBD"} />
          <Row label="PHP Est" value={phpEstimate > 0 ? peso(phpEstimate) : "TBD"} />
          <Row label="Hold" value={`${holdMonths} mo`} />
          <MaxBuy maxBuyPhp={maxBuyPhp} />
          <Row label="Sell Target" value={sellTarget} accent="green" />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {tags.map((t) => (
            <Pill key={t}>{t}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function FullCard({ item }: { item: FullListItem }) {
  const tier = item.budgetTier ? BUDGET_TIER_META[item.budgetTier] : null;
  const rankColor = tier ? ACCENT_VAR[tier.accent] : "var(--text2)";
  return (
    <PriorityCard
      rank={item.rank}
      rankColor={rankColor}
      name={item.name}
      cardNumber={item.cardNumber}
      set={item.set}
      topRight={tier ? <Badge accent={tier.accent}>{tier.label}</Badge> : null}
      momentum={item.momentum}
      usdPrice={item.usdPrice}
      phpEstimate={item.phpEstimate}
      holdMonths={item.holdMonths}
      maxBuyPhp={item.maxBuyPhp}
      sellTarget={item.sellTarget}
      notes={item.notes}
      tags={item.tags}
    />
  );
}

function BudgetCard({ item }: { item: BudgetListItem }) {
  const meta = TIER_META[item.tier];
  return (
    <PriorityCard
      rank={item.rank}
      rankColor={ACCENT_VAR[meta.accent]}
      name={item.name}
      cardNumber={item.cardNumber}
      set={item.set}
      topRight={
        <Badge accent={meta.accent} filled={meta.filled}>
          {meta.label}
        </Badge>
      }
      momentum={item.momentum}
      usdPrice={item.usdPrice}
      phpEstimate={item.phpEstimate}
      holdMonths={item.holdMonths}
      maxBuyPhp={item.maxBuyPhp}
      sellTarget={item.sellTarget}
      notes={item.notes}
      tags={item.tags}
    />
  );
}

export default function PriorityLists() {
  const data = priorityList;
  const [tab, setTab] = useState<"full" | "budget">("full");

  const tabs: { id: "full" | "budget"; label: string }[] = [
    { id: "full", label: `Full List (${data.fullList.length})` },
    { id: "budget", label: `5K-7K (${data.budgetList.length})` },
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
          <div className="tag">PRIORITY BUY LISTS</div>
          <h2 style={{ fontSize: "1.3rem", color: "var(--text)", marginTop: "0.15rem" }}>
            What to Buy Next
          </h2>
        </div>
        <span className="mono" style={{ fontSize: "0.74rem", color: "var(--text3)", textAlign: "right" }}>
          Last updated: {formatUpdated(data.lastUpdated)} · Rate: {data.usdToPhp} PHP/USD
        </span>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="mono"
              style={{
                padding: "0.4rem 0.9rem",
                fontSize: "0.78rem",
                borderRadius: "8px 8px 0 0",
                background: active ? "var(--green-dim)" : "var(--surface2)",
                color: active ? "var(--green)" : "var(--text2)",
                border: "1px solid var(--border)",
                borderBottom: active ? "2px solid var(--green)" : "1px solid var(--border)",
                fontWeight: active ? 700 : 400,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "full" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {data.fullList.map((item) => (
            <FullCard key={`${item.rank}-${item.cardNumber}`} item={item} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Budget constraint reminder */}
          <div
            className="card"
            style={{ background: "var(--amber-dim)", border: "1px solid var(--amber)" }}
          >
            <div className="tag" style={{ color: "var(--amber)" }}>
              BUDGET DISCIPLINE
            </div>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                marginTop: "0.4rem",
              }}
            >
              {[
                "Hard ceiling: ₱7,000 per card.",
                "Walk away from any card priced above its Max Buy.",
                "Never pay above US market price in PHP equivalent.",
                `Conversion reference: ${data.usdToPhp} PHP per USD.`,
              ].map((line, i) => (
                <li
                  key={i}
                  style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text2)", lineHeight: 1.5 }}
                >
                  <span style={{ color: "var(--amber)" }}>›</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {data.budgetList.map((item) => (
            <BudgetCard key={`${item.rank}-${item.cardNumber}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
