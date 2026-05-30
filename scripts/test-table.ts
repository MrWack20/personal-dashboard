import { buildTable } from "../lib/table.ts";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
      continue;
    }
    if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const samples: [string, string, string][] = [
  ["Pica · 2026 Live Tracker", "1ex175_mhn91t5eh13NW_fZgfKkVSOGC6LBJoAsy9xd8", "1470133624"],
  ["Pica · Inventory", "1ex175_mhn91t5eh13NW_fZgfKkVSOGC6LBJoAsy9xd8", "487502426"],
  ["Investing · SALES", "1G1rNjN3cyk-QFw6ww-_rN3TJgEEeWFSU", "1574350755"],
  ["National Dex · GEN 1", "1TjkGNjU3W_Bf05IHo8K2QJ5TQ9O3IBT3sR0vZ2rO5B4", "1887380160"],
];

for (const [name, id, gid] of samples) {
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`);
  const csv = await r.text();
  const t = buildTable(parseCsv(csv));
  console.log(`\n===== ${name} =====`);
  console.log(`headerRow=${t.headerRow}  rows=${t.rowCount}  cols=${t.columns.length}`);
  console.log("columns:", t.columns.map((c) => `${c.label}[${c.type}]`).join(" | "));
  console.log("aggregates:", t.aggregates.map((a) => `${a.label}: ${a.display}`).join("  ·  "));
  console.log("first row:", JSON.stringify(t.rows[0]));
}
