import { redirect } from "next/navigation"
import { processMercadoPagoPayment } from "@/lib/checkout-payment"
import { serverError } from "@/lib/server-log"

// MercadoPago redirige aquí tras un pago aprobado.
// El webhook ya procesó el pago y publicó el sitio.
// Simplemente redirigimos al dashboard con el estado correcto.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get("siteId") ?? ""
  const action = searchParams.get("action") ?? "buy"
  const paymentId = searchParams.get("payment_id") ?? searchParams.get("collection_id")

  if (paymentId) {
    try {
      await processMercadoPagoPayment(paymentId)
    } catch (error) {
      serverError("[checkout:success] Payment verification failed", error)
    }
  }

  redirect(`/dashboard?checkout=success&intent=${action}&siteId=${encodeURIComponent(siteId)}`)
}
