import { NextResponse } from "next/server"
import { z } from "zod"
import { editorPrisma } from "@/lib/editor-db"
import { getUserPlanAccess } from "@/lib/plan-guard"
import { createStoreMpPreference, isMpConfigured } from "@/lib/mercadopago"
import { getFunnel, isFunnelsReady, type FunnelStepKind } from "@/lib/commerce/funnels"
import { trackFunnelEvent } from "@/lib/commerce/funnel-analytics"
import { getExperiment, isExperimentsReady } from "@/lib/commerce/experiments"
import { trackExperimentEvent } from "@/lib/commerce/experiment-analytics"
import { triggerAutomations } from "@/lib/automation/runtime"
import { serverError } from "@/lib/server-log"
import type { Prisma } from "@/generated/editor-prisma"

type Ctx = { params: Promise<{ siteId: string }> }

const CheckoutSchema = z.object({
  customerEmail: z.string().email().max(191),
  customerName: z.string().max(191).optional(),
  funnelId: z.string().min(1).max(191).optional(),
  funnelStep: z.enum(["landing", "checkout", "upsell", "downsell", "thankyou"]).optional(),
  experimentId: z.string().min(1).max(191).optional(),
  experimentVariant: z.enum(["A", "B"]).optional(),
  items: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
})

function buildOrderNotes(
  funnelId?: string,
  funnelStep?: FunnelStepKind,
  mpPreferenceId?: string,
  experimentId?: string,
  experimentVariant?: "A" | "B"
) {
  const parts = ["checkout_created"]
  if (funnelId) parts.push(`funnel:${funnelId}`)
  if (funnelStep) parts.push(`step:${funnelStep}`)
  if (experimentId) parts.push(`experiment:${experimentId}`)
  if (experimentVariant) parts.push(`variant:${experimentVariant}`)
  if (mpPreferenceId) parts.push(`mp_preference:${mpPreferenceId}`)
  return parts.join("|")
}

