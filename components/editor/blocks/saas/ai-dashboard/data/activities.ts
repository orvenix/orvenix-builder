import { UserPlus, DollarSign, AlertTriangle, CheckCircle2, Zap } from "lucide-react"
import type { Activity } from "../types"

export const activities: Activity[] = [
  {
    id: 1,
    message: "Nuevo plan Enterprise activado",
    detail: "Acme Corp · $4,800/mes",
    time: "hace 2 min",
    icon: DollarSign,
    colorKey: "emerald",
  },
  {
    id: 2,
    message: "342 nuevos usuarios registrados",
    detail: "Spike +68% vs ayer · Canal: Organic",
    time: "hace 14 min",
    icon: UserPlus,
    colorKey: "violet",
  },
  {
    id: 3,
    message: "Latencia API elevada detectada",
    detail: "Región EU-West · P95: 840ms",
    time: "hace 31 min",
    icon: AlertTriangle,
    colorKey: "amber",
  },
  {
    id: 4,
    message: "Deploy producción completado",
    detail: "v2.8.1 · 0 errores · 12 servicios",
    time: "hace 1h",
    icon: CheckCircle2,
    colorKey: "emerald",
  },
  {
    id: 5,
    message: "IA detectó anomalía en churn",
    detail: "Segmento SMB · Riesgo +14% esta semana",
    time: "hace 2h",
    icon: Zap,
    colorKey: "indigo",
  },
]
