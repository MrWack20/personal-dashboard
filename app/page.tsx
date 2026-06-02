import TopBar from "@/components/layout/TopBar";
import MorningBriefing from "@/components/layout/MorningBriefing";
import ModuleView from "@/components/module/ModuleView";
import UserSheetView from "@/components/module/UserSheetView";
import InvestmentIntelligence from "@/components/module/InvestmentIntelligence";
import { enabledModules, getModule } from "@/lib/modules";
import { getModuleData, type ModuleData } from "@/lib/moduleData";

export const dynamic = "force-dynamic";

const TITLE = process.env.NEXT_PUBLIC_DASHBOARD_TITLE || "Joaquin's Command Center";
const SHEET_ID_RE = /^[A-Za-z0-9_-]{20,}$/;

export default async function Home({
  searchParams,
}: {
  searchParams: { module?: string; sheet?: string };
}) {
  // A user-added sheet is addressed by ?sheet=<id> and rendered client-side.
  const sheetId =
    typeof searchParams.sheet === "string" && SHEET_ID_RE.test(searchParams.sheet)
      ? searchParams.sheet
      : null;

  const requested = !sheetId && searchParams.module ? getModule(searchParams.module) : undefined;
  const active = sheetId ? null : requested && requested.enabled ? requested : enabledModules[0];

  let data: ModuleData | null = null;
  let fetchError: string | null = null;

  if (active) {
    try {
      data = await getModuleData(active.id);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : "Failed to load sheet data.";
    }
  }

  return (
    <>
      <TopBar
        title={TITLE}
        lastFetched={data?.lastFetched ?? new Date().toISOString()}
        modules={enabledModules}
        activeModuleId={active?.id ?? ""}
        activeSheetId={sheetId ?? ""}
        sheetUrl={data?.sheetUrl ?? "#"}
      />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        {sheetId ? (
          <UserSheetView id={sheetId} />
        ) : (
          <>
            <MorningBriefing />

            <div style={{ marginBottom: "1.25rem" }}>
              <div className="tag">{active?.icon} {active?.label}</div>
              <p style={{ color: "var(--text2)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                {active?.description}
              </p>
            </div>

            {fetchError ? (
              <div
                className="card"
                style={{
                  background: "var(--red-dim)",
                  border: "1px solid var(--red)",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ color: "var(--red)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                  Couldn’t fetch sheet data
                </div>
                <div style={{ color: "var(--text2)", fontSize: "0.8rem", lineHeight: 1.5 }}>{fetchError}</div>
              </div>
            ) : data ? (
              <>
                <ModuleView data={data} />
                {active?.id === "pokemon-investing" ? <InvestmentIntelligence /> : null}
              </>
            ) : (
              <div className="card" style={{ color: "var(--text3)" }}>No modules configured.</div>
            )}
          </>
        )}

        <footer
          style={{
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border)",
            fontSize: "0.72rem",
            color: "var(--text3)",
            textAlign: "center",
          }}
          className="mono"
        >
          {TITLE} · live data from Google Sheets
        </footer>
      </main>
    </>
  );
}
