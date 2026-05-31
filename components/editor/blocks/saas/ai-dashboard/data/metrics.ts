import { DollarSign, Users, MousePointerClick, TrendingUp } from "lucide-react"
import type { Metric } from "../types"

export const metrics: Metric[] = [
  {
    label: "Revenue Total",
    value: "$2.4M",
    rawValue: 2_400_000,
    change: "+12.5%",
    positive: true,
    icon: DollarSign,
    colorKey: "violet",
    sparkline: [60, 55, 70, 65, 80, 75, 90, 88, 95, 92, 100, 108],
  },
  {
    label: "Usuarios Activos",
    value: "48,291",
    rawValue: 48_291,
    change: "+8.2%",
    positive: true,
    icon: Users,
    colorKey: "blue",
    sparkline: [30, 40, 38, 50, 48, 60, 58, 70, 65, 78, 75, 90],
  },
  {
    label: "Tasa Conversión",
    value: "3.8%",
    rawValue: 3.8,
    change: "-0.4%",
    positive: false,
    icon: MousePointerClick,
    colorKey: "amber",
    sparkline: [45, 50, 48, 42, 44, 40, 38, 42, 39, 37, 38, 36],
  },
  {
    label: "MRR",
    value: "$124K",
    rawValue: 124_000,
    change: "+18.3%",
    positive: true,
    icon: TrendingUp,
    colorKey: "emerald",
    sparkline: [40, 42, 50, 55, 58, 65, 70, 80, 84, 90, 100, 110],
  },
]
