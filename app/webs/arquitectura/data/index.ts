import { Building2, Layers, Home, Sparkles, TreePine, Wrench } from "lucide-react"

export const brand = {
  name: "Espacio Studio",
  tagline: "Diseño que trasciende",
  email: "hola@espaciostudio.mx",
  phone: "+52 55 4400 8890",
  address: "Av. Presidente Masaryk 111, Polanco, CDMX",
  ig: "@espaciostudio.mx",
  founded: "2008",
}

export const stats = [
  { value: "240+", label: "Proyectos entregados" },
  { value: "17", label: "Años de experiencia" },
  { value: "94%", label: "Clientes que regresan" },
  { value: "12", label: "Premios de diseño" },
]

export const services = [
  {
    id: "residencial",
    icon: Home,
    title: "Arquitectura Residencial",
    desc: "Casas y departamentos de alto estándar: desde el anteproyecto hasta la entrega de llaves. Diseño adaptado al estilo de vida del cliente.",
    tags: ["Casas unifamiliares", "Departamentos", "Condominios", "Torres"],
    color: "text-amber-400",
    border: "border-amber-900/30",
    bg: "bg-amber-950/10",
    proyectos: "128 proyectos",
    satisfaccion: "98% satisfacción",
  },
  {
    id: "comercial",
    icon: Building2,
    title: "Arquitectura Comercial",
    desc: "Oficinas corporativas, locales comerciales y espacios de trabajo que potencian la productividad y la imagen de marca.",
    tags: ["Oficinas", "Locales", "Showrooms", "Restaurantes"],
    color: "text-stone-300",
    border: "border-stone-700/30",
    bg: "bg-stone-900/10",
    proyectos: "64 proyectos",
    satisfaccion: "97% satisfacción",
  },
  {
    id: "interiores",
    icon: Layers,
    title: "Diseño de Interiores",
    desc: "Conceptualización y ejecución de espacios interiores con paletas cromáticas, mobiliario a medida y materiales premium.",
    tags: ["Salas", "Cocinas", "Dormitorios", "Baños de lujo"],
    color: "text-orange-400",
    border: "border-orange-900/30",
    bg: "bg-orange-950/10",
    proyectos: "110 proyectos",
    satisfaccion: "99% satisfacción",
  },
  {
    id: "remodelacion",
    icon: Wrench,
    title: "Remodelación & Ampliación",
    desc: "Transformamos espacios existentes sin perder su esencia. Estudios de factibilidad estructural incluidos en el diagnóstico.",
    tags: ["Restructuración", "Cambio de uso", "Reciclaje espacial", "Accesibilidad"],
    color: "text-teal-400",
    border: "border-teal-900/30",
    bg: "bg-teal-950/10",
    proyectos: "78 proyectos",
    satisfaccion: "96% satisfacción",
  },
  {
    id: "paisajismo",
    icon: TreePine,
    title: "Paisajismo & Jardines",
    desc: "Diseño de exteriores, jardines verticales, terrazas y áreas verdes que complementan la arquitectura del proyecto.",
    tags: ["Jardines", "Terrazas", "Jardines verticales", "Albercas"],
    color: "text-green-400",
    border: "border-green-900/30",
    bg: "bg-green-950/10",
    proyectos: "45 proyectos",
    satisfaccion: "97% satisfacción",
  },
  {
    id: "sustentable",
    icon: Sparkles,
    title: "Arquitectura Sustentable",
    desc: "Proyectos con certificación LEED y sistemas pasivos de climatización. Reducción de hasta 40% en consumo energético.",
    tags: ["LEED", "Paneles solares", "Captación de agua", "Bioclimático"],
    color: "text-lime-400",
    border: "border-lime-900/30",
    bg: "bg-lime-950/10",
    proyectos: "32 proyectos",
    satisfaccion: "100% satisfacción",
  },
]

