import { Users, TrendingUp, BookOpen, Heart, BarChart2, Target } from "lucide-react"

export const brand = {
  name: "Talentum",
  sub: "HR Consulting",
  tagline: "El talento como ventaja competitiva",
  email: "hola@talentum.mx",
  phone: "+52 55 7700 1188",
  address: "Av. Santa Fe 428, Contadero, CDMX",
  linkedin: "talentum-hr-mx",
  founded: "2014",
}

export const stats = [
  { value: "320+", label: "Empresas atendidas" },
  { value: "12K+", label: "Posiciones reclutadas" },
  { value: "91%", label: "Retención a 12 meses" },
  { value: "11", label: "Años de experiencia" },
]

export const services = [
  {
    id: "reclutamiento",
    icon: Users,
    title: "Reclutamiento & Selección",
    desc: "Atracción de talento por competencias con metodología DISC y assessment center. Tiempo promedio de cobertura: 18 días hábiles para niveles medios y directivos.",
    tags: ["Perfiles directivos", "Mandos medios", "Operativos", "Tech talent"],
    color: "text-violet-400",
    border: "border-violet-900/30",
    bg: "bg-violet-950/10",
    kpi: "18 días promedio de cobertura",
    garantia: "Garantía 6 meses",
  },
  {
    id: "nomina",
    icon: BarChart2,
    title: "Administración de Nómina",
    desc: "Outsourcing de nómina con precisión del 99.8%. CFDI de nómina timbrados, SUA, INFONAVIT, reparto de PTU y reportes ejecutivos mensuales.",
    tags: ["CFDI 4.0", "SUA", "PTU", "INFONAVIT"],
    color: "text-teal-400",
    border: "border-teal-900/30",
    bg: "bg-teal-950/10",
    kpi: "99.8% precisión en pagos",
    garantia: "Respuesta en 24h",
  },
  {
    id: "capacitacion",
    icon: BookOpen,
    title: "Capacitación & Desarrollo",
    desc: "Programas de formación en competencias blandas, técnicas y liderazgo. Modalidad presencial, online y blended. Detección de necesidades incluida.",
    tags: ["Liderazgo", "Ventas", "Comunicación", "Gestión del tiempo"],
    color: "text-blue-400",
    border: "border-blue-900/30",
    bg: "bg-blue-950/10",
    kpi: "94% satisfacción participantes",
    garantia: "Constancias DC-3",
  },
  {
    id: "clima",
    icon: Heart,
    title: "Clima & Cultura Organizacional",
    desc: "Diagnóstico de clima laboral con encuesta validada, análisis de resultados, plan de acción y seguimiento trimestral de indicadores de engagement.",
    tags: ["Encuesta clima", "Engagement", "Cultura", "NPS empleado"],
    color: "text-rose-400",
    border: "border-rose-900/30",
    bg: "bg-rose-950/10",
    kpi: "+28% engagement promedio",
    garantia: "Diagnóstico en 10 días",
  },
  {
    id: "desempeno",
    icon: TrendingUp,
    title: "Gestión del Desempeño",
    desc: "Diseño e implementación de sistemas de evaluación 90°, 180° y 360°. OKRs, KPIs individuales, planes de desarrollo y compensación variable ligada a resultados.",
    tags: ["OKRs", "360°", "KPIs", "Compensación variable"],
    color: "text-amber-400",
    border: "border-amber-900/30",
    bg: "bg-amber-950/10",
    kpi: "+22% productividad medida",
    garantia: "Implementación en 30 días",
  },
  {
    id: "outplacement",
    icon: Target,
    title: "Outplacement & Transición",
    desc: "Apoyo profesional para colaboradores en proceso de salida: actualización de CV, coaching de entrevistas, red de contactos y acompañamiento hasta recolocación.",
    tags: ["CV profesional", "LinkedIn", "Coaching entrevistas", "Networking"],
    color: "text-emerald-400",
    border: "border-emerald-900/30",
    bg: "bg-emerald-950/10",
    kpi: "78% recolocados en 90 días",
    garantia: "Acompañamiento hasta 6 meses",
  },
]

