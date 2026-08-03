import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import {
  canManageSite,
  publishSite,
  unpublishSite,
  type UserRole,
} from "@/lib/auth";
import { listResolvedSiteRuntimePages } from "@/lib/builder-core/tree/siteRuntimeContext";
import {
  canPublishAsStaticHtml,
  removePublishedSiteArtifact,
  writePublishedSiteArtifacts,
} from "@/lib/publishedSiteArtifacts";
import { serverError } from "@/lib/server-log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function jsonError(error: string, status: number, code: string) {
  return NextResponse.json(
    { error, code },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

async function authorizeSiteManagement(id: string) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return {
      error: jsonError(
        "Autenticación requerida",
        401,
        "UNAUTHENTICATED",
      ),
    };
  }

  const role = (session.user.role ?? "CLIENT") as UserRole;
  const allowed = await canManageSite(id, session.user.id, role);

  if (!allowed) {
    return {
      error: jsonError(
        "No tienes permiso para administrar este sitio",
        403,
        "FORBIDDEN",
      ),
    };
  }

  return {
    userId: session.user.id,
    role,
  };
}

async function updatePublishedStatus(
  id: string,
  userId: string,
  role: UserRole,
  published: boolean,
) {
  if (role === "ADMIN") {
    const { editorPrisma } = await import("@/lib/editor-db");

    const result = await editorPrisma.editorWebsite.updateMany({
      where: { id },
      data: { published },
    });

    return result.count;
  }

  const result = published
    ? await publishSite(id, userId)
    : await unpublishSite(id, userId);

  return result.count;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return jsonError(
      "ID de sitio requerido",
      400,
      "SITE_ID_REQUIRED",
    );
  }

  try {
    /*
     * La autorización debe ocurrir antes de leer, escribir
     * o eliminar cualquier artefacto de publicación.
     */
    const authorization = await authorizeSiteManagement(id);

    if ("error" in authorization) {
      return authorization.error;
    }

    const runtimePages = await listResolvedSiteRuntimePages(id);

    if (runtimePages.length === 0) {
      return jsonError(
        "Sitio no encontrado",
        404,
        "SITE_NOT_FOUND",
      );
    }

    const publishablePages = runtimePages.map((page) => ({
      slug: page.activePageSlug,
      name: page.activePageName,
      isHome: page.isHome,
      tree: page.tree,
    }));

    const staticArtifactReady = publishablePages.every((page) =>
      canPublishAsStaticHtml(page.tree),
    );

    /*
     * Primero se genera o ajusta el artefacto.
     * Solo después se marca el sitio como publicado.
     */
    if (staticArtifactReady) {
      await writePublishedSiteArtifacts(
        id,
        publishablePages,
        runtimePages[0]?.pages,
      );
    } else {
      await removePublishedSiteArtifact(id);
    }

    const updatedCount = await updatePublishedStatus(
      id,
      authorization.userId,
      authorization.role,
      true,
    );

    if (updatedCount === 0) {
      /*
       * Evita dejar un artefacto publicado si el registro ya no existe
       * o cambió de propietario durante la operación.
       */
      await removePublishedSiteArtifact(id);

      return jsonError(
        "Sitio no encontrado o acceso revocado",
        404,
        "SITE_NOT_FOUND",
      );
    }

    return NextResponse.json(
      {
        ok: true,
        url: `/p/${id}`,
        publicationMode: staticArtifactReady
          ? "static-artifact"
          : "dynamic-renderer",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    serverError(`Error publishing site ${id}`, error);

    return jsonError(
      "No se pudo publicar el sitio",
      500,
      "SITE_PUBLISH_FAILED",
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return jsonError(
      "ID de sitio requerido",
      400,
      "SITE_ID_REQUIRED",
    );
  }

  try {
    const authorization = await authorizeSiteManagement(id);

    if ("error" in authorization) {
      return authorization.error;
    }

    /*
     * Primero se actualiza la base de datos.
     * Después se elimina el artefacto publicado.
     */
    const updatedCount = await updatePublishedStatus(
      id,
      authorization.userId,
      authorization.role,
      false,
    );

    if (updatedCount === 0) {
      return jsonError(
        "Sitio no encontrado",
        404,
        "SITE_NOT_FOUND",
      );
    }

    await removePublishedSiteArtifact(id);

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    serverError(`Error unpublishing site ${id}`, error);

    return jsonError(
      "No se pudo despublicar el sitio",
      500,
      "SITE_UNPUBLISH_FAILED",
    );
  }
}
