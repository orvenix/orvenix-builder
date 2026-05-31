import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { canManageSite, createSiteFromTree, type UserRole } from "@/lib/auth";
import { validateTree } from "@/types/validateTree";
import type { EditorTree } from "@/types/editor";
import { buildCheckoutRedirectUrl } from "@/lib/checkout";
import { isEditorWebId } from "@/lib/editorWebs";
import { requireCanCreateWebsite } from "@/lib/plan-guard";

type CheckoutAction = "rent" | "buy";

interface CheckoutBody {
  action?: CheckoutAction;
  siteId?: string | null;
  templateId?: string | null;
  tree?: unknown;
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 401 });
  }

  const body = (await request.json()) as CheckoutBody;
  const action = body.action === "buy" ? "buy" : "rent";
  const templateId = body.templateId && isEditorWebId(body.templateId) ? body.templateId : null;
  let siteId = body.siteId && !isEditorWebId(body.siteId) ? body.siteId : null;

  if (siteId) {
    const allowed = await canManageSite(
      siteId,
      session.user.id,
      (session.user.role ?? "CLIENT") as UserRole
    );
    if (!allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  } else if (body.tree) {
    const tree = validateTree(body.tree) as EditorTree;
    try {
      await requireCanCreateWebsite(session.user.id);
    } catch (error) {
      return NextResponse.json(
        {
          error: "PLAN_LIMIT_REACHED",
          message: error instanceof Error ? error.message : "No puedes crear mas sitios con tu plan actual.",
        },
        { status: 403 }
      );
    }

    const site = await createSiteFromTree({
      name: action === "buy" ? "Compra pendiente" : "Renta pendiente",
      description: `checkout:${action}: diseño creado durante checkout`,
      userId: session.user.id,
      tree,
    });
    siteId = site.id;
  }

  if (!siteId) {
    return NextResponse.json({ error: "Falta siteId o tree." }, { status: 400 });
  }

  // Reemplazar esta URL por Stripe Checkout, MercadoPago Preference, etc.
  const redirectUrl = buildCheckoutRedirectUrl(action, siteId, templateId);

  return NextResponse.json({
    ok: true,
    action,
    siteId,
    redirectUrl,
  });
}