export const metodologia = [
  { n: "01", title: "Diagnóstico organizacional", desc: "Assessment de madurez en gestión de talento: procesos, tecnología, cultura y estructura. Identificamos brechas y oportunidades de mejora." },
  { n: "02", title: "Diseño de solución", desc: "Construimos un plan de intervención a la medida de tu empresa: alcance, fases, métricas de éxito y cronograma con hitos claros." },
  { n: "03", title: "Implementación ágil", desc: "Ejecución por sprints de 30 días con entregas concretas en cada ciclo. Tu equipo participa activamente en el proceso de cambio." },
  { n: "04", title: "Transferencia de conocimiento", desc: "Capacitamos a tu área de RR.HH. para que pueda operar autónomamente los procesos implementados al finalizar el proyecto." },
  { n: "05", title: "Medición & ajuste", desc: "Tablero de métricas en tiempo real: rotación, tiempo de cobertura, satisfacción, engagement. Ajustamos estrategias basados en datos." },
  { n: "06", title: "Soporte post-proyecto", desc: "Acompañamiento trimestral durante el primer año para garantizar la sustentabilidad de los cambios implementados." },
]

export const team = [
  { name: "Mtra. Claudia Mendoza", role: "CEO & Fundadora", specialty: "Estrategia de talento & cultura", exp: "ITAM MBA · 18 años RRHH · Ex-Grupo Televisa", avatar: "CM", color: "from-violet-700 to-purple-900", cedula: "SHRM-SCP Certified" },
  { name: "Mtro. Rodrigo Salazar", role: "Director de Reclutamiento", specialty: "Headhunting ejecutivo & tech", exp: "UNAM · 14 años · Ex-Michael Page", avatar: "RS", color: "from-blue-700 to-indigo-900", cedula: "DISC Certified Trainer" },
  { name: "Lic. Andrea Vargas", role: "Gerente de Capacitación", specialty: "Desarrollo organizacional & coaching", exp: "UIA · PCC-ICF · 10 años", avatar: "AV", color: "from-teal-700 to-emerald-900", cedula: "ICF PCC Coach" },
  { name: "Lic. Pablo Estrada", role: "Especialista en Nómina", specialty: "Payroll & Seguridad Social", exp: "IPN · 12 años · IMSS e INFONAVIT especialista", avatar: "PE", color: "from-amber-700 to-orange-900", cedula: "Certificado STPS" },
]

export const casos = [
  { empresa: "Fintech MX (480 empleados)", reto: "Rotación del 34% en áreas de tecnología", solucion: "Rediseño EVP + esquemas de compensación flexible + programa desarrollo técnico", resultado: "Rotación bajó al 12% en 8 meses", gradient: "from-violet-900 to-indigo-950", sector: "Fintech" },
  { empresa: "Distribuidora Nacional (1,200 empleados)", reto: "Proceso de reclutamiento de 45 días promedio", solucion: "ATS + banco de talento + entrevistas por competencias estandarizadas", resultado: "Tiempo de cobertura: 16 días promedio", gradient: "from-teal-900 to-emerald-950", sector: "Logística" },
  { empresa: "Cadena de Restaurantes (320 empleados)", reto: "Clima laboral crítico: NPS empleado de -12", solucion: "Diagnóstico cualitativo + liderazgo situacional + plan de reconocimiento", resultado: "NPS empleado subió a +42 en 6 meses", gradient: "from-amber-900 to-orange-950", sector: "Gastronomía" },
  { empresa: "Manufactura Automotriz (680 empleados)", reto: "Evaluaciones de desempeño sin criterios objetivos", solucion: "Implementación OKRs + evaluación 360° + compensación variable", resultado: "+28% en productividad línea de producción", gradient: "from-blue-900 to-cyan-950", sector: "Manufactura" },
]

