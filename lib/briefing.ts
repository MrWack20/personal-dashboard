import raw from "@/public/briefing.json";

export type BriefingAccent = "green" | "amber" | "red" | "blue" | "purple";

export interface BriefingMetric {
  label: string;
  value: string;
  accent?: BriefingAccent;
}

export interface BriefingModule {
  /** Matches a module id in lib/modules.ts (or a user sheet id). */
  moduleId: string;
  label: string;
  icon?: string;
  /** One-sentence status line. */
  headline: string;
  /** Up to ~4 headline numbers. */
  metrics: BriefingMetric[];
  /** Up to ~4 action items / things to watch. */
  alerts: string[];
}

export interface Briefing {
  /** ISO timestamp of the last routine run that wrote this file. */
  generatedAt: string;
  /** One-line summary across everything. */
  summary: string;
  modules: BriefingModule[];
}

/** Nightly cross-sheet briefing, written by the 4 AM routine. */
export const briefing = raw as Briefing;
