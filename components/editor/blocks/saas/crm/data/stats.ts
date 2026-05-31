import type { CRMStat } from "../types"

export const crmStats: CRMStat[] = [
  { label: "Deals activos",    value: "142",   change: "+12%", positive: true,  colorKey: "blue"    },
  { label: "Pipeline total",   value: "$2.9M", change: "+18%", positive: true,  colorKey: "violet"  },
  { label: "Cerrados este mes",value: "$840K", change: "+24%", positive: true,  colorKey: "emerald" },
  { label: "Tasa de cierre",   value: "28%",   change: "-2%",  positive: false, colorKey: "amber"   },
]
