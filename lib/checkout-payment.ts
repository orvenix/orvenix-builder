import { sendWelcomeEmail } from "@/lib/email"
import { editorPrisma } from "@/lib/editor-db"
import { fileStoreApi } from "@/lib/file-store"
import { getMpPayment, parseExternalReference } from "@/lib/mercadopago"
import { serverDebug, serverError, serverWarn } from "@/lib/server-log"
import { isFileStorageMode } from "@/lib/storage-mode"
import { processStoreMercadoPagoPayment } from "@/lib/store-checkout-payment"

export interface CheckoutPaymentResult {
  ok: boolean
  paymentId: string
  siteId: string | null
  status: string | null
  processed: boolean
}

export async function processMercadoPagoPayment(paymentId: string): Promise<CheckoutPaymentResult> {
  const payment = await getMpPayment(paymentId)
  if (typeof payment.external_reference === "string" && payment.external_reference.startsWith("store:")) {
    const result = await processStoreMercadoPagoPayment(paymentId)
    return {
      ok: result.ok,
      paymentId,
      siteId: result.siteId,
      status: result.status,
      processed: result.processed,
    }
  }

  const status = typeof payment.status === "string" ? payment.status : null
  const { siteId, action, userEmail } = parseExternalReference(payment.external_reference)

  if (!siteId) {
    serverWarn("[checkout:mp] No siteId in external_reference", payment.external_reference)
    return { ok: false, paymentId, siteId: null, status, processed: false }
  }

  if (status !== "approved") {
    serverDebug(`[checkout:mp] Payment ${paymentId} status: ${status ?? "unknown"} - skipping`)
    return { ok: true, paymentId, siteId, status, processed: false }
  }

  const alreadyPaid = await isSitePaid(siteId)
  if (alreadyPaid) {
    serverDebug(`[checkout:mp] Site ${siteId} already paid - skipping duplicate`)
    return { ok: true, paymentId, siteId, status, processed: false }
  }

  const priceMxn = typeof payment.transaction_amount === "number" ? payment.transaction_amount : 0
  const description = `paid:${action}:${payment.id}:${new Date().toISOString()}:amount:${priceMxn}`
  await updateSiteAfterPayment(siteId, description)

  serverDebug(`[checkout:mp] Payment approved - siteId: ${siteId}, action: ${action}, amount: $${priceMxn} MXN`)

  if (userEmail) {
    sendWelcomeEmail({
      name: userEmail.split("@")[0],
      email: userEmail,
    }).catch((err) => serverError("[checkout:mp] Email failed", err))
  }

  return { ok: true, paymentId, siteId, status, processed: true }
}

async function isSitePaid(siteId: string): Promise<boolean> {
  const description = await getSiteDescription(siteId)
  return description.startsWith("paid:")
}

async function getSiteDescription(siteId: string): Promise<string> {
  if (isFileStorageMode()) {
    const store = await fileStoreApi.readStore()
    return store.sites.find((site) => site.id === siteId)?.description ?? ""
  }

  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { description: true },
  })
  return site?.description ?? ""
}

async function updateSiteAfterPayment(siteId: string, description: string) {
  if (isFileStorageMode()) {
    await fileStoreApi.updateSite({ id: siteId }, {
      published: true,
      description,
    })
    return
  }

  await editorPrisma.editorWebsite.update({
    where: { id: siteId },
    data: { published: true, description },
  })
}
