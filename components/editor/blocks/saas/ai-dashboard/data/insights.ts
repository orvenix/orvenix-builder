import { TrendingUp, AlertCircle, Zap } from "lucide-react"
import type { AIInsight } from "../types"

export const aiInsights: AIInsight[] = [
  {
    id: 1,
    title: "Oportunidad de upsell identificada",
    description:
      "427 cuentas en plan Basic tienen uso >85%. Potencial de conversión a Pro: $38K MRR adicional.",
    action: "Ver segmento",
    icon: TrendingUp,
    colorKey: "emerald",
    priority: "Alta",
  },
  {
    id: 2,
    title: "Churn risk en segmento Enterprise",
    description:
      "12 cuentas muestran señales de churn (uso -40% en 14 días). ARR en riesgo: $144K.",
    action: "Activar playbook",
    icon: AlertCircle,
    colorKey: "amber",
    priority: "Crítica",
  },
  {
    id: 3,
    title: "Canal orgánico superando paid",
    description:
      "SEO generó 34% más conversiones que paid ads este mes con 80% menos costo por adquisición.",
    action: "Ver análisis",
    icon: Zap,
    colorKey: "violet",
    priority: "Info",
  },
]
