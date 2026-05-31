import type { Testimonial } from "../types"

export const testimonials: Testimonial[] = [
  { id: 1, name: "Elena Martínez", role: "VP of Engineering", company: "Acme Corp",    initials: "EM", colorKey: "violet",  rating: 5, metric: "3h/día ahorradas por dev",     text: "Pasamos de 12 herramientas separadas a una sola plataforma. El ahorro de tiempo es brutal — fácil 3 horas al día por persona. La IA de automatización es increíble." },
  { id: 2, name: "James Wright",   role: "CTO",               company: "Stripe Inc.",  initials: "JW", colorKey: "blue",    rating: 5, metric: "100x escalado sin fricción",    text: "La escalabilidad es lo que nos convenció. Pasamos de 50 a 5,000 usuarios en 6 meses sin tocar la infraestructura. Literalmente no tuvimos que preocuparnos por nada." },
  { id: 3, name: "Yuki Tanaka",    role: "Head of Product",   company: "Notion Labs",  initials: "YT", colorKey: "emerald", rating: 5, metric: "Onboarding en 5 días",          text: "El mejor onboarding que hemos visto en un producto SaaS. Nuestro equipo de 80 personas estuvo completamente migrado y productivo en menos de una semana." },
  { id: 4, name: "Carlos Ruiz",    role: "CEO",               company: "Vercel",       initials: "CR", colorKey: "amber",   rating: 5, metric: "+340% ROI en 6 meses",          text: "El soporte es excepcional. Nuestro CSM conoce nuestro negocio mejor que algunos de nuestros propios empleados. ROI positivo desde el primer mes." },
  { id: 5, name: "Sarah Kim",      role: "Head of Sales",     company: "Linear",       initials: "SK", colorKey: "cyan",    rating: 5, metric: "+28% MRR en 90 días",           text: "Los analytics de ventas son increíbles. Ahora detectamos oportunidades de upsell automáticamente. Nuestro MRR creció un 28% solo con las recomendaciones de la IA." },
  { id: 6, name: "Alex Chen",      role: "DevOps Lead",       company: "Figma",        initials: "AC", colorKey: "indigo",  rating: 5, metric: "0 incidentes de seguridad",     text: "99.99% uptime en 18 meses. Cero incidentes de seguridad. Compliance SOC2 sin esfuerzo. Para un equipo que escala rápido, esto vale más que cualquier feature." },
]

export const brands = ["Stripe", "Vercel", "Linear", "Notion", "Figma", "Shopify"]
