import type { ColorKey } from "@/app/webs/_shared/lib/colors"

export interface Contact {
  id: number
  name: string
  company: string
  role: string
  email: string
  status: ContactStatus
  score: number
  deal: string
  lastContact: string
  initials: string
  colorKey: ColorKey
  starred: boolean
}

export type ContactStatus = "Activo" | "En propuesta" | "Calificado" | "Negociación" | "Lead"

export interface Deal {
  name: string
  value: string
  daysInStage: number
  initials: string
  colorKey: ColorKey
}

export interface PipelineStage {
  id: string
  label: string
  colorKey: ColorKey
  count: number
  totalValue: string
  deals: Deal[]
}

export interface CRMStat {
  label: string
  value: string
  change: string
  positive: boolean
  colorKey: ColorKey
}
