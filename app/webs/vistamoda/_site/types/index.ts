export interface Product {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number
  category: string
  image: string
  badge?: 'nuevo' | 'oferta' | 'popular'
  rating: number
  reviews: number
  description: string
  sizes?: string[]
  colors?: string[]
  inStock: boolean
}

export interface Category {
  id: string
  slug: string
  name: string
  image: string
  count: number
}

export interface CartItem {
  product: Product
  quantity: number
  size?: string
  color?: string
}
