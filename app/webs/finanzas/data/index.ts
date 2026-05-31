import { TrendingUp, PieChart, Landmark, ShieldCheck, Building2, BarChart3 } from "lucide-react"

export const brand = {
  name: "Nexo Capital",
  sub: "Asesores Financieros",
  tagline: "Tu patrimonio, nuestra estrategia",
  email: "contacto@nexocapital.mx",
  phone: "+52 55 4433 2200",
  whatsapp: "+52 55 4433 2200",
  address: "Blvd. Manuel Ávila Camacho 2610, Lomas de Chapultepec, CDMX",
  founded: "2011",
  license: "CNBV · Asesor en Inversiones 07-432-I",
}

export const stats = [
  { value: "$3.2B", label: "MXN bajo asesoría" },
  { value: "14 años", label: "De experiencia" },
  { value: "620+", label: "Familias asesoradas" },
  { value: "18.4%", label: "Rendimiento promedio anual" },
]

export const services = [
  {
    id: "patrimonio",
    icon: TrendingUp,
    name: "Gestión Patrimonial",
    desc: "Diseño y administración de portafolio de inversión personalizado con base en tu perfil de riesgo, horizonte temporal y objetivos financieros.",
    color: "text-emerald-400",
    border: "border-emerald-800/30",
    bg: "bg-emerald-950/15",
    tags: ["Renta variable", "Renta fija", "Divisas", "Commodities", "Portafolio modelo"],
    fullDesc: "Construimos portafolios de inversión alineados con tus metas: crecimiento de capital, generación de rentas, preservación patrimonial o combinaciones entre ellos. Administramos activos en México y EUA, con acceso a instrumentos en MXN, USD y EUR. Rendimiento anual promedio de nuestros portafolios conservadores: 10.2%; moderados: 14.8%; agresivos: 22.1% (últimos 5 años).",
    minimo: "Desde $500,000 MXN",
    comision: "1.2% anual sobre AUM",
  },
  {
    id: "planeacion",
    icon: PieChart,
    name: "Planeación Financiera",
    desc: "Diagnóstico completo de tu situación financiera y hoja de ruta personalizada para alcanzar tus metas de mediano y largo plazo.",
    color: "text-teal-400",
    border: "border-teal-800/30",
    bg: "bg-teal-950/15",
    tags: ["Presupuesto", "Metas financieras", "Deuda", "Ahorro", "Protección"],
    fullDesc: "La planeación financiera es la base de todo. Analizamos tus ingresos, gastos, activos y pasivos para construir un plan financiero personalizado a 5, 10 y 20 años. Incluye análisis de seguros, optimización fiscal, estrategia de deuda y hoja de ruta de inversión. Revisión trimestral incluida.",
    minimo: "Sin mínimo de inversión",
    comision: "Consultoría inicial desde $5,000 MXN",
  },
  {
    id: "retiro",
    icon: Landmark,
    name: "Planeación para el Retiro",
    desc: "Estrategia integral de retiro: AFORE, planes personales de retiro (PPR), seguros de ahorro y portafolios de renta fija. Máximo beneficio fiscal.",
    color: "text-cyan-400",
    border: "border-cyan-800/30",
    bg: "bg-cyan-950/15",
    tags: ["AFORE", "PPR", "Deducible ISR", "Anualidades", "Renta vitalicia"],
    fullDesc: "¿A qué edad quieres retirarte y con qué ingreso mensual? Esa respuesta define tu estrategia. Coordinamos tus aportaciones al AFORE, planes personales de retiro deducibles de ISR (hasta 5 SMGVDF anuales), seguros dotales y portafolios de bajo riesgo para construir el fondo de retiro que necesitas.",
    minimo: "Desde $2,000/mes en aportaciones",
    comision: "Incluido en planeación financiera",
  },
  {
    id: "fiscal",
    icon: ShieldCheck,
    name: "Optimización Fiscal",
    desc: "Estrategias legales para reducir tu carga impositiva: deducciones, estructuras eficientes, instrumentos fiscalmente favorecidos y diferimiento de impuestos.",
    color: "text-violet-400",
    border: "border-violet-800/30",
    bg: "bg-violet-950/15",
    tags: ["ISR personas físicas", "Deducciones", "PPR", "GMM deducible", "Donativos"],
    fullDesc: "Muchos contribuyentes pagan más impuestos de los que legalmente deben. Analizamos tu declaración anual y situación fiscal para identificar deducciones autorizadas no aplicadas, estructuras de inversión más eficientes y estrategias de diferimiento de impuestos que maximicen tu patrimonio neto.",
    minimo: "Diagnóstico fiscal desde $3,500 MXN",
    comision: "Ahorro promedio: 18% en ISR anual",
  },
  {
    id: "empresarial",
    icon: Building2,
    name: "Finanzas Corporativas",
    desc: "Asesoría financiera para empresas: planeación de flujo de caja, inversión de excedentes de tesorería, acceso a financiamiento y valuación de negocios.",
    color: "text-indigo-400",
    border: "border-indigo-800/30",
    bg: "bg-indigo-950/15",
    tags: ["Tesorería", "Valuación", "Financiamiento", "Fusiones", "Exit planning"],
    fullDesc: "Asesoramos a PYMES y empresas medianas en la gestión eficiente de su capital. Inversión de excedentes de tesorería en instrumentos de alta liquidez, planeación de flujo para temporadas de baja, acceso a crédito en condiciones óptimas y preparación para procesos de venta o sucesión de la empresa.",
    minimo: "Empresas desde $20M de ingresos anuales",
    comision: "Desde $15,000 MXN/mes",
  },
  {
    id: "inversiones",
    icon: BarChart3,
    name: "Acceso a Mercados",
    desc: "Inversión en bolsa mexicana y mercados internacionales (NYSE, NASDAQ), bonos, ETFs, fondos de inversión y activos alternativos.",
    color: "text-amber-400",
    border: "border-amber-800/30",
    bg: "bg-amber-950/15",
    tags: ["BMV", "NYSE", "ETFs", "Bonos", "Activos alternativos"],
    fullDesc: "Acceso asesorado a mercados financieros locales e internacionales. No vendemos productos de inversión propios: seleccionamos los mejores instrumentos del mercado según tu perfil. Cuentas en GBMO, GBM+ y custodios internacionales regulados. Reportes de rendimiento mensuales y reunión de seguimiento trimestral.",
    minimo: "Desde $300,000 MXN",
    comision: "0.8% anual sobre AUM",
  },
]

