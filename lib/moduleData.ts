import { cacheGet, cacheSet, cacheDelete } from "./cache";
import { discoverTabs, fetchTabCsv, parseCsv, sheetUrl } from "./sheetsSource";
import { buildTable, type TableData } from "./table";
import { getModule, type Module } from "./modules";

const TTL_MS = 5 * 60 * 1000;
const cacheKey = (id: string) => `module:${id}`;

export interface TabData {
  name: string;
  title: string;
  gid: string;
  url: string;
  priority: "normal" | "low";
  table: TableData | null;
  error?: string;
}

export interface ModuleData {
  moduleId: string;
  sheetUrl: string;
  tabs: TabData[];
  lastFetched: string;
}

async function loadTab(module: Module, name: string, gid: string): Promise<TabData> {
  const override = module.tabOverrides?.[name] ?? {};
  const base: TabData = {
    name,
    title: override.title ?? name,
    gid,
    url: sheetUrl(module.sheetsId, gid),
    priority: override.priority ?? "normal",
    table: null,
  };
  try {
    const csv = await fetchTabCsv(module.sheetsId, gid);
    base.table = buildTable(parseCsv(csv));
  } catch (err) {
    base.error = err instanceof Error ? err.message : "Failed to load tab.";
  }
  return base;
}

async function fetchModuleData(module: Module): Promise<ModuleData> {
  const discovered = await discoverTabs(module.sheetsId);
  const excluded = new Set(module.excludeTabs ?? []);
  const wanted = discovered.filter((t) => !excluded.has(t.title));

  const tabs = await Promise.all(wanted.map((t) => loadTab(module, t.title, t.gid)));

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
