import { Video, Image, Star, Heart, Building2, Aperture } from "lucide-react"

export const brand = {
  name: "Lumière",
  sub: "Estudio Visual",
  tagline: "Historias que se ven, momentos que perduran",
  email: "hola@lumierestudio.mx",
  phone: "+52 55 4422 8800",
  whatsapp: "+52 55 4422 8800",
  address: "Colonia Condesa, CDMX",
  founded: "2016",
  instagram: "@lumierestudio.mx",
}

export const stats = [
  { value: "+1,800", label: "Sesiones realizadas" },
  { value: "9 años", label: "De experiencia" },
  { value: "98%", label: "Clientes satisfechos" },
  { value: "4.9★", label: "Calificación promedio" },
]

export const services = [
  {
    id: "bodas",
    icon: Heart,
    name: "Fotografía de Bodas",
    desc: "Documentamos cada emoción de tu día especial. Desde la preparación hasta el último baile, con un estilo editorial y auténtico que resiste el paso del tiempo.",
    color: "text-rose-400",
    border: "border-rose-800/30",
    bg: "bg-rose-950/15",
    tags: ["Día completo", "Edición artística", "Álbum físico", "Entrega digital", "2 fotógrafos"],
    desde: "Desde $18,000 MXN",
    fullDesc: "Nuestro servicio de bodas incluye cobertura completa desde los preparativos hasta la recepción. Trabajamos en equipo de dos fotógrafos para no perder ningún ángulo. La edición es editorial y atemporal — sin filtros excesivos ni sobreedición. Entrega en 6-8 semanas.",
  },
  {
    id: "quinceanos",
    icon: Star,
    name: "Quinceañeras",
    desc: "Un momento único en la vida merece imágenes únicas. Sesiones de estudio, locación exterior y cobertura del evento que capturan la esencia de este día irrepetible.",
    color: "text-pink-400",
    border: "border-pink-800/30",
    bg: "bg-pink-950/15",
    tags: ["Sesión previa", "Evento completo", "Drone disponible", "Video highlight", "Álbum"],
    desde: "Desde $12,000 MXN",
    fullDesc: "Paquete completo que incluye sesión de fotos previa (trash the dress o locación temática), cobertura del evento en el día y video highlight de 3-5 minutos. Opcionalmente incluimos drone para tomas aéreas espectaculares del evento y los exteriores.",
  },
  {
    id: "corporativo",
    icon: Building2,
    name: "Fotografía Corporativa",
    desc: "Headshots profesionales, fotos de equipo, eventos empresariales y contenido para redes sociales que proyectan la imagen de tu marca con autoridad.",
    color: "text-blue-400",
    border: "border-blue-800/30",
    bg: "bg-blue-950/15",
    tags: ["Headshots", "Equipo directivo", "Eventos", "Producto", "Contenido RRSS"],
    desde: "Desde $4,500 MXN",
    fullDesc: "Sesiones corporativas en tu oficina o en nuestro estudio. Headshots individuales con 3 cambios de ropa y fondo. Fotografía de equipo directivo y staff. Eventos empresariales con entrega al día siguiente. También realizamos fotografía de producto para e-commerce y catálogos.",
  },
  {
    id: "video",
    icon: Video,
    name: "Videografía & Reels",
    desc: "Video cinematic de bodas y eventos, reels para Instagram y TikTok, videos institucionales y comerciales que comunican con impacto visual.",
    color: "text-amber-400",
    border: "border-amber-800/30",
    bg: "bg-amber-950/15",
    tags: ["Bodas cinematic", "Reels RRSS", "Video institucional", "Testimoniales", "Drone"],
    desde: "Desde $8,000 MXN",
    fullDesc: "Producción de video full HD y 4K. Bodas cinematic con música licenciada, color grading profesional y entrega en 4-6 semanas. Reels para Instagram/TikTok con montaje dinámico en 5-7 días. Videos institucionales y comerciales con guion, dirección y postproducción incluida.",
  },
  {
    id: "sesiones",
    icon: Image,
    name: "Sesiones de Retrato",
    desc: "Sesiones individuales, de pareja, familiares y maternidad. En estudio controlado o locaciones exteriores de CDMX seleccionadas por el equipo.",
    color: "text-emerald-400",
    border: "border-emerald-800/30",
    bg: "bg-emerald-950/15",
    tags: ["Individual", "Pareja", "Familia", "Maternidad", "Newborn"],
    desde: "Desde $2,800 MXN",
    fullDesc: "Sesiones de 1 a 2 horas en locaciones exteriores de la CDMX o en nuestro estudio en Condesa. Incluye asesoría de vestuario previa, dirección durante la sesión y 30-50 imágenes editadas en alta resolución. Entrega en 2-3 semanas via galería privada en línea.",
  },
  {
    id: "producto",
    icon: Aperture,
    name: "Fotografía de Producto",
    desc: "Imágenes de producto para e-commerce, catálogos y redes sociales. Fondo blanco, lifestyle y flat lay. Entrega optimizada para Amazon, Mercado Libre y tiendas en línea.",
    color: "text-violet-400",
    border: "border-violet-800/30",
    bg: "bg-violet-950/15",
    tags: ["E-commerce", "Catálogo", "Lifestyle", "Flat lay", "Fondo blanco"],
    desde: "Desde $350/pieza",
    fullDesc: "Fotografía de producto profesional con fondo infinito blanco, lifestyle con modelos o ambientación, y flat lay temático. Precios por pieza con descuentos por volumen. Optimizamos el tamaño y formato para cada plataforma: Amazon, Mercado Libre, Shopify o cualquier tienda en línea.",
  },
]

