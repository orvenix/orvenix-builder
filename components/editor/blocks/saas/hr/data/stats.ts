import { Users, UserPlus, TrendingDown, Smile } from "lucide-react"
import type { StatItem } from "@/app/webs/_shared/types/common"

export const hrStats: StatItem[] = [
  {
    label: "Total Empleados",
    value: "284",
    change: "+8 este mes",
    positive: true,
    icon: Users,
    accent: "#f59e0b",
    sparkline: [240, 245, 248, 252, 255, 258, 262, 265, 268, 272, 278, 284],
  },
  {
    label: "Nuevas Contrataciones",
    value: "18",
    change: "+50% vs mes ant.",
    positive: true,
    icon: UserPlus,
    accent: "#fbbf24",
    sparkline: [8, 6, 10, 9, 12, 11, 14, 13, 15, 14, 16, 18],
  },
  {
    label: "Tasa de Rotación",
    value: "3.2%",
    change: "-0.8% mejora",
    positive: true,
    icon: TrendingDown,
    accent: "#34d399",
    sparkline: [6, 5.8, 5.5, 5.2, 4.9, 4.6, 4.4, 4.2, 4.0, 3.8, 3.5, 3.2],
  },
  {
    label: "Satisfacción",
    value: "8.7 / 10",
    change: "+0.3 este trimestre",
    positive: true,
    icon: Smile,
    accent: "#a78bfa",
    sparkline: [7.8, 7.9, 8.0, 8.0, 8.1, 8.2, 8.3, 8.3, 8.4, 8.5, 8.6, 8.7],
  },
]
