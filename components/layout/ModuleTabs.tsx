import Link from "next/link";
import type { Module } from "@/lib/modules";

export default function ModuleTabs({
  modules,
  activeId,
}: {
  modules: Module[];
  activeId: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
      {modules.map((m) => {
        const active = m.id === activeId;
        return (
          <Link
            key={m.id}
            href={`/?module=${m.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.7rem",
              borderRadius: "8px",
              background: active ? "var(--surface2)" : "transparent",
              borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
              fontSize: "0.82rem",
              color: active ? "var(--text)" : "var(--text2)",
              fontWeight: active ? 700 : 400,
            }}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
