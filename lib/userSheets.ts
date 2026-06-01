/**
 * Client-side store for user-added sheets. Persisted in localStorage so the
 * user can add sheets from the UI without touching code. Per-device by design
 * (no backend/database); the sheet itself is addressable by ?sheet=<id>.
 */

export interface UserSheet {
  id: string;
  label: string;
}

const KEY = "dashboard-user-sheets";
const EVENT = "user-sheets-changed";

/** Pull a spreadsheet ID out of a full Sheets URL, or accept a bare ID. */
export function extractSheetId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;
  return null;
}

export function loadUserSheets(): UserSheet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is UserSheet =>
        x && typeof x.id === "string" && typeof x.label === "string",
    );
  } catch {
    return [];
  }
}

function save(list: UserSheet[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore quota / private-mode errors
  }
  window.dispatchEvent(new Event(EVENT));
}

export function addUserSheet(sheet: UserSheet): UserSheet[] {
  const list = loadUserSheets();
  const next = list.some((s) => s.id === sheet.id)
    ? list.map((s) => (s.id === sheet.id ? { ...s, label: sheet.label } : s))
    : [...list, sheet];
  save(next);
  return next;
}

export function removeUserSheet(id: string): UserSheet[] {
  const next = loadUserSheets().filter((s) => s.id !== id);
  save(next);
  return next;
}

export function getUserSheetLabel(id: string): string | null {
  return loadUserSheets().find((s) => s.id === id)?.label ?? null;
}

export const USER_SHEETS_EVENT = EVENT;
