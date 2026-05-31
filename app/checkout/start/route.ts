import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { createSiteFromTree } from "@/lib/auth"
import { buildCheckoutRedirectUrl, normalizeCheckoutAction } from "@/lib/checkout"
import { getEditorTreeForWeb, isEditorWebId, WEB_LABELS, type EditorWebId } from "@/lib/editorWebs"
import { getRealTemplate } from "@/lib/realTemplates"
import { requireCanCreateWebsite } from "@/lib/plan-guard"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const templateId = url.searchParams.get("templateId")
  const action = normalizeCheckoutAction(url.searchParams.get("intent"))

  if (!templateId || !isEditorWebId(templateId)) {
    redirect("/webs")
  }

  const callbackUrl = `/checkout/start?templateId=${encodeURIComponent(templateId)}&intent=${action}`
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  try {
    await requireCanCreateWebsite(session.user.id)
  } catch {
    redirect(`/precios?upgrade=websites&callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const id = templateId as EditorWebId
  const template = getRealTemplate(id)
  const site = await createSiteFromTree({
    name: `${WEB_LABELS[id]} - ${action === "buy" ? "Compra única" : "Renta mensual"}`,
    description: `${action === "buy" ? "purchase_license" : "rental_subscription"}: plantilla=${template?.name ?? WEB_LABELS[id]}.`,
    userId: session.user.id,
    tree: getEditorTreeForWeb(id),
  })

  redirect(buildCheckoutRedirectUrl(action, site.id, id))
}
