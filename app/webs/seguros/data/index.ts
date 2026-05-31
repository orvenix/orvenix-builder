import { Shield, Car, Heart, Building2, Home, Umbrella } from "lucide-react"

export const brand = {
  name: "Fortuna",
  sub: "Corredores de Seguros",
  tagline: "Protege lo que más importa",
  email: "contacto@fortunaseguros.mx",
  phone: "+52 55 6677 8800",
  whatsapp: "+52 55 6677 8800",
  address: "Av. Insurgentes Sur 1898, Florida, Álvaro Obregón, CDMX",
  founded: "2009",
  license: "CNSF 18-642-I · AMIS Clave 0892",
}

export const stats = [
  { value: "+12,400", label: "Pólizas vigentes" },
  { value: "16 años", label: "En el mercado" },
  { value: "98%", label: "Reclamaciones pagadas" },
  { value: "$0", label: "Reclamaciones negadas injustamente" },
]

export const products = [
  {
    id: "vida",
    icon: Heart,
    name: "Seguro de Vida",
    desc: "Cobertura temporal, ordinaria de vida y gastos funerarios. Protege el futuro económico de tu familia ante lo imprevisto.",
    color: "text-rose-400",
    border: "border-rose-800/30",
    bg: "bg-rose-950/15",
    tags: ["Temporal 10/20 años", "Vida entera", "Dotal", "Gastos funerarios", "Accidentes"],
    fullDesc: "El seguro de vida más adecuado depende de tu etapa de vida, dependientes económicos y patrimonio actual. Te ayudamos a calcular la suma asegurada óptima y comparamos propuestas de MetLife, GNP, Seguros Atlas y AXA para que tengas la mejor relación costo-beneficio.",
    desde: "Desde $180/mes",
    aseguradoras: ["GNP", "MetLife", "AXA", "Seguros Atlas"],
  },
  {
    id: "gmm",
    icon: Shield,
    name: "Gastos Médicos Mayores",
    desc: "Cobertura hospitalaria, quirúrgica, maternidad, enfermedades crónicas y accidentes. Individual o familiar con suma asegurada alta.",
    color: "text-blue-400",
    border: "border-blue-800/30",
    bg: "bg-blue-950/15",
    tags: ["Individual", "Familiar", "Maternidad", "Enf. crónicas", "Dental opcional"],
    fullDesc: "Analizamos tu perfil de salud, historial médico y presupuesto para recomendar el plan de gastos médicos más conveniente. Gestionamos tu póliza directamente con la aseguradora y te acompañamos durante cualquier reclamación para que no enfrentes la burocracia solo.",
    desde: "Desde $650/mes",
    aseguradoras: ["Seguros Monterrey", "GNP", "AXA", "BUPA"],
  },
  {
    id: "auto",
    icon: Car,
    name: "Seguro de Auto",
    desc: "Amplia cobertura, limitada y RC. Para vehículos particulares, flotillas empresariales y motocicletas. Cotización instantánea.",
    color: "text-indigo-400",
    border: "border-indigo-800/30",
    bg: "bg-indigo-950/15",
    tags: ["Amplia", "RC", "Flotillas", "Motos", "Asistencia vial 24/7"],
    fullDesc: "Cotizamos tu seguro de auto en las principales aseguradoras del mercado en minutos. Para flotillas empresariales negociamos tarifas preferenciales y asignamos un ejecutivo dedicado para la gestión de siniestros. Cobertura en toda la República Mexicana y en EUA hasta 50 millas de frontera.",
    desde: "Desde $250/mes",
    aseguradoras: ["Qualitas", "HDI", "AXA", "GNP"],
  },
  {
    id: "empresarial",
    icon: Building2,
    name: "Seguro Empresarial",
    desc: "Daños a inmuebles, interrupción de negocio, responsabilidad civil patronal, equipo electrónico y robo con violencia.",
    color: "text-violet-400",
    border: "border-violet-800/30",
    bg: "bg-violet-950/15",
    tags: ["RC Patronal", "Incendio", "Robo", "Eq. Electrónico", "Interrupción de negocio"],
    fullDesc: "Diseñamos programas de seguros corporativos a la medida de tu empresa. Desde protección básica para una PYME hasta programas multi-riesgo para corporativos con operaciones en varios estados. Auditamos tus coberturas actuales para detectar subcoberturas y duplicidades.",
    desde: "Cotización personalizada",
    aseguradoras: ["Zurich", "AXA", "Mapfre", "GNP"],
  },
  {
    id: "hogar",
    icon: Home,
    name: "Seguro de Hogar",
    desc: "Contenidos, estructura, responsabilidad civil familiar, robo con violencia y asistencia en el hogar 24/7 incluida.",
    color: "text-emerald-400",
    border: "border-emerald-800/30",
    bg: "bg-emerald-950/15",
    tags: ["Contenidos", "Estructura", "RC Familiar", "Robo", "Asistencia 24/7"],
    fullDesc: "Protege tu patrimonio más valioso con coberturas que realmente responden. Analizamos si tu hogar es en propiedad o en renta, el valor de tus contenidos y los riesgos específicos de tu zona para recomendarte la cobertura exacta que necesitas, sin pagar de más.",
    desde: "Desde $120/mes",
    aseguradoras: ["GNP", "Seguros Atlas", "HDI", "Mapfre"],
  },
  {
    id: "retiro",
    icon: Umbrella,
    name: "Seguro de Retiro & Ahorro",
    desc: "Planes flexibles de ahorro con rendimiento garantizado, aportaciones deducibles de impuestos y cobertura de vida incluida.",
    color: "text-cyan-400",
    border: "border-cyan-800/30",
    bg: "bg-cyan-950/15",
    tags: ["Plan retiro", "Deducible ISR", "Rendimiento garantizado", "Educación", "Patrimonio"],
    fullDesc: "Los seguros de vida con ahorro y los planes de retiro son una de las inversiones más eficientes fiscalmente en México. Tus aportaciones son deducibles del ISR hasta 5 SMGVDF. Comparamos proyecciones de Allianz, MetLife y GNP para que elijas con información completa.",
    desde: "Desde $500/mes",
    aseguradoras: ["Allianz", "MetLife", "GNP", "Seguros Atlas"],
  },
]

