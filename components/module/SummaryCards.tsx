import MetricCard from "@/components/shared/MetricCard";
import type { Aggregate } from "@/lib/table";

export default function SummaryCards({ aggregates }: { aggregates: Aggregate[] }) {
  if (aggregates.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
        gap: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      {aggregates.map((a, i) => (
        <MetricCard key={i} label={a.label} value={a.display} accentColor={a.accent} />
      ))}
    </div>
  );
}
