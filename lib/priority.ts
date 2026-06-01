import raw from "@/public/priority-list.json";

export type BudgetTier = "within" | "stretch" | "aspirational" | "pre-release";
export type Tier = 1 | 2 | 3;

export interface FullListItem {
  rank: number;
  name: string;
  cardNumber: string;
  set: string;
  type: string;
  usdPrice: number;
  phpEstimate: number;
  /** Hard ceiling to pay, in PHP. 0 = aspirational (save toward it, no max). */
  maxBuyPhp: number;
  /** Some items omit this (treated as no budget badge). */
  budgetTier?: BudgetTier;
  holdMonths: string;
  sellTarget: string;
  /** Free-text momentum, read by prefix: "up" | "down" | "stable" | "pre-release". */
  momentum: string;
  notes: string;
  tags: string[];
}

export interface BudgetListItem {
  rank: number;
  tier: Tier;
  name: string;
  cardNumber: string;
  set: string;
  type: string;
  usdPrice: number;
  phpEstimate: number;
  maxBuyPhp: number;
  momentum: string;
  holdMonths: string;
  sellTarget: string;
  notes: string;
  tags: string[];
}

export interface PriorityListData {
  lastUpdated: string;
  usdToPhp: number;
  fullList: FullListItem[];
  budgetList: BudgetListItem[];
}

/** Static, manually-maintained priority buy lists (edit public/priority-list.json). */
export const priorityList = raw as PriorityListData;

export type Accent = "green" | "amber" | "red" | "blue" | "purple";

/** Momentum string → small colored indicator (prefix match). */
export function momentumMeta(m: string): { accent: Accent; mark: string } {
  const s = m.trim().toLowerCase();
  if (s.startsWith("up")) return { accent: "green", mark: "↑" };
  if (s.startsWith("down")) return { accent: "red", mark: "↓" };
  if (s.startsWith("pre-release")) return { accent: "amber", mark: "○" };
  return { accent: "blue", mark: "–" }; // "stable" and anything else
}

/** Budget tier → badge accent + label. */
export const BUDGET_TIER_META: Record<BudgetTier, { accent: Accent; label: string }> = {
  within: { accent: "green", label: "Within Budget" },
  stretch: { accent: "amber", label: "Stretch" },
  aspirational: { accent: "purple", label: "Aspirational" },
  "pre-release": { accent: "blue", label: "Pre-Release" },
};

/** Numeric tier (5K-7K list) → badge accent, label, and rank-number color. */
export const TIER_META: Record<Tier, { accent: Accent; label: string; filled: boolean }> = {
  1: { accent: "green", label: "Tier 1 · Buy on Sight", filled: true },
  2: { accent: "blue", label: "Tier 2 · Strong Buy", filled: false },
  3: { accent: "amber", label: "Tier 3 · Good Hold", filled: false },
};
