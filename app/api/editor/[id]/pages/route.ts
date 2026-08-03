import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { canManageSite, type UserRole } from "@/lib/auth";
import {
  PageLimitReachedError,
  requireCanCreatePage,
} from "@/lib/plan-guard";
import {
  createSitePage,
  listSitePages,
} from "@/lib/builder-core/tree/sitePages";
import { serverError } from "@/lib/server-log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 120;
const MAX_SLUG_LENGTH = 100;

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

function validateSlug(slug: unknown) {
  if (slug === undefined) {
    return {
      value: undefined,
      error: null,
    };
  }

  if (typeof slug !== "string") {
    return {
      value: undefined,
      error: "El slug debe ser una cadena de texto.",
    };
  }

  const normalizedSlug = slug.trim().toLowerCase();

  if (
    !normalizedSlug ||
    normalizedSlug.length > MAX_SLUG_LENGTH ||
    !SAFE_SLUG_PATTERN.test(normalizedSlug)
  ) {
    return {
      value: undefined,
      error:
        "El slug debe contener únicamente letras minúsculas, números y guiones.",
    };
  }

  return {
    value: normalizedSlug,
    error: null,
  };
}

/**
 * GET /api/editor/[id]/pages
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  const authorization = await authorizeSiteManagement(id);
  if (authorization.response) {
    return authorization.response;
  }

  try {
    const pages = await listSitePages(id);

    return jsonResponse({
      ok: true,
      pages,
    });
  } catch (error) {
    serverError("[editor-pages] Error listando páginas", error);

    return jsonResponse(
      {
        error: "No se pudieron obtener las páginas",
        code: "PAGE_LIST_FAILED",
      },
      500,
    );
  }
}

/**
 * POST /api/editor/[id]/pages
 */
export async function POST(
  request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  const authorization = await authorizeSiteManagement(id);
  if (authorization.response) {
    return authorization.response;
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

  if (typeof input.name !== "string") {
    return jsonResponse(
      {
        error: "El nombre de la página es obligatorio",
        code: "PAGE_NAME_REQUIRED",
      },
      400,
    );
  }

  const name = input.name.trim();

  if (!name) {
    return jsonResponse(
      {
        error: "El nombre de la página es obligatorio",
        code: "PAGE_NAME_REQUIRED",
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

  const slugValidation = validateSlug(input.slug);

  if (slugValidation.error) {
    return jsonResponse(
      {
        error: slugValidation.error,
        code: "INVALID_PAGE_SLUG",
      },
      400,
    );
  }

  try {
     await requireCanCreatePage(id);


    const page = await createSitePage(id, {
      name,
      slug: slugValidation.value,
    });

    return jsonResponse(
      {
        ok: true,
        page,
      },
      201,
    );
  } catch (error) {
  if (error instanceof PageLimitReachedError) {
    return jsonResponse(
      {
        error: error.message,
        code: error.code,
        upgradeUrl: "/precios?upgrade=pages",
      },
      403,
    );
  }

  serverError("[editor-pages] Error creando página", error);

  const message =
    error instanceof Error &&
    (
      error.message.includes("slug") ||
      error.message.includes("existe")
    )
      ? error.message
      : "No se pudo crear la página";

  return jsonResponse(
    {
      error: message,
      code: "PAGE_CREATE_FAILED",
    },
    400,
  );
}
}
