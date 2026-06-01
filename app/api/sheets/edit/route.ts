import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getModule } from "@/lib/modules";
import { refreshModuleData } from "@/lib/moduleData";
import {
  readGrid,
  updateCell,
  appendRow,
  SheetsNotConfiguredError,
} from "@/lib/sheetsWrite";

export const dynamic = "force-dynamic";

/** Constant-time check of the caller-supplied passcode against EDIT_SECRET. */
function secretOk(provided: unknown): boolean {
  const expected = process.env.EDIT_SECRET;
  if (!expected) return false; // editing stays disabled until a secret is set
  if (typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface Body {
  action?: "grid" | "updateCell" | "appendRow";
  moduleId?: string;
  gid?: string;
  secret?: string;
  a1?: string;
  value?: unknown;
  values?: unknown;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!secretOk(body.secret)) {
    return NextResponse.json({ error: "Incorrect or missing edit passcode." }, { status: 401 });
  }

  const moduleEntry = getModule(String(body.moduleId ?? ""));
  if (!moduleEntry) {
    return NextResponse.json({ error: "Unknown module." }, { status: 400 });
  }
  const gid = String(body.gid ?? "");
  if (!/^\d+$/.test(gid)) {
    return NextResponse.json({ error: "Invalid tab id." }, { status: 400 });
  }
  const sheetsId = moduleEntry.sheetsId;

  try {
    if (body.action === "grid") {
      const grid = await readGrid(sheetsId, gid);
      return NextResponse.json(grid);
    }

    if (body.action === "updateCell") {
      if (typeof body.a1 !== "string" || !/^[A-Z]+\d+$/.test(body.a1)) {
        return NextResponse.json({ error: "Invalid cell reference." }, { status: 400 });
      }
      await updateCell(sheetsId, gid, body.a1, String(body.value ?? ""));
      refreshModuleData(moduleEntry.id).catch(() => {}); // best-effort cache refresh
      return NextResponse.json({ ok: true });
    }

    if (body.action === "appendRow") {
      if (!Array.isArray(body.values)) {
        return NextResponse.json({ error: "Row values must be an array." }, { status: 400 });
      }
      const values = body.values.map((v) => String(v ?? ""));
      await appendRow(sheetsId, gid, values);
      refreshModuleData(moduleEntry.id).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    if (err instanceof SheetsNotConfiguredError) {
      return NextResponse.json(
        { error: "Editing isn't set up on the server yet — add the Google service-account env vars." },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Write failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
