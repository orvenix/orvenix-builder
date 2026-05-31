import type { Contact } from "../types"

export const contacts: Contact[] = [
  { id: 1, name: "Elena Martínez", company: "Acme Corp",    role: "VP of Engineering",  email: "elena@acme.com",   status: "Activo",       score: 94, deal: "$80K",  lastContact: "Hoy",      initials: "EM", colorKey: "violet", starred: true  },
  { id: 2, name: "James Wright",   company: "Stripe Inc.",  role: "CTO",                email: "james@stripe.com", status: "En propuesta", score: 88, deal: "$200K", lastContact: "Ayer",     initials: "JW", colorKey: "blue",   starred: true  },
  { id: 3, name: "Yuki Tanaka",    company: "Notion Labs",  role: "Head of Product",    email: "yuki@notion.so",   status: "Calificado",   score: 76, deal: "$55K",  lastContact: "Hace 2d",  initials: "YT", colorKey: "emerald",starred: false },
  { id: 4, name: "Carlos Ruiz",    company: "Vercel",       role: "CEO",                email: "carlos@vercel.com",status: "Negociación",  score: 91, deal: "$380K", lastContact: "Hace 3d",  initials: "CR", colorKey: "amber",  starred: true  },
  { id: 5, name: "Sarah Kim",      company: "Linear Corp",  role: "Sales Director",     email: "sarah@linear.app", status: "Calificado",   score: 72, deal: "$140K", lastContact: "Hace 5d",  initials: "SK", colorKey: "cyan",   starred: false },
  { id: 6, name: "Alex Chen",      company: "Figma",        role: "Enterprise Lead",    email: "alex@figma.com",   status: "Lead",         score: 58, deal: "$90K",  lastContact: "Hace 1s",  initials: "AC", colorKey: "indigo", starred: false },
]

export const statusStyles: Record<string, string> = {
  Activo:         "bg-emerald-50 text-emerald-600 border-emerald-200",
  "En propuesta": "bg-violet-50 text-violet-600 border-violet-200",
  Calificado:     "bg-blue-50 text-blue-600 border-blue-200",
  Negociación:    "bg-amber-50 text-amber-600 border-amber-200",
  Lead:           "bg-slate-100 text-slate-500 border-slate-200",
}
