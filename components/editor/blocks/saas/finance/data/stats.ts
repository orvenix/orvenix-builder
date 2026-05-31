import { TrendingUp, DollarSign, Landmark, Wallet } from "lucide-react"
import type { StatItem } from "@/app/webs/_shared/types/common"

export const financeStats: StatItem[] = [
  {
    label: "Portfolio Total",
    value: "$2.84M",
    change: "+8.3%",
    positive: true,
    icon: TrendingUp,
    accent: "#10b981",
    sparkline: [42, 38, 51, 47, 60, 58, 72, 69, 83, 78, 91, 88],
  },
  {
    label: "P&L Mensual",
    value: "+$42,300",
    change: "+12.1%",
    positive: true,
    icon: DollarSign,
    accent: "#34d399",
    sparkline: [20, 35, 28, 45, 38, 52, 47, 61, 58, 72, 68, 80],
  },
  {
    label: "Activos Totales",
    value: "38",
    change: "+3 este mes",
    positive: true,
    icon: Landmark,
    accent: "#6ee7b7",
    sparkline: [30, 30, 31, 32, 33, 33, 34, 35, 36, 36, 37, 38],
  },
  {
    label: "Liquidez",
    value: "$128,500",
    change: "-4.2%",
    positive: false,
    icon: Wallet,
    accent: "#f59e0b",
    sparkline: [90, 85, 88, 80, 78, 82, 75, 70, 73, 68, 65, 62],
  },
]
