export interface PortfolioSlice {
  label: string
  value: number
  pct: number
  color: string
  change: string
  positive: boolean
}

export const portfolioSlices: PortfolioSlice[] = [
  { label: "Acciones US",     value: 1_280_000, pct: 45, color: "#10b981", change: "+11.2%", positive: true },
  { label: "Renta Fija",      value: 568_000,   pct: 20, color: "#34d399", change: "+2.1%",  positive: true },
  { label: "Crypto",          value: 398_600,   pct: 14, color: "#f59e0b", change: "-3.8%",  positive: false },
  { label: "Inmuebles",       value: 341_000,   pct: 12, color: "#6366f1", change: "+5.4%",  positive: true },
  { label: "Materias Primas", value: 170_400,   pct: 6,  color: "#ec4899", change: "+1.7%",  positive: true },
  { label: "Cash & Equiv.",   value: 85_000,    pct: 3,  color: "#64748b", change: "0.0%",   positive: true },
]

export const monthlyPnL = [
  { month: "Nov", value: 18_400 },
  { month: "Dic", value: 24_100 },
  { month: "Ene", value: 31_800 },
  { month: "Feb", value: 27_500 },
  { month: "Mar", value: 38_200 },
  { month: "Abr", value: 42_300 },
]