export const processSteps = [
  { n: "01", title: "Diagnóstico financiero", desc: "Entrevista de 60 minutos para mapear tu situación actual: ingresos, gastos, activos, pasivos, seguros, impuestos y metas. Sin costo y sin compromiso." },
  { n: "02", title: "Plan personalizado", desc: "Desarrollamos un plan financiero integral con recomendaciones concretas para cada área. Presentación en segunda reunión con análisis detallado y proyecciones." },
  { n: "03", title: "Implementación", desc: "Abrimos cuentas, coordinamos transferencias, contratamos instrumentos y ejecutamos las estrategias acordadas. Tu participación es mínima." },
  { n: "04", title: "Seguimiento continuo", desc: "Reunión trimestral de revisión, reporte mensual de rendimientos y acceso permanente a tu asesor por WhatsApp. Ajustamos cuando cambian tus circunstancias." },
]

export const team = [
  { name: "Lic. Andrés Castellanos", role: "Director de Inversiones", specialty: "Portafolios & Mercados Internacionales", exp: "22 años · CFA Charterholder · Ex-BBVA", avatar: "AC", color: "from-emerald-600 to-emerald-900", bio: "CFA® Charterholder con 22 años gestionando portafolios para family offices y clientes de alto patrimonio. Ex-director de inversiones en BBVA Asset Management México. MBA en Wharton School." },
  { name: "CP. María Fernanda Oliva", role: "Directora de Planeación", specialty: "Planeación Financiera & Fiscal", exp: "18 años · CFP® · IMCP", avatar: "MO", color: "from-teal-600 to-teal-900", bio: "Certified Financial Planner (CFP®) con especialidad en planeación para retiro y optimización fiscal de personas físicas. Socia fundadora del despacho. Contadora Pública certificada ante el IMCP." },
  { name: "Lic. Santiago Guerrero", role: "Asesor Senior Patrimonial", specialty: "Gestión Patrimonial & Retiro", exp: "14 años · Tec de Monterrey · GBM Certified", avatar: "SG", color: "from-indigo-600 to-indigo-900", bio: "Especialista en estructuración de portafolios para clientes con patrimonio superior a $5M. Asesor certificado por GBM, GBMO y custodios internacionales. Egresado del ITESM con maestría en Finanzas." },
  { name: "MBA. Claudia Reyes", role: "Asesora Corporativa", specialty: "Finanzas Corporativas & Valuación", exp: "11 años · UAM · AMIB", avatar: "CR", color: "from-violet-600 to-violet-900", bio: "Asesora financiera para empresas medianas con especialidad en valuación de negocios y preparación para exit. Certificada ante la AMIB. Ha coordinado transacciones corporativas por más de $800M MXN." },
]

