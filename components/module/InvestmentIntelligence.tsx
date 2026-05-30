import { intelligence, formatUpdated, type WatchlistItem } from "@/lib/intelligence";
import { peso } from "@/lib/format";

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

function usd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
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
        <Row label="US Price" value={usd(item.usdPrice)} />
        <Row label="PHP Est." value={peso(item.phpEstimate)} />
        <Row label="Hold" value={`${item.holdMonths} mo`} />
        <Row label="Sell Target" value={item.sellTarget} accent="green" />
      </div>

      <p style={{ color: "var(--text2)", fontSize: "0.76rem", lineHeight: 1.5 }}>{item.notes}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {item.tags.map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>
    </div>
  );
}

export default function InvestmentIntelligence() {
  const data = intelligence;

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
        <span className="mono" style={{ fontSize: "0.74rem", color: "var(--text3)" }}>
          Updated {formatUpdated(data.lastUpdated)} · $1 ≈ ₱{data.usdToPhp}
        </span>
      </div>

      {/* 1 — Watchlist */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <SubHeader tag="WATCHLIST" title="Cards to find in PH" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {data.watchlist.map((item) => (
            <WatchCard key={`${item.name}-${item.cardNumber}`} item={item} />
          ))}
        </div>
      </div>

      {/* 2 — Sealed hold rules */}
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

      {/* 3 — Buy checklist */}
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

      {/* 4 — Avoid + Notes */}
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
    </section>
  );
}
