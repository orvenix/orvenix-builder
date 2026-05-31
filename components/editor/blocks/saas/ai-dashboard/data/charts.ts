import type { TrafficSource, RevenuePoint, ChartStat } from "../types"

export const revenuePoints: RevenuePoint[] = [
  { month: "Ene", value: 42 },
  { month: "Feb", value: 58 },
  { month: "Mar", value: 51 },
  { month: "Abr", value: 74 },
  { month: "May", value: 68 },
  { month: "Jun", value: 82 },
  { month: "Jul", value: 77 },
  { month: "Ago", value: 91 },
  { month: "Sep", value: 88 },
  { month: "Oct", value: 96 },
  { month: "Nov", value: 89 },
  { month: "Dic", value: 108 },
]

export const trafficSources: TrafficSource[] = [
  { label: "Organic Search", value: 42, colorKey: "violet" },
  { label: "Direct",         value: 28, colorKey: "blue"   },
  { label: "Paid Ads",       value: 18, colorKey: "amber"  },
  { label: "Referral",       value: 12, colorKey: "emerald"},
]

export const revenueStats: ChartStat[] = [
  { label: "Revenue total",    value: "$1.08M", delta: "+18.3%" },
  { label: "Promedio mensual", value: "$90K",   delta: "+12.1%" },
  { label: "Proyección Q1",    value: "$340K",  delta: "+24.7%" },
]
