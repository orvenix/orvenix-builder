import { Home, Building2, TrendingUp, Search, Star, Users } from "lucide-react"

export const brand = {
  name: "Vertex Realty",
  sub: "Bienes Raíces Premium",
  tagline: "Tu propiedad ideal, nuestra especialidad",
  email: "info@vertexrealty.mx",
  phone: "+52 55 9900 1122",
  whatsapp: "+52 55 9900 1122",
  address: "Av. Presidente Masaryk 61, Polanco, CDMX",
  founded: "2010",
  instagram: "@vertexrealty.mx",
}

export const stats = [
  { value: "+4.2B", label: "MXN en transacciones" },
  { value: "15 años", label: "En el mercado" },
  { value: "+850", label: "Propiedades vendidas" },
  { value: "98%", label: "Clientes satisfechos" },
]

export const propiedades = [
  { id: 1, tipo: "Penthouse", nombre: "Penthouse Reforma 360", zona: "Paseo de la Reforma", precio: "$18,500,000", m2: "320 m²", recamaras: 4, banos: 4, parking: 3, tag: "NUEVO", desc: "Penthouse de 4 niveles con terraza de 80 m², alberca privada, sala de cine y vista 360° de CDMX. Acabados Gaggenau y Miele.", color: "text-amber-400", bg: "bg-amber-950/15", border: "border-amber-800/30" },
  { id: 2, tipo: "Departamento", nombre: "Depto. Polanco Alto", zona: "Polanco V Sección", precio: "$8,900,000", m2: "185 m²", recamaras: 3, banos: 3, parking: 2, tag: "EXCLUSIVO", desc: "Planta baja doble con jardín privado de 60 m². Cocina Molteni, clósets Poliform, A/C Daikin central.", color: "text-indigo-400", bg: "bg-indigo-950/15", border: "border-indigo-800/30" },
  { id: 3, tipo: "Casa", nombre: "Casa Jardines del Pedregal", zona: "Jardines del Pedregal", precio: "$25,000,000", m2: "780 m²", recamaras: 5, banos: 6, parking: 4, tag: "LUJOSA", desc: "Casa residencial en terreno de 1,100 m². Alberca, jardín con cancha de pádel, cuarto de servicio independiente.", color: "text-emerald-400", bg: "bg-emerald-950/15", border: "border-emerald-800/30" },
  { id: 4, tipo: "Departamento", nombre: "Depto. Santa Fe Skyline", zona: "Santa Fe", precio: "$5,200,000", m2: "120 m²", recamaras: 2, banos: 2, parking: 2, tag: "INVERSIÓN", desc: "Departamento en torre corporativa con amenidades de lujo: gym, coworking, concierge y roof garden.", color: "text-cyan-400", bg: "bg-cyan-950/15", border: "border-cyan-800/30" },
  { id: 5, tipo: "Local Comercial", nombre: "Local Masaryk", zona: "Paseo de la Reforma", precio: "$12,000,000", m2: "240 m²", recamaras: 0, banos: 2, parking: 4, tag: "RENTA DISPONIBLE", desc: "Local en la zona más exclusiva de Polanco. Fachada de cristal, entrepiso, bodega y 4 cajones exclusivos.", color: "text-rose-400", bg: "bg-rose-950/15", border: "border-rose-800/30" },
  { id: 6, tipo: "Preventa", nombre: "Residencial Bosques", zona: "Bosques de las Lomas", precio: "Desde $6,800,000", m2: "150–280 m²", recamaras: 3, banos: 3, parking: 2, tag: "PREVENTA", desc: "Proyecto boutique de 40 unidades. Entrega Q4 2026. Oportunidad de precio preventa con plusvalía estimada del 22%.", color: "text-violet-400", bg: "bg-violet-950/15", border: "border-violet-800/30" },
]

