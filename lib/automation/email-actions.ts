import type { AutomationAction, AutomationTriggerType } from "@/lib/automation/config"

/**
 * SEC-1 (SEC0-08): composes automation emails without trusting the payload.
 *
 * - Every value interpolated into HTML is escaped (owner config included).
 * - Subjects come from owner configuration only, single line.
 * - Triggers fired by PUBLIC, unauthenticated requests carry caller-chosen
 *   addresses, so a payload address is never used as a recipient for them;
 *   only an owner-configured `config.to` (or the platform admin address for
 *   `email_admin`) can receive mail. Otherwise a public form becomes an open
 *   relay from the Orvenix sender.
 */

export const PUBLIC_UNVERIFIED_TRIGGERS_V1: ReadonlySet<AutomationTriggerType> = new Set<AutomationTriggerType>([
  "contact_created",
  "store_checkout_started",
])

export type AutomationEmailV1 = { to: string; subject: string; html: string }

const EMAIL_PATTERN = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/

export function escapeEmailHtmlV1(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function validRecipient(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim()
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null
}

function singleLine(value: unknown, fallback: string): string {
  const text = typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim().slice(0, 200) : ""
  return text || fallback
}

export function buildAutomationEmailV1(input: {
  action: AutomationAction
  triggerType: AutomationTriggerType
  payload: Record<string, unknown>
  platformAdminEmail?: string | null
}): AutomationEmailV1 | null {
  const { action, triggerType, payload } = input
  const config = action.config ?? {}

  if (action.type === "email_admin") {
    const to = validRecipient(config.to) ?? validRecipient(input.platformAdminEmail)
    if (!to) return null
    const subject = singleLine(config.subject, "Nueva automatización ejecutada")
    const html = `<div style="font-family:Arial,sans-serif"><h2>${escapeEmailHtmlV1(subject)}</h2><pre style="white-space:pre-wrap">${escapeEmailHtmlV1(JSON.stringify(payload, null, 2))}</pre></div>`
    return { to, subject, html }
  }

  if (action.type === "email_contact") {
    const configured = validRecipient(config.to)
    const fromPayload = PUBLIC_UNVERIFIED_TRIGGERS_V1.has(triggerType)
      ? null
      : validRecipient(payload.email) ?? validRecipient(payload.customerEmail)
    const to = configured ?? fromPayload
    if (!to) return null
    const subject = singleLine(config.subject, "Seguimiento de Orvenix")
    const message = typeof config.message === "string" && config.message.trim()
      ? config.message.trim()
      : "Gracias por tu interes. Te contactaremos pronto."
    const html = `<div style="font-family:Arial,sans-serif"><p>${escapeEmailHtmlV1(message).replace(/\n/g, "<br>")}</p></div>`
    return { to, subject, html }
  }

  return null
}
