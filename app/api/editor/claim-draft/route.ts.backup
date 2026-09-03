import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { canManageSite, createSiteFromTree, type UserRole } from "@/lib/auth";
import { saveEditorTreeToDb } from "@/lib/editorPersistence";
import { buildCheckoutRedirectUrl } from "@/lib/checkout";
import { validateTree } from "@/types/validateTree";
import type { CheckoutAction } from "@/lib/pendingDesignDraft";
import { requireCanCreateWebsite } from "@/lib/plan-guard";

interface ClaimDraftBody {
  draftKey?: string;
  action?: CheckoutAction;
  sourceSiteId?: string | null;
  tree?: unknown;
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 401 });
  }

  const body = (await request.json()) as ClaimDraftBody;
  if (!body.draftKey || !body.tree) {
    return NextResponse.json({ error: "Draft incompleto." }, { status: 400 });
  }

  const action = body.action === "buy" ? "buy" : "rent";
  const tree = validateTree(body.tree);
  let siteId: string;

  async function guardSiteCreation() {
    try {
      await requireCanCreateWebsite(session.user.id);
      return null;
    } catch (error) {
      return NextResponse.json(
        {
          error: "PLAN_LIMIT_REACHED",
          message: error instanceof Error ? error.message : "No puedes crear mas sitios con tu plan actual.",
        },
        { status: 403 }
      );
    }
  }

  if (body.sourceSiteId) {
    const allowed = await canManageSite(
      body.sourceSiteId,
      session.user.id,
      (session.user.role ?? "CLIENT") as UserRole
    );

    if (allowed) {
      await saveEditorTreeToDb(body.sourceSiteId, tree);
      siteId = body.sourceSiteId;
    } else {
      const limitResponse = await guardSiteCreation();
      if (limitResponse) return limitResponse;

      const site = await createSiteFromTree({
        name: action === "buy" ? "Diseño para compra" : "Diseño para renta",
        description: `pending_design:${action}:${body.draftKey}`,
        userId: session.user.id,
        tree,
      });
      siteId = site.id;
    }
  } else {
    const limitResponse = await guardSiteCreation();
    if (limitResponse) return limitResponse;

    const site = await createSiteFromTree({
      name: action === "buy" ? "Diseño para compra" : "Diseño para renta",
      description: `pending_design:${action}:${body.draftKey}`,
      userId: session.user.id,
      tree,
    });
    siteId = site.id;
  }

  return NextResponse.json({
    ok: true,
    siteId,
    nextRoute: `/editor/${siteId}`,
    redirectUrl: buildCheckoutRedirectUrl(action, siteId),
  });
}
