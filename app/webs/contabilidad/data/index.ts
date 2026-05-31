import { Calculator, FileText, Users, TrendingUp, Shield, Briefcase } from "lucide-react"

export const brand = {
  name: "FiscalPro",
  sub: "Contadores & Asociados",
  tagline: "Tu patrimonio, bien contado",
  email: "contacto@fiscalpro.mx",
  phone: "+52 55 3322 9900",
  address: "Insurgentes Sur 1602, Florida, CDMX",
  rfc: "FPC-120308-AB2",
  founded: "2012",
}

export const stats = [
  { value: "850+", label: "Empresas activas" },
  { value: "13", label: "Años de experiencia" },
  { value: "$0", label: "Multas SAT a clientes" },
  { value: "99.4%", label: "Declaraciones a tiempo" },
]

export const services = [
  {
    id: "contabilidad",
    icon: Calculator,
    title: "Contabilidad Mensual",
    desc: "Registro y clasificación de operaciones, conciliación bancaria, balanzas de comprobación y estados financieros mensuales entregados en plataforma digital.",
    tags: ["PYMES", "Personas físicas", "Startups", "GmbH"],
    color: "text-teal-400",
    border: "border-teal-900/30",
    bg: "bg-teal-950/10",
    clients: "340 clientes",
    tiempoResp: "48h máx.",
  },
  {
    id: "fiscal",
    icon: FileText,
    title: "Declaraciones Fiscales",
    desc: "ISR, IVA, IMSS, INFONAVIT, ISN. Presentamos y monitoreamos todas tus obligaciones ante el SAT para que no incurras en recargos ni multas.",
    tags: ["SAT", "ISR anual", "IVA mensual", "DIOT"],
    color: "text-cyan-400",
    border: "border-cyan-900/30",
    bg: "bg-cyan-950/10",
    clients: "850 clientes",
    tiempoResp: "24h previo vencimiento",
  },
  {
    id: "nomina",
    icon: Users,
    title: "Nómina & IMSS",
    desc: "Cálculo de nómina semanal, quincenal o mensual. Alta y baja ante IMSS e INFONAVIT. CFDI de nómina timbrados y envío a empleados.",
    tags: ["IMSS", "INFONAVIT", "SUA", "CFDI 4.0"],
    color: "text-blue-400",
    border: "border-blue-900/30",
    bg: "bg-blue-950/10",
    clients: "210 empresas",
    tiempoResp: "Día hábil anterior",
  },
  {
    id: "auditoria",
    icon: Shield,
    title: "Auditoría & Dictamen",
    desc: "Auditoría de estados financieros, dictamen fiscal voluntario y revisiones preventivas internas para detectar inconsistencias antes del SAT.",
    tags: ["Dictamen fiscal", "Auditoría interna", "Due diligence", "NIF"],
    color: "text-violet-400",
    border: "border-violet-900/30",
    bg: "bg-violet-950/10",
    clients: "65 empresas",
    tiempoResp: "15 días hábiles",
  },
  {
    id: "planeacion",
    icon: TrendingUp,
    title: "Planeación Fiscal",
    desc: "Estrategias legales para minimizar la carga tributaria: régimen óptimo, deducciones autorizadas, PTU, dividendos y reestructuras corporativas.",
    tags: ["RESICO", "Persona moral", "Holding", "Dividendos"],
    color: "text-amber-400",
    border: "border-amber-900/30",
    bg: "bg-amber-950/10",
    clients: "180 clientes",
    tiempoResp: "Consulta en 48h",
  },
  {
    id: "empresarial",
    icon: Briefcase,
    title: "Constitución de Empresas",
    desc: "Apertura de SA de CV, SAS, SAPI. Alta en SAT, IMSS, municipio y REPSE. Asesoría de régimen fiscal desde el primer día de operaciones.",
    tags: ["SA de CV", "SAPI", "SAS", "REPSE"],
    color: "text-emerald-400",
    border: "border-emerald-900/30",
    bg: "bg-emerald-950/10",
    clients: "120 empresas",
    tiempoResp: "7 días hábiles",
  },
]

export const process = [
  { n: "01", title: "Diagnóstico sin costo", desc: "Revisamos tu situación fiscal actual, obligaciones pendientes y posibles contingencias. Sin compromiso de contratación." },
  { n: "02", title: "Propuesta personalizada", desc: "Enviamos propuesta con alcance exacto de servicios, honorarios mensuales y fechas de entrega de cada obligación." },
  { n: "03", title: "Migración de información", desc: "Solicitamos acceso a tu portal SAT, folios del IMSS y estados de cuenta. Realizamos el traspaso ordenado sin interrumpir tu operación." },
  { n: "04", title: "Onboarding & configuración", desc: "Configuramos tu expediente en nuestra plataforma digital. Recibes acceso para subir facturas, ver reportes y comunicarte con tu contador asignado." },
  { n: "05", title: "Operación mensual", desc: "Tu contador asignado procesa la contabilidad, presenta declaraciones y te envía el resumen ejecutivo antes del día 15 de cada mes." },
  { n: "06", title: "Reportes & alertas proactivas", desc: "Recibe alertas anticipadas de vencimientos fiscales, cambios en disposiciones del SAT y oportunidades de optimización fiscal." },
]

