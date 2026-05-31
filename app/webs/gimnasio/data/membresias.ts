export interface Membresia {
  name: string
  price: number
  period: string
  desc: string
  features: string[]
  notIncluded: string[]
  badge?: string
  highlight: boolean
  cta: string
  ctaStyle: string
  color: string
}

export const membresias: Membresia[] = [
  {
    name: "Básica",
    price: 699,
    period: "MXN / mes",
    desc: "Acceso ilimitado al área de pesas y cardio. Ideal para quienes prefieren entrenar a su ritmo.",
    features: [
      "Acceso ilimitado área libre (pesas, cardio)",
      "Vestidores y lockers incluidos",
      "App de seguimiento de entrenamientos",
      "1 valoración física inicial",
    ],
    notIncluded: [
      "Clases grupales",
      "Entrenamiento personalizado",
      "Acceso zonas premium (Pilates, Funcional)",
    ],
    highlight: false,
    cta: "Contratar básica",
    ctaStyle: "bg-white/5 border border-white/15 text-white/70 hover:bg-white/10",
    color: "text-white",
  },
  {
    name: "Premium",
    price: 1299,
    period: "MXN / mes",
    desc: "La elección más popular. Acceso total al gimnasio + todas las clases grupales sin restricción.",
    features: [
      "Todo lo de Básica",
      "Clases grupales ilimitadas (CrossFit, Yoga, HIIT, Box...)",
      "2 sesiones de PT al mes incluidas",
      "Acceso zonas Pilates y Funcional",
      "App premium con planes de nutrición",
      "1 sesión de nutrición al contratar",
    ],
    notIncluded: [],
    badge: "Más popular",
    highlight: true,
    cta: "Contratar Premium",
    ctaStyle: "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-900/30",
    color: "text-orange-400",
  },
  {
    name: "Elite",
    price: 2199,
    period: "MXN / mes",
    desc: "Experiencia sin compromisos. Entrenamiento personalizado, nutrición y acceso VIP a todas las instalaciones.",
    features: [
      "Todo lo de Premium",
      "8 sesiones de entrenamiento personalizado al mes",
      "Plan de nutrición mensual con seguimiento",
      "Acceso 24/7 (incluye horario nocturno y madrugada)",
      "Invitados: 2 pases por mes",
      "Acceso prioritario a talleres y eventos",
      "Análisis de composición corporal mensual (InBody)",
    ],
    notIncluded: [],
    highlight: false,
    cta: "Contratar Elite",
    ctaStyle: "bg-white/5 border border-white/20 text-white/80 hover:bg-white/10",
    color: "text-amber-400",
  },
]

export const entrenadores = [
  { name: "Marco Herrera", role: "Head Coach · CrossFit", cert: "CF-L3 · Precision Nutrition L1", exp: "9 años", avatar: "MH", color: "from-red-700 to-red-900" },
  { name: "Sofía Delgado", role: "Coach · Yoga & Pilates", cert: "RYT-500 · Stott Pilates", exp: "11 años", avatar: "SD", color: "from-emerald-700 to-emerald-900" },
  { name: "Carlos Bravo", role: "Coach · Box & HIIT", cert: "ISSA · FMB Nivel 2", exp: "7 años", avatar: "CB", color: "from-yellow-700 to-yellow-900" },
  { name: "Luisa Montoya", role: "Coach · Fuerza & Nutrición", cert: "NSCA-CSCS · Nutrióloga", exp: "8 años", avatar: "LM", color: "from-violet-700 to-violet-900" },
]

export const testimoniosGimnasio = [
  { name: "Daniela Flores", handle: "Miembro Premium", avatar: "DF", text: "Llevo 2 años en ForgeGym y bajé 18 kg. Los coaches te conocen por nombre y siempre hay variedad en las clases. Lo mejor es que no hay actitud de élite: todos somos bienvenidos.", rating: 5, date: "Abr 2026" },
  { name: "Ing. Rodrigo Castro", handle: "Miembro Elite", avatar: "RC", text: "El entrenamiento personalizado con Marco cambió completamente mi composición corporal. Pasé de 22% a 12% de grasa en 5 meses. Plan de nutrición + fuerza = resultados reales.", rating: 5, date: "Mar 2026" },
  { name: "Lic. Andrea Salinas", handle: "Miembro Premium", avatar: "AS", text: "Empecé con yoga para manejar el estrés laboral y terminé enganchada también al CrossFit. El equipo de coaches es increíble y el ambiente es súper positivo y motivador.", rating: 5, date: "Feb 2026" },
  { name: "Omar Gutiérrez", handle: "Miembro Básico", avatar: "OG", text: "El gimnasio está equipado con maquinaria de primera, siempre limpio y el horario de apertura temprana me permite entrenar antes del trabajo. Excelente relación precio-calidad.", rating: 5, date: "Ene 2026" },
]