export const portfolio = [
  { id: 1, category: "Bodas", title: "Boda en Hacienda San Gabriel", location: "Morelos", year: "2025" },
  { id: 2, category: "Bodas", title: "Ceremonia en Catedral Metropolitana", location: "CDMX", year: "2025" },
  { id: 3, category: "Corporativo", title: "Directivos BBVA México", location: "CDMX", year: "2025" },
  { id: 4, category: "Quinceañeras", title: "XV de Valentina Soto", location: "Guadalajara", year: "2024" },
  { id: 5, category: "Retratos", title: "Sesión familiar Los Herrera", location: "Parque Chapultepec", year: "2025" },
  { id: 6, category: "Producto", title: "Colección SS25 — Moda local", location: "Estudio Condesa", year: "2025" },
  { id: 7, category: "Bodas", title: "Boda íntima en Casa Azul", location: "Coyoacán, CDMX", year: "2024" },
  { id: 8, category: "Video", title: "Highlight boda Martínez-Rosas", location: "Valle de Bravo", year: "2025" },
  { id: 9, category: "Corporativo", title: "Evento anual Grupo Femsa", location: "WTC CDMX", year: "2024" },
]

export const team = [
  {
    name: "Marco Álvarez",
    role: "Director Creativo & Fotógrafo Principal",
    specialty: "Bodas · Retratos editoriales",
    exp: "15 años · Ex-editorial Vogue MX · Canon Explorer",
    avatar: "MA",
    color: "from-slate-600 to-slate-900",
    bio: "Formado en la Escuela Activa de Fotografía y con más de 15 años documentando bodas y retratos. Ha publicado en Vogue México, Quién y GQ. Canon Explorer of Light desde 2020.",
  },
  {
    name: "Sofía Ramírez",
    role: "Fotógrafa & Directora de Arte",
    specialty: "Corporativo · Producto · Lifestyle",
    exp: "11 años · CDMX · Sony Ambassador",
    avatar: "SR",
    color: "from-rose-700 to-rose-900",
    bio: "Especialista en fotografía de marca y producto. Ha trabajado con más de 80 marcas mexicanas y latinoamericanas para sus campañas digitales. Sony Ambassador y docente en CENTRO.",
  },
  {
    name: "Diego Fernández",
    role: "Videógrafo & Editor",
    specialty: "Bodas cinematic · Video institucional",
    exp: "9 años · Postproducción L.A. · DJI Pro",
    avatar: "DF",
    color: "from-amber-700 to-amber-900",
    bio: "Videógrafo con formación en Los Ángeles y especialidad en color grading cinemático. Maneja drone certificado por la AFAC. Ha producido videos institucionales para OXXO, Liverpool y Spotify MX.",
  },
  {
    name: "Valeria Cruz",
    role: "Asistente & Segunda Fotógrafa",
    specialty: "Bodas · Quinceañeras",
    exp: "5 años · UNAM Diseño · Nikon",
    avatar: "VC",
    color: "from-violet-700 to-violet-900",
    bio: "Fotógrafa egresada de la UNAM con especialidad en eventos sociales. Segunda fotógrafa oficial en más de 200 bodas. Coordina la logística del día y garantiza que no se pierda ningún ángulo del evento.",
  },
]

