export interface AutomationRunPayloadDetails {
  summary: string
  orderId: string | null
  contactId: string | null
  recordId: string | null
  funnelId: string | null
  experimentId: string | null
  email: string | null
  customerEmail: string | null
  collectionSlug: string | null
  funnelStep: string | null
  eventLabel: string | null
}

export function getAutomationRunPayloadDetails(payload: unknown): AutomationRunPayloadDetails {
  if (!payload || typeof payload !== "object") {
    return {
      summary: "Sin contexto adicional",
      orderId: null,
      contactId: null,
      recordId: null,
      funnelId: null,
      experimentId: null,
      email: null,
      customerEmail: null,
      collectionSlug: null,
      funnelStep: null,
      eventLabel: null,
    }
  }

  const record = payload as Record<string, unknown>
  const orderId = typeof record.orderId === "string" && record.orderId ? record.orderId : null
  const contactId = typeof record.contactId === "string" && record.contactId ? record.contactId : null
  const recordId = typeof record.recordId === "string" && record.recordId ? record.recordId : null
  const funnelId = typeof record.funnelId === "string" && record.funnelId ? record.funnelId : null
  const experimentId = typeof record.experimentId === "string" && record.experimentId ? record.experimentId : null
  const customerEmail = typeof record.customerEmail === "string" && record.customerEmail ? record.customerEmail : null
  const email = typeof record.email === "string" && record.email ? record.email : null
  const collectionSlug = typeof record.collectionSlug === "string" && record.collectionSlug ? record.collectionSlug : null
  const funnelStep = typeof record.funnelStep === "string" && record.funnelStep ? record.funnelStep : null
  const eventLabel = typeof record.eventLabel === "string" && record.eventLabel ? record.eventLabel : null

  return {
    summary: customerEmail
      ? `Cliente: ${customerEmail}`
      : orderId
        ? `Pedido: ${orderId}`
      : email
        ? `Contacto: ${email}`
        : collectionSlug
          ? `Colección: ${collectionSlug}`
          : eventLabel
            ? `Evento: ${eventLabel}`
            : funnelStep
              ? `Paso funnel: ${funnelStep}`
              : "Ejecución registrada",
    orderId,
    contactId,
    recordId,
    funnelId,
    experimentId,
    email,
    customerEmail,
    collectionSlug,
    funnelStep,
    eventLabel,
  }
}