export const process = [
  { n: "01", title: "Consulta inicial", desc: "Reunión de diagnóstico sin costo para entender tus necesidades, presupuesto y plazos. Revisamos el predio o espacio a intervenir." },
  { n: "02", title: "Anteproyecto", desc: "Presentamos esquemas conceptuales, moodboard, plantas preliminares y estimación de costos para tu validación." },
  { n: "03", title: "Proyecto ejecutivo", desc: "Planos arquitectónicos, estructurales, instalaciones y especificaciones completas para tramitación de permisos." },
  { n: "04", title: "Tramitación", desc: "Gestionamos ante el municipio los permisos de construcción, manifestaciones de impacto ambiental y licencias de uso." },
  { n: "05", title: "Construcción & Supervisión", desc: "Ejecución de obra con supervisión permanente, control de calidad y reportes semanales de avance fotográfico." },
  { n: "06", title: "Entrega & Postventa", desc: "Entrega formal con recorrido técnico, manuales de mantenimiento y garantía de 12 meses en instalaciones." },
]

export const team = [
  { name: "Arq. Carlos Vega Ibarra", role: "Director Creativo", specialty: "Arquitectura residencial de lujo", exp: "Egresado UNAM · Maestría en Barcelona", avatar: "CV", color: "from-amber-700 to-stone-800", cedula: "Cédula DGP-45822" },
  { name: "Arq. Daniela Ríos", role: "Directora de Proyectos", specialty: "Interiorismo & materiales", exp: "ITESM · Especialidad en Milán", avatar: "DR", color: "from-orange-700 to-amber-900", cedula: "Cédula DGP-61940" },
  { name: "Arq. Marco Salas", role: "Arquitecto Senior", specialty: "Arquitectura comercial & oficinas", exp: "Iberoamericana · 12 años experiencia", avatar: "MS", color: "from-stone-600 to-zinc-800", cedula: "Cédula DGP-72213" },
  { name: "Ing. Laura Moreno", role: "Ingeniería Estructural", specialty: "Cálculo estructural & supervisión", exp: "IPN · Certificación ASCE", avatar: "LM", color: "from-teal-700 to-emerald-900", cedula: "Cédula DGP-58811" },
]

export const projects = [
  { id: 1, name: "Casa Lomas del Valle", type: "Residencial", area: "650 m²", year: "2024", location: "Lomas de Chapultepec, CDMX", desc: "Residencia de 4 recámaras con spa privado, cava de vinos y jardín de 200m². Certificación LEED Silver.", gradient: "from-amber-900 to-stone-900", tag: "Premium" },
  { id: 2, name: "Torre Corporativa Reforma", type: "Comercial", area: "4,200 m²", year: "2023", location: "Paseo de la Reforma, CDMX", desc: "15 pisos de oficinas corporativas con terraza verde, auditorio y sistema HVAC inteligente.", gradient: "from-stone-800 to-zinc-900", tag: "Corporativo" },
  { id: 3, name: "Hotel Boutique Tepoztlán", type: "Hospitalidad", area: "1,100 m²", year: "2023", location: "Tepoztlán, Morelos", desc: "12 suites con arquitectura vernácula, piscina infinita y restaurante de autor. Premio ARQUINE 2023.", gradient: "from-orange-900 to-amber-950", tag: "Premio" },
  { id: 4, name: "Showroom Muebles Modernos", type: "Comercial", area: "820 m²", year: "2024", location: "Santa Fe, CDMX", desc: "Espacio expositivo con iluminación natural cenital, piso pulido importado y terraza de exhibición.", gradient: "from-zinc-800 to-slate-900", tag: "Retail" },
  { id: 5, name: "Conjunto Habitacional Loreto", type: "Residencial", area: "3,800 m²", year: "2022", location: "Loreto, BCS", desc: "48 unidades frente al mar con áreas comunes, roof garden compartido y marina privada.", gradient: "from-teal-900 to-stone-900", tag: "Conjuntos" },
  { id: 6, name: "Remodelación Casa Coyoacán", type: "Remodelación", area: "280 m²", year: "2024", location: "Coyoacán, CDMX", desc: "Transformación completa de casa colonial: estructura reforzada, cocina integral y jardín interior.", gradient: "from-stone-700 to-zinc-900", tag: "Remodelación" },
]

