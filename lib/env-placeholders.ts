const PLACEHOLDER_MARKERS = [
  "placeholder",
  "replace_with",
  "replace-with",
  "changeme",
  "change_me",
  "xxxxxxxx",
  "tudominio.com",
  "example.com",
  "USER:PASSWORD",
  "usuario:password",
  "<USER",
  "<PASSWORD",
  "<HOST",
  "<DATABASE",
  "<GENERATED",
  "<STRIPE",
  "<RESEND",
  "<ANTHROPIC",
  "<MERCADOPAGO",
] as const

export function isPlaceholderEnvValue(value: string | undefined | null) {
  const normalized = value?.trim() ?? ""
  if (!normalized) return true

  const lower = normalized.toLowerCase()
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker.toLowerCase()))
}

export function hasConfiguredEnvValue(value: string | undefined | null) {
  return !isPlaceholderEnvValue(value)
}
