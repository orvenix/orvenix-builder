import type { PricingPlan } from "../types"

export const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    desc: "Perfecto para equipos pequeños que empiezan a escalar.",
    monthlyPrice: 29,
    yearlyPrice: 23,
    colorKey: "slate",
    popular: false,
    features: ["Hasta 5 usuarios", "10GB de almacenamiento", "Analytics básico", "Integraciones principales (5)", "Soporte por email", "API REST"],
    missing: ["IA avanzada", "SSO / SAML", "SLA garantizado"],
  },
  {
    id: "pro",
    name: "Pro",
    desc: "Para equipos en crecimiento que necesitan más potencia.",
    monthlyPrice: 89,
    yearlyPrice: 71,
    colorKey: "indigo",
    popular: true,
    features: ["Usuarios ilimitados", "100GB de almacenamiento", "Analytics avanzado + IA", "Integraciones ilimitadas", "Soporte prioritario 24/7", "API REST + GraphQL", "SSO básico", "Roles y permisos avanzados"],
    missing: ["SLA 99.99%", "Infraestructura dedicada"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    desc: "Infraestructura dedicada y soporte enterprise completo.",
    monthlyPrice: 299,
    yearlyPrice: 239,
    colorKey: "emerald",
    popular: false,
    features: ["Todo lo de Pro", "Almacenamiento ilimitado", "Infraestructura dedicada", "SLA 99.99% garantizado", "SSO / SAML / SCIM", "Soporte dedicado + CSM", "Auditoría completa", "Compliance SOC2 + GDPR", "On-premise disponible"],
    missing: [],
  },
]
