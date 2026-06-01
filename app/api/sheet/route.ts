import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/moduleData";

export const dynamic = "force-dynamic";

const ID_RE = /^[A-Za-z0-9_-]{20,}$/;

/** GET /api/sheet?id=<spreadsheetId> — parsed tabs for any public sheet. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid spreadsheet id." }, { status: 400 });
  }
  try {
    const data = await getSheetData(id);
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load that spreadsheet.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
