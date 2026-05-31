import { Resend } from "resend"
import { render } from "@react-email/components"
import WelcomeEmail from "@/emails/welcome"
import DifmCreatedEmail from "@/emails/difm-created"
import DifmUpdatedEmail from "@/emails/difm-updated"
import ResetPasswordEmail from "@/emails/reset-password"
import type { EditRequestStatus } from "@/lib/editRequests"
import { serverDebug, serverError } from "@/lib/server-log"

// ─── Config ──────────────────────────────────────────────────────────────────

const FROM = process.env.RESEND_FROM ?? "Orvenix <hola@orvenix.com.mx>"
const ADMIN_EMAIL = process.env.ORVENIX_ADMIN_EMAILS?.split(",")[0]?.trim() ?? ""
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key || key === "re_placeholder") return null
  return new Resend(key)
}

// ─── Generic send ─────────────────────────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[]
  subject: string
  html: string
}) {
  const resend = getResend()
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      serverDebug(`[email:dev] To: ${to} | Subject: ${subject}`)
    }
    return { ok: true, skipped: true }
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      serverError("[email] Send error", error)
      return { ok: false, error }
    }
    return { ok: true }
  } catch (err) {
    serverError("[email] Unexpected error", err)
    return { ok: false, error: err }
  }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export async function sendWelcomeEmail({ name, email }: { name: string; email: string }) {
  const html = await render(
    WelcomeEmail({ name, email, dashboardUrl: `${APP_URL}/dashboard` })
  )
  return sendEmail({
    to: email,
    subject: `Bienvenido a Orvenix, ${name} 👋`,
    html,
  })
}

export async function sendDifmCreatedEmail({
  userName,
  userEmail,
  ticketId,
  siteName,
  message,
  timeline,
}: {
  userName: string
  userEmail: string
  ticketId: string
  siteName: string
  message: string
  timeline: string | null
}) {
  const dashboardUrl = `${APP_URL}/dashboard`

  const clientHtml = await render(
    DifmCreatedEmail({ userName, userEmail, ticketId, siteName, message, timeline, dashboardUrl, isAdmin: false })
  )
  const adminHtml = await render(
    DifmCreatedEmail({ userName, userEmail, ticketId, siteName, message, timeline, dashboardUrl: `${APP_URL}/admin`, isAdmin: true })
  )

  const results = await Promise.allSettled([
    sendEmail({ to: userEmail, subject: `Solicitud de ajustes recibida — ${siteName}`, html: clientHtml }),
    ADMIN_EMAIL
      ? sendEmail({ to: ADMIN_EMAIL, subject: `[DIFM] Nueva solicitud de ${userName} — ${siteName}`, html: adminHtml })
      : Promise.resolve({ ok: true, skipped: true }),
  ])

  return results
}

export async function sendDifmUpdatedEmail({
  userName,
  userEmail,
  ticketId,
  siteName,
  newStatus,
}: {
  userName: string
  userEmail: string
  ticketId: string
  siteName: string
  newStatus: EditRequestStatus
}) {
  if (newStatus === "open") return { ok: true, skipped: true }

  const html = await render(
    DifmUpdatedEmail({
      userName,
      ticketId,
      siteName,
      newStatus: newStatus as "in_progress" | "done" | "cancelled",
      dashboardUrl: `${APP_URL}/dashboard`,
    })
  )

  return sendEmail({
    to: userEmail,
    subject: getStatusSubject(newStatus, siteName),
    html,
  })
}

export async function sendResetPasswordEmail({
  name,
  email,
  token,
}: {
  name: string
  email: string
  token: string
}) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  const html = await render(
    ResetPasswordEmail({ name, resetUrl, expiresInMinutes: 30 })
  )
  return sendEmail({
    to: email,
    subject: "Restablecer contraseña — Orvenix",
    html,
  })
}

// ─── Store order confirmation ─────────────────────────────────────────────────

export async function sendOrderConfirmationEmail({
  customerEmail,
  customerName,
  orderId,
  totalMxn,
  items,
}: {
  customerEmail: string
  customerName?: string
  orderId: string
  totalMxn: number
  items: Array<{ variantId?: string; quantity?: number; productName?: string; variantName?: string; priceMxn?: number }>
}) {
  const name = customerName ?? customerEmail.split("@")[0]
  const itemLines = items
    .map((i) => `• ${i.productName ?? "Producto"} (${i.variantName ?? ""}) × ${i.quantity ?? 1} — $${((i.priceMxn ?? 0) * (i.quantity ?? 1) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`)
    .join("\n")
  const totalFormatted = `$${(totalMxn / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;background:#f8fafc;padding:32px;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h1 style="color:#0f172a;font-size:22px;margin-bottom:8px;">¡Pedido confirmado!</h1>
      <p style="color:#475569;margin-bottom:24px;">Hola ${name}, tu pedido ha sido procesado correctamente.</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:#64748b;font-size:12px;margin:0 0 8px;">Número de pedido</p>
        <p style="color:#0f172a;font-family:monospace;font-weight:700;margin:0;">#${orderId.slice(-8).toUpperCase()}</p>
      </div>
      <pre style="background:#f8fafc;border-radius:8px;padding:16px;font-size:13px;color:#334155;white-space:pre-wrap;margin-bottom:24px;">${itemLines}</pre>
      <div style="border-top:1px solid #e2e8f0;padding-top:16px;text-align:right;">
        <span style="color:#64748b;font-size:13px;">Total: </span>
        <span style="color:#0f172a;font-size:18px;font-weight:700;">${totalFormatted}</span>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Recibirás tu pedido pronto. ¡Gracias por tu compra!</p>
    </div>
  </body></html>`

  return sendEmail({
    to: customerEmail,
    subject: `Pedido confirmado #${orderId.slice(-8).toUpperCase()} — Orvenix`,
    html,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusSubject(status: EditRequestStatus, siteName: string) {
  const map: Record<EditRequestStatus, string> = {
    open: `Solicitud recibida — ${siteName}`,
    in_progress: `Tu solicitud está en progreso — ${siteName}`,
    done: `✅ Ajustes completados — ${siteName}`,
    cancelled: `Solicitud cancelada — ${siteName}`,
  }
  return map[status]
}
