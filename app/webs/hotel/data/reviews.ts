export interface Review {
  name: string
  handle: string
  avatar: string
  text: string
  fecha: string
  rating: number
  tipo: string
}

export const reviews: Review[] = [
  {
    name: "Ana Lucía Fernández",
    handle: "Ciudad de México",
    avatar: "AF",
    text: "Una experiencia que supera todas las expectativas. La Junior Suite con terraza privada fue mágica. El desayuno gourmet, la atención del personal y los detalles en habitación hacen de este lugar algo único en México.",
    fecha: "Abr 2026",
    rating: 5,
    tipo: "Junior Suite",
  },
  {
    name: "Mr. James Crawford",
    handle: "Toronto, Canada",
    avatar: "JC",
    text: "Best boutique hotel I've stayed at in all of Latin America. The staff speaks excellent English, the spa treatments were world-class, and the Master Suite penthouse view is breathtaking. Will return.",
    fecha: "Mar 2026",
    rating: 5,
    tipo: "Master Suite",
  },
  {
    name: "Familia Gutiérrez-Mora",
    handle: "Guadalajara, Jalisco",
    avatar: "FG",
    text: "Vinimos a celebrar un aniversario y el hotel lo organizó todo a la perfección. Pétalos en la habitación, champaña y una cena en la terraza que nunca olvidaremos. Atención personalizada excepcional.",
    fecha: "Feb 2026",
    rating: 5,
    tipo: "Superior City View",
  },
  {
    name: "Carlos Pérez García",
    handle: "Monterrey, N.L.",
    avatar: "CP",
    text: "Viaje de negocios pero me fue imposible no disfrutarlo. El escritorio ejecutivo es muy cómodo, Wi-Fi rápido y el servicio de conserjería me organizó reuniones y traslados sin contratiempos. Regresaré.",
    fecha: "Ene 2026",
    rating: 5,
    tipo: "Superior City View",
  },
  {
    name: "Valentina Rojas",
    handle: "Buenos Aires, Argentina",
    avatar: "VR",
    text: "El spa es increíble. El masaje de piedras volcánicas fue la mejor experiencia en mucho tiempo. El ambiente del hotel mezcla lo contemporáneo con lo artesanal mexicano de una manera muy elegante.",
    fecha: "May 2026",
    rating: 5,
    tipo: "Deluxe Garden View",
  },
  {
    name: "Dr. Andrés Villanueva",
    handle: "Ciudad de México",
    avatar: "AV",
    text: "Llevamos a nuestros clientes internacionales aquí cuando vienen a CDMX. Siempre quedamos bien. La calidad, la discreción y el nivel de servicio es consistente en cada visita. Nuestro hotel de cabecera.",
    fecha: "Mar 2026",
    rating: 5,
    tipo: "Master Suite",
  },
]

export const faqsHotel = [
  { q: "¿El desayuno está incluido en la tarifa?", a: "El desayuno gourmet buffet está incluido en la tarifa de todas las habitaciones para dos personas. Para huéspedes adicionales tiene un costo de $350 MXN por persona." },
  { q: "¿Cuáles son los horarios de check-in y check-out?", a: "Check-in: 3:00 PM. Check-out: 12:00 PM. Late check-out hasta las 3 PM disponible por $500 MXN sujeto a disponibilidad. Los huéspedes de Master Suite tienen check-in/check-out flexible sin cargo." },
  { q: "¿Aceptan mascotas?", a: "Aceptamos mascotas pequeñas (hasta 10 kg) con cargo adicional de $400 MXN/noche. Contamos con amenities para mascotas y el jardín interior está disponible. Consultar disponibilidad al reservar." },
  { q: "¿Tienen paquetes para eventos especiales?", a: "Sí. Ofrecemos paquetes para aniversarios, cumpleaños, propuestas de matrimonio y lunas de miel con decoración, champaña, cena privada y amenidades especiales. Contáctanos para personalizar." },
  { q: "¿Cuál es la política de cancelación?", a: "Cancelación gratuita hasta 48 horas antes del check-in. Cancelaciones con menos de 48 horas o no-show tienen cargo de 1 noche. Reservas de temporada alta (Navidad, AñoNuevo, Semana Santa) tienen políticas especiales." },
]
