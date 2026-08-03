import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { canManageSite, type UserRole } from "@/lib/auth";
import { isEditorWebId } from "@/lib/editorWebs";
import { updateSitePageMetadata } from "@/lib/builder-core/tree/sitePages";

interface RouteContext {
  params: Promise<{ id: string; pageId: string }>;
}

async function canAccessEditorId(id: string) {
  if (id === "default-page" || isEditorWebId(id)) return true;
  const session = await getAuthSession();
  if (!session?.user?.id) return false;
  return canManageSite(id, session.user.id, (session.user.role ?? "CLIENT") as UserRole);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, pageId } = await context.params;

  if (!(await canAccessEditorId(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; slug?: string };

  try {
    const page = await updateSitePageMetadata(id, pageId, {
      name: body.name,
      slug: body.slug,
    });
    return NextResponse.json({ ok: true, page });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la pagina";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
