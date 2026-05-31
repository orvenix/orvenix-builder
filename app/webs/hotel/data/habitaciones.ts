export interface Habitacion {
  id: string
  name: string
  desc: string
  precio: number
  size: string
  capacidad: string
  vista: string
  features: string[]
  popular?: boolean
  img: string
}

export const habitaciones: Habitacion[] = [
  {
    id: "deluxe",
    name: "Deluxe Garden View",
    desc: "Habitación luminosa con vista al jardín interior, cama king-size con ropa de cama premium y baño con ducha de lluvia.",
    precio: 2800,
    size: "32 m²",
    capacidad: "2 personas",
    vista: "Jardín",
    popular: false,
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop&q=85",
    features: ["King-size", "AC centralizado", "Smart TV 55\"", "Wi-Fi 500 Mbps", "Minibar", "Caja fuerte"],
  },
  {
    id: "superior",
    name: "Superior City View",
    desc: "Amplia habitación con vista panorámica a la ciudad. Cama king-size, sala de estar y escritorio de trabajo ejecutivo.",
    precio: 3900,
    size: "42 m²",
    capacidad: "2 personas",
    vista: "Ciudad",
    popular: true,
    img: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&h=500&fit=crop&q=85",
    features: ["King-size", "Sala de estar", "Escritorio ejecutivo", "Cafetera Nespresso", "Bañera + ducha", "Pantuflas y bata"],
  },
  {
    id: "junior-suite",
    name: "Junior Suite",
    desc: "Suite con sala separada, terraza privada y vista al volcán. Perfecta para estancias especiales o trabajo extendido.",
    precio: 5800,
    size: "68 m²",
    capacidad: "3 personas",
    vista: "Terraza + volcán",
    popular: false,
    img: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop&q=85",
    features: ["King-size + sofá cama", "Terraza privada", "Sala separada", "Bar surtido", "Jacuzzi interior", "Mayordomía"],
  },
  {
    id: "master-suite",
    name: "Master Suite Penthouse",
    desc: "La suite más exclusiva del hotel. Dos pisos, terraza 360°, jacuzzi exterior y servicio de mayordomía personalizado.",
    precio: 12500,
    size: "140 m²",
    capacidad: "4 personas",
    vista: "360° panorámica",
    popular: false,
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=500&fit=crop&q=85",
    features: ["2 recámaras king-size", "Jacuzzi exterior 360°", "Sala y comedor privados", "Cocina equipada", "Mayordomía 24h", "Check-in/out flexibles"],
  },
]

export const statsHotel = [
  { value: "4.9★", label: "Calificación promedio" },
  { value: "24", label: "Habitaciones únicas" },
  { value: "15 años", label: "De hospitalidad" },
  { value: "100%", label: "Diseño artesanal" },
]

export const serviciosHotel = [
  { emoji: "🍳", name: "Desayuno gourmet", desc: "Buffet artesanal 7–11 AM. Ingredientes locales de temporada." },
  { emoji: "🏊", name: "Alberca climatizada", desc: "Abierta todo el año. Toallas y bebidas de cortesía incluidas." },
  { emoji: "💆", name: "Spa & bienestar", desc: "Masajes, tratamientos faciales y corporales con reserva anticipada." },
  { emoji: "🏋️", name: "Gimnasio equipado", desc: "Acceso libre para huéspedes. Equipo Life Fitness. 6 AM – 10 PM." },
  { emoji: "🍷", name: "Bar & terraza", desc: "Carta de vinos mexicanos e internacionales. Abierto hasta medianoche." },
  { emoji: "🚗", name: "Valet parking", desc: "Servicio disponible 24h. Estacionamiento seguro en instalaciones." },
  { emoji: "🧳", name: "Conserjería 24h", desc: "Reservas, traslados, tours y atención personalizada a cualquier hora." },
  { emoji: "🍽️", name: "Room service", desc: "Menú completo disponible de 7 AM a 12 AM. Sin cargo adicional." },
]
