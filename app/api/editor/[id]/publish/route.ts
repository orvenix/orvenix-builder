import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { canManageSite, publishSite, unpublishSite, type UserRole } from "@/lib/auth";
import { isEditorWebId } from "@/lib/editorWebs";
import { listResolvedSiteRuntimePages } from "@/lib/builder-core/tree/siteRuntimeContext";
import {
  canPublishAsStaticHtml,
  removePublishedSiteArtifact,
  writePublishedSiteArtifacts,
} from "@/lib/publishedSiteArtifacts";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const runtimePages = await listResolvedSiteRuntimePages(id);
  if (runtimePages.length === 0) {
    return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });
  }

  const publishablePages = runtimePages.map((page) => ({
    slug: page.activePageSlug,
    name: page.activePageName,
    isHome: page.isHome,
    tree: page.tree,
  }));

  const staticArtifactReady = publishablePages.every((page) => canPublishAsStaticHtml(page.tree));

  if (staticArtifactReady) {
    await writePublishedSiteArtifacts(
      id,
      publishablePages,
      runtimePages[0]?.pages
    );
  } else {
    await removePublishedSiteArtifact(id);
  }

  // Demo sites can be published without auth
  if (!isEditorWebId(id)) {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const role = (session.user.role ?? "CLIENT") as UserRole;
    const allowed = await canManageSite(id, session.user.id, role);
    if (!allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (role === "ADMIN") {
      const { editorPrisma } = await import("@/lib/editor-db");
      await editorPrisma.editorWebsite.update({ where: { id }, data: { published: true } });
    } else {
      await publishSite(id, session.user.id);
    }
  } else {
    // Demo site — publish directly (no user ownership check)
    const { editorPrisma } = await import("@/lib/editor-db");
    await editorPrisma.editorWebsite.update({ where: { id }, data: { published: true } });
  }

  return NextResponse.json({
    ok: true,
    url: `/p/${id}`,
    publicationMode: staticArtifactReady ? "static-artifact" : "dynamic-renderer",
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isEditorWebId(id)) {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const role = (session.user.role ?? "CLIENT") as UserRole;
    const allowed = await canManageSite(id, session.user.id, role);
    if (!allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (role === "ADMIN") {
      const { editorPrisma } = await import("@/lib/editor-db");
      await editorPrisma.editorWebsite.update({ where: { id }, data: { published: false } });
    } else {
      await unpublishSite(id, session.user.id);
    }
  } else {
    const { editorPrisma } = await import("@/lib/editor-db");
    await editorPrisma.editorWebsite.update({ where: { id }, data: { published: false } });
  }

  await removePublishedSiteArtifact(id);

  return NextResponse.json({ ok: true });
}
