import { Scale, Building2, Home, Users, ShieldCheck, Briefcase } from "lucide-react"

export const brand = {
  name: "Montes de Oca",
  sub: "& Asociados",
  tagline: "Tu defensa jurídica en manos expertas",
  email: "contacto@montesdeoca.mx",
  phone: "+52 55 5555 2400",
  whatsapp: "+52 55 5555 2400",
  address: "Paseo de la Reforma 505, Piso 14, Cuauhtémoc, CDMX",
  founded: "2007",
  barNumber: "ANADE-2184730",
}

export const stats = [
  { value: "+2,320", label: "Casos resueltos" },
  { value: "18 años", label: "De experiencia" },
  { value: "92%", label: "Tasa de éxito" },
  { value: "4,800+", label: "Clientes satisfechos" },
]

export const areas = [
  {
    id: "laboral",
    icon: Users,
    name: "Derecho Laboral",
    desc: "Asesoría integral para trabajadores y empresas: despidos injustificados, liquidaciones, reinstalaciones, contratos y convenios colectivos.",
    casos: "+620 casos",
    tasa: "94% éxito",
    color: "text-blue-400",
    border: "border-blue-800/30",
    bg: "bg-blue-950/15",
    tags: ["Despidos", "Liquidaciones", "IMSS/INFONAVIT", "Contratos", "Reinstalación"],
    fullDesc: "Protegemos los derechos de trabajadores y empresas ante el TFCA y Juntas Locales. Desde la primera notificación hasta la ejecución del laudo, te acompañamos en cada paso. Manejamos casos de despido injustificado, liquidaciones, discriminación laboral, acoso y conflictos colectivos.",
    precio: "Desde $8,000 MXN",
  },
  {
    id: "mercantil",
    icon: Briefcase,
    name: "Derecho Mercantil",
    desc: "Constitución de empresas, contratos comerciales, litigios mercantiles, fusiones, adquisiciones y reestructuras corporativas.",
    casos: "+480 casos",
    tasa: "91% éxito",
    color: "text-violet-400",
    border: "border-violet-800/30",
    bg: "bg-violet-950/15",
    tags: ["Contratos", "SA de CV / SAS", "Fusiones", "Litigios", "Due Diligence"],
    fullDesc: "Asesoramos en todas las etapas del ciclo de vida empresarial: constitución, operación, crecimiento y salida. Redactamos y revisamos contratos mercantiles, representamos en litigios ante Juzgados Mercantiles y coordinamos operaciones de M&A con firmas internacionales.",
    precio: "Desde $15,000 MXN",
  },
  {
    id: "familiar",
    icon: Home,
    name: "Derecho Familiar",
    desc: "Divorcios, custodia, pensión alimenticia, adopciones, testamentos, sucesiones y mediación familiar con enfoque humano.",
    casos: "+390 casos",
    tasa: "96% éxito",
    color: "text-rose-400",
    border: "border-rose-800/30",
    bg: "bg-rose-950/15",
    tags: ["Divorcio", "Custodia", "Alimentos", "Sucesiones", "Mediación"],
    fullDesc: "Abordamos cada caso con empatía y firmeza. Desde divorcios incausados hasta procesos de adopción o testamentaria, nuestro equipo familiar busca siempre la solución menos traumática sin sacrificar tus derechos. Somos mediadores certificados ante el CDMX.",
    precio: "Desde $10,000 MXN",
  },
  {
    id: "penal",
    icon: ShieldCheck,
    name: "Derecho Penal",
    desc: "Defensa penal efectiva en todas las etapas del proceso. Garantizamos el debido proceso y protegemos tus derechos constitucionales.",
    casos: "+270 casos",
    tasa: "88% éxito",
    color: "text-amber-400",
    border: "border-amber-800/30",
    bg: "bg-amber-950/15",
    tags: ["Defensa penal", "Amparo", "Medidas cautelares", "Juicio oral", "LNPP"],
    fullDesc: "Defensa penal estratégica en el sistema acusatorio adversarial. Atendemos detenidos en menos de 2 horas. Manejamos audiencias iniciales, medidas cautelares, juicios orales y recursos de apelación. Disponibilidad 24/7 para emergencias penales.",
    precio: "Desde $25,000 MXN",
  },
  {
    id: "inmobiliario",
    icon: Building2,
    name: "Derecho Inmobiliario",
    desc: "Compraventa, arrendamientos, escrituración, regularización de predios, condominios y litigios por posesión y usucapión.",
    casos: "+350 casos",
    tasa: "92% éxito",
    color: "text-emerald-400",
    border: "border-emerald-800/30",
    bg: "bg-emerald-950/15",
    tags: ["Escrituración", "Arrendamiento", "Regularización", "Condominios", "Usucapión"],
    fullDesc: "Protegemos tu patrimonio inmobiliario en cada operación. Due diligence completo antes de cualquier compraventa, elaboración de contratos de arrendamiento blindados, regularización de inmuebles ante el Registro Público y defensa en juicios posesorios.",
    precio: "Desde $12,000 MXN",
  },
  {
    id: "corporativo",
    icon: Scale,
    name: "Derecho Corporativo",
    desc: "Gobierno corporativo, compliance, contratos internacionales, propiedad intelectual, protección de datos y regulación sectorial.",
    casos: "+210 casos",
    tasa: "93% éxito",
    color: "text-cyan-400",
    border: "border-cyan-800/30",
    bg: "bg-cyan-950/15",
    tags: ["Compliance", "Contratos", "LFPDPPP", "PI", "M&A"],
    fullDesc: "Asesoría jurídica preventiva para empresas que operan en entornos regulados. Diseñamos programas de cumplimiento, redactamos contratos internacionales en inglés/español, registramos marcas ante el IMPI y coordinamos auditorías legales pre-inversión.",
    precio: "Desde $20,000 MXN",
  },
]

