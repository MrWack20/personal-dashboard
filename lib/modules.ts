export interface StockBreakdown {
  /** Card heading. */
  title?: string;
  /** Header label of the item/product column. */
  labelColumn: string;
  /** Header label of the quantity-on-hand column. */
  valueColumn: string;
  /** Header label of an optional status column that drives the colour. */
  statusColumn?: string;
  /** Unit word shown after totals, e.g. "bags". */
  unit?: string;
}

export interface TabOverride {
  /** Display title to use instead of the raw tab name. */
  title?: string;
  /** Force a header row (1-based) when auto-detection guesses wrong. */
  headerRow?: number;
  /** Lower-priority tabs render last and are de-emphasized. */
  priority?: "normal" | "low";
  /** Render a compact per-item stock breakdown card above the table. */
  stockBreakdown?: StockBreakdown;
}

export interface Module {
  id: string;
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
  /** Google Sheets spreadsheet ID. */
  sheetsId: string;
  /** Tab names to skip entirely (exact match). */
  excludeTabs?: string[];
  /** Per-tab display tweaks, keyed by exact tab name. */
  tabOverrides?: Record<string, TabOverride>;
}

/**
 * Add a new sheet to the dashboard by appending an entry here.
 * Tabs are auto-discovered; columns, types, and summaries are auto-detected.
 * Only `id`, `label`, `icon`, and `sheetsId` are required.
 */
export const modules: Module[] = [
  {
    id: "pica-pica",
    label: "J's Pica Pica",
    icon: "🛍️",
    description: "Live sales & inventory tracker for the business",
    enabled: true,
    sheetsId: "1ex175_mhn91t5eh13NW_fZgfKkVSOGC6LBJoAsy9xd8",
    excludeTabs: ["Year 3 Planner"],
    tabOverrides: {
      Inventory: {
        stockBreakdown: {
          title: "Remaining Stock by Product",
          labelColumn: "Product",
          valueColumn: "On Hand (Bags)",
          statusColumn: "Status",
          unit: "bags",
        },
      },
      "Historical 2024-2025": { priority: "low" },
    },
  },
  {
    id: "pokemon-investing",
    label: "Pokémon Investing",
    icon: "📈",
    description: "Buy & sell investment tracker",
    enabled: true,
    sheetsId: "1G1rNjN3cyk-QFw6ww-_rN3TJgEEeWFSU",
    excludeTabs: ["GUIDE"],
  },
  {
    id: "national-dex",
    label: "National Dex",
    icon: "📕",
    description: "National Pokédex collection tracker",
    enabled: true,
    sheetsId: "1TjkGNjU3W_Bf05IHo8K2QJ5TQ9O3IBT3sR0vZ2rO5B4",
  },
  {
    id: "shiny-dex",
    label: "Shiny Living Dex",
    icon: "✨",
    description: "Shiny living dex collection tracker",
    enabled: true,
    sheetsId: "1psyEyTHcQhEVZKtsJLyCK6IcEIfm0f3jR7TBwHE-F4Y",
  },
];

export const enabledModules = modules.filter((m) => m.enabled);

export function getModule(id: string): Module | undefined {
  return modules.find((m) => m.id === id);
}
