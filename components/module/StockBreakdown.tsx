import type { Breakdown, BreakdownAccent } from "@/lib/moduleData";

const ACCENT_VAR: Record<BreakdownAccent, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  blue: "var(--blue)",
};
const ACCENT_DIM: Record<BreakdownAccent, string> = {
  green: "var(--green-dim)",
  amber: "var(--amber-dim)",
  red: "var(--red-dim)",
  blue: "var(--blue-dim)",
};

export default function StockBreakdown({ data }: { data: Breakdown }) {
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
        <div className="tag">{data.title}</div>
        <span className="mono" style={{ fontSize: "0.74rem", color: "var(--text3)" }}>
          {data.total} on hand · {data.inStock} in stock · {data.outCount} out
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "0.6rem",
        }}
      >
        {data.items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.6rem",
              padding: "0.6rem 0.75rem",
              borderRadius: "10px",
              background: ACCENT_DIM[item.accent],
              border: `1px solid ${ACCENT_VAR[item.accent]}`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={item.label}
              >
                {item.label}
              </div>
              {item.status ? (
                <div
                  className="mono"
                  style={{ fontSize: "0.64rem", color: ACCENT_VAR[item.accent], marginTop: "0.1rem" }}
                >
                  {item.status}
                </div>
              ) : null}
            </div>
            <div
              className="syne-value"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 700,
                fontSize: "1.5rem",
                lineHeight: 1,
                color: ACCENT_VAR[item.accent],
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