export const processSteps = [
  { n: "01", title: "Consulta inicial gratuita", desc: "Primera reunión de 45 min sin costo. Analizamos tu caso, evaluamos viabilidad y te explicamos el camino legal con absoluta claridad y sin jerga innecesaria." },
  { n: "02", title: "Análisis jurídico", desc: "Revisión exhaustiva de documentos, hechos y marco legal aplicable. Identificamos fortalezas, riesgos y la estrategia más eficiente para tu caso específico." },
  { n: "03", title: "Estrategia & propuesta", desc: "Plan de acción personalizado con etapas, tiempos estimados, honorarios transparentes por escrito y métricas de avance medibles." },
  { n: "04", title: "Ejecución & seguimiento", desc: "Representación activa con reportes periódicos vía app o email. Nunca estarás sin información sobre el estado de tu asunto jurídico." },
]

export const team = [
  { name: "Lic. Carlos Montes de Oca", role: "Socio Fundador", specialty: "Derecho Mercantil & Corporativo", exp: "23 años · Ex-SHCP · Árbitro CANACO", avatar: "CM", color: "from-slate-600 to-slate-800", cedula: "Cédula Prof. 2184730", bio: "Fundó el despacho en 2007 tras 8 años en la SHCP. Árbitro certificado ante la CANACO-SERVYTUR y profesor de Derecho Mercantil en la UNAM. Ha coordinado operaciones de M&A por más de USD 400M." },
  { name: "Lic. Patricia Vargas Luna", role: "Socia Senior", specialty: "Derecho Laboral & IMSS", exp: "19 años · Ex-STPS · Conciliadora CFCRL", avatar: "PV", color: "from-indigo-600 to-indigo-900", cedula: "Cédula Prof. 4921085", bio: "Especialista en el nuevo sistema laboral acusatorio. Ex-funcionaria de la STPS durante 6 años. Conciliadora certificada ante el CFCRL. Ha ganado más de 620 casos laborales con 94% de tasa de éxito." },
  { name: "Lic. Roberto Salcedo Ríos", role: "Socio Senior", specialty: "Derecho Penal & Amparo", exp: "16 años · UNAM · Ex-PGR", avatar: "RS", color: "from-slate-700 to-gray-900", cedula: "Cédula Prof. 6037412", bio: "Maestro en Derecho Penal por la UNAM. Ex-agente del Ministerio Público Federal. Especialista en juicios orales y amparo. Atiende emergencias penales 24/7 con una red de apoyo multidisciplinario." },
  { name: "Lic. Alejandra Torres Medina", role: "Asociada Senior", specialty: "Derecho Familiar & Sucesiones", exp: "12 años · Iberoamericana · Mediadora", avatar: "AT", color: "from-slate-600 to-blue-900", cedula: "Cédula Prof. 7842016", bio: "Mediadora certificada por el TSJ-CDMX. Especialista en divorcios, custodia y planeación sucesoria. Ha conducido más de 200 procesos de mediación familiar con resolución exitosa en el 96% de los casos." },
  { name: "Lic. Miguel Ángel Soto", role: "Asociado", specialty: "Derecho Inmobiliario & Notarial", exp: "8 años · Anáhuac · RNPP", avatar: "MS", color: "from-emerald-700 to-emerald-900", cedula: "Cédula Prof. 9103847", bio: "Especialista en derecho registral e inmobiliario. Coordina due diligence para desarrolladoras y fondos de inversión inmobiliaria. Conocimiento profundo del Registro Público de la Propiedad de CDMX y EDOMEX." },
  { name: "Lic. Fernanda Rivas Ochoa", role: "Asociada", specialty: "Compliance & Protección de Datos", exp: "6 años · ITAM · CIPP/E", avatar: "FR", color: "from-violet-700 to-violet-900", cedula: "Cédula Prof. 10284930", bio: "Certificada como Privacy Professional (CIPP/E) por la IAPP. Diseña programas de compliance para empresas tecnológicas y financieras. Especialista en LFPDPPP, GDPR y regulación sectorial ante COFECE y CNBV." },
]

