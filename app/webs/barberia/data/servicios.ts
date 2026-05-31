export interface Servicio {
  name: string
  desc: string
  precio: number
  duracion: string
  popular?: boolean
}

export const servicios: Servicio[] = [
  { name: "Corte clásico", desc: "Corte a tijera o máquina con terminado perfecto. Incluye lavado, secado y estilizado.", precio: 280, duracion: "45 min", popular: true },
  { name: "Corte + barba", desc: "Corte de cabello más perfilado y arreglo de barba con navaja y toalla caliente.", precio: 420, duracion: "70 min", popular: true },
  { name: "Afeitado clásico", desc: "Afeitado con navaja de barbero, espuma artesanal y toallas calientes. Experiencia tradicional.", precio: 250, duracion: "35 min" },
  { name: "Diseño de barba", desc: "Perfilado, despunte y diseño personalizado de barba con productos premium.", precio: 200, duracion: "30 min" },
  { name: "Fade / Degradado", desc: "Degradado técnico: skin fade, low, mid o high fade. Línea de nuca perfecta.", precio: 320, duracion: "50 min", popular: true },
  { name: "Corte infantil", desc: "Corte para niños menores de 12 años. Paciencia garantizada. Incluye dulce.", precio: 220, duracion: "35 min" },
  { name: "Tratamiento capilar", desc: "Hidratación profunda con keratina o aceite de argán. Elimina frizz y da brillo.", precio: 380, duracion: "60 min" },
  { name: "Color / Mechas", desc: "Coloración, mechas o rayitos con productos ammonia-free. Incluye toning.", precio: 650, duracion: "90 min" },
  { name: "Paquete VIP", desc: "Corte + barba + afeitado clásico + tratamiento capilar + masaje de cuero cabelludo.", precio: 1100, duracion: "150 min" },
]

export const statsBarber = [
  { value: "11 años", label: "En el oficio" },
  { value: "4,800+", label: "Clientes fieles" },
  { value: "98%", label: "De satisfacción" },
  { value: "8", label: "Barberos expertos" },
]

export const galeriaItems = [
  { label: "Fade & Texture", img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&h=600&fit=crop&crop=top&q=85" },
  { label: "Classic Taper", img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=600&fit=crop&crop=top&q=85" },
  { label: "Beard Design", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop&crop=center&q=85" },
  { label: "Skin Fade", img: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=600&h=600&fit=crop&crop=top&q=85" },
  { label: "Textured Crop", img: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=600&h=600&fit=crop&crop=top&q=85" },
  { label: "Classic Shave", img: "https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=600&h=600&fit=crop&crop=center&q=85" },
]
