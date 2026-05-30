import { cacheGet, cacheSet } from "./cache";

export interface DiscoveredTab {
  title: string;
  gid: string;
}

const DISCOVER_TTL_MS = 30 * 60 * 1000; // tab structure changes rarely

/** Build the edit URL for a spreadsheet (optionally deep-linked to a tab). */
export function sheetUrl(sheetsId: string, gid?: string): string {
  const base = `https://docs.google.com/spreadsheets/d/${sheetsId}/edit`;
  return gid ? `${base}#gid=${gid}` : base;
}

function decodeName(raw: string): string {
  return raw
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .trim();
}

const TAB_RE =
  /items\.push\(\{name:\s*"((?:[^"\\]|\\.)*)",\s*pageUrl:[^,]*,\s*gid:\s*"(\d+)"/g;

/**
 * Discover every tab (name + gid) in a link-shared spreadsheet by parsing the
 * public htmlview page. No API key required.
 */
export async function discoverTabs(sheetsId: string): Promise<DiscoveredTab[]> {
  const key = `tabs:${sheetsId}`;
  const cached = cacheGet<DiscoveredTab[]>(key);
  if (cached) return cached;

  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetsId}/htmlview`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(
      `Could not load spreadsheet ${sheetsId} (${res.status}). Is it shared as "Anyone with the link"?`,
    );
  }
  const html = await res.text();
  const tabs: DiscoveredTab[] = [...html.matchAll(TAB_RE)].map((m) => ({
    title: decodeName(m[1]),
    gid: m[2],
  }));

  if (tabs.length === 0) {
    throw new Error(
      `No tabs found for spreadsheet ${sheetsId}. It may be private or stored in an unsupported format.`,
    );
  }

  cacheSet(key, tabs, DISCOVER_TTL_MS);
  return tabs;
}

/** Fetch a single tab as raw CSV via the public export endpoint. */
export async function fetchTabCsv(sheetsId: string, gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetsId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch tab (gid ${gid}) from ${sheetsId}: ${res.status}`);
  }
  return res.text();
}

/** Parse CSV text into a matrix of strings (handles quotes, commas, newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // ignore; handled by \n
    } else {
      field += c;
    }
  }
  // flush trailing field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
