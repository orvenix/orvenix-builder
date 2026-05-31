import { Plane, Map, Anchor, Heart, Users, Star } from "lucide-react"

export const brand = {
  name: "Ruta Norte",
  sub: "Agencia de Viajes",
  tagline: "El mundo en tus manos",
  email: "viajes@rutanorte.mx",
  phone: "+52 55 8800 4422",
  whatsapp: "+52 55 8800 4422",
  address: "Av. Álvaro Obregón 147, Roma Norte, CDMX",
  iata: "IATA 66-84219",
  founded: "2011",
}

export const stats = [
  { value: "48K+", label: "Viajeros felices" },
  { value: "120+", label: "Destinos activos" },
  { value: "14", label: "Años en operación" },
  { value: "4.9★", label: "Calificación Google" },
]

export const categories = [
  {
    id: "nacional",
    icon: Map,
    title: "Paquetes Nacionales",
    desc: "Los mejores destinos de México: Riviera Maya, Los Cabos, Oaxaca, Chiapas, Ciudad de México y más. Todo incluido o a la medida.",
    tags: ["Riviera Maya", "Los Cabos", "Oaxaca", "Chiapas"],
    color: "text-orange-400",
    border: "border-orange-900/30",
    bg: "bg-orange-950/10",
    desde: "Desde $6,500 MXN",
    popularidad: "Más vendido",
  },
  {
    id: "internacional",
    icon: Plane,
    title: "Viajes Internacionales",
    desc: "Europa, Asia, Norteamérica y Sudamérica. Vuelos, hoteles, traslados y actividades organizados en un solo paquete con asistencia 24/7.",
    tags: ["Europa", "Asia", "USA & Canadá", "Sudamérica"],
    color: "text-sky-400",
    border: "border-sky-900/30",
    bg: "bg-sky-950/10",
    desde: "Desde $28,000 MXN",
    popularidad: "Alta demanda",
  },
  {
    id: "cruceros",
    icon: Anchor,
    title: "Cruceros",
    desc: "Cruceros por el Caribe, Mediterráneo y fiordos noruegos. MSC, Norwegian, Royal Caribbean y Celebrity con camarotes a los mejores precios.",
    tags: ["Caribe", "Mediterráneo", "Alaska", "Fiordos"],
    color: "text-blue-400",
    border: "border-blue-900/30",
    bg: "bg-blue-950/10",
    desde: "Desde $32,000 MXN",
    popularidad: "Tendencia 2025",
  },
  {
    id: "luna-de-miel",
    icon: Heart,
    title: "Luna de Miel",
    desc: "Paquetes románticos personalizados: Maldivas, Santorini, Bali, Toscana y el Caribe. Detalles especiales, cenas privadas y actividades exclusivas.",
    tags: ["Maldivas", "Bali", "Santorini", "Toscana"],
    color: "text-rose-400",
    border: "border-rose-900/30",
    bg: "bg-rose-950/10",
    desde: "Desde $45,000 MXN",
    popularidad: "Experiencias únicas",
  },
  {
    id: "grupos",
    icon: Users,
    title: "Viajes Grupales",
    desc: "Cotizaciones especiales para grupos de 10+ personas. Eventos corporativos, bodas en el extranjero, graduaciones y retiros de empresa.",
    tags: ["Corporativo", "Bodas destino", "Graduaciones", "Retiros"],
    color: "text-violet-400",
    border: "border-violet-900/30",
    bg: "bg-violet-950/10",
    desde: "Precios especiales",
    popularidad: "Solicitar cotización",
  },
  {
    id: "aventura",
    icon: Star,
    title: "Turismo de Aventura",
    desc: "Safaris en África, trekking en Nepal, Patagonia, Galápagos y Antarctica. Para viajeros que buscan experiencias fuera de lo ordinario.",
    tags: ["Safari", "Trekking", "Galapagos", "Antarctica"],
    color: "text-amber-400",
    border: "border-amber-900/30",
    bg: "bg-amber-950/10",
    desde: "Desde $85,000 MXN",
    popularidad: "Exclusivo",
  },
]

export const destinos = [
  { name: "París, Francia", desc: "Ciudad Luz, Torre Eiffel y gastronomía de clase mundial", noches: "7 noches", desde: "$42,500", gradient: "from-blue-900 to-indigo-950", emoji: "🗼", tag: "Más deseado" },
  { name: "Riviera Maya", desc: "Playas paradisíacas, cenotes y cultura maya en México", noches: "5 noches", desde: "$8,900", gradient: "from-teal-900 to-emerald-950", emoji: "🏖️", tag: "Todo incluido" },
  { name: "Tokio, Japón", desc: "Tecnología, tradición, gastronomía y la flor del cerezo", noches: "10 noches", desde: "$65,000", gradient: "from-rose-900 to-pink-950", emoji: "🗾", tag: "Tendencia 2025" },
  { name: "Roma & Toscana", desc: "Arte, historia, vino y la dolce vita italiana", noches: "9 noches", desde: "$51,000", gradient: "from-amber-900 to-orange-950", emoji: "🏛️", tag: "Luna de miel" },
  { name: "Cancún, México", desc: "Zona Hotelera, Isla Mujeres y la Laguna Nichupté", noches: "4 noches", desde: "$6,500", gradient: "from-sky-900 to-cyan-950", emoji: "🌊", tag: "Más vendido" },
  { name: "Santorini, Grecia", desc: "Cúpulas azules, atardeceres legendarios y vino volcánico", noches: "6 noches", desde: "$58,000", gradient: "from-indigo-900 to-blue-950", emoji: "🌅", tag: "Romántico" },
]

