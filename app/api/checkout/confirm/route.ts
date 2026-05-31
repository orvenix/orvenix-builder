import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite, type UserRole } from "@/lib/auth"
import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"
import { fileStoreApi } from "@/lib/file-store"
import { buildCheckoutSuccessUrl, normalizeCheckoutAction } from "@/lib/checkout"
import { isMpConfigured, createMpPreference, getPriceForTemplate } from "@/lib/mercadopago"
import { serverError } from "@/lib/server-log"

interface ConfirmCheckoutBody {
  action?: string
  siteId?: string | null
  templateId?: string | null
  priceMxn?: number | null
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 401 })

  const body = (await request.json()) as ConfirmCheckoutBody
  const siteId = body.siteId?.trim()
  if (!siteId) return NextResponse.json({ error: "Falta siteId." }, { status: 400 })

  const role = (session.user.role ?? "CLIENT") as UserRole
  const allowed = await canManageSite(siteId, session.user.id, role)
  if (!allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const action = normalizeCheckoutAction(body.action)
  const templateId = body.templateId ?? null

  // Nombre del sitio para el título en MP
  let siteName = siteId
  if (isFileStorageMode()) {
    const store = await fileStoreApi.readStore()
    siteName = store.sites.find(s => s.id === siteId)?.name ?? siteId
  } else {
    const site = await editorPrisma.editorWebsite.findUnique({ where: { id: siteId }, select: { name: true } })
    siteName = site?.name ?? siteId
  }

  // Precio: del body, luego del template, luego null
  const priceMxn = body.priceMxn ?? getPriceForTemplate(templateId, action) ?? null

  // ── Con MercadoPago configurado ───────────────────────────────────────────
  if (isMpConfigured() && priceMxn) {
    try {
      const useSandbox = process.env.MP_SANDBOX === "true" || process.env.NODE_ENV !== "production"
      const mp = await createMpPreference({
        siteId, siteName, templateId, action, priceMxn,
        userEmail: session.user.email ?? "",
      })
      await markCheckoutInitiated(siteId, action, mp.preferenceId)
      return NextResponse.json({
        ok: true, siteId,
        preferenceId: mp.preferenceId,
        redirectUrl: useSandbox ? mp.sandboxUrl : mp.initPoint,
        mode: useSandbox ? "sandbox" : "live",
      })
    } catch (err) {
      serverError("[checkout:confirm] MP error", err)
      return NextResponse.json({ error: "No se pudo iniciar el pago. Intenta de nuevo." }, { status: 502 })
    }
  }

  // ── Fallback manual (sin MP o sin precio) ─────────────────────────────────
  await markCheckoutInitiated(siteId, action, "manual")
  return NextResponse.json({
    ok: true, siteId,
    redirectUrl: buildCheckoutSuccessUrl(action, siteId),
    mode: "manual",
  })
}

async function markCheckoutInitiated(siteId: string, action: string, ref: string) {
  const desc = `checkout_pending:${action}:${ref}:${new Date().toISOString()}`
  if (isFileStorageMode()) {
    await fileStoreApi.updateSite({ id: siteId }, { description: desc })
    return
  }
  await editorPrisma.editorWebsite.update({ where: { id: siteId }, data: { description: desc } })
}
