import { Coffee, Droplets, Leaf, Car, Wifi, Utensils } from "lucide-react"

export const brand = {
  name: "Grand Palacio",
  sub: "Hotel & Suites",
  tagline: "Donde el lujo se encuentra con la calidez mexicana",
  email: "reservas@grandpalacio.mx",
  phone: "+52 55 8800 5544",
  whatsapp: "+52 55 8800 5544",
  address: "Paseo de la Reforma 2180, Lomas, CDMX",
  founded: "2010",
  tripadvisor: "TripAdvisor Certificate of Excellence 2024",
  rating: "4.9 · 1,840 reseñas",
}

export const stats = [
  { value: "4.9★", label: "Google & TripAdvisor" },
  { value: "86", label: "Habitaciones y suites" },
  { value: "15 años", label: "De hospitalidad" },
  { value: "98%", label: "Tasa de regreso" },
]

export const habitaciones = [
  { name: "Suite Presidencial", size: "120 m²", view: "Vista Reforma", guests: "2–4", price: "$18,500", night: "noche", amenities: ["King size 200×200", "Sala de estar independiente", "Jacuzzi privado", "Terraza con vista panorámica", "Butler service 24h", "Minibar premium curado"], color: "text-amber-400", bg: "bg-amber-950/15", border: "border-amber-800/30", badge: "La más exclusiva" },
  { name: "Suite Junior Deluxe", size: "75 m²", view: "Vista jardín/ciudad", guests: "2", price: "$8,900", night: "noche", amenities: ["King size", "Sala de estar integrada", "Baño con tina romana", "Cafetera Nespresso", "Smart TV 65\"", "Caja de seguridad"], color: "text-rose-400", bg: "bg-rose-950/15", border: "border-rose-800/30" },
  { name: "Habitación Superior", size: "45 m²", view: "Vista ciudad", guests: "2", price: "$5,200", night: "noche", amenities: ["King o Twin", "Escritorio ejecutivo", "Ducha lluvia italiana", "Amenities Molton Brown", "Smart TV 55\"", "Servicio al cuarto 24h"], color: "text-indigo-400", bg: "bg-indigo-950/15", border: "border-indigo-800/30" },
  { name: "Habitación Estándar", size: "32 m²", view: "Jardín interior", guests: "2", price: "$3,800", night: "noche", amenities: ["King o Twin", "Baño completo premium", "Smart TV", "Caja de seguridad", "Wifi 1Gbps", "Cafetera"], color: "text-teal-400", bg: "bg-teal-950/15", border: "border-teal-800/30" },
]

export const servicios = [
  { icon: Leaf, name: "Spa & Wellness", desc: "2,000 m² dedicados al bienestar: masajes, tratamientos faciales, body wraps, sauna finlandés, temazcal y alberca de hidroterapia.", tags: ["Lunes–Domingo 7–22h", "Reserva obligatoria", "Solo huéspedes y día spa"], color: "text-rose-400", bg: "bg-rose-950/15", border: "border-rose-800/30" },
  { icon: Utensils, name: "Restaurante Terraza", desc: "Cocina mexicana contemporánea en el piso 22 con vista panorámica de 360°. Desayuno bufé, comida y cena. Chef ejecutivo con experiencia internacional.", tags: ["7:00–23:00", "Dress code casual elegante", "Reserva recomendada"], color: "text-amber-400", bg: "bg-amber-950/15", border: "border-amber-800/30" },
  { icon: Droplets, name: "Alberca Infinity", desc: "Alberca climatizada exterior en el piso 18 con vista a la ciudad. Bar de alberca, tumbonas premium y butler de alberca de lunes a domingo.", tags: ["7:00–21:00", "Solo huéspedes", "Temperatura controlada 28°C"], color: "text-cyan-400", bg: "bg-cyan-950/15", border: "border-cyan-800/30" },
  { icon: Coffee, name: "Bar & Lobby Lounge", desc: "Coctelería artesanal con mezcales y whiskies seleccionados, tapas gourmet y música en vivo los fines de semana. El mejor afterwork de la Reforma.", tags: ["12:00–02:00 L-V", "12:00–03:00 F-S", "Música en vivo V-S 21h"], color: "text-violet-400", bg: "bg-violet-950/15", border: "border-violet-800/30" },
  { icon: Car, name: "Concierge & Traslados", desc: "Equipo de concierge disponible 24/7 para restaurantes, espectáculos, tours y traslados ejecutivos al aeropuerto o cualquier destino en la ciudad.", tags: ["24/7", "Flota ejecutiva propia", "Aeropuerto AICM y AIFA"], color: "text-emerald-400", bg: "bg-emerald-950/15", border: "border-emerald-800/30" },
  { icon: Wifi, name: "Business Center", desc: "Salas de juntas privadas con capacidad de 6–40 personas, equipo audiovisual de última generación y servicio de catering ejecutivo.", tags: ["Salas desde 2h", "Capacidad 6–40 pax", "Catering incluido opcional"], color: "text-blue-400", bg: "bg-blue-950/15", border: "border-blue-800/30" },
]

export const paquetes = [
  { name: "Luna de Miel", icon: "💍", desc: "Check-in VIP, pétalo de rosa en habitación, botella de champagne, cena romántica en terraza y late check-out incluido.", price: "Desde $3,200 adicional", highlight: true },
  { name: "Descanso Total", icon: "🧘", desc: "2 noches mínimo, desayuno bufé incluido, 1 sesión de spa por persona, acceso ilimitado a alberca y gym.", price: "Desde $2,100/noche", highlight: false },
  { name: "Negocios Premium", icon: "💼", desc: "Check-in exprés, sala de juntas por 2h, desayuno ejecutivo, traslado aeropuerto y acceso Business Lounge.", price: "Desde $1,500 adicional", highlight: false },
  { name: "Cumpleaños & Celebraciones", icon: "🎂", desc: "Decoración temática en habitación, pastel artesanal personalizado, botella de vino y serenata opcional.", price: "Desde $1,800 adicional", highlight: false },
]

