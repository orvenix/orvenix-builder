import type { ColorKey } from "@/app/webs/_shared/lib/colors"

export type ProductStatus = "active" | "low_stock" | "out_of_stock"
export type OrderStatus = "completed" | "processing" | "shipped" | "refunded"

export interface Product {
  id: number
  name: string
  category: string
  categoryColorKey: ColorKey
  price: number
  stock: number
  sold: number
  rating: number
  reviews: number
  status: ProductStatus
  trend: string
}

export interface Order {
  id: string
  customer: string
  email: string
  product: string
  amount: string
  status: OrderStatus
  date: string
  initials: string
  colorKey: ColorKey
}

export interface EcommerceStat {
  label: string
  value: string
  change: string
  positive: boolean
  colorKey: ColorKey
}
