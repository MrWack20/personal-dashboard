const ids = {
  "J's Pica Pica": "1ex175_mhn91t5eh13NW_fZgfKkVSOGC6LBJoAsy9xd8",
  "Pokemon Investing": "1G1rNjN3cyk-QFw6ww-_rN3TJgEEeWFSU",
  "National Dex": "1TjkGNjU3W_Bf05IHo8K2QJ5TQ9O3IBT3sR0vZ2rO5B4",
  "Shiny Dex": "1psyEyTHcQhEVZKtsJLyCK6IcEIfm0f3jR7TBwHE-F4Y",
};

const re = /items\.push\(\{name:\s*"((?:[^"\\]|\\.)*)",\s*pageUrl:[^,]*,\s*gid:\s*"(\d+)"/g;

for (const [name, id] of Object.entries(ids)) {
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/htmlview`);
  const html = await r.text();
  const items = [...html.matchAll(re)];
  console.log(`\n===== ${name} (${items.length} tabs) =====`);
  for (const m of items) {
    const tabName = m[1]
      .replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\\//g, "/")
      .replace(/\\"/g, '"');
    console.log(`  gid=${m[2]}  ${tabName}`);
  }
}