export const testimonials = [
  { name: "Ing. Roberto Méndez", handle: "CEO · Manufactura Méndez", avatar: "RM", rating: 5, text: "Claudia y su equipo transformaron nuestro departamento de RRHH en un área estratégica. La rotación bajó 60% en un año. El ROI fue evidente desde el tercer mes.", date: "Feb 2025", servicio: "Consultoría integral" },
  { name: "Mtra. Sandra Ortiz", handle: "Directora RH · Grupo Bancario", avatar: "SO", rating: 5, text: "Contratamos a Talentum para reclutar 40 posiciones tech en 60 días. Lo lograron en 52. La calidad de los perfiles superó nuestras expectativas.", date: "Ene 2025", servicio: "Reclutamiento masivo" },
  { name: "Lic. Andrés Garza", handle: "CFO · Empresa Logística", avatar: "AG", rating: 5, text: "El outsourcing de nómina con Talentum nos ahorró 2 posiciones internas y eliminó los errores que teníamos cada quincena. Vale muchísimo la inversión.", date: "Mar 2025", servicio: "Nómina" },
  { name: "Patricia Reyes", handle: "Gerente General · Retail", avatar: "PR", rating: 5, text: "El programa de capacitación en servicio al cliente generó un aumento del 18% en NPS de clientes en 3 meses. No esperaba resultados tan rápidos.", date: "Dic 2024", servicio: "Capacitación" },
  { name: "Carlos Ibarra", handle: "CHRO · Empresa Farmacéutica", avatar: "CI", rating: 5, text: "La consultoría de clima fue reveladora. Identificaron problemas que yo intuía pero no podía cuantificar. El plan de acción fue claro y los resultados medibles.", date: "Nov 2024", servicio: "Clima laboral" },
  { name: "Dra. Mónica Fuentes", handle: "Directora · Hospital Privado", avatar: "MF", rating: 5, text: "Procesos de outplacement para 12 colaboradores. Todos tratados con dignidad y 9 de ellos ya están empleados. El equipo de Talentum es simplemente excepcional.", date: "Oct 2024", servicio: "Outplacement" },
]

export const faqs = [
  { q: "¿Trabajan con empresas de cualquier tamaño?", a: "Sí. Tenemos soluciones para startups de 10 personas hasta corporativos de 5,000+ empleados. El nivel de servicio y herramientas se adapta al tamaño y madurez de la empresa." },
  { q: "¿Cuánto tiempo toma ver resultados con sus servicios?", a: "Depende del servicio. En reclutamiento los primeros candidatos llegan en 5 días hábiles. En clima laboral los resultados del diagnóstico se presentan en 10 días. En rotación los cambios significativos se ven a los 3-6 meses." },
  { q: "¿Tienen experiencia en sectores específicos?", a: "Sí. Tenemos práctica profunda en tecnología, manufactura, retail, banca, hospitalidad y salud. Cada sector tiene dinámicas de talento muy distintas y nuestro equipo lo conoce bien." },
  { q: "¿Cómo miden el ROI de sus servicios de consultoría?", a: "Antes de iniciar definimos métricas base: rotación actual, tiempo de cobertura, costo por contratación, índice de clima. Al finalizar el proyecto medimos el delta y calculamos el retorno con metodología CEB/Gartner." },
  { q: "¿Qué herramientas tecnológicas utilizan para reclutamiento?", a: "Trabajamos con ATS propios (Greenhouse, Lever) y también implementamos herramientas en las empresas cliente. Usamos LinkedIn Recruiter, assessment digitales (DISC, Wonderlic) y video-entrevistas asincrónicas." },
  { q: "¿Garantizan las posiciones que reclutan?", a: "Sí. Para niveles gerenciales y directivos ofrecemos garantía de 6 meses: si el candidato sale antes por causas atribuibles al ajuste cultural o performance, hacemos el reemplazo sin costo adicional." },
]
