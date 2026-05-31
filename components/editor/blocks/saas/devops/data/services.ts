export type ServiceStatus = "up" | "degraded" | "down"

export interface Service {
  name: string
  status: ServiceStatus
  latency: number
  uptime: string
  requests: string
  endpoint: string
}

export const services: Service[] = [
  { name: "API Gateway",      status: "up",       latency: 24,  uptime: "99.98%", requests: "2.4M/d",  endpoint: "api.orvenix.io" },
  { name: "Auth Service",     status: "up",       latency: 18,  uptime: "99.99%", requests: "840K/d",  endpoint: "auth.orvenix.io" },
  { name: "Editor Backend",   status: "up",       latency: 31,  uptime: "99.95%", requests: "1.1M/d",  endpoint: "editor.orvenix.io" },
  { name: "Media CDN",        status: "degraded", latency: 142, uptime: "98.72%", requests: "3.8M/d",  endpoint: "cdn.orvenix.io" },
  { name: "Notifications",    status: "up",       latency: 45,  uptime: "99.90%", requests: "320K/d",  endpoint: "notif.internal" },
  { name: "Analytics Engine", status: "up",       latency: 67,  uptime: "99.88%", requests: "5.2M/d",  endpoint: "analytics.internal" },
  { name: "Worker Queue",     status: "down",     latency: 0,   uptime: "96.41%", requests: "0/d",     endpoint: "queue.internal" },
  { name: "Search Index",     status: "up",       latency: 12,  uptime: "99.97%", requests: "780K/d",  endpoint: "search.internal" },
]

export const serviceStatusConfig = {
  up:       { label: "Operativo",  color: "#10b981", dot: "bg-emerald-400" },
  degraded: { label: "Degradado",  color: "#f59e0b", dot: "bg-amber-400 animate-pulse" },
  down:     { label: "Caído",      color: "#ef4444", dot: "bg-red-500 animate-pulse" },
} as const
