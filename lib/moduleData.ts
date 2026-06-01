import { cacheGet, cacheSet, cacheDelete } from "./cache";
import { discoverTabs, fetchTabCsv, parseCsv, sheetUrl } from "./sheetsSource";
import { buildTable, columnIndex, cleanNum, type TableData } from "./table";
import { getModule, type Module, type StockBreakdown, type TabOverride } from "./modules";

const TTL_MS = 20 * 1000;
const cacheKey = (id: string) => `module:${id}`;

export type BreakdownAccent = "green" | "amber" | "red" | "blue";

export interface BreakdownItem {
  label: string;
  value: string;
  status?: string;
  accent: BreakdownAccent;
}

export interface Breakdown {
  title: string;
  unit?: string;
  total: string;
  inStock: number;
  outCount: number;
  items: BreakdownItem[];
}

export interface TabData {
  name: string;
  title: string;
  gid: string;
  url: string;
  priority: "normal" | "low";
  table: TableData | null;
  breakdown?: Breakdown | null;
  error?: string;
}

function accentForStatus(status: string, value: number): BreakdownAccent {
  const s = status.toLowerCase();
  if (/out of stock|critical|🔴|❌/.test(s) || value <= 0) return "red";
  if (/low|reorder|🟡/.test(s)) return "amber";
  if (/ok|healthy|good|✅|🟢/.test(s)) return "green";
  return "blue";
}

function buildBreakdown(table: TableData, cfg: StockBreakdown): Breakdown | null {
  const li = columnIndex(table, cfg.labelColumn);
  const vi = columnIndex(table, cfg.valueColumn);
  const si = cfg.statusColumn ? columnIndex(table, cfg.statusColumn) : -1;
  if (li < 0 || vi < 0) return null;

  const items: BreakdownItem[] = [];
  let total = 0;
  let inStock = 0;
  let outCount = 0;

  for (const row of table.rows) {
    const label = (row[li] ?? "").trim();
    if (!label || /^(total|grand[\s-]?total|sum|subtotal)$/i.test(label)) continue;
    const rawVal = (row[vi] ?? "").trim();
    const n = cleanNum(rawVal) ?? 0;
    const status = si >= 0 ? (row[si] ?? "").trim() : "";
    total += n;
    if (n > 0) inStock += 1;
    else outCount += 1;
    items.push({ label, value: rawVal || "0", status, accent: accentForStatus(status, n) });
  }

  if (items.length === 0) return null;

  // Lowest stock first so reorder candidates surface at a glance.
  items.sort((a, b) => (cleanNum(a.value) ?? 0) - (cleanNum(b.value) ?? 0));

  const unit = cfg.unit ? ` ${cfg.unit}` : "";
  return {
    title: cfg.title ?? "Stock",
    unit: cfg.unit,
    total: `${total.toLocaleString("en-PH")}${unit}`,
    inStock,
    outCount,
    items,
  };
}

export interface ModuleData {
  moduleId: string;
  sheetUrl: string;
  tabs: TabData[];
  lastFetched: string;
}

async function loadTab(
  sheetsId: string,
  name: string,
  gid: string,
  override: TabOverride = {},
): Promise<TabData> {
  const base: TabData = {
    name,
    title: override.title ?? name,
    gid,
    url: sheetUrl(sheetsId, gid),
    priority: override.priority ?? "normal",
    table: null,
  };
  try {
    const csv = await fetchTabCsv(sheetsId, gid);
    base.table = buildTable(parseCsv(csv));
    if (base.table && !base.table.empty && override.stockBreakdown) {
      base.breakdown = buildBreakdown(base.table, override.stockBreakdown);
    }
  } catch (err) {
    base.error = err instanceof Error ? err.message : "Failed to load tab.";
  }
  return base;
}

async function fetchModuleData(module: Module): Promise<ModuleData> {
  const discovered = await discoverTabs(module.sheetsId);
  const excluded = new Set(module.excludeTabs ?? []);
  const wanted = discovered.filter((t) => !excluded.has(t.title));

  const tabs = await Promise.all(
    wanted.map((t) => loadTab(module.sheetsId, t.title, t.gid, module.tabOverrides?.[t.title])),
  );

  // Normal-priority tabs first (preserving sheet order), low-priority last.
  tabs.sort((a, b) => {
    const rank = (p: TabData["priority"]) => (p === "low" ? 1 : 0);
    return rank(a.priority) - rank(b.priority);
  });

  return {
    moduleId: module.id,
    sheetUrl: sheetUrl(module.sheetsId),
    tabs,
    lastFetched: new Date().toISOString(),
  };
}

export async function getModuleData(moduleId: string): Promise<ModuleData> {
  const module = getModule(moduleId);
  if (!module) throw new Error(`Unknown module: ${moduleId}`);

  const cached = cacheGet<ModuleData>(cacheKey(moduleId));
  if (cached) return cached;

  const data = await fetchModuleData(module);
  cacheSet(cacheKey(moduleId), data, TTL_MS);
  return data;
}

export async function refreshModuleData(moduleId: string): Promise<ModuleData> {
  cacheDelete(cacheKey(moduleId));
  return getModuleData(moduleId);
}

/** Data for an arbitrary (user-added) spreadsheet — no module registration. */
export interface SheetData {
  sheetsId: string;
  sheetUrl: string;
  tabs: TabData[];
  lastFetched: string;
}

async function fetchSheetData(sheetsId: string): Promise<SheetData> {
  const discovered = await discoverTabs(sheetsId);
  const tabs = await Promise.all(discovered.map((t) => loadTab(sheetsId, t.title, t.gid)));
  return {
    sheetsId,
    sheetUrl: sheetUrl(sheetsId),
    tabs,
    lastFetched: new Date().toISOString(),
  };
}

/** Fetch (and briefly cache) any public spreadsheet by its ID. */
export async function getSheetData(sheetsId: string): Promise<SheetData> {
  const key = `sheet:${sheetsId}`;
  const cached = cacheGet<SheetData>(key);
  if (cached) return cached;
  const data = await fetchSheetData(sheetsId);
  cacheSet(key, data, TTL_MS);
  return data;
}