export const team = [
  { name: "C.P. Rodrigo Nava", role: "Socio Director", specialty: "Planeación fiscal corporativa", exp: "UNAM · 20 años · Ex-KPMG", avatar: "RN", color: "from-teal-700 to-cyan-900", cedula: "IMCP 88-4521" },
  { name: "C.P.C. Mariana López", role: "Socia Fiscal", specialty: "ISR personas morales & grupos", exp: "IPN · 15 años · Ex-PwC", avatar: "ML", color: "from-cyan-700 to-blue-900", cedula: "IMCP 88-5890" },
  { name: "L.C.C. Diego Fuentes", specialty: "Nómina & Seguridad Social", role: "Gerente de Nóminas", exp: "UANL · 10 años · Certificado IMSS", avatar: "DF", color: "from-blue-700 to-indigo-900", cedula: "IMCP 88-7122" },
  { name: "Mtra. Celia Aranda", role: "Auditora Senior", specialty: "Auditoría & NIF", exp: "ITAM · 12 años · Ex-EY", avatar: "CA", color: "from-violet-700 to-purple-900", cedula: "IMCP 88-6344" },
]

export const planes = [
  {
    name: "Starter",
    price: "$2,900",
    period: "/mes + IVA",
    desc: "Para personas físicas y microempresas",
    features: ["Contabilidad mensual", "Declaraciones ISR e IVA", "CFDI de nómina (hasta 5)", "Soporte por email", "Portal digital incluido"],
    highlight: false,
    cta: "Comenzar ahora",
  },
  {
    name: "Business",
    price: "$5,900",
    period: "/mes + IVA",
    desc: "Para PYMES en crecimiento",
    features: ["Todo Starter incluido", "Nómina (hasta 30 empleados)", "IMSS e INFONAVIT", "Dictamen fiscal anual", "Asesor dedicado", "Reportes ejecutivos"],
    highlight: true,
    cta: "Más popular",
  },
  {
    name: "Enterprise",
    price: "A consultar",
    period: "",
    desc: "Para corporativos y grupos empresariales",
    features: ["Todo Business incluido", "Planeación fiscal avanzada", "Due diligence", "Holding & reestructuras", "Contador dedicado exclusivo", "SLA garantizado"],
    highlight: false,
    cta: "Solicitar propuesta",
  },
]

export const testimonials = [
  { name: "Laura Carrasco", handle: "CEO · Importadora LC", avatar: "LC", rating: 5, text: "Llevamos 3 años con FiscalPro y nunca hemos tenido una multa ni un retraso. Su plataforma digital hace todo transparente.", date: "Feb 2025", servicio: "Business" },
  { name: "Tomás Herrera", handle: "Director · TH Consulting", avatar: "TH", rating: 5, text: "Vinimos de una contadora anterior que nos dejó con adeudos al SAT. FiscalPro los resolvió todos en 60 días. Ahora dormimos tranquilos.", date: "Ene 2025", servicio: "Business" },
  { name: "Patricia Suárez", handle: "Socia · Restaurantes PS", avatar: "PS", rating: 5, text: "La planeación fiscal que hizo Rodrigo nos ahorró más del doble del costo anual de sus honorarios. Vale cada peso.", date: "Mar 2025", servicio: "Enterprise" },
  { name: "Emilio Ramos", handle: "Freelancer · Tecnología", avatar: "ER", rating: 5, text: "Soy desarrollador de software y el SAT me daba pánico. Con FiscalPro Starter me encargo de lo que sé y ellos de lo que saben.", date: "Dic 2024", servicio: "Starter" },
  { name: "Claudia Vidal", handle: "Dueña · Boutique Vidal", avatar: "CV", rating: 5, text: "Me explicaron en términos sencillos qué régimen me convenía. Pasé a RESICO y pago casi la mitad de lo que pagaba antes.", date: "Nov 2024", servicio: "Starter" },
  { name: "Grupo Inmobiliario BR", handle: "CFO · Grupo BR", avatar: "GB", rating: 5, text: "Manejamos 12 empresas en el grupo y FiscalPro las consolida todas. El reporte ejecutivo mensual que recibo es oro puro para la toma de decisiones.", date: "Oct 2024", servicio: "Enterprise" },
]

export const faqs = [
  { q: "¿Qué documentos necesito para empezar?", a: "RFC y contraseña SAT, acceso a IMSS (si tienes empleados), estados de cuenta bancarios de los últimos 3 meses y facturas emitidas y recibidas. Nuestro equipo te guía paso a paso en el onboarding." },
  { q: "¿Qué pasa si ya tengo retrasos o adeudos con el SAT?", a: "Lo primero que hacemos es un diagnóstico de tu situación. Regularizamos declaraciones omisas, calculamos recargos y actualizaciones, y solicitamos convenios de pago fraccionado si aplica." },
  { q: "¿Tienen acceso a mis cuentas bancarias?", a: "No. Solo accedemos a tu portal del SAT para presentar declaraciones y consultar el buzón tributario. Nunca solicitamos acceso a cuentas bancarias o sistemas de pagos." },
  { q: "¿Qué incluye el portal digital que mencionan?", a: "Una plataforma donde puedes subir facturas, ver el avance de tus declaraciones, descargar estados financieros, recibir alertas de vencimientos y chatear con tu contador asignado." },
  { q: "¿Puedo cambiarme de otro despacho sin perder información?", a: "Sí. Nos encargamos de la migración completa: solicitamos expediente anterior, descargamos historial del SAT y reconstruimos la contabilidad. En menos de 2 semanas estás operando normalmente." },
  { q: "¿Cómo se cobran sus honorarios?", a: "Cargo mensual fijo al inicio de cada mes vía transferencia o SPEI. Emitimos CFDI inmediatamente. Sin costos por consultas adicionales incluidas en tu plan." },
]
