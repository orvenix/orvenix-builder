export interface Vehiculo {
  name: string
  tipo: string
  capacidad: string
  desc: string
  features: string[]
  img: string
  categoria: "sedan" | "suv" | "van" | "autobus"
}

export const flotilla: Vehiculo[] = [
  {
    name: "Mercedes-Benz E-Class",
    tipo: "Sedán Ejecutivo",
    capacidad: "3 pasajeros",
    desc: "El estándar del transporte ejecutivo. Interior en piel, Wi-Fi, cargadores inalámbricos y aislamiento acústico superior.",
    features: ["Wi-Fi 4G", "Cargador inalámbrico", "Agua mineral", "Periódicos digitales", "A/C dual"],
    img: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&h=400&fit=crop&q=85",
    categoria: "sedan",
  },
  {
    name: "BMW Serie 7",
    tipo: "Sedán Premium",
    capacidad: "3 pasajeros",
    desc: "El pináculo del lujo alemán. Asientos masajeadores, pantallas traseras y experiencia de conducción silenciosa.",
    features: ["Asientos masajeadores", "Pantallas traseras", "Wi-Fi", "Champagne a petición", "Insonorización total"],
    img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop&q=85",
    categoria: "sedan",
  },
  {
    name: "Chevrolet Suburban",
    tipo: "SUV Ejecutiva",
    capacidad: "6 pasajeros",
    desc: "Versatilidad, seguridad y confort para grupos pequeños o familias. Maletero amplio. Ideal para aeropuerto.",
    features: ["6 pasajeros", "Maletero XXL", "Pantallas traseras", "Wi-Fi", "Techo panorámico"],
    img: "https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?w=600&h=400&fit=crop&q=85",
    categoria: "suv",
  },
  {
    name: "Mercedes-Benz Sprinter",
    tipo: "Van Ejecutiva",
    capacidad: "14 pasajeros",
    desc: "La opción perfecta para grupos medianos, traslados corporativos y tours privados. Interior premium reconfigurable.",
    features: ["14 pasajeros", "Interior VIP", "Portaequipajes", "USB x10", "A/C techo"],
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop&q=85",
    categoria: "van",
  },
]

export const paquetes = [
  {
    name: "City Transfer",
    price: "$850",
    period: "por traslado",
    desc: "Traslado punto a punto en CDMX. Sedán ejecutivo, chófer uniformado. Hasta 3 pasajeros y 4 maletas.",
    features: ["Hasta 3 pax", "Sedán ejecutivo", "Chófer uniformado", "Combustible incluido"],
    cta: "Cotizar ahora",
    highlight: false,
  },
  {
    name: "Ejecutivo Día",
    price: "$4,800",
    period: "8 horas",
    desc: "Chófer profesional y vehículo premium a tu disposición por un día completo. Casetas y combustible incluidos.",
    features: ["8 horas continuas", "Sedán o SUV", "Casetas incluidas", "Combustible incluido", "Agua y revistas"],
    cta: "Reservar",
    highlight: true,
    badge: "Más vendido",
  },
  {
    name: "Tour Privado",
    price: "$1,800",
    period: "desde",
    desc: "Tour personalizado a los destinos que elijas. Guía bilingüe opcional. Grupos de 2 a 6 personas.",
    features: ["Destino a elegir", "Hasta 6 personas", "Guía bilingüe opcional", "Seguro de pasajeros", "Hidratación incluida"],
    cta: "Ver tours",
    highlight: false,
  },
]

export const zonasCobro = [
  { zona: "CDMX Centro", tiempo: "30–60 min", costo: "Desde $650" },
  { zona: "Polanco / Lomas", tiempo: "20–45 min", costo: "Desde $750" },
  { zona: "Santa Fe / Pedregal", tiempo: "45–70 min", costo: "Desde $900" },
  { zona: "Tlalnepantla / Naucalpan", tiempo: "60–90 min", costo: "Desde $1,100" },
  { zona: "Toluca", tiempo: "1.5–2h", costo: "Desde $2,200" },
  { zona: "Cuernavaca", tiempo: "1.5–2h", costo: "Desde $2,400" },
  { zona: "Puebla", tiempo: "2–2.5h", costo: "Desde $3,200" },
  { zona: "Querétaro", tiempo: "2.5–3h", costo: "Desde $4,500" },
]

export const testimoniosTransporte = [
  { name: "Dra. Claudia Herrera", handle: "Directora Médica", avatar: "CH", text: "Llevo 4 años usando TransEjecutivo para todos mis traslados. La puntualidad es excepcional y los chóferes son siempre profesionales y discretos. Lo mejor que he contratado.", rating: 5, date: "Abr 2026" },
  { name: "Grupo Banorte", handle: "Gerencia de Viajes", avatar: "GB", text: "Manejamos todos los traslados VIP de ejecutivos internacionales con ellos. Cero incidentes en 3 años. Respuesta inmediata a cambios de último momento. Proveedor imprescindible.", rating: 5, date: "Mar 2026" },
  { name: "Patricia Campos", handle: "Organizadora de eventos", avatar: "PC", text: "Coordinaron 28 unidades para una boda con 300 invitados. Llegaron todos puntual, las unidades impecables y el coordinador de operaciones estuvo disponible toda la noche. 100%.", rating: 5, date: "Feb 2026" },
  { name: "Ing. Ricardo Fuentes", handle: "CEO Startup Tech", avatar: "RF", text: "Usamos el paquete ejecutivo mensual. Excelente para impresionar clientes. El Suburban tiene mejor Wi-Fi que mi oficina y los chóferes hablan inglés básico. Todo listo.", rating: 5, date: "May 2026" },
]