export const values = [
  { title: "Confidencialidad absoluta", desc: "Todo lo que nos compartes está protegido por el secreto profesional. Firmamos NDA desde la primera reunión.", icon: "🔒" },
  { title: "Transparencia total", desc: "Honorarios fijos por escrito. Sin sorpresas, sin letra chica, sin cargos no autorizados.", icon: "📋" },
  { title: "Orientación al resultado", desc: "No vendemos horas, vendemos soluciones. Medimos nuestro éxito por el resultado que obtienes.", icon: "🎯" },
  { title: "Comunicación constante", desc: "Reporte de avance semanal. Tu caso nunca queda sin seguimiento ni sin respuesta.", icon: "📡" },
]

export const awards = [
  { year: "2024", title: "Despacho del Año", org: "ANADE · Asociación Nacional de Abogados de Empresa" },
  { year: "2023", title: "Top 10 Firmas Laborales", org: "Chambers Latin America 2023" },
  { year: "2022", title: "Reconocimiento a la Excelencia", org: "Barra de Abogados CDMX" },
  { year: "2020", title: "Mejor Despacho Boutique", org: "Legal 500 México" },
]

export const testimonials = [
  { name: "Grupo Industrial Nortek", handle: "Director Jurídico", avatar: "GI", text: "El despacho Montes de Oca manejó nuestra reestructura corporativa con una precisión y velocidad excepcional. Cumplieron cada plazo sin sorpresas en honorarios. Los recomendaríamos sin dudarlo.", area: "Corporativo", rating: 5, date: "Ene 2026" },
  { name: "Ing. Fernando Reyes", handle: "Cliente particular", avatar: "FR", text: "Después de un despido injustificado después de 14 años en la empresa, el Lic. Montes recuperó el 100% de mi liquidación más tres meses extra de compensación. Proceso rápido y sin estrés.", area: "Laboral", rating: 5, date: "Mar 2026" },
  { name: "Dra. Verónica Castillo", handle: "Empresaria", avatar: "VC", text: "La Lic. Vargas manejó mi divorcio con una sensibilidad y profesionalismo que no esperaba. Logró la mejor custodia para mis hijos y una pensión justa. Estaré eternamente agradecida.", area: "Familiar", rating: 5, date: "Feb 2026" },
  { name: "Constructora Arco Sur", handle: "Gerencia Legal", avatar: "CA", text: "Resolvieron un litigio por usucapión de 3 años que nos tenía paralizado. Su conocimiento del derecho inmobiliario y sus contactos en el registro público fueron clave para el resultado.", area: "Inmobiliario", rating: 5, date: "Dic 2025" },
  { name: "Sr. Arturo Mendívil", handle: "Cliente particular", avatar: "AM", text: "El Lic. Salcedo logró mi absolución en un proceso penal en el que me vi involucrado injustamente. Su manejo del juicio oral fue impresionante. Defensa de primer nivel.", area: "Penal", rating: 5, date: "Abr 2026" },
  { name: "TechStart México S.A.S.", handle: "CEO & Co-founder", avatar: "TM", text: "Constituyeron nuestra empresa, redactaron contratos con inversores internacionales y nos asesoran en cumplimiento de LFPDPPP. Son el socio legal que toda startup necesita.", area: "Mercantil", rating: 5, date: "Mar 2026" },
  { name: "Clínica Médica del Norte", handle: "Administración", avatar: "CM", text: "Nos ayudaron con contratos de trabajo, alta de empleados ante IMSS y manejo de una inspección laboral. Todo resuelto en tiempo récord sin multas.", area: "Laboral", rating: 5, date: "May 2026" },
  { name: "Sra. Gabriela Fuentes", handle: "Propietaria", avatar: "GF", text: "Regularizaron un predio que llevaba 12 años con problemas en el Registro Público. Pensé que era imposible, ellos lo hicieron en 4 meses.", area: "Inmobiliario", rating: 5, date: "Feb 2026" },
  { name: "Importadora Zentral", handle: "Gerente General", avatar: "IZ", text: "Manejaron una demanda mercantil de un proveedor extranjero con una estrategia que nunca imaginé. Ganamos el caso y recuperamos nuestra garantía íntegra.", area: "Mercantil", rating: 5, date: "Ene 2026" },
]

