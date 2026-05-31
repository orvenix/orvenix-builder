import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { getEditorTreeFromDb, saveEditorTreeToDb } from "@/lib/editorPersistence";
import { canManageSite, type UserRole } from "@/lib/auth";
import { isEditorWebId } from "@/lib/editorWebs";
import { serverDebug, serverError } from "@/lib/server-log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function canAccessEditorId(id: string) {
  if (id === "default-page" || isEditorWebId(id)) return true;
  const session = await getAuthSession();
  if (!session?.user?.id) return false;
  return canManageSite(id, session.user.id, (session.user.role ?? "CLIENT") as UserRole);
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const page = new URL(request.url).searchParams.get("page") ?? "home";
  
  if (!id) {
    return NextResponse.json({ error: "ID de editor requerido" }, { status: 400 });
  }

  try {
    if (!(await canAccessEditorId(id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const tree = await getEditorTreeFromDb(id, page);
    if (!tree) {
      serverDebug(`[API Editor GET] No tree found in DB for ID: ${id}`);
    }

    return NextResponse.json({ tree });
  } catch (error) {
    serverError(`Error fetching editor tree for ID ${id}`, error);
    return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const page = new URL(request.url).searchParams.get("page") ?? "home";

  try {
    if (!(await canAccessEditorId(id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const body = (await request.json()) as { tree?: unknown };
    const tree = await saveEditorTreeToDb(id, body.tree, page);
    return NextResponse.json({ ok: true, tree });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el editor";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