export const processSteps = [
  { n: "01", title: "Diagnóstico de necesidades", desc: "Analizamos tu situación personal o empresarial, activos a proteger, dependientes económicos y presupuesto disponible para identificar los riesgos prioritarios." },
  { n: "02", title: "Cotización comparativa", desc: "Solicitamos propuestas a múltiples aseguradoras simultáneamente. Te presentamos una comparativa clara con coberturas, exclusiones y precios lado a lado." },
  { n: "03", title: "Emisión de póliza", desc: "Una vez elegido el plan, gestionamos toda la documentación, llenado de solicitud y emisión de póliza. Recibes tu carátula y comprobante el mismo día." },
  { n: "04", title: "Servicio post-venta", desc: "Somos tu interlocutor permanente. Gestión de siniestros, renovaciones, modificaciones de suma asegurada e inclusión de nuevos beneficiarios. Un ejecutivo asignado para siempre." },
]

export const team = [
  { name: "Agente Fernando Ríos", role: "Director General", specialty: "Vida & Patrimonial", exp: "20 años · CNSF Clave 18-642-I · LUOMA", avatar: "FR", color: "from-indigo-600 to-indigo-900", bio: "Corredor certificado con 20 años en el mercado asegurador. Especialista en planeación patrimonial y seguros de vida de alto valor. Ex-director regional de MetLife México por 8 años." },
  { name: "Agente Daniela Soto", role: "Especialista GMM", specialty: "Gastos Médicos & Dental", exp: "14 años · LUOAC · AMIS", avatar: "DS", color: "from-rose-700 to-rose-900", bio: "Especialista en seguros de salud individual y colectivos. Asesora a más de 80 empresas en la gestión de beneficios de salud para empleados. Certificada como Health & Benefits Advisor." },
  { name: "Agente Marco Villanueva", role: "Especialista Empresarial", specialty: "Seguros Corporativos & RC", exp: "12 años · LUOMA · Zurich Partner", avatar: "MV", color: "from-violet-700 to-violet-900", bio: "Diseña programas de seguros para empresas medianas y grandes. Partner certificado de Zurich México. Ha gestionado siniestros corporativos por más de MXN 85M con 100% de recuperación." },
  { name: "Agente Lucía Mendoza", role: "Especialista Auto & Hogar", specialty: "Daños & Autos", exp: "9 años · Qualitas Partner · HDI", avatar: "LM", color: "from-emerald-700 to-emerald-900", bio: "Experta en seguros de daños para particulares y flotillas. Gestiona la cartera de autos más grande del despacho con más de 2,100 vehículos asegurados activos y tiempo promedio de pago de siniestros de 8 días." },
]

