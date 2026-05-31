import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { readSiteContent, upsertSiteContent } from "@/lib/siteContentStore";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await readSiteContent());
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { key?: string; value?: unknown } | null;

  if (!body?.key || typeof body.value === "undefined") {
    return NextResponse.json({ ok: false, error: "Faltan campos: key y value" }, { status: 400 });
  }

  await upsertSiteContent(body.key, body.value);
  return NextResponse.json({ ok: true });
}
