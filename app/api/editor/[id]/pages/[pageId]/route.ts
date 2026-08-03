import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { canManageSite, type UserRole } from "@/lib/auth";
import { updateSitePageMetadata } from "@/lib/builder-core/tree/sitePages";
import { serverError } from "@/lib/server-log";

interface RouteContext {
  params: Promise<{
    id: string;
    pageId: string;
  }>;
}

const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_SLUG_LENGTH = 100;
const MAX_ID_LENGTH = 191;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function authorizeSiteManagement(siteId: string) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return {
      response: jsonResponse(
        {
          error: "Autenticación requerida",
          code: "UNAUTHENTICATED",
        },
        401,
      ),
    };
  }

  const allowed = await canManageSite(
    siteId,
    session.user.id,
    (session.user.role ?? "CLIENT") as UserRole,
  );

  if (!allowed) {
    return {
      response: jsonResponse(
        {
          error: "No tienes permiso para administrar este sitio",
          code: "FORBIDDEN",
        },
        403,
      ),
    };
  }

  return {
    session,
    response: null,
  };
}

/**
 * PATCH /api/editor/[id]/pages/[pageId]
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const { id, pageId } = await context.params;

  const authorization = await authorizeSiteManagement(id);
  if (authorization.response) {
    return authorization.response;
  }

  if (
    !pageId ||
    pageId.length > MAX_ID_LENGTH ||
    !SAFE_ID_PATTERN.test(pageId)
  ) {
    return jsonResponse(
      {
        error: "El identificador de la página no es válido",
        code: "INVALID_PAGE_ID",
      },
      400,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        error: "El cuerpo de la solicitud no contiene JSON válido",
        code: "INVALID_JSON",
      },
      400,
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(
      {
        error: "El cuerpo de la solicitud no es válido",
        code: "INVALID_BODY",
      },
      400,
    );
  }

  const input = body as Record<string, unknown>;
  const update: {
    name?: string;
    slug?: string;
  } = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string") {
      return jsonResponse(
        {
          error: "El nombre debe ser una cadena de texto",
          code: "INVALID_PAGE_NAME",
        },
        400,
      );
    }

    const name = input.name.trim();

    if (!name) {
      return jsonResponse(
        {
          error: "El nombre de la página no puede estar vacío",
          code: "INVALID_PAGE_NAME",
        },
        400,
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      return jsonResponse(
        {
          error: `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`,
          code: "PAGE_NAME_TOO_LONG",
        },
        400,
      );
    }

    update.name = name;
  }

  if (input.slug !== undefined) {
    if (typeof input.slug !== "string") {
      return jsonResponse(
        {
          error: "El slug debe ser una cadena de texto",
          code: "INVALID_PAGE_SLUG",
        },
        400,
      );
    }

    const slug = input.slug.trim().toLowerCase();

    if (
      !slug ||
      slug.length > MAX_SLUG_LENGTH ||
      !SAFE_SLUG_PATTERN.test(slug)
    ) {
      return jsonResponse(
        {
          error:
            "El slug debe contener únicamente letras minúsculas, números y guiones",
          code: "INVALID_PAGE_SLUG",
        },
        400,
      );
    }

    update.slug = slug;
  }

  if (update.name === undefined && update.slug === undefined) {
    return jsonResponse(
      {
        error: "No se proporcionó ningún campo válido para actualizar",
        code: "NO_UPDATE_FIELDS",
      },
      400,
    );
  }

  try {
    const page = await updateSitePageMetadata(
      id,
      pageId,
      update,
    );

    return jsonResponse({
      ok: true,
      page,
    });
  } catch (error) {
    serverError("[editor-page] Error actualizando página", error);

    const message =
      error instanceof Error &&
      (
        error.message.includes("slug") ||
        error.message.includes("existe") ||
        error.message.includes("encontr")
      )
        ? error.message
        : "No se pudo actualizar la página";

    return jsonResponse(
      {
        error: message,
        code: "PAGE_UPDATE_FAILED",
      },
      400,
    );
  }
}
