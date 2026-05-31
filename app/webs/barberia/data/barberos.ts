export interface Barbero {
  name: string
  role: string
  esp: string
  exp: string
  avatar: string
  color: string
  ig?: string
}

export const barberos: Barbero[] = [
  {
    name: "Don Esteban Ruiz",
    role: "Master Barber · Fundador",
    esp: "Afeitado clásico · Cortes vintage",
    exp: "28 años de oficio",
    avatar: "ER",
    color: "from-stone-600 to-stone-800",
    ig: "@donestebar",
  },
  {
    name: "Rodrigo Vega",
    role: "Senior Barber",
    esp: "Fades técnicos · Diseños",
    exp: "12 años",
    avatar: "RV",
    color: "from-amber-700 to-amber-900",
    ig: "@rodfades",
  },
  {
    name: "Isaac Morales",
    role: "Senior Barber",
    esp: "Color · Mechas · Texturizado",
    exp: "9 años",
    avatar: "IM",
    color: "from-zinc-600 to-zinc-800",
    ig: "@isaaccuts",
  },
  {
    name: "Daniela Peña",
    role: "Barber & Stylist",
    esp: "Corte femenino · Tratamientos",
    exp: "7 años",
    avatar: "DP",
    color: "from-rose-700 to-rose-900",
    ig: "@dani.barber",
  },
]

export const testimoniosBarber = [
  { name: "Alejandro Ríos", handle: "Cliente desde 2019", avatar: "AR", text: "Llevo 6 años viniendo a Señorío Barber y nunca me han fallado. Rodrigo hace los mejores fades de la ciudad. La experiencia es premium pero el precio es honesto.", rating: 5, date: "May 2026" },
  { name: "Lic. Miguel Torres", handle: "Cliente frecuente", avatar: "MT", text: "El paquete VIP es una experiencia increíble. Toallas calientes, afeitado con navaja y tratamiento capilar. Sales renovado completamente. Vale cada peso.", rating: 5, date: "Abr 2026" },
  { name: "Jorge Espinoza", handle: "Cliente desde 2021", avatar: "JE", text: "Don Esteban es un artista. El afeitado clásico con su navaja y espuma artesanal no tiene comparación en la ciudad. Tradición y calidad al máximo nivel.", rating: 5, date: "Mar 2026" },
  { name: "Carlos Méndez", handle: "Cliente frecuente", avatar: "CM", text: "Ambiente increíble, música buena, atención puntual. Isaac me hizo el mejor trabajo de color que he tenido. Ya no voy a ningún otro lado.", rating: 5, date: "Feb 2026" },
]

export const faqsBarber = [
  { q: "¿Necesito reservar o puedo ir de walk-in?", a: "Aceptamos tanto reservas como walk-in. Recomendamos reservar especialmente para fines de semana o para servicios de más de 60 min. Puedes hacerlo por WhatsApp o directamente en el formulario." },
  { q: "¿Qué productos usan?", a: "Trabajamos exclusivamente con productos profesionales: Suavecito, Reuzel, Proraso, Uppercut Deluxe y Osmo. Todos disponibles para venta en tienda." },
  { q: "¿Tienen parqueo disponible?", a: "Sí, tenemos 2 cajones exclusivos para clientes frente al local. También hay estacionamiento público a media cuadra." },
  { q: "¿Cuánto tiempo dura una cita con reserva?", a: "Respetamos al minuto los tiempos publicados. Una vez confirmada tu reserva, tu barbero estará listo 5 minutos antes para recibirte." },
]
