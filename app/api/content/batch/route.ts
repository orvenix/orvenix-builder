import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { upsertManySiteContent } from "@/lib/siteContentStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { changes?: Record<string, unknown> } | null;

  if (!body?.changes || typeof body.changes !== "object" || Array.isArray(body.changes)) {
    return NextResponse.json({ ok: false, error: "Se esperaba: { changes: { key: value } }" }, { status: 400 });
  }

  await upsertManySiteContent(body.changes);
  return NextResponse.json({ ok: true, saved: Object.keys(body.changes).length });
}