export async function POST(request: Request, { params }: Ctx) {
  const { siteId } = await params
  const parsed = CheckoutSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_CHECKOUT", details: parsed.error.flatten() }, { status: 400 })
  }

  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { id: true, name: true, userId: true },
  })
  if (!site?.userId) return NextResponse.json({ error: "STORE_NOT_FOUND" }, { status: 404 })

  const access = await getUserPlanAccess(site.userId)
  if (!access.plan?.hasEcommerce) {
    return NextResponse.json(
      { error: "STORE_DISABLED", message: "Esta tienda no tiene checkout activo." },
      { status: 403 }
    )
  }

  const funnelId = parsed.data.funnelId?.trim() || undefined
  const funnelStep = funnelId ? (parsed.data.funnelStep ?? "checkout") : undefined
  const experimentId = parsed.data.experimentId?.trim() || undefined
  const experimentVariant = experimentId ? parsed.data.experimentVariant : undefined
  if (funnelId) {
    if (!isFunnelsReady()) {
      return NextResponse.json(
        { error: "FUNNELS_NOT_READY", message: "Activa funnels en la base antes de usarlos en checkout." },
        { status: 503 }
      )
    }

    const funnel = await getFunnel(siteId, funnelId)
    if (!funnel) {
      return NextResponse.json(
        { error: "INVALID_FUNNEL", message: "El funnel indicado ya no existe o no pertenece a este sitio." },
        { status: 400 }
      )
    }
  }
  if (experimentId) {
    if (!isExperimentsReady()) {
      return NextResponse.json(
        { error: "EXPERIMENTS_NOT_READY", message: "Activa experimentos en la base antes de usarlos en checkout." },
        { status: 503 }
      )
    }

    const experiment = await getExperiment(siteId, experimentId)
    if (!experiment) {
      return NextResponse.json(
        { error: "INVALID_EXPERIMENT", message: "El experimento indicado ya no existe o no pertenece a este sitio." },
        { status: 400 }
      )
    }
  }

  const requestedItems = parsed.data.items
  const requestedByVariant = new Map(requestedItems.map((item) => [item.variantId, item.quantity]))
  const variants = await editorPrisma.productVariant.findMany({
    where: {
      id: { in: requestedItems.map((item) => item.variantId) },
      product: { siteId, status: "active" },
    },
    include: { product: true },
  })

  if (variants.length !== requestedItems.length) {
    return NextResponse.json({ error: "INVALID_ITEMS", message: "Uno o mas productos ya no estan disponibles." }, { status: 400 })
  }

  const items = variants.map((variant) => {
    const quantity = requestedByVariant.get(variant.id) ?? 1
    return {
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      quantity,
      priceMxn: variant.priceMxn,
      subtotalMxn: variant.priceMxn * quantity,
    }
  })
  const totalMxn = items.reduce((sum, item) => sum + item.subtotalMxn, 0)

  if (totalMxn <= 0) {
    return NextResponse.json({ error: "INVALID_TOTAL", message: "El total del pedido no es valido." }, { status: 400 })
  }

  const order = await editorPrisma.order.create({
    data: {
      siteId,
      customerEmail: parsed.data.customerEmail,
      customerName: parsed.data.customerName?.trim() || null,
      status: "pending",
      items: items as Prisma.InputJsonValue,
      totalMxn,
      notes: buildOrderNotes(funnelId, funnelStep, undefined, experimentId, experimentVariant),
    },
  })

  if (funnelId && funnelStep) {
    trackFunnelEvent({
      siteId,
      funnelId,
      step: funnelStep,
      eventType: "checkout_started",
    }).catch(() => {})
  }
  if (experimentId && experimentVariant) {
    trackExperimentEvent({
      siteId,
      experimentId,
      variant: experimentVariant,
      eventType: "checkout_started",
    }).catch(() => {})
  }
  triggerAutomations(siteId, "store_checkout_started", {
    orderId: order.id,
    customerEmail: parsed.data.customerEmail,
    customerName: parsed.data.customerName?.trim() || null,
    totalMxn,
    itemCount: items.length,
    eventLabel: "checkout_started",
    funnelId: funnelId ?? null,
    funnelStep: funnelStep ?? null,
    experimentId: experimentId ?? null,
    experimentVariant: experimentVariant ?? null,
  }).catch(() => {})

  if (isMpConfigured()) {
    try {
      const useSandbox = process.env.MP_SANDBOX === "true" || process.env.NODE_ENV !== "production"
      const mp = await createStoreMpPreference({
        siteId,
        orderId: order.id,
        siteName: site.name,
        customerEmail: parsed.data.customerEmail,
        funnelId,
        funnelStep,
        experimentId,
        experimentVariant,
        items: items.map((item) => ({
          id: item.variantId,
          title: `${item.productName} - ${item.variantName}`,
          quantity: item.quantity,
          unitPriceMxn: item.priceMxn / 100,
        })),
      })

      await editorPrisma.order.update({
        where: { id: order.id },
        data: { notes: buildOrderNotes(funnelId, funnelStep, mp.preferenceId, experimentId, experimentVariant) },
      })

      return NextResponse.json({
        ok: true,
        orderId: order.id,
        siteId,
        totalMxn,
        preferenceId: mp.preferenceId,
        redirectUrl: useSandbox ? mp.sandboxUrl : mp.initPoint,
        mode: useSandbox ? "sandbox" : "live",
      })
    } catch (error) {
      serverError("[store-checkout] MP error", error)
      return NextResponse.json({ error: "PAYMENT_INIT_FAILED", message: "No se pudo iniciar el pago." }, { status: 502 })
    }
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    siteId,
    totalMxn,
    redirectUrl: `/api/store/checkout/pending?siteId=${encodeURIComponent(siteId)}&orderId=${encodeURIComponent(order.id)}${funnelId ? `&funnelId=${encodeURIComponent(funnelId)}&funnelStep=${encodeURIComponent(funnelStep ?? "checkout")}` : ""}${experimentId ? `&experimentId=${encodeURIComponent(experimentId)}&experimentVariant=${encodeURIComponent(experimentVariant ?? "A")}` : ""}`,
    mode: "manual",
  })
}
