import { Scissors, Star, Clock, Users, Award, Shield } from "lucide-react"

export const brand = {
  name: "Señorío",
  sub: "Barbershop & Grooming",
  tagline: "El arte del caballero moderno",
  email: "citas@senorio.mx",
  phone: "+52 55 6677 1234",
  whatsapp: "+52 55 6677 1234",
  address: "Álvaro Obregón 110, Roma Norte, CDMX",
  founded: "2015",
  instagram: "@senoriobarbershop",
  horario: "Lun–Sáb 9:00–20:00 · Dom 10:00–18:00",
}

export const stats = [
  { value: "+920", label: "Reseñas Google" },
  { value: "4.9★", label: "Calificación promedio" },
  { value: "10 años", label: "En la Roma Norte" },
  { value: "3", label: "Sucursales CDMX" },
]

export const servicios = [
  { nombre: "Corte Clásico", desc: "Corte a tijera o máquina con acabado perfecto. Incluye lavado, secado y estilizado.", duracion: "45 min", precio: "$250", icon: Scissors, color: "text-amber-400", bg: "bg-amber-950/15", border: "border-amber-800/30" },
  { nombre: "Afeitado Clásico", desc: "Afeitado con navaja recta, vapor caliente, masaje facial y bálsamo post-afeitado artesanal.", duracion: "35 min", precio: "$220", icon: Shield, color: "text-stone-400", bg: "bg-stone-950/15", border: "border-stone-800/30" },
  { nombre: "Corte + Barba", desc: "Combo premium: corte personalizado más perfilado y arreglo completo de barba. El más popular.", duracion: "70 min", precio: "$420", icon: Star, color: "text-orange-400", bg: "bg-orange-950/15", border: "border-orange-800/30", popular: true },
  { nombre: "Fade & Design", desc: "Fades de bajo, medio o alto con detalles de diseño. Especialidad de la casa.", duracion: "60 min", precio: "$350", icon: Award, color: "text-indigo-400", bg: "bg-indigo-950/15", border: "border-indigo-800/30" },
  { nombre: "Tratamiento de Barba", desc: "Hidratación profunda con aceites naturales, peinado y fijación de forma. Para barba seca o con caspa.", duracion: "30 min", precio: "$180", icon: Users, color: "text-emerald-400", bg: "bg-emerald-950/15", border: "border-emerald-800/30" },
  { nombre: "Ritual Premium", desc: "2 horas de experiencia completa: corte, afeitado, masaje craneal, tratamiento facial y bebida de bienvenida.", duracion: "120 min", precio: "$750", icon: Clock, color: "text-rose-400", bg: "bg-rose-950/15", border: "border-rose-800/30" },
]

export const equipo = [
  { name: "Maestro Carlos Reyes", role: "Director & Barbero Principal", specialty: "Cortes clásicos · Navajas · Fades técnicos", exp: "22 años · Formado en Sevilla · Ganador NHF Award 2022", avatar: "CR", color: "from-amber-700 to-amber-900" },
  { name: "Barbero Luis Ortega", role: "Barbero Senior", specialty: "Skin fade · Diseños · Afro texture", exp: "14 años · Campeón CDMX Barber Battle 2023", avatar: "LO", color: "from-stone-700 to-stone-900" },
  { name: "Barbero David Pérez", role: "Barbero", specialty: "Cortes texturizados · Barba larga · Tratamientos", exp: "9 años · Certificado Wahl Pro", avatar: "DP", color: "from-slate-700 to-gray-900" },
  { name: "Barbero Marco Silva", role: "Barbero", specialty: "Buzz cut · Taper fade · Cortes juveniles", exp: "6 años · Andis Ambassador", avatar: "MS", color: "from-zinc-700 to-zinc-900" },
]