export const testimonials = [
  { name: "Familia Hernández Vega", handle: "Huéspedes frecuentes", avatar: "HV", text: "Ya van 4 aniversarios celebrados en el Grand Palacio. El equipo recuerda nuestras preferencias desde la primera vez. El spa es absolutamente excepcional y la vista desde la Suite Presidencial no tiene comparación en CDMX.", tipo: "Suite Presidencial", rating: 5, date: "Jun 2025" },
  { name: "Lic. Carlos Bernal", handle: "Viajero de negocios", avatar: "CB", text: "Vengo al menos una vez al mes por trabajo. El equipo de concierge organiza mis reuniones perfectamente. El Business Lounge es silencioso y funcional. Y el desayuno bufé es el mejor que he visto en un hotel de negocios en México.", tipo: "Habitación Superior", rating: 5, date: "May 2025" },
  { name: "Sra. Marie Dupont", handle: "Huésped de Francia", avatar: "MD", text: "J'ai séjourné dans beaucoup d'hôtels 5 étoiles à travers le monde. Le Grand Palacio est dans mon top 5 absolu. Le service est chaleureux, la vue est incroyable et le spa est exceptionnel.", tipo: "Suite Junior Deluxe", rating: 5, date: "Abr 2025" },
  { name: "Sr. & Sra. Nakamura", handle: "Luna de miel desde Japón", avatar: "NK", text: "Best honeymoon experience ever. The staff arranged everything perfectly: rose petals, champagne, private dinner on the rooftop terrace. We will definitely come back for our anniversary.", tipo: "Suite Presidencial", rating: 5, date: "Mar 2025" },
]

export const faqs = [
  { q: "¿Cuál es el horario de check-in y check-out?", a: "Check-in: 15:00. Check-out: 12:00. Solicitamos late check-out hasta las 15:00 sin cargo adicional sujeto a disponibilidad. Para suites, late check-out hasta las 18:00 con cargo adicional según temporada." },
  { q: "¿Aceptan mascotas?", a: "Sí. El Grand Palacio es pet-friendly para mascotas de hasta 10 kg. Cargo de $500 MXN por noche. Incluye cama, platos y amenidades para tu mascota. No se permiten mascotas en áreas comunes de restaurante y spa." },
  { q: "¿Tienen estacionamiento?", a: "Sí. Valet parking incluido para todos los huéspedes. Capacidad para 120 autos. Huéspedes de suite tienen acceso prioritario. Hora adicional $80 MXN." },
  { q: "¿El desayuno está incluido?", a: "El desayuno bufé está incluido en los paquetes 'Descanso Total' y 'Negocios Premium'. En tarifas base, el desayuno es opcional: $380 MXN/persona en el Restaurante Terraza. Servicio al cuarto disponible 7–12h." },
  { q: "¿Realizan eventos corporativos?", a: "Sí. Contamos con 8 salas de juntas (6–200 personas), salón de eventos para hasta 400 invitados, equipo AV completo y equipo de coordinación de eventos dedicado. Solicitar cotización con mínimo 4 semanas de anticipación." },
  { q: "¿Tienen servicio al cuarto 24 horas?", a: "Sí. Menú completo del restaurante disponible 24h. Suites: butler service dedicado. Tiempo de entrega promedio: 25 minutos. Sin cargo por servicio al cuarto para huéspedes de suite." },
]

export const blogPosts = [
  { id: 1, slug: "reforma-turismo-guide", title: "Guía definitiva del Paseo de la Reforma: lo que debes ver, comer y vivir en 48 horas", excerpt: "La arteria más icónica de Ciudad de México tiene capas que la mayoría de los visitantes jamás descubren. Nuestro equipo de concierge comparte los secretos de Reforma después de 15 años de recomendaciones.", category: "Guía de ciudad", date: "10 May 2025", readTime: "12 min", author: "Equipo Concierge Grand Palacio" },
  { id: 2, slug: "cocteleria-mezcal-cdmx", title: "Los mejores mezcales para comenzar tu amor por el agave, según nuestro bartender", excerpt: "El mezcal artesanal de Oaxaca y Guerrero ha conquistado los mejores bars del mundo. Marco, nuestro bartender con 18 años de experiencia, te guía por los 10 mezcales imprescindibles.", category: "Bar & Gastronomía", date: "3 May 2025", readTime: "8 min", author: "Marco Villanueva, Bartender Senior" },
  { id: 3, slug: "spa-ritual-temazcal", title: "El temazcal: tradición prehispánica que deberías experimentar antes de irte de México", excerpt: "Mucho más que un baño de vapor, el temazcal es una experiencia espiritual y física de 5,000 años. Nuestra directora de spa explica el ritual y por qué los atletas y celebridades lo adoptan.", category: "Wellness", date: "26 Abr 2025", readTime: "7 min", author: "Directora de Spa, Dra. Lucía Reyes" },
  { id: 4, slug: "viaje-de-negocios-cdmx", title: "La guía del viajero de negocios en CDMX: lo que nadie te dice antes de venir", excerpt: "Zonas empresariales, tráfico, networking y los mejores restaurantes para cerrar tratos. Todo lo que necesitas saber para que tu viaje a CDMX sea productivo y memorable.", category: "Business Travel", date: "18 Abr 2025", readTime: "9 min", author: "Equipo Concierge Grand Palacio" },
]
