import type { LucideIcon } from "lucide-react"
import type { ColorKey } from "@/app/webs/_shared/lib/colors"

export interface Metric {
  label: string
  value: string
  rawValue: number
  change: string
  positive: boolean
  icon: LucideIcon
  colorKey: ColorKey
  sparkline: number[]
}

export interface Activity {
  id: number
  message: string
  detail: string
  time: string
  icon: LucideIcon
  colorKey: ColorKey
}

export interface AIInsight {
  id: number
  title: string
  description: string
  action: string
  icon: LucideIcon
  colorKey: ColorKey
  priority: "Crítica" | "Alta" | "Info"
}

export interface TrafficSource {
  label: string
  value: number
  colorKey: ColorKey
}

export interface RevenuePoint {
  month: string
  value: number
}

export interface ChartStat {
  label: string
  value: string
  delta: string
}
