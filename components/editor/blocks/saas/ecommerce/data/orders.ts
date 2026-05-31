import type { Order } from "../types"

export const orders: Order[] = [
  { id: "#ORD-8821", customer: "Elena M.",  email: "elena@acme.com",   product: "Wireless Headphones X1", amount: "$299", status: "completed",  date: "Hoy, 14:32",   initials: "EM", colorKey: "violet"  },
  { id: "#ORD-8820", customer: "James W.",  email: "james@stripe.com", product: "Ergonomic Chair",        amount: "$449", status: "processing", date: "Hoy, 12:18",   initials: "JW", colorKey: "blue"    },
  { id: "#ORD-8819", customer: "Yuki T.",   email: "yuki@notion.so",   product: "Mechanical Keyboard",    amount: "$159", status: "shipped",    date: "Hoy, 10:45",   initials: "YT", colorKey: "emerald" },
  { id: "#ORD-8818", customer: "Carlos R.", email: "carlos@vercel.com",product: "4K Portable Monitor",    amount: "$349", status: "refunded",   date: "Ayer, 18:22",  initials: "CR", colorKey: "amber"   },
  { id: "#ORD-8817", customer: "Sarah K.",  email: "sarah@linear.app", product: "Premium Yoga Mat",       amount: "$89",  status: "completed",  date: "Ayer, 15:08",  initials: "SK", colorKey: "cyan"    },
]

export const orderStatusStyles: Record<string, string> = {
  completed:  "bg-emerald-50 text-emerald-600 border-emerald-200",
  processing: "bg-blue-50 text-blue-600 border-blue-200",
  shipped:    "bg-violet-50 text-violet-600 border-violet-200",
  refunded:   "bg-red-50 text-red-500 border-red-200",
}

export const orderStatusLabels: Record<string, string> = {
  completed:  "Completado",
  processing: "Procesando",
  shipped:    "Enviado",
  refunded:   "Reembolsado",
}