export const testimonials = [
  { name: "Daniela & Roberto Morales", handle: "Novios · Boda en Hacienda", avatar: "DM", text: "Marco y su equipo superaron todas nuestras expectativas. Las fotos de nuestra boda son cinematic, naturales y emotivas. Tres meses después, seguimos mirándolas con la misma emoción del primer día.", service: "Bodas", rating: 5, date: "Abr 2025" },
  { name: "Grupo Financiero Banorte", handle: "Dirección de Comunicación", avatar: "GB", text: "Profesionalismo total. Llegaron puntual, capturaron a todo el equipo directivo en una mañana y entregaron las fotos al día siguiente. Calidad que proyecta exactamente la imagen que buscamos.", service: "Corporativo", rating: 5, date: "Mar 2025" },
  { name: "Sra. Elena Vidal", handle: "Mamá de la quinceañera", avatar: "EV", text: "Sofía entendió perfectamente lo que queríamos: fotos que reflejaran la personalidad de mi hija, no fotos genéricas de quinceañera. El álbum quedó hermoso y el video me hace llorar cada vez que lo veo.", service: "Quinceañeras", rating: 5, date: "Feb 2025" },
  { name: "Cocina Madre — Restaurante", handle: "Dirección de Marketing", avatar: "CM", text: "Las fotos de producto para nuestra carta y redes sociales aumentaron el engagement un 340% en el primer mes. Sofía sabe exactamente cómo hacer que la comida se vea irresistible.", service: "Producto", rating: 5, date: "May 2025" },
  { name: "Ing. Carlos & Ana Reyes", handle: "Pareja · Sesión familiar", avatar: "CA", text: "Llevamos a toda la familia, incluidos los perros y un bebé de 8 meses. El equipo fue increíblemente paciente, divertido y profesional. Las fotos capturan perfectamente quiénes somos.", service: "Retratos", rating: 5, date: "Ene 2025" },
  { name: "Startup Kubo — Tech", handle: "CEO & Founder", avatar: "SK", text: "Necesitábamos headshots y fotos de oficina para el site y el pitch deck. Diego los entregó en 24 horas con una calidad que nos sorprendió. Cerramos la ronda de inversión esa misma semana.", service: "Corporativo", rating: 5, date: "Mar 2025" },
]

export const faqs = [
  { q: "¿Con cuánto tiempo debo reservar para una boda?", a: "Recomendamos reservar con 8-12 meses de anticipación, especialmente para bodas de mayo a noviembre que es temporada alta. Para eventos más pequeños o sesiones, 2-4 semanas suele ser suficiente. Confirma disponibilidad cuanto antes con 50% de anticipo." },
  { q: "¿Cuántas fotos entregamos?", a: "Depende del servicio: bodas 400-600 fotos editadas, quinceañeras 300-450, sesiones de retrato 30-50, corporativos según acuerdo. Todas las fotos se entregan en alta resolución via galería privada en línea, sin marca de agua." },
  { q: "¿En cuánto tiempo recibo las fotos?", a: "Sesiones de retrato: 2-3 semanas. Corporativo: 48-72 horas para headshots, 1 semana para eventos. Bodas y quinceañeras: 6-8 semanas para la edición completa. Video: 4-6 semanas para bodas, 1-2 semanas para reels." },
  { q: "¿Trabajan fuera de CDMX?", a: "Sí. Hemos trabajado en Guadalajara, Monterrey, Cancún, Los Cabos, Valle de Bravo y en destinos internacionales. El costo de traslado y hospedaje se cotiza por separado según la ubicación." },
  { q: "¿Qué pasa si llueve el día de mi boda?", a: "La lluvia crea fotos espectaculares si se planea bien. Siempre llegamos con equipo para lluvia y plan B de locaciones techadas. La cobertura no se cancela por clima — es parte de la experiencia que documentamos." },
  { q: "¿Incluyen impresiones o álbum físico?", a: "Algunos paquetes de boda incluyen álbum físico artesanal hecho en Italia. Para otros servicios, ofrecemos álbumes y prints como extras opcionales. Trabajamos con laboratorios de fine art print en CDMX." },
]

