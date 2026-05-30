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
  watchlist: WatchlistItem[];
  sealedRules: SealedRule[];
  avoidList: string[];
  buyChecklist: string[];
  generalNotes: string[];
}

/** Static, manually-maintained intelligence data (edit public/intelligence.json). */
export const intelligence = raw as InvestmentIntelligence;

/** Format an ISO date (YYYY-MM-DD) as "May 30, 2026" without timezone drift. */
export function formatUpdated(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
