import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import {
  canManageSite,
  createSiteFromTree,
  type UserRole,
} from "@/lib/auth";
import { saveEditorTreeToDb } from "@/lib/editorPersistence";
import { isArtisanEditableTree } from "@/lib/editorWebs";
import { buildCheckoutRedirectUrl } from "@/lib/checkout";
import { validateTree } from "@/types/validateTree";
import {
  PENDING_DESIGN_PREFIX,
  type CheckoutAction,
} from "@/lib/pendingDesignDraft";
import { getUserPlanAccess, requireCanCreateWebsite } from "@/lib/plan-guard";
import { isAdvancedBuilderPlan } from "@/lib/pro-plan";
import { seedProfessionalStarterPages } from "@/lib/professional-site-starter";
import { serverError } from "@/lib/server-log";

interface ClaimDraftBody {
  draftKey?: unknown;
  action?: unknown;
  sourceSiteId?: unknown;
  tree?: unknown;
}

const MAX_DRAFT_KEY_LENGTH = 191;
const MAX_SITE_ID_LENGTH = 191;
const MAX_CLAIM_BODY_BYTES = 2 * 1024 * 1024;

const SAFE_DRAFT_KEY_SUFFIX_PATTERN = /^[a-zA-Z0-9_-]+$/;
const SAFE_SITE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

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

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return jsonResponse(
      {
        error: "Autenticación requerida",
        code: "UNAUTHENTICATED",
      },
      401,
    );
  }

  let body: ClaimDraftBody;

try {
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredSize = Number.parseInt(contentLength, 10);

    if (
      Number.isFinite(declaredSize) &&
      declaredSize > MAX_CLAIM_BODY_BYTES
    ) {
      return jsonResponse(
        {
          error: "El cuerpo de la solicitud es demasiado grande",
          code: "PAYLOAD_TOO_LARGE",
        },
        413,
      );
    }
  }

  const rawBody = await request.text();
  const actualSize = new TextEncoder().encode(rawBody).byteLength;

  if (actualSize > MAX_CLAIM_BODY_BYTES) {
    return jsonResponse(
      {
        error: "El cuerpo de la solicitud es demasiado grande",
        code: "PAYLOAD_TOO_LARGE",
      },
      413,
    );
  }

  const parsed: unknown = JSON.parse(rawBody);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return jsonResponse(
      {
        error: "El cuerpo de la solicitud no es válido",
        code: "INVALID_BODY",
      },
      400,
    );
  }

  body = parsed as ClaimDraftBody;
} catch {
  return jsonResponse(
    {
      error: "El cuerpo de la solicitud no contiene JSON válido",
      code: "INVALID_JSON",
    },
    400,
  );
}

  if (typeof body.draftKey !== "string") {
    return jsonResponse(
      {
        error: "La clave del borrador es obligatoria",
        code: "DRAFT_KEY_REQUIRED",
      },
      400,
    );
  }

  const draftKey = body.draftKey.trim();
if (
  !draftKey.startsWith(PENDING_DESIGN_PREFIX) ||
  draftKey.length <= PENDING_DESIGN_PREFIX.length ||
  draftKey.length > MAX_DRAFT_KEY_LENGTH
) {
  return jsonResponse(
    {
      error: "La clave del borrador no es válida",
      code: "INVALID_DRAFT_KEY",
    },
    400,
  );
}

const draftKeySuffix = draftKey.slice(
  PENDING_DESIGN_PREFIX.length,
);

if (!SAFE_DRAFT_KEY_SUFFIX_PATTERN.test(draftKeySuffix)) {
  return jsonResponse(
    {
      error: "La clave del borrador no es válida",
      code: "INVALID_DRAFT_KEY",
    },
    400,
  );
}

  if (body.tree === undefined || body.tree === null) {
    return jsonResponse(
      {
        error: "El borrador no contiene un árbol de diseño",
        code: "DRAFT_TREE_REQUIRED",
      },
      400,
    );
  }

  if (body.action !== "buy" && body.action !== "rent") {
  return jsonResponse(
    {
      error: "La acción solicitada no es válida",
      code: "INVALID_CHECKOUT_ACTION",
    },
    400,
  );
}

const action: CheckoutAction = body.action;

  let sourceSiteId: string | null = null;

  if (body.sourceSiteId !== undefined && body.sourceSiteId !== null) {
    if (typeof body.sourceSiteId !== "string") {
      return jsonResponse(
        {
          error: "El identificador del sitio de origen no es válido",
          code: "INVALID_SOURCE_SITE_ID",
        },
        400,
      );
    }

    sourceSiteId = body.sourceSiteId.trim();

    if (
      !sourceSiteId ||
      sourceSiteId.length > MAX_SITE_ID_LENGTH ||
      !SAFE_SITE_ID_PATTERN.test(sourceSiteId)
    ) {
      return jsonResponse(
        {
          error: "El identificador del sitio de origen no es válido",
          code: "INVALID_SOURCE_SITE_ID",
        },
        400,
      );
    }
  }

  let tree: ReturnType<typeof validateTree>;

  try {
    tree = validateTree(body.tree);
  } catch (error) {
    serverError("[claim-draft] Árbol de diseño inválido", error);

    return jsonResponse(
      {
        error: "El árbol del borrador no es válido",
        code: "INVALID_DRAFT_TREE",
      },
      400,
    );
  }

  async function requireSiteCreationPermission() {
    try {
      await requireCanCreateWebsite(session.user.id);
      return null;
    } catch (error) {
      serverError(
        "[claim-draft] Límite del plan alcanzado",
        error,
      );

      return jsonResponse(
        {
          error: "Tu plan no permite crear otro sitio",
          code: "PLAN_LIMIT_REACHED",
        },
        403,
      );
    }
  }

  try {
    let siteId: string;

    if (sourceSiteId) {
      const allowed = await canManageSite(
        sourceSiteId,
        session.user.id,
        (session.user.role ?? "CLIENT") as UserRole,
      );

      if (!allowed) {
        return jsonResponse(
          {
            error: "No tienes permiso para modificar el sitio de origen",
            code: "FORBIDDEN",
          },
          403,
        );
      }

      await saveEditorTreeToDb(sourceSiteId, tree);

      const planAccess = await getUserPlanAccess(session.user.id);
      if (isAdvancedBuilderPlan(planAccess.plan?.id) && !isArtisanEditableTree(tree)) {
        await seedProfessionalStarterPages(sourceSiteId, tree);
      }

      siteId = sourceSiteId;
    } else {
      const limitResponse =
        await requireSiteCreationPermission();

      if (limitResponse) {
        return limitResponse;
      }

      const site = await createSiteFromTree({
        name:
          action === "buy"
            ? "Diseño para compra"
            : "Diseño para renta",
        description: `pending_design:${action}:${draftKey}`,
        userId: session.user.id,
        tree,
      });

      siteId = site.id;
    }

    return jsonResponse({
      ok: true,
      siteId,
      nextRoute: `/editor/${siteId}`,
      redirectUrl: buildCheckoutRedirectUrl(action, siteId),
    });
  } catch (error) {
    serverError(
      "[claim-draft] No se pudo reclamar el borrador",
      error,
    );

    return jsonResponse(
      {
        error: "No se pudo reclamar el borrador",
        code: "CLAIM_DRAFT_FAILED",
      },
      500,
    );
  }
} 
