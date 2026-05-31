import { DollarSign, ShoppingCart, Users, Package } from "lucide-react"
import type { EcommerceStat } from "../types"

export const ecStats: EcommerceStat[] = [
  { label: "Ingresos hoy",    value: "$14,820", change: "+18.4%", positive: true,  colorKey: "amber"   },
  { label: "Pedidos activos", value: "342",     change: "+12%",   positive: true,  colorKey: "blue"    },
  { label: "Clientes nuevos", value: "1,284",   change: "+8.2%",  positive: true,  colorKey: "emerald" },
  { label: "Ticket promedio", value: "$43.30",  change: "-2.1%",  positive: false, colorKey: "indigo"  },
]

export const ecStatIcons = [DollarSign, ShoppingCart, Users, Package]
