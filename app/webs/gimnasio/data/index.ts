import { Dumbbell, Zap, Heart, Timer, Target, Wind } from "lucide-react"

export const brand = {
  name: "Iron District",
  sub: "Fitness & Performance",
  tagline: "Forja tu mejor versión",
  email: "hola@irondistrict.mx",
  phone: "+52 55 7788 9900",
  whatsapp: "+52 55 7788 9900",
  address: "Av. Ejército Nacional 843, Polanco, CDMX",
  founded: "2017",
  instagram: "@irondistrict.mx",
}

export const stats = [
  { value: "+2,400", label: "Miembros activos" },
  { value: "8 años", label: "En operación" },
  { value: "42", label: "Clases semanales" },
  { value: "4.8★", label: "Google reviews" },
]

export const clases = [
  { icon: Dumbbell, name: "Strength & Conditioning", desc: "Entrenamiento funcional con barra libre, kettlebells y movimientos olímpicos. Ideal para ganar fuerza y masa muscular con técnica supervisada.", nivel: "Todos los niveles", duracion: "60 min", color: "text-orange-400", bg: "bg-orange-950/15", border: "border-orange-800/30" },
  { icon: Zap, name: "HIIT & Metcon", desc: "Alta intensidad por intervalos: 8 rondas de trabajo explosivo seguido de recuperación activa. Quema calorías hasta 36 horas después.", nivel: "Intermedio–Avanzado", duracion: "45 min", color: "text-yellow-400", bg: "bg-yellow-950/15", border: "border-yellow-800/30" },
  { icon: Heart, name: "Yoga Flow", desc: "Práctica dinámica de yoga vinyasa adaptada para atletas. Mejora movilidad, reduce tensión muscular y equilibra el sistema nervioso.", nivel: "Principiante–Intermedio", duracion: "60 min", color: "text-rose-400", bg: "bg-rose-950/15", border: "border-rose-800/30" },
  { icon: Wind, name: "Spinning Elite", desc: "Ciclismo de alto rendimiento con instructor certificado, música curada y métricas de rendimiento en pantalla para seguir tu progreso.", nivel: "Todos los niveles", duracion: "50 min", color: "text-cyan-400", bg: "bg-cyan-950/15", border: "border-cyan-800/30" },
  { icon: Target, name: "CrossFit Open", desc: "Entrenamiento funcional de alta intensidad basado en movimientos variados: cardio, halterofilia y gimnasia. Comunidad que empuja tus límites.", nivel: "Intermedio–Avanzado", duracion: "60 min", color: "text-emerald-400", bg: "bg-emerald-950/15", border: "border-emerald-800/30" },
  { icon: Timer, name: "Pilates Reformer", desc: "Trabajo de core profundo en máquina reformer. Mejora postura, alineación y fuerza estabilizadora. Grupos de máximo 8 personas.", nivel: "Principiante–Intermedio", duracion: "55 min", color: "text-violet-400", bg: "bg-violet-950/15", border: "border-violet-800/30" },
]

export const membresias = [
  {
    name: "Básica",
    price: "$899",
    period: "/mes",
    desc: "Para quien va a su ritmo",
    features: ["Acceso ilimitado 6am–10pm", "8 clases grupales/mes", "Casillero incluido", "App de seguimiento", "1 sesión de evaluación inicial"],
    cta: "Empezar gratis 7 días",
    featured: false,
    color: "text-white/60",
  },
  {
    name: "Premium",
    price: "$1,299",
    period: "/mes",
    desc: "Para quien va en serio",
    features: ["Acceso 24/7", "Clases grupales ilimitadas", "2 sesiones con PT/mes", "Nutrición básica incluida", "Zona de recuperación (sauna, ice bath)", "App premium con tracking"],
    cta: "El más popular →",
    featured: true,
    color: "text-orange-400",
  },
  {
    name: "Elite",
    price: "$2,499",
    period: "/mes",
    desc: "Para atletas de alto rendimiento",
    features: ["Todo lo del Premium", "8 sesiones con PT/mes", "Plan nutricional personalizado", "Análisis de composición corporal mensual", "Acceso VIP a zona competitiva", "Descuentos en suplementos"],
    cta: "Consultar disponibilidad",
    featured: false,
    color: "text-white/60",
  },
]

export const entrenadores = [
  { name: "Coach Daniel Morales", specialty: "Strength & CrossFit", cert: "NSCA-CSCS · CrossFit L2 · 12 años", avatar: "DM", color: "from-orange-700 to-orange-900", bio: "Campeón nacional de powerlifting (2019). Ha entrenado a 3 atletas de CrossFit Games. Su filosofía: la técnica correcta es más importante que el peso." },
  { name: "Coach Valeria Sánchez", specialty: "HIIT · Spinning", cert: "ACE-CPT · RPM Certified · 9 años", avatar: "VS", color: "from-cyan-700 to-cyan-900", bio: "Triatleta Ironman. Especialista en periodización del entrenamiento cardiovascular. Sus clases de spinning son las más solicitadas del gym." },
  { name: "Coach Miguel Torres", specialty: "Yoga · Movilidad", cert: "RYT-500 · FMS Level 2 · 14 años", avatar: "MT", color: "from-rose-700 to-rose-900", bio: "Practicante de yoga desde los 18 años. Integra metodología de movimiento funcional con tradición yoguica. Especialista en recuperación deportiva." },
  { name: "Coach Fernanda López", specialty: "Pilates · Core", cert: "STOTT Pilates · PMA-CPT · 10 años", avatar: "FL", color: "from-violet-700 to-violet-900", bio: "Ex-bailarina profesional. Diseña programas de Pilates Reformer para atletas en recuperación y personas con lesiones de columna. 0 lesiones en su historial." },
]