export const agentes = [
  { name: "Ing. Roberto Garza", role: "Director General", specialty: "Residencial alto patrimonio · Polanco · Lomas", exp: "20 años · Transacciones > $500M MXN · Ex-CBRE", avatar: "RG", color: "from-amber-700 to-amber-900" },
  { name: "Arq. Carmen Vidal", role: "Agente Senior", specialty: "Departamentos · Santa Fe · Reforma", exp: "14 años · +280 cierres · Certificada NAR", avatar: "CV", color: "from-indigo-700 to-indigo-900" },
  { name: "Lic. Diego Fuentes", role: "Especialista Comercial", specialty: "Locales · Oficinas · Naves industriales", exp: "12 años · Portafolio comercial $1.2B MXN", avatar: "DF", color: "from-emerald-700 to-emerald-900" },
  { name: "Lic. Sofía Morales", role: "Agente Preventa", specialty: "Proyectos nuevos · Inversión inmobiliaria", exp: "9 años · +150 unidades en preventa vendidas", avatar: "SM", color: "from-rose-700 to-rose-900" },
]

export const servicios = [
  { icon: Search, name: "Búsqueda Personalizada", desc: "Analizamos tus necesidades, presupuesto y preferencias para presentarte solo propiedades que realmente cumplan tus criterios. Sin perder tu tiempo.", color: "text-indigo-400", bg: "bg-indigo-950/15", border: "border-indigo-800/30" },
  { icon: TrendingUp, name: "Valuación y Análisis de Mercado", desc: "Valuaciones certificadas y análisis comparativo de mercado. Te decimos exactamente cuánto vale tu propiedad y en qué precio venderla rápido.", color: "text-emerald-400", bg: "bg-emerald-950/15", border: "border-emerald-800/30" },
  { icon: Building2, name: "Asesoría en Inversión", desc: "Identificamos las zonas con mayor plusvalía en CDMX. Proyectamos rendimientos y ROI para que tu inversión sea la más rentable posible.", color: "text-amber-400", bg: "bg-amber-950/15", border: "border-amber-800/30" },
  { icon: Home, name: "Acompañamiento Legal y Notarial", desc: "Coordinamos el proceso completo: verificación jurídica del título, tramitación notarial, crédito hipotecario y entrega de escrituras.", color: "text-cyan-400", bg: "bg-cyan-950/15", border: "border-cyan-800/30" },
  { icon: Star, name: "Marketing de Propiedades", desc: "Fotografía profesional, video 4K, tour 360°, publicación en portales premium y campaña digital dirigida a compradores calificados.", color: "text-violet-400", bg: "bg-violet-950/15", border: "border-violet-800/30" },
  { icon: Users, name: "Red de Compradores Calificados", desc: "Base de datos de +2,000 compradores activos con capital listo. Tu propiedad llega directamente a quien puede comprarla hoy.", color: "text-rose-400", bg: "bg-rose-950/15", border: "border-rose-800/30" },
]

export const testimonials = [
  { name: "Familia Gutiérrez Medina", handle: "Compradores", avatar: "GM", text: "Roberto nos acompañó en la búsqueda de nuestra casa durante 4 meses. Su conocimiento del mercado de Jardines del Pedregal fue fundamental para no sobrepagar. Cerramos $1.8M por debajo del precio de lista.", tipo: "Casa residencial", rating: 5, date: "May 2025" },
  { name: "Ing. Carlos Bernal", handle: "Inversionista", avatar: "CB", text: "Diego me consiguió un local en Masaryk con renta del 8.5% anual. En el mercado actual eso es excepcional. Su conocimiento del mercado comercial es el mejor que he encontrado en CDMX.", tipo: "Local comercial", rating: 5, date: "Abr 2025" },
  { name: "Sra. Ana María Torres", handle: "Vendedora", avatar: "AT", text: "Vendimos el departamento en 22 días al precio completo de lista. La estrategia de marketing de Carmen, con el tour virtual y la campaña digital, atrajo 18 visitas calificadas en dos semanas.", tipo: "Departamento Polanco", rating: 5, date: "Mar 2025" },
  { name: "Grupo Inversiones del Norte", handle: "Cliente corporativo", avatar: "GI", text: "Vertex Realty maneja nuestro portafolio de 12 propiedades comerciales en CDMX desde 2019. Profesionalismo, transparencia y resultados consistentes. No trabajamos con nadie más.", tipo: "Portafolio corporativo", rating: 5, date: "Feb 2025" },
]

