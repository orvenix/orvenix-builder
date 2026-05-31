import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { canManageSite, type UserRole } from "@/lib/auth";
import { isEditorWebId } from "@/lib/editorWebs";
import { createSitePage, listSitePages } from "@/lib/builder-core/tree/sitePages";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function canAccessEditorId(id: string) {
  if (id === "default-page" || isEditorWebId(id)) return true;
  const session = await getAuthSession();
  if (!session?.user?.id) return false;
  return canManageSite(id, session.user.id, (session.user.role ?? "CLIENT") as UserRole);
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!(await canAccessEditorId(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const pages = await listSitePages(id);
  return NextResponse.json({ pages });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!(await canAccessEditorId(id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; slug?: string };
  const rawName = body.name?.trim() ?? "";

  if (!rawName) {
    return NextResponse.json({ error: "El nombre de la pagina es obligatorio." }, { status: 400 });
  }

  try {
    const page = await createSitePage(id, { name: rawName, slug: body.slug });
    return NextResponse.json({ ok: true, page });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la pagina";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