export const values = [
  { title: "Independencia total", desc: "No somos empleados de ninguna aseguradora. Trabajamos para ti, no para ellas. Por eso nuestras recomendaciones son 100% imparciales.", icon: "⚖️" },
  { title: "Transparencia de comisiones", desc: "Cobramos comisión a la aseguradora, no al cliente. Te informamos exactamente cuánto gana nuestro agente en cada póliza si nos lo preguntas.", icon: "💡" },
  { title: "Gestión de siniestros", desc: "Cuando ocurre lo imprevisto, estamos contigo. Presentamos el siniestro, negociamos con el ajustador y no cerramos el caso hasta que cobres.", icon: "🤝" },
  { title: "Revisión anual gratuita", desc: "Cada año revisamos tu portafolio de seguros para asegurarnos de que tus coberturas siguen siendo adecuadas y los precios siguen siendo competitivos.", icon: "🔄" },
]

export const testimonials = [
  { name: "Empresa Textil Celaya", handle: "Gerente de RRHH", avatar: "TC", text: "Fernando nos ayudó a diseñar el plan de GMM colectivo para nuestros 340 empleados. Negociaron una tarifa 23% menor a lo que teníamos con nuestra póliza anterior. El servicio post-venta es excepcional.", product: "GMM Colectivo", rating: 5, date: "Abr 2026" },
  { name: "Sra. Carmen Herrera", handle: "Ama de casa", avatar: "CH", text: "Tenía mi seguro de vida con el mismo agente de siempre y nunca había comparado. Daniela me hizo ver que estaba pagando 40% de más por la misma cobertura. Cambié y ahorré $8,000 al año.", product: "Vida", rating: 5, date: "Mar 2026" },
  { name: "Dr. Rodrigo Peralta", handle: "Médico cirujano", avatar: "RP", text: "Cuando mi GMM rechazó inicialmente cubrir un procedimiento, Marco gestionó la disputa con la aseguradora y en 3 días tenía la aprobación. Sin su ayuda, habría perdido $180,000.", product: "GMM", rating: 5, date: "Feb 2026" },
  { name: "Constructora Vértice", handle: "Director Operativo", avatar: "CV", text: "Marco diseñó el programa de seguros para nuestras 5 obras en CDMX y EDOMEX. Coberturas coordinadas, un solo interlocutor y precio 18% por debajo del mercado. Todo lo que necesitábamos.", product: "Empresarial", rating: 5, date: "Ene 2026" },
  { name: "Ing. Tomás Quiroga", handle: "Propietario", avatar: "TQ", text: "Tuve un accidente de auto en Querétaro. Lucía gestionó todo desde CDMX: grúa, auto sustituto y perito. En 6 días ya tenía el pago del daño total. Servicio extraordinario.", product: "Auto", rating: 5, date: "May 2026" },
  { name: "Familia Espinoza", handle: "Cliente familiar", avatar: "FE", text: "Tomamos el seguro de hogar con Fortuna hace 3 años. Cuando sufrimos un robo con violencia, el proceso fue sorprendentemente rápido. Recibimos el 100% de lo reclamado en 12 días.", product: "Hogar", rating: 5, date: "Mar 2026" },
]

