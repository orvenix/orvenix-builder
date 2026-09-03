import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import {
  canManageSite,
  publishSite,
  unpublishSite,
  type UserRole,
} from "@/lib/auth";

import {
  removePublishedSiteArtifact,
} from "@/lib/publishedSiteArtifacts";

import { serverError } from "@/lib/server-log";

import {
  publishSiteForActor,
  SitePublicationError,
} from "@/lib/site-publication";

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

        const publication =
      await publishSiteForActor({
        siteId: id,

        actor: {
          userId:
            authorization.userId,

          role:
            authorization.role,
        },
      });

    return NextResponse.json(
      {
        ok: true,
        ...publication,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
        if (
      error instanceof
      SitePublicationError
    ) {
      const status =
        error.code ===
          "SITE_ID_REQUIRED"
          ? 400
          : error.code ===
              "FORBIDDEN"
            ? 403
            : error.code ===
                "SITE_NOT_FOUND"
              ? 404
              : 500;

      return jsonError(
        error.message,
        status,
        error.code,
      );
    }
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
