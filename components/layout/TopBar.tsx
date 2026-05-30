"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModuleTabs from "./ModuleTabs";
import { timeAgo } from "@/lib/format";
import type { Module } from "@/lib/modules";

export default function TopBar({
  title,
  lastFetched,
  modules,
  activeModuleId,
  sheetUrl,
}: {
  title: string;
  lastFetched: string;
  modules: Module[];
  activeModuleId: string;
  sheetUrl: string;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [rel, setRel] = useState<string>("");

  useEffect(() => {
    const update = () => setRel(timeAgo(lastFetched));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [lastFetched]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch(`/api/refresh?module=${encodeURIComponent(activeModuleId)}`, { method: "POST" });
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(13, 15, 20, 0.8)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0.7rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <ModuleTabs modules={modules} activeId={activeModuleId} />

        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <a
            href={sheetUrl}
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
            Open Sheet ↗
          </a>
          <span className="mono" style={{ fontSize: "0.74rem", color: "var(--text3)" }}>
            {rel || "—"}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "var(--surface2)",
              border: "1px solid var(--border2)",
              borderRadius: "8px",
              color: "var(--text)",
              fontSize: "0.8rem",
              padding: "0.4rem 0.8rem",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <span className={refreshing ? "spin" : ""} style={{ display: "inline-block" }}>
              ↻
            </span>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    </header>
  );
}
