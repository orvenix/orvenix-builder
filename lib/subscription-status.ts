export const MP_STATUS_MAP: Record<string, string> = {
  authorized: "active",
  paused: "paused",
  cancelled: "cancelled",
  pending: "pending",
}

export function mapMercadoPagoSubscriptionStatus(status: string | null | undefined) {
  if (!status) return "pending"
  return MP_STATUS_MAP[status] ?? "pending"
}

export function dateFromUnixSeconds(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000) : null
}
