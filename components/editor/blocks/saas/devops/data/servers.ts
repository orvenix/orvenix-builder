export type ServerStatus = "healthy" | "warning" | "critical" | "offline"
export type ServerRole = "web" | "db" | "cache" | "worker" | "gateway"

export interface Server {
  id: string
  name: string
  role: ServerRole
  status: ServerStatus
  region: string
  cpu: number
  ram: number
  disk: number
  uptime: string
  ip: string
}

export const servers: Server[] = [
  { id: "sv1", name: "prod-web-01",    role: "web",     status: "healthy",  region: "EU-West",   cpu: 42,  ram: 61,  disk: 38,  uptime: "99.98%", ip: "10.0.1.10" },
  { id: "sv2", name: "prod-web-02",    role: "web",     status: "healthy",  region: "EU-West",   cpu: 38,  ram: 55,  disk: 36,  uptime: "99.97%", ip: "10.0.1.11" },
  { id: "sv3", name: "prod-db-01",     role: "db",      status: "warning",  region: "EU-West",   cpu: 78,  ram: 89,  disk: 72,  uptime: "99.92%", ip: "10.0.2.10" },
  { id: "sv4", name: "prod-db-02",     role: "db",      status: "healthy",  region: "EU-West",   cpu: 34,  ram: 67,  disk: 58,  uptime: "99.99%", ip: "10.0.2.11" },
  { id: "sv5", name: "prod-cache-01",  role: "cache",   status: "healthy",  region: "EU-West",   cpu: 22,  ram: 44,  disk: 18,  uptime: "100%",   ip: "10.0.3.10" },
  { id: "sv6", name: "prod-worker-01", role: "worker",  status: "critical", region: "US-East",   cpu: 96,  ram: 94,  disk: 81,  uptime: "98.41%", ip: "10.1.1.10" },
  { id: "sv7", name: "prod-worker-02", role: "worker",  status: "healthy",  region: "US-East",   cpu: 48,  ram: 52,  disk: 44,  uptime: "99.95%", ip: "10.1.1.11" },
  { id: "sv8", name: "prod-gw-01",     role: "gateway", status: "offline",  region: "AP-South",  cpu: 0,   ram: 0,   disk: 0,   uptime: "0%",     ip: "10.2.1.10" },
]

export const statusConfig = {
  healthy:  { label: "Saludable",  color: "#10b981", dot: "bg-emerald-400" },
  warning:  { label: "Advertencia",color: "#f59e0b", dot: "bg-amber-400 animate-pulse" },
  critical: { label: "Crítico",    color: "#ef4444", dot: "bg-red-400 animate-pulse" },
  offline:  { label: "Offline",    color: "#64748b", dot: "bg-slate-500" },
} as const

export const roleLabels: Record<ServerRole, string> = {
  web: "Web", db: "Database", cache: "Cache", worker: "Worker", gateway: "Gateway",
}
