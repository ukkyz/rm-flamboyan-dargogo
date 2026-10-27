import { sqlite } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = sqlite.prepare("select 1 as ok").get() as { ok: number } | undefined;
    return Response.json({ ok: row?.ok === 1, engine: "sqlite" });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
