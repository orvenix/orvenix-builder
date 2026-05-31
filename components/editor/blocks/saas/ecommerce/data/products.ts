import type { Product } from "../types"

export const products: Product[] = [
  { id: 1, name: "Pro Wireless Headphones X1",  category: "Electronics",  categoryColorKey: "blue",    price: 299, stock: 142, sold: 1284, rating: 4.8, reviews: 312, status: "active",        trend: "+12%" },
  { id: 2, name: "Ergonomic Mesh Office Chair",  category: "Furniture",    categoryColorKey: "violet",  price: 449, stock: 38,  sold: 847,  rating: 4.6, reviews: 198, status: "active",        trend: "+8%"  },
  { id: 3, name: "Mechanical Keyboard TKL RGB",  category: "Electronics",  categoryColorKey: "blue",    price: 159, stock: 214, sold: 2104, rating: 4.9, reviews: 541, status: "active",        trend: "+24%" },
  { id: 4, name: "Minimalist Leather Wallet",    category: "Accessories",  categoryColorKey: "amber",   price: 49,  stock: 8,   sold: 3218, rating: 4.7, reviews: 892, status: "low_stock",     trend: "+5%"  },
  { id: 5, name: "4K Portable Monitor 15.6\"",  category: "Electronics",  categoryColorKey: "blue",    price: 349, stock: 0,   sold: 425,  rating: 4.5, reviews: 124, status: "out_of_stock",  trend: "-3%"  },
  { id: 6, name: "Premium Yoga Mat Pro",         category: "Sports",       categoryColorKey: "emerald", price: 89,  stock: 521, sold: 1842, rating: 4.8, reviews: 456, status: "active",        trend: "+18%" },
]

export const productStatusStyles: Record<string, string> = {
  active:        "bg-emerald-50 text-emerald-600 border-emerald-200",
  low_stock:     "bg-amber-50 text-amber-600 border-amber-200",
  out_of_stock:  "bg-red-50 text-red-500 border-red-200",
}

export const productStatusLabels: Record<string, string> = {
  active:       "Activo",
  low_stock:    "Stock bajo",
  out_of_stock: "Sin stock",
}

export const categories = ["all", "Electronics", "Furniture", "Accessories", "Sports"] as const
export type CategoryFilter = (typeof categories)[number]
