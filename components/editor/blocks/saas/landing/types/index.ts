import type { ColorKey } from "@/app/webs/_shared/lib/colors"
import type { LucideIcon } from "lucide-react"

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
  colorKey: ColorKey
  tag: string
}

export interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  initials: string
  colorKey: ColorKey
  rating: number
  text: string
  metric: string
}

export interface PricingPlan {
  id: string
  name: string
  desc: string
  monthlyPrice: number
  yearlyPrice: number
  colorKey: ColorKey
  popular: boolean
  features: string[]
  missing: string[]
}

export interface PricingStat {
  value: string
  label: string
}