export const faqs = [
  { q: "¿Cobran comisión al comprador?", a: "En operaciones de compraventa residencial, la comisión la paga el vendedor y va del 3 al 5% más IVA sobre el precio de venta final. Para el comprador, la asesoría es completamente gratuita." },
  { q: "¿Cuánto tarda en promedio una operación de compraventa?", a: "Desde la oferta aceptada hasta la firma de escrituras: 45-90 días naturales. El mayor tiempo lo consume el trámite notarial y, en caso de crédito hipotecario, la resolución del banco (15-30 días adicionales)." },
  { q: "¿Pueden ayudarme a conseguir crédito hipotecario?", a: "Sí. Tenemos convenios con los principales bancos (BBVA, Santander, Banorte, HSBC) y brokers hipotecarios independientes. Te presentamos las mejores tasas disponibles en el mercado para tu perfil." },
  { q: "¿Hacen valuaciones de propiedades?", a: "Sí. Valuaciones comerciales y de mercado sin costo para propiedades en venta con nosotros. Valuaciones certificadas por perito para trámites legales o bancarios tienen un costo según el tipo de propiedad." },
  { q: "¿En qué zonas de CDMX operan?", a: "Especialistas en Polanco, Lomas de Chapultepec, Santa Fe, Reforma, Roma, Condesa, Pedregal, Del Valle, Satélite y Juriquilla. Para propiedades en otras zonas, trabajamos con red de corresponsales." },
]

export const blogPosts = [
  { id: 1, slug: "polanco-mercado-2025", title: "Mercado inmobiliario de Polanco: precios, tendencias y zonas más buscadas en 2025", excerpt: "Polanco mantiene su posición como el mercado más activo de CDMX con precio promedio por m² de $85,000 MXN. Analizamos qué está comprando la demanda y en qué colonias hay más oportunidad.", category: "Mercado", date: "8 May 2025", readTime: "11 min", author: "Ing. Roberto Garza" },
  { id: 2, slug: "credito-hipotecario-2025", title: "¿Conviene tomar crédito hipotecario en 2025? El análisis completo", excerpt: "Con tasas entre 9.5% y 11.5% anual, la decisión de hipoteca vs contado es más compleja que nunca. Analizamos los escenarios y cuándo cada opción tiene sentido financiero.", category: "Financiamiento", date: "1 May 2025", readTime: "9 min", author: "Lic. Sofía Morales" },
  { id: 3, slug: "plusvalia-cdmx-zonas", title: "Las 5 colonias con mayor plusvalía proyectada en CDMX para 2025-2028", excerpt: "Narvarte, Doctores, Azcapotzalco, Xochimilco y Álvaro Obregón muestran señales claras de plusvalía superior. Los datos que respaldan esta tendencia.", category: "Inversión", date: "22 Abr 2025", readTime: "8 min", author: "Arq. Carmen Vidal" },
  { id: 4, slug: "vender-depto-rapido", title: "Cómo vender tu departamento rápido sin bajar el precio: 7 estrategias probadas", excerpt: "El 73% de los departamentos en CDMX tardan más de 6 meses en venderse. Pero con la estrategia correcta, el tiempo se reduce a 3-8 semanas. Aquí las 7 acciones que marcan la diferencia.", category: "Venta", date: "14 Abr 2025", readTime: "7 min", author: "Arq. Carmen Vidal" },
]