export const faqs = [
  { q: "¿La primera consulta tiene costo?", a: "No. Ofrecemos una primera consulta gratuita de 45 minutos para analizar tu caso, orientarte sobre opciones legales disponibles y presentarte una propuesta de honorarios sin compromiso." },
  { q: "¿Cuánto tiempo tarda resolver un caso laboral?", a: "Con la nueva LFTSE y el sistema de conciliación previa, casos laborales sencillos pueden resolverse en 3-6 meses. Litigios complejos o con audiencias pueden extenderse 12-18 meses. Te daremos un estimado concreto al analizar tu caso." },
  { q: "¿Trabajan en CDMX o también en otros estados?", a: "Tenemos sede en CDMX y operamos en Estado de México, Jalisco, Nuevo León y Querétaro. Para otros estados coordinamos con abogados corresponsales de nuestra red nacional." },
  { q: "¿Cómo se estructuran los honorarios?", a: "Honorarios fijos por asesoría, por proyecto o éxito según el tipo de caso. Siempre por escrito en contrato de servicios. Sin cuotas ocultas ni sorpresas. En algunos casos laborales trabajamos a contingencia." },
  { q: "¿Puedo contratar servicios de forma remota?", a: "Sí. Atendemos clientes en todo México de forma digital. Videollamadas, firma electrónica y gestión documental 100% en línea. Muchos clientes nunca visitan físicamente nuestra oficina." },
  { q: "¿Tienen experiencia con empresas extranjeras?", a: "Sí. Trabajamos con subsidiarias de empresas de EUA, España, Japón y Alemania. Redactamos contratos bilaterales, coordinamos con firmas corresponsales en el extranjero y ofrecemos servicios en inglés." },
]

export const blogPosts = [
  { id: 1, slug: "reforma-laboral-2025", title: "Reforma laboral 2025: lo que tu empresa debe saber antes de enero", excerpt: "El CFCRL amplía sus facultades y el período de conciliación obligatoria se extiende. Analizamos los cambios clave que afectan contratos, liquidaciones y revisiones colectivas.", category: "Laboral", date: "12 May 2026", readTime: "8 min", author: "Lic. Patricia Vargas Luna" },
  { id: 2, slug: "usucapion-cdmx", title: "Usucapión en CDMX: cómo regularizar tu propiedad paso a paso", excerpt: "Si llevas más de 5 años en posesión de un inmueble, podrías tener derecho a adquirirlo legalmente. Te explicamos el proceso completo ante el Registro Público.", category: "Inmobiliario", date: "4 May 2026", readTime: "11 min", author: "Lic. Miguel Ángel Soto" },
  { id: 3, slug: "divorcio-incausado-que-es", title: "Divorcio incausado en México: ¿qué significa y cómo afecta la custodia?", excerpt: "Desde 2008, no necesitas probar causales para divorciarte. Explicamos las implicaciones en custodia, bienes y pensión alimenticia bajo la ley actual.", category: "Familiar", date: "28 Abr 2026", readTime: "7 min", author: "Lic. Alejandra Torres Medina" },
  { id: 4, slug: "compliance-pymes-2025", title: "Compliance para PYMES: 5 obligaciones que probablemente estás incumpliendo", excerpt: "LFPDPPP, antilavado, NOM-035, protección al consumidor y contratos de trabajo son las áreas de mayor riesgo para medianas empresas en 2025.", category: "Corporativo", date: "19 Abr 2026", readTime: "9 min", author: "Lic. Fernanda Rivas Ochoa" },
  { id: 5, slug: "amparo-penal-cuando-procede", title: "¿Cuándo procede el amparo en materia penal? Guía práctica 2026", excerpt: "El juicio de amparo es una herramienta poderosa pero tiene requisitos precisos. Explicamos cuándo y cómo utilizarlo para proteger tus derechos fundamentales.", category: "Penal", date: "10 Abr 2026", readTime: "10 min", author: "Lic. Roberto Salcedo Ríos" },
  { id: 6, slug: "contratos-startup-mexico", title: "Los 7 contratos que toda startup mexicana debe tener desde el día 1", excerpt: "Desde el acuerdo de socios hasta los contratos con early employees y proveedores tecnológicos, estos son los documentos que protegen tu empresa desde el inicio.", category: "Mercantil", date: "2 Abr 2026", readTime: "12 min", author: "Lic. Carlos Montes de Oca" },
]