export const process = [
  { n: "01", title: "Consulta personalizada", desc: "Un asesor de viajes certificado IATA analiza tus preferencias, presupuesto, fechas y tipo de viaje. Sin costo y sin compromiso." },
  { n: "02", title: "Propuesta a la medida", desc: "Recibe en 24h hasta 3 opciones de itinerario detallado con vuelos, hoteles, traslados y actividades con precios all-in." },
  { n: "03", title: "Personalización & reserva", desc: "Ajustamos el itinerario a tus deseos. Una vez confirmado, realizamos las reservas con prioridad garantizada." },
  { n: "04", title: "Documentación & preparación", desc: "Te entregamos vouchers digitales, checklist de viaje, tips del destino y números de emergencia locales." },
  { n: "05", title: "Acompañamiento en destino", desc: "Asistencia 24/7 vía WhatsApp durante todo el viaje. Si algo sale mal, lo resolvemos desde aquí." },
]

export const team = [
  { name: "Fernanda Castillo", role: "Directora de Viajes", specialty: "Europa & Medio Oriente", exp: "14 años · IATA certificada · 45 países visitados", avatar: "FC", color: "from-orange-700 to-rose-900" },
  { name: "Roberto Güémez", role: "Especialista Internacional", specialty: "Asia & Oceanía", exp: "12 años · IATA · Ex-Aeroméxico Vacaciones", avatar: "RG", color: "from-sky-700 to-blue-900" },
  { name: "Ale Montoya", role: "Asesora de Cruceros", specialty: "Cruceros & expediciones", exp: "8 años · Certificada MSC & NCL", avatar: "AM", color: "from-teal-700 to-emerald-900" },
  { name: "Javier Olvera", role: "Asesor de Grupos", specialty: "Eventos corporativos", exp: "10 años · 500+ grupos gestionados", avatar: "JO", color: "from-violet-700 to-purple-900" },
]

export const testimonials = [
  { name: "Gabriela Ramírez", handle: "Viajera · Luna de miel Santorini", avatar: "GR", rating: 5, text: "Fernanda organizó nuestra luna de miel en Santorini con tanto detalle que llegamos a una sorpresa en el hotel. Impecable desde el primer correo hasta la vuelta a casa.", date: "Mar 2025", destino: "Santorini" },
  { name: "Lic. Manuel Torres", handle: "Director · Grupo Empresarial", avatar: "MT", rating: 5, text: "Organizaron el retiro de 60 directivos en Japón. Logística impecable, hoteles de lujo y cero contratiempos. Los volveré a contratar.", date: "Feb 2025", destino: "Tokio" },
  { name: "Familia Herrera", handle: "Familia de 5 · Riviera Maya", avatar: "FH", rating: 5, text: "Primera vez de todo incluido y fue perfecta. El resort era exactamente como en las fotos y el traslado llegó puntual. Mis hijos no quieren volver a casa.", date: "Ene 2025", destino: "Riviera Maya" },
  { name: "Cristina Navarro", handle: "Viajera frecuente · 8 viajes con RN", avatar: "CN", rating: 5, text: "Llevo 8 viajes con Ruta Norte y en todos me ha ido excelente. Son serios, responden rápido y cuando tuve un problema con un vuelo lo resolvieron en menos de 2 horas.", date: "Dic 2024", destino: "Varios" },
  { name: "Pablo & Sofía Reyes", handle: "Pareja · Boda destino Cancún", avatar: "PR", rating: 5, text: "Organizaron nuestra boda para 85 invitados en Cancún. Cada detalle fue perfecto. Todos nuestros invitados felices y nosotros con el sueño cumplido.", date: "Nov 2024", destino: "Cancún" },
  { name: "Martha Soto", handle: "Jubilada · Primera vez en Europa", avatar: "MS", rating: 5, text: "Tenía 70 años y nunca había salido del país. El equipo de Ruta Norte me llevó por Roma, París y Praga con todo el apoyo. Regresé llorando de felicidad.", date: "Oct 2024", destino: "Europa" },
]

export const faqs = [
  { q: "¿Puedo pagar a meses sin intereses?", a: "Sí. Ofrecemos planes de hasta 18 meses sin intereses con tarjetas participantes (Banamex, BBVA, Santander, HSBC). También aceptamos transferencia, depósito y PayPal." },
  { q: "¿Qué incluye el seguro de viajero?", a: "Cobertura médica hasta USD $50,000, cancelación de vuelo, pérdida de equipaje y asistencia legal en el extranjero. Está incluido en todos los paquetes internacionales." },
  { q: "¿Con cuánta anticipación debo reservar?", a: "Recomendamos reservar con al menos 30 días de anticipación para destinos nacionales y 60-90 días para internacionales. Temporada alta (diciembre, Semana Santa) con 6 meses mínimo." },
  { q: "¿Qué pasa si necesito cancelar o modificar mi viaje?", a: "Depende de las políticas del proveedor. Trabajamos con hoteles y aerolíneas que ofrecen tarifas con flexibilidad. Siempre te informamos antes de confirmar las condiciones exactas." },
  { q: "¿Tienen paquetes para viajeros con necesidades especiales?", a: "Sí. Coordinamos viajes accesibles para personas con movilidad reducida, viajeros con restricciones dietéticas y grupos con necesidades médicas. Cuéntanos tu situación y lo personalizamos." },
  { q: "¿Tramitan visas?", a: "Te orientamos sobre los requisitos de visa para cada destino y te indicamos cómo gestionarla. Para algunos países como EUA, Schengen y Canadá ofrecemos el servicio de cita y llenado de formularios." },
]
