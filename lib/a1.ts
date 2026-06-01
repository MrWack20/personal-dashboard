/** Spreadsheet A1-notation helpers. Pure — safe in both server and client code. */

/** 0-based column index → letters. 0 → "A", 25 → "Z", 26 → "AA". */
export function colLetter(index: number): string {
  let s = "";
  let i = index + 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

/** 0-based (row, col) → A1 cell reference, e.g. (0, 0) → "A1". */
export function toA1(row: number, col: number): string {
  return `${colLetter(col)}${row + 1}`;
}
