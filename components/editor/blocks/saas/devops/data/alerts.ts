export type AlertSeverity = "critical" | "warning" | "info"

export interface Alert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  service: string
  time: string
  resolved: boolean
}

export const alerts: Alert[] = [
  { id: "a1", title: "CPU crítica en prod-worker-01", description: "CPU al 96% durante más de 10 minutos. Posible memory leak.", severity: "critical", service: "prod-worker-01", time: "hace 2min",  resolved: false },
  { id: "a2", title: "Gateway AP-South offline",      description: "El servidor prod-gw-01 no responde. Timeout en health check.", severity: "critical", service: "prod-gw-01",    time: "hace 8min",  resolved: false },
  { id: "a3", title: "RAM alta en prod-db-01",        description: "Uso de RAM al 89%. Revisar queries lentas.", severity: "warning", service: "prod-db-01",    time: "hace 15min", resolved: false },
  { id: "a4", title: "SSL expira en 14 días",          description: "El certificado de api.orvenix.io expira el 17-May-2026.", severity: "warning", service: "api-gateway",    time: "hace 1h",    resolved: false },
  { id: "a5", title: "Deploy fallido en staging",      description: "Pipeline #4821 falló en step 'integration-tests'.", severity: "warning", service: "CI/CD",          time: "hace 2h",    resolved: true },
  { id: "a6", title: "Backup completado",              description: "Snapshot de prod-db-01 guardado en S3. Tamaño: 18.4GB.", severity: "info",    service: "Backup",         time: "hace 3h",    resolved: true },
]

export const severityConfig = {
  critical: { label: "Crítico",     color: "#ef4444", bg: "#ef444418", border: "#ef444440" },
  warning:  { label: "Advertencia", color: "#f59e0b", bg: "#f59e0b18", border: "#f59e0b40" },
  info:     { label: "Info",        color: "#06b6d4", bg: "#06b6d418", border: "#06b6d440" },
} as const
