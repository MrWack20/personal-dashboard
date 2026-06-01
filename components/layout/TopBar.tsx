"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModuleTabs from "./ModuleTabs";
import UserSheetTabs from "./UserSheetTabs";
import { timeAgo } from "@/lib/format";
import type { Module } from "@/lib/modules";

export default function TopBar({
  title,
  lastFetched,
  modules,
  activeModuleId,
  activeSheetId,
  sheetUrl,
}: {
  title: string;
  lastFetched: string;
  modules: Module[];
  activeModuleId: string;
  activeSheetId: string;
  sheetUrl: string;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [rel, setRel] = useState<string>("");

  useEffect(() => {
    const update = () => setRel(timeAgo(lastFetched));
    update();
    const id = setInterval(update, 15000);
    return () => clearInterval(id);
  }, [lastFetched]);

  // Force a fresh pull (bust the server cache) then re-render.
  const hardRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch(`/api/refresh?module=${encodeURIComponent(activeModuleId)}`, { method: "POST" });
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [activeModuleId, router]);

  // Auto-refresh on a steady interval so sheet edits appear without clicking.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);

  // Refresh the instant you return to the tab (e.g. right after editing a sheet).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") hardRefresh();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hardRefresh]);

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
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", flex: "1 1 auto", minWidth: 0 }}>
          <ModuleTabs modules={modules} activeId={activeModuleId} />
          <UserSheetTabs activeSheetId={activeSheetId} />
        </div>

        {!activeSheetId ? (
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
          <span
            className="mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.74rem",
              color: "var(--text3)",
            }}
            title="Live — auto-refreshing"
          >
            <span
              className="pulse"
              style={{
                display: "inline-block",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--green)",
              }}
            />
            {rel || "—"}
          </span>
          <button
            onClick={hardRefresh}
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
        ) : null}
      </div>
    </header>
  );
}