export const faqs = [
  { q: "¿Cuánto cobran por sus servicios de asesoría?", a: "Nuestros servicios son completamente gratuitos para el cliente. Cobramos comisión directamente a la aseguradora por colocar y administrar tu póliza. Esta comisión está incluida en la prima que de todas formas pagarías si fueras directamente con la aseguradora." },
  { q: "¿Por qué no ir directamente con la aseguradora?", a: "Al ir directamente, pagas la misma prima pero sin tener a nadie que te defienda en caso de siniestro. Un corredor independiente conoce las pólizas en detalle, identifica exclusiones problemáticas y te representa ante la aseguradora cuando más lo necesitas." },
  { q: "¿Trabajan con todas las aseguradoras?", a: "Sí. Tenemos convenio de agentes con GNP, MetLife, AXA, Zurich, HDI, Qualitas, Mapfre, Allianz, BUPA, Seguros Atlas y Seguros Monterrey, entre otras. Esto nos permite comparar el mercado completo para cada cliente." },
  { q: "¿Qué pasa si tengo un siniestro?", a: "Nos contactas directamente a nosotros, no a la aseguradora. Nosotros presentamos el siniestro, coordinamos con el ajustador, revisamos el dictamen y negociamos si consideramos que hay errores. No cerramos el caso hasta que estés satisfecho." },
  { q: "¿Pueden revisar los seguros que ya tengo?", a: "Por supuesto, es uno de nuestros servicios más solicitados. Revisamos tus pólizas actuales sin costo, identificamos subcoberturas, duplicidades y oportunidades de ahorro. Si ya tienes buenos seguros, te lo decimos honestamente." },
]

export const blogPosts = [
  { id: 1, slug: "gmm-colectivo-vs-individual", title: "GMM colectivo vs individual: ¿cuál conviene más a tu empresa?", excerpt: "Las pólizas colectivas tienen ventajas fiscales y tarifas menores, pero los planes individuales dan portabilidad al empleado. Análisis comparativo completo.", category: "Gastos Médicos", date: "10 May 2026", readTime: "9 min", author: "Agente Daniela Soto" },
  { id: 2, slug: "cuanta-vida-necesitas", title: "¿Cuánto seguro de vida realmente necesitas? La fórmula correcta", excerpt: "La regla del '10x el ingreso anual' está obsoleta. Te explicamos cómo calcular la suma asegurada ideal según tu situación financiera actual.", category: "Vida", date: "3 May 2026", readTime: "7 min", author: "Agente Fernando Ríos" },
  { id: 3, slug: "seguro-auto-amplia-vs-limitada", title: "Cobertura amplia vs limitada en seguro de auto: ¿cuándo justifica el costo?", excerpt: "Si tu vehículo tiene más de 5 años o su valor es menor a $150,000, la cobertura limitada puede ser la decisión más inteligente. Aquí los criterios exactos.", category: "Auto", date: "26 Abr 2026", readTime: "6 min", author: "Agente Lucía Mendoza" },
  { id: 4, slug: "siniestro-rechazado-que-hacer", title: "Mi siniestro fue rechazado: 5 pasos para revertir la decisión", excerpt: "Las aseguradoras rechazan siniestros por tecnicismos que muchas veces no tienen sustento legal. Conoce tus derechos y cómo presentar una reclamación exitosa.", category: "Siniestros", date: "18 Abr 2026", readTime: "10 min", author: "Agente Marco Villanueva" },
  { id: 5, slug: "deduccion-fiscal-seguros-2025", title: "Seguros deducibles de impuestos en 2025: guía completa para personas físicas", excerpt: "Los seguros de gastos médicos y los planes de retiro reducen tu ISR. Te explicamos los límites, requisitos y cómo maximizar tu beneficio fiscal.", category: "Fiscal", date: "9 Abr 2026", readTime: "11 min", author: "Agente Fernando Ríos" },
  { id: 6, slug: "seguro-hogar-apartamento", title: "¿Necesito seguro de hogar si rento? Sí, y te decimos por qué", excerpt: "Tu casero asegura la estructura, no tus pertenencias ni tu responsabilidad civil. Explicamos qué cubre el seguro de hogar para inquilinos y cuánto cuesta.", category: "Hogar", date: "1 Abr 2026", readTime: "5 min", author: "Agente Lucía Mendoza" },
]
