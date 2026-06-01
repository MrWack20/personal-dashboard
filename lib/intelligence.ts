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

/** Format an ISO date (YYYY-MM-DD) as "May 30, 2026" without timezone drift. */
export function formatUpdated(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
