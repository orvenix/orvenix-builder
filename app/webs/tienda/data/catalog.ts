import {
  BarChart3,
  BadgeCheck,
  Boxes,
  CreditCard,
  Headphones,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Truck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type Category = "Todo" | "Tecnologia" | "Oficina" | "Lifestyle" | "Accesorios"

type Product = {
  id: string
  name: string
  category: Category
  price: number
  compareAt: number
  rating: number
  reviews: number
  tag: string
  accent: string
  bg: string
  Icon: LucideIcon
}

type Benefit = {
  icon: LucideIcon
  title: string
  text: string
}

type Collection = {
  name: string
  items: string
  tone: string
  icon: LucideIcon
}

export const categories: Category[] = ["Todo", "Tecnologia", "Oficina", "Lifestyle", "Accesorios"]

export const products: Product[] = [
  {
    id: "soundcore-pro",
    name: "Auriculares SoundCore Pro",
    category: "Tecnologia",
    price: 3290,
    compareAt: 4190,
    rating: 4.9,
    reviews: 318,
    tag: "Más vendido",
    accent: "#2563eb",
    bg: "bg-blue-50",
    Icon: Headphones,
  },
  {
    id: "deskflow-chair",
    name: "Silla DeskFlow Mesh",
    category: "Oficina",
    price: 6890,
    compareAt: 7590,
    rating: 4.8,
    reviews: 214,
    tag: "Ergonomía",
    accent: "#7c3aed",
    bg: "bg-violet-50",
    Icon: Boxes,
  },
  {
    id: "daily-carry",
    name: "Mochila Daily Carry",
    category: "Lifestyle",
    price: 1890,
    compareAt: 2390,
    rating: 4.7,
    reviews: 176,
    tag: "Nuevo",
    accent: "#0891b2",
    bg: "bg-cyan-50",
    Icon: PackageCheck,
  },
  {
    id: "wallet-minimal",
    name: "Cartera Slim RFID",
    category: "Accesorios",
    price: 790,
    compareAt: 990,
    rating: 4.8,
    reviews: 421,
    tag: "Compacto",
    accent: "#dc2626",
    bg: "bg-rose-50",
    Icon: LockKeyhole,
  },
  {
    id: "dock-studio",
    name: "Dock Studio USB-C",
    category: "Tecnologia",
    price: 2490,
    compareAt: 2990,
    rating: 4.6,
    reviews: 143,
    tag: "Trabajo",
    accent: "#059669",
    bg: "bg-emerald-50",
    Icon: SlidersHorizontal,
  },
  {
    id: "desk-lamp",
    name: "Lámpara Focus One",
    category: "Oficina",
    price: 1190,
    compareAt: 1490,
    rating: 4.7,
    reviews: 89,
    tag: "Stock limitado",
    accent: "#d97706",
    bg: "bg-amber-50",
    Icon: Sparkles,
  },
]

export const metrics = [
  { value: "2.8x", label: "mejor conversión en móvil" },
  { value: "42%", label: "menos abandono en checkout" },
  { value: "24h", label: "base lista para operar" },
]

export const benefits: Benefit[] = [
  {
    icon: Truck,
    title: "Envíos claros",
    text: "Bloques para prometer cobertura, tiempos, rastreo y políticas sin fricción.",
  },
  {
    icon: CreditCard,
    title: "Pagos listos",
    text: "Estructura preparada para Stripe, Mercado Pago, PayPal o pago manual.",
  },
  {
    icon: ShieldCheck,
    title: "Confianza visible",
    text: "Sellos, garantías, reseñas y preguntas frecuentes integradas al flujo.",
  },
  {
    icon: BarChart3,
    title: "Operación medible",
    text: "Secciones pensadas para conectar analítica, campañas y seguimiento comercial.",
  },
]

export const collections: Collection[] = [
  { name: "Home office", items: "18 productos", tone: "bg-slate-950 text-white", icon: Store },
  { name: "Tecnología diaria", items: "24 productos", tone: "bg-blue-600 text-white", icon: Headphones },
  { name: "Accesorios premium", items: "31 productos", tone: "bg-emerald-600 text-white", icon: BadgeCheck },
]

export const steps = [
  { title: "Explora", text: "Categorías, destacados, búsqueda y filtros preparados para catálogo real." },
  { title: "Agrega", text: "Carrito visual con cantidades, descuentos y productos recomendados." },
  { title: "Paga", text: "Resumen, datos de envío, método de pago y confirmación de orden." },
]

export const testimonials = [
  {
    name: "Mariana R.",
    role: "Retail wellness",
    text: "La tienda quedó lista para vender sin parecer una plantilla genérica. Pudimos cambiar productos y textos en una tarde.",
  },
  {
    name: "Carlos V.",
    role: "Distribuidor B2C",
    text: "El flujo de compra se siente claro en móvil. Las secciones de confianza nos ayudaron a bajar dudas antes del pago.",
  },
  {
    name: "Ana L.",
    role: "Marca boutique",
    text: "La estructura modular hizo fácil lanzar colección, ofertas y preguntas frecuentes sin rehacer todo.",
  },
]

export const faqs = [
  [
    "¿Se puede conectar a pagos reales?",
    "Sí. La estructura está preparada para conectar Stripe, Mercado Pago, PayPal o un flujo manual con confirmación por WhatsApp.",
  ],
  [
    "¿Puedo editar productos y categorías?",
    "Sí. El catálogo está organizado por datos modulares para cambiar nombre, precio, categoría, etiquetas y destacados.",
  ],
  [
    "¿Funciona para tiendas pequeñas?",
    "Sí. Sirve para una boutique de pocos productos y también puede escalar hacia inventario, pedidos y analítica avanzada.",
  ],
  [
    "¿Qué reemplaza de las plantillas vacías?",
    "Reemplaza la demo base por una página comercial completa: hero, catálogo, beneficios, checkout, testimonios, FAQ y CTA.",
  ],
]
