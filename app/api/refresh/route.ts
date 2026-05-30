import { NextResponse } from "next/server";
import { refreshModuleData } from "@/lib/moduleData";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const moduleId = new URL(req.url).searchParams.get("module");
  if (!moduleId) {
    return NextResponse.json({ error: "Missing module id." }, { status: 400 });
  }
  try {
    const data = await refreshModuleData(moduleId);
    return NextResponse.json({ data, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to refresh sheet data.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
