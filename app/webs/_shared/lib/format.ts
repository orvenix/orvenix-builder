// ─── Currency ──────────────────────────────────────────────────────────────────

export function formatCurrency(
  value: number,
  options: { currency?: string; compact?: boolean } = {}
): string {
  const { currency = "USD", compact = true } = options
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value)
}

// ─── Numbers ───────────────────────────────────────────────────────────────────

export function formatNumber(value: number, compact = true): string {
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value)
}

// ─── Percentages ───────────────────────────────────────────────────────────────

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`
}

// ─── Relative time ─────────────────────────────────────────────────────────────

export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return "ahora"
  if (diffMin < 60) return `hace ${diffMin}min`
  if (diffHr < 24) return `hace ${diffHr}h`
  if (diffDay === 1) return "ayer"
  if (diffDay < 7) return `hace ${diffDay}d`
  return `hace ${Math.floor(diffDay / 7)}s`
}

// ─── Date ──────────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string, style: "short" | "medium" | "long" = "medium"): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: style }).format(new Date(date))
}