export const values = [
  { title: "Independencia fiduciaria", desc: "No vendemos productos propios ni recibimos comisiones de fondos. Actuamos siempre en tu mejor interés, por obligación legal y ética.", icon: "⚖️" },
  { title: "Transparencia total de costos", desc: "Sabes exactamente cuánto cobran tus fondos, qué pagamos en comisiones y cuánto cobra Nexo Capital. Sin letra chica.", icon: "💡" },
  { title: "Rendimiento ajustado al riesgo", desc: "No buscamos el rendimiento más alto, sino el mejor rendimiento para el nivel de riesgo que estás dispuesto a asumir.", icon: "📊" },
  { title: "Relación de largo plazo", desc: "El 78% de nuestros clientes llevan más de 5 años con nosotros. Creemos en acompañarlos en cada etapa de su vida financiera.", icon: "🤝" },
]

export const testimonials = [
  { name: "Familia Gutiérrez Montes", handle: "Clientes desde 2014", avatar: "GM", text: "Andrés nos ayudó a consolidar todo nuestro patrimonio disperso y construir una estrategia coherente. En 10 años, triplicamos nuestros activos invertibles. Lo mejor fue tener siempre claridad de hacia dónde íbamos.", service: "Gestión Patrimonial", rating: 5, date: "May 2026" },
  { name: "Dr. Héctor Sánchez", handle: "Médico especialista", avatar: "HS", text: "Como médico, nunca tuve tiempo ni conocimiento para manejar mis inversiones bien. María Fernanda diseñó un plan de retiro a 15 años que me permite enfrensar el trabajo sin angustia financiera.", service: "Retiro", rating: 5, date: "Abr 2026" },
  { name: "Pinturas Durex de México", handle: "Gerente de Finanzas", avatar: "PD", text: "Claudia optimizó la inversión de nuestros excedentes de tesorería y conseguimos rendimientos del 14% anual en instrumentos de alta liquidez. Nunca habíamos aprovechado bien ese capital.", service: "Corporativo", rating: 5, date: "Mar 2026" },
  { name: "Ing. Roberto Aranda", handle: "Empresario", avatar: "RA", text: "La estrategia fiscal que diseñaron para mi empresa y para mí como persona física me ahorró $890,000 en ISR el año pasado. Todo completamente legal y documentado.", service: "Fiscal", rating: 5, date: "Feb 2026" },
  { name: "Sra. Patricia Vidal", handle: "Inversionista particular", avatar: "PV", text: "Tenía $2M en el banco ganando 6% anual. Santiago me mostró cómo estructurarlos en un portafolio diversificado que el año pasado generó 19.3%. Sin haberme dado cuenta de que podía ganar tanto más.", service: "Inversiones", rating: 5, date: "Ene 2026" },
  { name: "Fundación Esperanza CDMX", handle: "Directora Ejecutiva", avatar: "FE", text: "Nexo Capital administra el fondo de inversión de nuestra fundación desde 2018. Transparencia total, rendimientos superiores al benchmark y siempre disponibles cuando los necesitamos.", service: "Patrimonial", rating: 5, date: "Mar 2026" },
]

