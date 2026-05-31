import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { removeSiteContent } from "@/lib/siteContentStore";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await context.params;
  await removeSiteContent(key);
  return NextResponse.json({ ok: true });
}
