import { MercadoPagoConfig, Preference, Payment, PreApprovalPlan, PreApproval } from "mercadopago"
import { REAL_TEMPLATES } from "@/lib/realTemplates"
import type { CheckoutAction } from "@/lib/pendingDesignDraft"

// ─── Config ──────────────────────────────────────────────────────────────────

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token || token === "APP_USR-placeholder") {
    throw new Error("MP_ACCESS_TOKEN no configurado")
  }
  return new MercadoPagoConfig({ accessToken: token })
}

function getAppUrl() {
  const raw =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000"

  return raw.replace(/\/$/, "")
}

export function isMpConfigured(): boolean {
  const token = process.env.MP_ACCESS_TOKEN ?? ""
  return token.length > 20 && !token.includes("placeholder")
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export function getPriceForTemplate(templateId: string | null, action: CheckoutAction): number | null {
  if (!templateId) return null
  const tmpl = REAL_TEMPLATES.find(t => t.id === templateId)
  if (!tmpl) return null
  return action === "buy" ? tmpl.purchasePriceMxn : tmpl.rentalPriceMxn
}

export function getTemplateInfo(templateId: string | null) {
  if (!templateId) return null
  return REAL_TEMPLATES.find(t => t.id === templateId) ?? null
}

// ─── Create preference ───────────────────────────────────────────────────────

export interface CreatePreferenceParams {
  siteId: string
  siteName: string
  templateId: string | null
  action: CheckoutAction
  priceMxn: number
  userEmail: string
}

export interface MpPreferenceResult {
  preferenceId: string
  initPoint: string     // URL de pago — redirect aquí en producción
  sandboxUrl: string    // URL de sandbox para pruebas
}

export interface StorePreferenceItem {
  id: string
  title: string
  quantity: number
  unitPriceMxn: number
}

export interface CreateStorePreferenceParams {
  siteId: string
  orderId: string
  siteName: string
  customerEmail: string
  items: StorePreferenceItem[]
  funnelId?: string
  funnelStep?: string
  experimentId?: string
  experimentVariant?: string
}

export async function createMpPreference(params: CreatePreferenceParams): Promise<MpPreferenceResult> {
  const client = getClient()
  const preference = new Preference(client)

  const appUrl = getAppUrl()
  const title = `${params.siteName} — ${params.action === "buy" ? "Compra única" : "Renta mensual"}`
  const successUrl = new URL("/api/checkout/success", appUrl)
  successUrl.searchParams.set("siteId", params.siteId)
  successUrl.searchParams.set("action", params.action)

  const failureUrl = new URL("/api/checkout/failure", appUrl)
  failureUrl.searchParams.set("siteId", params.siteId)
  failureUrl.searchParams.set("action", params.action)

  const pendingUrl = new URL("/api/checkout/pending", appUrl)
  pendingUrl.searchParams.set("siteId", params.siteId)
  pendingUrl.searchParams.set("action", params.action)

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.siteId,
          title,
          quantity: 1,
          unit_price: params.priceMxn,
          currency_id: "MXN",
          category_id: "software",
          description: params.templateId ? `Template ${params.templateId} - Orvenix` : "Orvenix Web Studio",
        },
      ],
      payer: {
        email: params.userEmail,
      },
      back_urls: {
        success: successUrl.toString(),
        failure: failureUrl.toString(),
        pending: pendingUrl.toString(),
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/checkout/webhook`,
      external_reference: `${params.siteId}:${params.action}:${encodeURIComponent(params.userEmail)}`,
      statement_descriptor: "ORVENIX",
      metadata: {
        siteId: params.siteId,
        action: params.action,
        userEmail: params.userEmail,
        templateId: params.templateId ?? "",
      },
    },
  })

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxUrl: result.sandbox_init_point!,
  }
}

export async function createStoreMpPreference(params: CreateStorePreferenceParams): Promise<MpPreferenceResult> {
  const client = getClient()
  const preference = new Preference(client)
  const appUrl = getAppUrl()

  const successUrl = new URL("/api/store/checkout/success", appUrl)
  successUrl.searchParams.set("siteId", params.siteId)
  successUrl.searchParams.set("orderId", params.orderId)
  if (params.funnelId) successUrl.searchParams.set("funnelId", params.funnelId)
  if (params.funnelStep) successUrl.searchParams.set("funnelStep", params.funnelStep)
  if (params.experimentId) successUrl.searchParams.set("experimentId", params.experimentId)
  if (params.experimentVariant) successUrl.searchParams.set("experimentVariant", params.experimentVariant)

  const failureUrl = new URL("/api/store/checkout/failure", appUrl)
  failureUrl.searchParams.set("siteId", params.siteId)
  failureUrl.searchParams.set("orderId", params.orderId)
  if (params.funnelId) failureUrl.searchParams.set("funnelId", params.funnelId)
  if (params.funnelStep) failureUrl.searchParams.set("funnelStep", params.funnelStep)
  if (params.experimentId) failureUrl.searchParams.set("experimentId", params.experimentId)
  if (params.experimentVariant) failureUrl.searchParams.set("experimentVariant", params.experimentVariant)

  const pendingUrl = new URL("/api/store/checkout/pending", appUrl)
  pendingUrl.searchParams.set("siteId", params.siteId)
  pendingUrl.searchParams.set("orderId", params.orderId)
  if (params.funnelId) pendingUrl.searchParams.set("funnelId", params.funnelId)
  if (params.funnelStep) pendingUrl.searchParams.set("funnelStep", params.funnelStep)
  if (params.experimentId) pendingUrl.searchParams.set("experimentId", params.experimentId)
  if (params.experimentVariant) pendingUrl.searchParams.set("experimentVariant", params.experimentVariant)

  const result = await preference.create({
    body: {
      items: params.items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPriceMxn,
        currency_id: "MXN",
        category_id: "others",
      })),
      payer: {
        email: params.customerEmail,
      },
      back_urls: {
        success: successUrl.toString(),
        failure: failureUrl.toString(),
        pending: pendingUrl.toString(),
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/checkout/webhook`,
      external_reference: `store:${params.orderId}:${params.siteId}:${encodeURIComponent(params.customerEmail)}`,
      statement_descriptor: "ORVENIX",
      metadata: {
        kind: "store_order",
        siteId: params.siteId,
        orderId: params.orderId,
        customerEmail: params.customerEmail,
        funnelId: params.funnelId ?? "",
        funnelStep: params.funnelStep ?? "",
        experimentId: params.experimentId ?? "",
        experimentVariant: params.experimentVariant ?? "",
      },
    },
  })

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxUrl: result.sandbox_init_point!,
  }
}