export const testimonials = [
  { name: "Eduardo Vargas", handle: "Miembro desde 2021", avatar: "EV", text: "Llevo 3 años en Iron District. Perdí 18 kilos en 8 meses y ahora compito en carreras de 10km. El Coach Daniel cambió por completo mi relación con el ejercicio.", plan: "Premium", rating: 5, date: "May 2025" },
  { name: "Adriana Moreno", handle: "Miembro desde 2023", avatar: "AM", text: "Las clases de Pilates de Fernanda han eliminado el dolor de espalda que tenía hace 5 años. Además aprendí a moverme correctamente. Nada que ver con lo que hacía antes.", plan: "Básica", rating: 5, date: "Abr 2025" },
  { name: "Empresas Grupo Alfa", handle: "Plan corporativo", avatar: "GA", text: "Tenemos 45 empleados con membresía corporativa en Iron District. El impacto en productividad y bienestar del equipo ha sido medible desde el primer trimestre.", plan: "Elite Corporativo", rating: 5, date: "Mar 2025" },
  { name: "Pamela Ríos", handle: "Miembro desde 2022", avatar: "PR", text: "Vine con 0 experiencia en el gym. El programa de onboarding fue fundamental: 2 semanas aprendiendo técnica antes de subirme a las clases grupales. Eso marcó la diferencia.", plan: "Premium", rating: 5, date: "Feb 2025" },
]

export const faqs = [
  { q: "¿Puedo probar el gym antes de suscribirme?", a: "Sí. Ofrecemos 7 días gratuitos sin tarjeta de crédito para todos los planes. Incluye acceso completo al gym, clases grupales según membresía e instalaciones. Solo necesitas una identificación oficial." },
  { q: "¿Cómo funcionan las clases grupales?", a: "Reservas tu lugar a través de la app hasta con 48 horas de anticipación. Lista de espera automática si la clase está llena. Cancelación sin cargo hasta 2 horas antes. Las clases tienen cupo máximo de 16 personas para atención personalizada." },
  { q: "¿Tienen estacionamiento?", a: "Sí. Estacionamiento validado por 2 horas con compra de membresía. También contamos con guarda bicicletas y regaderas para quien viene pedaleando o corriendo." },
  { q: "¿Aceptan seguros de gastos médicos para lesiones?", a: "No ofrecemos atención médica dentro del gym, pero trabajamos con fisioterapeutas recomendados. Contamos con kit de primeros auxilios y AED (desfibrilador) en todo momento. El personal está certificado en RCP." },
  { q: "¿Tienen planes corporativos?", a: "Sí. Planes corporativos desde 5 empleados con descuento progresivo. Incluye reporte mensual de asistencia para RRHH, sesiones de team building y evaluaciones de salud corporativa. Consulta disponibilidad." },
]

export const blogPosts = [
  { id: 1, slug: "periodizacion-entrenamiento", title: "Periodización del entrenamiento: cómo planear tu año de gym para no estancarte", excerpt: "El plateau es el mayor enemigo del atleta amateur. El Coach Daniel explica cómo estructurar mesociclos de fuerza, hipertrofia y recuperación para progresar constantemente.", category: "Entrenamiento", date: "8 May 2025", readTime: "10 min", author: "Coach Daniel Morales" },
  { id: 2, slug: "nutricion-fuerza-guia", title: "Proteína, carbohidratos y timing: la guía de nutrición sin mitos", excerpt: "¿Cuánta proteína necesitas realmente? ¿Importa cuándo comes? Desmontamos los mitos más comunes y te damos un marco práctico para optimizar tu alimentación.", category: "Nutrición", date: "1 May 2025", readTime: "8 min", author: "Coach Valeria Sánchez" },
  { id: 3, slug: "recuperacion-activa-importancia", title: "Por qué la recuperación es el entrenamiento más importante que ignoras", excerpt: "El descanso no es dejar de entrenar — es entrenar el sistema nervioso y hormonal. Sauna, ice bath, movilidad y sueño: el protocolo de recuperación de nuestros atletas élite.", category: "Recuperación", date: "24 Abr 2025", readTime: "7 min", author: "Coach Miguel Torres" },
  { id: 4, slug: "pilates-para-atletas", title: "Pilates para atletas: por qué los mejores corredores y nadadores lo usan", excerpt: "El Pilates no es solo para recuperación. Es una herramienta de rendimiento que mejora la transferencia de fuerza, reduce lesiones y optimiza la mecánica de movimiento.", category: "Pilates", date: "17 Abr 2025", readTime: "6 min", author: "Coach Fernanda López" },
]
