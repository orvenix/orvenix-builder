import type { PipelineStage } from "../types"

export const pipelineStages: PipelineStage[] = [
  {
    id: "lead", label: "Leads", colorKey: "slate", count: 28, totalValue: "$142K",
    deals: [
      { name: "Acme Industries",  value: "$24K", daysInStage: 2,  initials: "AI", colorKey: "violet"  },
      { name: "TechFlow GmbH",    value: "$18K", daysInStage: 5,  initials: "TF", colorKey: "blue"    },
      { name: "Nova Partners",    value: "$31K", daysInStage: 1,  initials: "NP", colorKey: "indigo"  },
    ],
  },
  {
    id: "qualified", label: "Calificados", colorKey: "blue", count: 15, totalValue: "$380K",
    deals: [
      { name: "Stripe Inc.",      value: "$80K", daysInStage: 8,  initials: "SI", colorKey: "blue"    },
      { name: "Notion Labs",      value: "$55K", daysInStage: 12, initials: "NL", colorKey: "indigo"  },
      { name: "Figma Pro",        value: "$90K", daysInStage: 4,  initials: "FP", colorKey: "violet"  },
    ],
  },
  {
    id: "proposal", label: "Propuesta", colorKey: "violet", count: 9, totalValue: "$510K",
    deals: [
      { name: "Cloudflare Ent.", value: "$200K", daysInStage: 18, initials: "CE", colorKey: "orange"  },
      { name: "Linear Corp",     value: "$140K", daysInStage: 22, initials: "LC", colorKey: "cyan"    },
    ],
  },
  {
    id: "negotiation", label: "Negociación", colorKey: "amber", count: 5, totalValue: "$680K",
    deals: [
      { name: "Vercel Enterprise",value: "$380K", daysInStage: 31, initials: "VE", colorKey: "slate"  },
      { name: "PlanetScale",      value: "$120K", daysInStage: 14, initials: "PS", colorKey: "teal"   },
    ],
  },
  {
    id: "closed", label: "Cerrados", colorKey: "emerald", count: 12, totalValue: "$1.2M",
    deals: [
      { name: "Shopify Plus",     value: "$420K", daysInStage: 0,  initials: "SP", colorKey: "emerald" },
      { name: "Atlassian",        value: "$280K", daysInStage: 0,  initials: "AT", colorKey: "blue"    },
    ],
  },
]
