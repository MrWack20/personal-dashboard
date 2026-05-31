const ID = "1ex175_mhn91t5eh13NW_fZgfKkVSOGC6LBJoAsy9xd8";
const tabs = [
  ["Live Tracker", "1470133624"],
  ["Inventory", "487502426"],
];

function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else q = false; } else field += c; continue; }
    if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

for (const [name, gid] of tabs) {
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${ID}/export?format=csv&gid=${gid}`);
  const m = parseCsv(await r.text());
  console.log(`\n===== ${name} (gid ${gid}) — ${m.length} rows =====`);
  m.slice(0, 12).forEach((row, i) => {
    console.log(String(i).padStart(2), JSON.stringify(row));
  });
}