export const testimonials = [
  { name: "Ricardo Alvarado", handle: "Director General · Grupo Alvarado", avatar: "RA", rating: 5, text: "Espacio Studio transformó nuestras oficinas en un entorno de trabajo que realmente inspira. El equipo entendió nuestra cultura corporativa desde el primer día.", date: "Ene 2025", tipo: "Comercial" },
  { name: "Valeria Mendoza", handle: "Propietaria · Casa Lomas", avatar: "VM", rating: 5, text: "La casa de nuestros sueños. Carlos y Daniela estuvieron presentes en cada detalle, desde el diseño hasta la entrega. Superaron todas nuestras expectativas.", date: "Feb 2025", tipo: "Residencial" },
  { name: "Pedro Fuentes", handle: "Hotel Boutique · Tepoztlán", avatar: "PF", rating: 5, text: "El hotel ganó un premio ARQUINE el mismo año de su apertura. La propuesta arquitectónica captura la esencia de Tepoztlán sin perder lujo ni confort.", date: "Nov 2024", tipo: "Hospitalidad" },
  { name: "Ana Cristina Ruiz", handle: "Familia Ruiz · Coyoacán", avatar: "AC", rating: 5, text: "La remodelación se entregó en tiempo y forma, con un presupuesto controlado. La calidad de los materiales y el detalle son impresionantes.", date: "Mar 2025", tipo: "Remodelación" },
  { name: "Jorge Ibáñez", handle: "CEO · Muebles Modernos", avatar: "JI", rating: 5, text: "El showroom es nuestra carta de presentación ante clientes internacionales. Varios socios han preguntado quién lo diseñó. El retorno fue inmediato.", date: "Dic 2024", tipo: "Retail" },
  { name: "Sofía Torres", handle: "Desarrolladora · Loreto BCS", avatar: "ST", rating: 5, text: "Trabajamos con Espacio Studio en 48 unidades de lujo frente al mar. Su manejo de tiempos y proveedores es impecable. Ya tenemos el siguiente proyecto en proceso.", date: "Oct 2024", tipo: "Desarrollos" },
]

export const faqs = [
  { q: "¿Cuánto tiempo toma el proceso completo desde el diseño hasta la entrega?", a: "Depende del tipo de proyecto. Una casa residencial de 300 m² toma entre 14 y 18 meses incluyendo diseño, permisos y construcción. Proyectos de interiorismo pueden concluirse en 4 a 6 meses." },
  { q: "¿Hacen proyectos fuera de la Ciudad de México?", a: "Sí. Tenemos experiencia en Guadalajara, Monterrey, Los Cabos, Cancún y Mérida. Para proyectos foráneos incluimos un protocolo de supervisión remota con visitas quincenales en sitio." },
  { q: "¿La consulta inicial tiene costo?", a: "No. La primera reunión de diagnóstico es completamente gratuita y sin compromiso. En ella evaluamos el predio, tus necesidades y te damos una estimación de honorarios y tiempos." },
  { q: "¿Trabajan con presupuesto cerrado o por administración?", a: "Ofrecemos ambas modalidades. Para proyectos residenciales recomendamos precio cerrado. Para remodelaciones de alcance variable usamos administración con presupuesto base y contingencia del 10%." },
  { q: "¿Tienen experiencia en proyectos sustentables con certificación LEED?", a: "Sí. Contamos con 32 proyectos con criterios sustentables y 14 con certificación LEED (Silver y Gold). El costo adicional de certificación se recupera en 4 a 7 años de ahorro energético." },
  { q: "¿Se encargan también de los trámites ante el municipio?", a: "Sí. Nuestro departamento de gestión tramita permisos de construcción, licencias de uso de suelo, manifestaciones de impacto ambiental y regularizaciones en la CDMX y área metropolitana." },
]