export const faqs = [
  { q: "¿Cuánto dinero necesito para empezar?", a: "Depende del servicio. Para planeación financiera no hay mínimo. Para gestión de portafolios de inversión el mínimo es $500,000 MXN. Para acceso a mercados internacionales, $300,000 MXN. Podemos armar un plan para cualquier patrimonio." },
  { q: "¿Cómo gana dinero Nexo Capital?", a: "Cobramos honorarios anuales sobre los activos que gestionamos (AUM). No recibimos comisiones por recomendar fondos o productos específicos. Esto elimina el conflicto de interés que existe cuando los asesores cobran por vender productos." },
  { q: "¿Están regulados por la CNBV?", a: "Sí. Nexo Capital está registrado ante la CNBV como Asesor en Inversiones con clave 07-432-I. Esto nos obliga legalmente a actuar en el mejor interés del cliente, a mantener registros auditables y a revelar cualquier conflicto de interés." },
  { q: "¿Qué pasa con mi dinero si algo le ocurre a Nexo Capital?", a: "Tu dinero nunca está en cuentas de Nexo Capital. Tus inversiones se mantienen en custodios independientes (GBM, GBMO, BROKERAGE) a tu nombre. Nexo solo tiene autorización para gestionar, nunca para retirar fondos." },
  { q: "¿Pueden ayudarme si ya tengo un portafolio armado?", a: "Por supuesto. Uno de nuestros servicios más solicitados es la revisión y optimización de portafolios existentes. Analizamos tu situación actual sin costo y te presentamos recomendaciones concretas." },
  { q: "¿Trabajan con clientes fuera de la CDMX?", a: "Sí. Atendemos clientes en todo México y también a mexicanos residentes en el extranjero. Todas nuestras reuniones de seguimiento pueden hacerse por videollamada. El 40% de nuestros clientes activos están fuera de CDMX." },
]

export const blogPosts = [
  { id: 1, slug: "inflacion-portafolio-2025", title: "Cómo proteger tu portafolio de la inflación en México (2025)", excerpt: "Con inflación persistente, el efectivo y los CETES ya no son suficientes. Analizamos los instrumentos que históricamente han superado la inflación en México y cómo combinarlos.", category: "Inversiones", date: "13 May 2026", readTime: "10 min", author: "Lic. Andrés Castellanos" },
  { id: 2, slug: "ppr-cuanto-deducir-2025", title: "Plan Personal de Retiro: cuánto deducir y cómo elegir el mejor", excerpt: "El PPR es la deducción más subutilizada por personas físicas. Te explicamos los límites, cómo comparar productos y cuánto puedes ahorrar en ISR este año.", category: "Retiro", date: "6 May 2026", readTime: "8 min", author: "CP. María Fernanda Oliva" },
  { id: 3, slug: "errores-portafolio-inversion", title: "7 errores que destruyen portafolios de inversión en México", excerpt: "Desde concentración excesiva en CETES hasta invertir en dólares sin estrategia, estos son los errores más frecuentes que vemos al revisar portafolios de nuevos clientes.", category: "Inversiones", date: "29 Abr 2026", readTime: "12 min", author: "Lic. Santiago Guerrero" },
  { id: 4, slug: "diversificacion-internacional-mexico", title: "¿Cómo invertir en bolsa internacional desde México sin complicaciones?", excerpt: "NYSE, NASDAQ y mercados europeos son accesibles desde México a través de GBM, GBMO y cuentas internacionales. Guía paso a paso para comenzar.", category: "Mercados", date: "21 Abr 2026", readTime: "9 min", author: "Lic. Andrés Castellanos" },
  { id: 5, slug: "tesoreria-empresa-rentabilizar", title: "Cómo rentabilizar el efectivo de tu empresa sin sacrificar liquidez", excerpt: "Las empresas con excedentes de tesorería en cuenta corriente están perdiendo dinero. Analizamos los mejores instrumentos para rendir ese capital con acceso inmediato.", category: "Corporativo", date: "12 Abr 2026", readTime: "7 min", author: "MBA. Claudia Reyes" },
  { id: 6, slug: "cuando-contratar-asesor-financiero", title: "¿Cuándo necesitas un asesor financiero? Las 5 señales claras", excerpt: "No todo el mundo necesita un asesor financiero. Pero hay situaciones específicas en las que no tenerlo sale muy caro. Aquí las más comunes.", category: "Finanzas personales", date: "4 Abr 2026", readTime: "6 min", author: "CP. María Fernanda Oliva" },
]
