import { analyzeTable } from "@/lib/chart";
import type { TableData } from "@/lib/table";
import BarChart from "./BarChart";
import LineChart from "./LineChart";
import Donut from "./Donut";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "0.85rem 0.9rem",
        minWidth: 0,
      }}
    >
      <div className="tag" style={{ marginBottom: "0.6rem" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function AutoCharts({ table }: { table: TableData | null | undefined }) {
  if (!table || table.empty) return null;
  const plan = analyzeTable(table);
  const cards: React.ReactNode[] = [];

  if (plan.line) {
    cards.push(
      <ChartCard key="line" title={plan.line.title}>
        <LineChart data={plan.line.points} format={plan.line.format} />
      </ChartCard>,
    );
  } else if (plan.bar) {
    cards.push(
      <ChartCard key="bar" title={plan.bar.title}>
        <BarChart data={plan.bar.data} format={plan.bar.format} />
      </ChartCard>,
    );
  }

  if (plan.donut) {
    cards.push(
      <ChartCard key="donut" title={plan.donut.title}>
        <Donut data={plan.donut.data} format={plan.donut.format} total={plan.donut.total} />
      </ChartCard>,
    );
  } else if (plan.line && plan.bar) {
    cards.push(
      <ChartCard key="bar2" title={plan.bar.title}>
        <BarChart data={plan.bar.data} format={plan.bar.format} />
      </ChartCard>,
    );
  }

  if (cards.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <div className="tag">CHARTS</div>
        <h3 style={{ fontSize: "1.02rem", color: "var(--text)", marginTop: "0.15rem" }}>Visual summary</h3>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cards.length > 1 ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr",
          gap: "0.85rem",
          alignItems: "start",
        }}
      >
        {cards}
      </div>
    </div>
  );
}