// ─── Fetch payment ────────────────────────────────────────────────────────────

export async function getMpPayment(paymentId: string) {
  const client = getClient()
  const payment = new Payment(client)
  return payment.get({ id: paymentId })
}

// ─── Subscription Plans (PreApproval) ────────────────────────────────────────

export interface MpPlanResult {
  mpPlanId: string
  initPoint: string
}

export interface CreateMpSubscriptionParams {
  mpPlanId: string
  userEmail: string
  userId: string
  planId: string
  interval: "month" | "year"
}

export interface MpSubscriptionResult {
  mpSubscriptionId: string
  initPoint: string
}

/** Crea un plan recurrente en MP (se llama una sola vez por plan, no por usuario) */
export async function createMpPlan(params: {
  planName: string
  priceMxn: number
  intervalUnit: "months"
  intervalFrequency: number
}): Promise<MpPlanResult> {
  const client = getClient()
  const plan = new PreApprovalPlan(client)
  const appUrl = getAppUrl()

  const result = await plan.create({
    body: {
      reason: `Orvenix — ${params.planName}`,
      auto_recurring: {
        frequency: params.intervalFrequency,
        frequency_type: params.intervalUnit,
        transaction_amount: params.priceMxn,
        currency_id: "MXN",
      },
      payment_methods_allowed: {
        payment_types: [{ id: "credit_card" }, { id: "debit_card" }],
      },
      back_url: `${appUrl}/dashboard`,
    },
  })

  return {
    mpPlanId: result.id!,
    initPoint: result.init_point!,
  }
}

/** Suscribe a un usuario a un plan recurrente de MP */
export async function createMpSubscription(
  params: CreateMpSubscriptionParams
): Promise<MpSubscriptionResult> {
  const client = getClient()
  const preapproval = new PreApproval(client)
  const appUrl = getAppUrl()

  const result = await preapproval.create({
    body: {
      preapproval_plan_id: params.mpPlanId,
      payer_email: params.userEmail,
      back_url: `${appUrl}/dashboard?sub=ok`,
      external_reference: `${params.userId}:${params.planId}:${params.interval}`,
      status: "pending",
    },
  })

  return {
    mpSubscriptionId: result.id!,
    initPoint: result.init_point!,
  }
}

/** Cancela una suscripción activa */
export async function cancelMpSubscription(mpSubscriptionId: string): Promise<void> {
  const client = getClient()
  const preapproval = new PreApproval(client)
  await preapproval.update({
    id: mpSubscriptionId,
    body: { status: "cancelled" },
  })
}

/** Obtiene el estado actual de una suscripción en MP */
export async function getMpSubscription(mpSubscriptionId: string) {
  const client = getClient()
  const preapproval = new PreApproval(client)
  return preapproval.get({ id: mpSubscriptionId })
}

/** Parsea el external_reference de una suscripción */
export function parseSubscriptionReference(ref: string | null | undefined): {
  userId: string | null
  planId: string | null
  interval: "month" | "year"
} {
  if (!ref) return { userId: null, planId: null, interval: "month" }
  const [userId, planId, interval] = ref.split(":")
  return {
    userId: userId ?? null,
    planId: planId ?? null,
    interval: interval === "year" ? "year" : "month",
  }
}

// ─── Parse external reference ─────────────────────────────────────────────────

export function parseExternalReference(ref: string | null | undefined): {
  siteId: string | null
  action: CheckoutAction
  userEmail: string | null
} {
  if (!ref) return { siteId: null, action: "buy", userEmail: null }
  const [siteId, action, userEmail] = ref.split(":")
  return {
    siteId: siteId ?? null,
    action: action === "rent" ? "rent" : "buy",
    userEmail: userEmail ? decodeURIComponent(userEmail) : null,
  }
}

export function parseStoreExternalReference(ref: string | null | undefined): {
  orderId: string | null
  siteId: string | null
  customerEmail: string | null
} {
  if (!ref?.startsWith("store:")) return { orderId: null, siteId: null, customerEmail: null }
  const [, orderId, siteId, customerEmail] = ref.split(":")
  return {
    orderId: orderId ?? null,
    siteId: siteId ?? null,
    customerEmail: customerEmail ? decodeURIComponent(customerEmail) : null,
  }
}
