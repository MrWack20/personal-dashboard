import raw from "@/public/intelligence.json";

export interface WatchlistItem {
  name: string;
  cardNumber: string;
  set: string;
  type: "GG" | "TG" | "SIR" | "Sealed" | "Single";
  usdPrice: number;
  phpEstimate: number;
  budgetStatus: "within" | "stretch" | "over";
  priority: "high" | "medium" | "low";
  holdMonths: string;
  sellTarget: string;
  notes: string;
  tags: string[];
  /** ISO date (YYYY-MM-DD) the usdPrice was last verified against a live source. */
  priceUpdated?: string;
  /** Where the price was verified, e.g. "TCGplayer market". */
  priceSource?: string;
}

export interface InvestmentGoal {
  title: string;
  priority: "high" | "medium" | "low";
  status: "on-track" | "in-progress" | "not-started" | "done";
  targetPhp: number;
  savedPhp: number;
  targetDate: string;
  linkedCard?: string;
  why: string;
}

export type HoldingAction =
  | "HOLD STRONG"
  | "HOLD"
  | "WATCH"
  | "SELL IF OFFERED"
  | "SELL NOW";

export interface HoldingCall {
  /** Must match the INVENTORY tab's "Item Name" exactly. */
  card: string;
  /** Mirrors the owner's sheet Status column: "Holding" | "Collection" | "For Sale" | "". */
  status?: string;
  action: HoldingAction;
  /** Buy Price from the sheet, in PHP. */
  costPhp?: number;
  /** Current verified market value in PHP (omitted until verified). */
  valuePhp?: number;
  /** ISO date (YYYY-MM-DD) valuePhp was last verified. */
  priceUpdated?: string;
  priceSource?: string;
  reason: string;
}

export interface SealedRule {
  product: string;
  costPhp: number;
  minHoldMonths: number;
  sellTargetPhp: number;
  sellTriggerPct: number;
  riskNote: string;
}

export interface InvestmentIntelligence {
  lastUpdated: string;
  usdToPhp: number;
  goals: InvestmentGoal[];
  holdings: HoldingCall[];
  watchlist: WatchlistItem[];
  sealedRules: SealedRule[];
  avoidList: string[];
  buyChecklist: string[];
  generalNotes: string[];
}

/** Static, manually-maintained intelligence data (edit public/intelligence.json). */
export const intelligence = raw as InvestmentIntelligence;

/** Whole days between an ISO date (YYYY-MM-DD) and today, or null if unparseable. */
export function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const then = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((today - then) / 86_400_000);
}

/** Format an ISO date (YYYY-MM-DD) as "May 30" (short, no year). */
export function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Sort rank for priority — high first, low last. */
export function priorityRank(p: "high" | "medium" | "low"): number {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}

/** Sort rank for a holding action — most urgent (sell now) first. */
export function actionRank(a: HoldingAction): number {
  const order: HoldingAction[] = ["SELL NOW", "SELL IF OFFERED", "WATCH", "HOLD", "HOLD STRONG"];
  const i = order.indexOf(a);
  return i < 0 ? order.length : i;
}

/** Normalize a free-text sheet Status value into a canonical bucket. */
export function normalizeStatus(raw?: string): "Holding" | "Collection" | "For Sale" | "" {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return "";
  if (/(^|\b)(for ?sale|selling|sell|list(ed)?)\b/.test(s)) return "For Sale";
  if (/(^|\b)(collection|collect|pc|personal|keep(sake)?|never sell)\b/.test(s)) return "Collection";
  if (/(^|\b)(hold(ing)?|invest(ment)?|keep for now)\b/.test(s)) return "Holding";
  return "Holding";
}

/** Format an ISO date (YYYY-MM-DD) as "May 30, 2026" without timezone drift. */
export function formatUpdated(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
