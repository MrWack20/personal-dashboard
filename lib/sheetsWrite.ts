import { JWT } from "google-auth-library";

/**
 * Server-only Google Sheets *write* access via a service account.
 *
 * Reads use the public CSV export (no auth). Writes require a service account
 * that has been shared on the spreadsheet as an Editor. Credentials come from
 * env vars and must NEVER be committed (this repo is public):
 *   GOOGLE_SHEETS_CLIENT_EMAIL  - the service account's client_email
 *   GOOGLE_SHEETS_PRIVATE_KEY   - the service account's private_key
 */

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API = "https://sheets.googleapis.com/v4/spreadsheets";

/** Thrown when the service-account env vars are missing. */
export class SheetsNotConfiguredError extends Error {
  constructor(message = "Google Sheets write credentials are not configured.") {
    super(message);
    this.name = "SheetsNotConfiguredError";
  }
}

function getCreds(): { email: string; key: string } {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email || !key) throw new SheetsNotConfiguredError();
  // Env vars store the multiline key with literal "\n"; restore real newlines.
  key = key.replace(/\\n/g, "\n");
  return { email, key };
}

let client: JWT | null = null;

async function accessToken(): Promise<string> {
  if (!client) {
    const { email, key } = getCreds();
    client = new JWT({ email, key, scopes: [SCOPE] });
  }
  const res = await client.getAccessToken();
  if (!res.token) throw new Error("Failed to obtain a Google access token.");
  return res.token;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Sheets API ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/** Quote a sheet title for A1 ranges, escaping embedded single quotes. */
function quoteTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

// gid -> title, cached per spreadsheet (tab structure changes rarely).
const titleCache = new Map<string, Map<string, string>>();

/** Resolve a tab's title from its gid (the Sheets values API needs the title). */
export async function resolveTitle(sheetsId: string, gid: string): Promise<string> {
  let map = titleCache.get(sheetsId);
  if (map?.has(gid)) return map.get(gid)!;

  const data = await api<{ sheets?: { properties?: { sheetId?: number; title?: string } }[] }>(
    `/${sheetsId}?fields=sheets(properties(sheetId,title))`,
  );
  map = new Map();
  for (const s of data.sheets ?? []) {
    const p = s.properties;
    if (p && p.sheetId !== undefined && p.title) map.set(String(p.sheetId), p.title);
  }
  titleCache.set(sheetsId, map);

  const title = map.get(gid);
  if (!title) throw new Error(`No tab with gid ${gid} was found in the spreadsheet.`);
  return title;
}

/** Read the entire used range of a tab as a raw row/column matrix. */
export async function readGrid(
  sheetsId: string,
  gid: string,
): Promise<{ title: string; values: string[][] }> {
  const title = await resolveTitle(sheetsId, gid);
  const range = encodeURIComponent(quoteTitle(title));
  const data = await api<{ values?: string[][] }>(
    `/${sheetsId}/values/${range}?majorDimension=ROWS`,
  );
  return { title, values: data.values ?? [] };
}

/** Write a single cell (A1 within the tab). Values are parsed as if typed. */
export async function updateCell(
  sheetsId: string,
  gid: string,
  a1: string,
  value: string,
): Promise<void> {
  const title = await resolveTitle(sheetsId, gid);
  const range = encodeURIComponent(`${quoteTitle(title)}!${a1}`);
  await api(`/${sheetsId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [[value]] }),
  });
}

/** Append a row to the end of the tab's contiguous data table. */
export async function appendRow(sheetsId: string, gid: string, values: string[]): Promise<void> {
  const title = await resolveTitle(sheetsId, gid);
  const range = encodeURIComponent(quoteTitle(title));
  await api(
    `/${sheetsId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [values] }),
    },
  );
}
