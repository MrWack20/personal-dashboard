# Joaquin's Command Center

A personal dashboard built with **Next.js 14** + **TypeScript** + **Tailwind**. It reads live data from multiple **Google Sheets** and renders each as a typed, sortable dashboard module — auto-detecting tabs, columns, value types, and summary stats.

**No API key required.** Sheets are read through Google's public CSV export, so any spreadsheet shared as *"Anyone with the link"* works with zero credentials.

---

## How it works

- **Tab discovery** — each sheet's tabs (name + gid) are parsed from its public `htmlview` page.
- **Typed tables** — every tab is fetched as CSV and run through a schema-agnostic engine that detects the header row, infers column types (currency / number / percent / boolean / date / text), and builds summary aggregates (totals, completion %).
- **Caching** — tab structure is cached 30 min, row data 5 min, with a per-module Refresh button to bust it.

Each sheet is a self-contained "module" — switch between them with the tabs in the top bar; switch between a sheet's tabs below.

---

## Prerequisites

- **Node 18+** (tested on Node 24)
- A **Vercel account** (for deployment)
- Google Sheets shared as *Anyone with the link → Viewer*

---

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No environment variables are required to read sheets.

Optional:

```env
NEXT_PUBLIC_DASHBOARD_TITLE=Joaquin's Command Center
```

---

## Adding a sheet

Append one entry to `lib/modules.ts` — only `id`, `label`, `icon`, and `sheetsId` are required. Tabs, columns, types, and summaries are auto-detected.

```ts
{
  id: "my-sheet",
  label: "My Sheet",
  icon: "📊",
  description: "What it tracks",
  enabled: true,
  sheetsId: "<spreadsheet-id-from-the-url>",
  excludeTabs: ["Tab To Skip"],            // optional
  tabOverrides: {                          // optional
    "Some Tab": { title: "Nicer Name", priority: "low" },
  },
}
```

The Spreadsheet ID is the part of the URL between `/d/` and `/edit`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo.
3. Deploy. Vercel auto-detects Next.js (`vercel.json` is included). No env vars needed.

---

## Project structure

```
app/            layout, page, globals.css, /api/refresh
components/
  layout/       TopBar, ModuleTabs
  module/       ModuleView, DataTable, SummaryCards
  shared/       MetricCard
lib/
  sheetsSource  tab discovery + CSV fetch/parse
  table         header detection, type inference, aggregates
  modules       sheet registry
  moduleData    per-module orchestration + cache
  cache, format helpers
scripts/        test-table.ts (engine sanity check against live sheets)
```

---

*Reads public Google Sheets — no API key, no Anthropic API.*
