"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loadUserSheets,
  addUserSheet,
  removeUserSheet,
  extractSheetId,
  USER_SHEETS_EVENT,
  type UserSheet,
} from "@/lib/userSheets";

export default function UserSheetTabs({ activeSheetId }: { activeSheetId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sheets, setSheets] = useState<UserSheet[]>([]);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const sync = () => setSheets(loadUserSheets());
    sync();
    window.addEventListener(USER_SHEETS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(USER_SHEETS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const sid = extractSheetId(url);
    if (!sid) {
      setErr("That doesn’t look like a Google Sheets link.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/sheet?id=${encodeURIComponent(sid)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json.error || "Couldn’t read that sheet. Make sure it’s shared as “Anyone with the link.”",
        );
      }
      const label = (name.trim() || json.tabs?.[0]?.title || "My Sheet").slice(0, 40);
      addUserSheet({ id: sid, label });
      setUrl("");
      setName("");
      setOpen(false);
      router.push(`/?sheet=${sid}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add sheet.");
    } finally {
      setBusy(false);
    }
  }

  function remove(id: string) {
    removeUserSheet(id);
    if (activeSheetId === id) router.push("/");
  }

  if (!mounted) return null;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.35rem 0.7rem",
    borderRadius: "8px",
    background: active ? "var(--surface2)" : "transparent",
    borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
    fontSize: "0.82rem",
    color: active ? "var(--text)" : "var(--text2)",
    fontWeight: active ? 700 : 400,
  });

  return (
    <>
      {sheets.map((s) => (
        <Link key={s.id} href={`/?sheet=${s.id}`} style={tabStyle(s.id === activeSheetId)}>
          <span>📄</span>
          <span>{s.label}</span>
        </Link>
      ))}

      <button
        onClick={() => {
          setOpen(true);
          setErr(null);
        }}
        className="mono"
        style={{
          padding: "0.35rem 0.7rem",
          borderRadius: "8px",
          background: "transparent",
          border: "1px dashed var(--border2)",
          color: "var(--text2)",
          fontSize: "0.78rem",
        }}
        title="Add a Google Sheet by link"
      >
        + Sheet
      </button>

      {open ? (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "4rem 1rem 1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: "100%", maxWidth: "460px", background: "var(--surface)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.85rem" }}>
              <div>
                <div className="tag">ADD A SHEET</div>
                <h3 style={{ fontSize: "1.05rem", color: "var(--text)", marginTop: "0.15rem" }}>Paste a Google Sheets link</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text3)", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                autoFocus
                style={inputStyle}
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                style={inputStyle}
              />
              {err ? (
                <div style={{ color: "var(--red)", fontSize: "0.76rem", lineHeight: 1.5 }}>{err}</div>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                style={{
                  background: "var(--green-dim)",
                  border: "1px solid var(--green)",
                  borderRadius: "8px",
                  color: "var(--green)",
                  fontSize: "0.82rem",
                  padding: "0.5rem 0.9rem",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? "Checking…" : "Add sheet"}
              </button>
            </form>

            <p style={{ color: "var(--text3)", fontSize: "0.7rem", lineHeight: 1.5, marginTop: "0.6rem" }}>
              The sheet must be shared as “Anyone with the link”. Added sheets are saved on this device.
            </p>

            {sheets.length > 0 ? (
              <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                <div className="tag" style={{ marginBottom: "0.5rem" }}>
                  YOUR SHEETS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {sheets.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📄 {s.label}
                      </span>
                      <button
                        onClick={() => remove(s.id)}
                        className="mono"
                        style={{
                          marginLeft: "auto",
                          background: "transparent",
                          border: "1px solid var(--border2)",
                          borderRadius: "6px",
                          color: "var(--text3)",
                          fontSize: "0.68rem",
                          padding: "0.2rem 0.5rem",
                        }}
                      >
                        remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface2)",
  border: "1px solid var(--border2)",
  borderRadius: "8px",
  color: "var(--text)",
  fontFamily: "var(--font-dm-mono), monospace",
  fontSize: "0.8rem",
  padding: "0.5rem 0.7rem",
  width: "100%",
};