export const blogPosts = [
  { id: 1, slug: "que-llevar-sesion-fotos", title: "¿Qué ponerse para tu sesión de fotos? Guía completa por tipo de sesión", excerpt: "La ropa correcta puede hacer la diferencia entre fotos buenas y fotos extraordinarias. Te damos las recomendaciones que damos a todos nuestros clientes antes de su sesión.", category: "Tips & Consejos", date: "8 May 2025", readTime: "7 min", author: "Sofía Ramírez" },
  { id: 2, slug: "hora-dorada-fotografia", title: "Por qué la hora dorada cambia todo en la fotografía exterior", excerpt: "La luz del sol justo antes de la puesta cambia completamente la atmósfera de las fotos. Te explicamos cómo la aprovechamos y por qué deberías planear tus sesiones alrededor de ella.", category: "Técnica", date: "24 Abr 2025", readTime: "5 min", author: "Marco Álvarez" },
  { id: 3, slug: "video-boda-highlights", title: "Highlight vs película de boda: ¿cuál elegir y por qué?", excerpt: "El highlight de 3-5 minutos emocionará a tu red social. La película completa de 20-40 minutos es para ti. Te explicamos cuándo contratar cada uno o ambos.", category: "Bodas", date: "11 Abr 2025", readTime: "6 min", author: "Diego Fernández" },
  { id: 4, slug: "fotografia-producto-ecommerce", title: "Por qué las fotos profesionales de producto sí aumentan tus ventas", excerpt: "Datos reales de clientes: tiendas que actualizaron su fotografía de producto vieron un incremento del 25-340% en conversión. Te mostramos ejemplos antes y después.", category: "Producto", date: "28 Mar 2025", readTime: "8 min", author: "Sofía Ramírez" },
  { id: 5, slug: "headshot-corporativo-guia", title: "Headshot corporativo perfecto: todo lo que necesitas saber antes de la sesión", excerpt: "Desde qué ropa usar hasta cómo pararte, mirarte y respirar. La guía que enviamos a todos nuestros clientes corporativos antes de su sesión.", category: "Corporativo", date: "15 Mar 2025", readTime: "9 min", author: "Sofía Ramírez" },
  { id: 6, slug: "lluvia-boda-fotos", title: "Lluvia en tu boda: por qué puede ser una bendición fotográfica", excerpt: "Nuestras fotos de bodas con lluvia son algunas de las más épicas que hemos capturado. Te contamos cómo nos preparamos para convertir el mal clima en magia visual.", category: "Bodas", date: "3 Mar 2025", readTime: "5 min", author: "Marco Álvarez" },
]

export const equipment = [
  { brand: "Canon", model: "EOS R5 · R3", type: "Cámaras principales" },
  { brand: "Sony", model: "A7R V · FX3", type: "Video & cámara B" },
  { brand: "DJI", model: "Mavic 3 Pro", type: "Drone 4K certificado" },
  { brand: "Profoto", model: "B10X · B1X", type: "Flash estudio & exterior" },
  { brand: "Adobe", model: "Lightroom · Premiere · Davinci Resolve", type: "Edición & postproducción" },
]
