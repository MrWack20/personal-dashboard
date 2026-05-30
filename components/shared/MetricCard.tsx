export type AccentColor = "green" | "red" | "amber" | "blue" | "purple";

const ACCENT: Record<AccentColor, string> = {
  green: "var(--green)",
  red: "var(--red)",
  amber: "var(--amber)",
  blue: "var(--blue)",
  purple: "var(--purple)",
};

export default function MetricCard({
  label,
  value,
  sub,
  accentColor,
  large,
  valueNode,
}: {
  label: string;
  value?: string;
  sub?: string;
  accentColor: AccentColor;
  large?: boolean;
  valueNode?: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: ACCENT[accentColor],
        }}
      />
      <div
        className="mono"
        style={{
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text2)",
        }}
      >
        {label}
      </div>
      <div
        className="syne-value"
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: large ? "1.9rem" : "1.6rem",
          lineHeight: 1.1,
          color: "var(--text)",
        }}
      >
        {valueNode ?? value}
      </div>
      {sub ? (
        <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>{sub}</div>
      ) : null}
    </div>
  );
}