export const testimonials = [
  { name: "Lic. Andrés Morales", handle: "Cliente desde 2018", avatar: "AM", text: "El maestro Carlos hace el mejor afeitado clásico de CDMX. El ritual de vapor, navaja y bálsamo artesanal es una experiencia que no tiene precio. Vengo cada dos semanas religiosamente.", servicio: "Afeitado Clásico", rating: 5, date: "May 2025" },
  { name: "Rodrigo Espinoza", handle: "Diseñador", avatar: "RE", text: "Luis Ortega hace fades que no he visto en ningún otro lugar de la ciudad. Preciso, rápido y siempre con el mismo resultado impecable. El ambiente del local es increíble también.", servicio: "Fade & Design", rating: 5, date: "Abr 2025" },
  { name: "Ing. Samuel Torres", handle: "Cliente frecuente", avatar: "ST", text: "El combo corte + barba es la mejor inversión que hago cada mes. Mi imagen profesional mejoró notablemente y varios colegas me preguntaron dónde me cortaba. Ahora también van a Señorío.", servicio: "Corte + Barba", rating: 5, date: "Mar 2025" },
  { name: "Chef Javier Benítez", handle: "Cliente VIP", avatar: "JB", text: "El ritual premium de 2 horas parece ridículo hasta que lo vives. El masaje craneal y el tratamiento facial son inesperadamente relajantes. Perfecto para antes de un evento importante.", servicio: "Ritual Premium", rating: 5, date: "Feb 2025" },
]

export const faqs = [
  { q: "¿Necesito cita o acepto walk-ins?", a: "Recomendamos agendar cita con al menos 24 horas de anticipación, especialmente para fines de semana. Aceptamos walk-ins sujeto a disponibilidad del barbero. La cita garantiza tu tiempo y barbero preferido." },
  { q: "¿Qué incluye el servicio de barba?", a: "Perfilado con navaja, definición del contorno, hidratación con aceite de jojoba y fijación con pomada artesanal. Para barba muy larga añadimos recorte a la forma deseada sin cargo adicional." },
  { q: "¿Usan productos naturales?", a: "Sí. Todos nuestros aceites, bálsamos y tratamientos son formulados con ingredientes naturales. Sin parabenos, sin sulfatos. También vendemos en tienda para que continúes el cuidado en casa." },
  { q: "¿Hacen servicios a domicilio?", a: "Ofrecemos servicio a domicilio para bodas, eventos corporativos y grupos de más de 4 personas. Contactar con mínimo 72 horas de anticipación. Tarifa adicional según zona de la CDMX." },
  { q: "¿Tienen membresías o paquetes?", a: "Sí. El Plan Caballero incluye 4 cortes mensuales con 15% de descuento. El Plan Premium incluye 4 cortes + 2 afeitados. Ambos se activan mensualmente sin permanencia." },
]

export const blogPosts = [
  { id: 1, slug: "tipos-barba-cara", title: "Qué tipo de barba te queda según la forma de tu cara", excerpt: "No todas las barbas favorecen a todos. El maestro Carlos explica cómo identificar tu forma de rostro y qué estilos de barba te van a hacer lucir mejor.", category: "Estilo", date: "9 May 2025", readTime: "6 min", author: "Maestro Carlos Reyes" },
  { id: 2, slug: "cuidado-barba-larga", title: "Cómo mantener una barba larga sin que parezca descuidada", excerpt: "El truco no está en no recortarla, sino en hidratarla, moldearla y saber cuándo visitar al barbero. La guía completa para los que van por el look de barba épica.", category: "Grooming", date: "2 May 2025", readTime: "8 min", author: "Barbero Luis Ortega" },
  { id: 3, slug: "aceites-barba-guia", title: "Aceites de barba: cuál usar según tu tipo de piel y textura", excerpt: "Jojoba para piel grasa, argán para piel seca, coco para barba gruesa. Explicamos cómo elegir el aceite correcto y cómo aplicarlo para máximo beneficio.", category: "Productos", date: "25 Abr 2025", readTime: "5 min", author: "Maestro Carlos Reyes" },
  { id: 4, slug: "historia-barberia-clasica", title: "Por qué la barbería clásica está de regreso — y para quedarse", excerpt: "De Sweeney Todd a Boardwalk Empire: la estética de la barbería clásica tiene un atractivo que no pasa de moda. Exploramos el renacimiento del grooming masculino en México.", category: "Cultura", date: "18 Abr 2025", readTime: "7 min", author: "Señorío Editorial" },
]
