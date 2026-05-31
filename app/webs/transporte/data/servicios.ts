import { Plane, Car, MapPin, Users, Route, Star as StarIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface ServicioTransporte {
  id: string
  icon: LucideIcon
  name: string
  desc: string
  desde: string
  duracion: string
  color: string
  border: string
  bg: string
  tags: string[]
}

export const serviciosTransporte: ServicioTransporte[] = [
  {
    id: "aeropuerto",
    icon: Plane,
    name: "Traslado aeropuerto",
    desc: "Servicio puntual al AICM o AIFA. Monitoreo de vuelo en tiempo real, asistencia con equipaje y 30 min de espera incluidos sin cargo.",
    desde: "$850 MXN",
    duracion: "Según ruta",
    color: "text-blue-400",
    border: "border-blue-800/30",
    bg: "bg-blue-950/15",
    tags: ["AICM", "AIFA", "Seguimiento de vuelo", "Equipaje incluido"],
  },
  {
    id: "ejecutivo",
    icon: Car,
    name: "Transporte ejecutivo",
    desc: "Vehículos premium (Mercedes, BMW, Suburban) con chófer uniformado. Ideal para juntas de negocio, visitas corporativas y atención a clientes VIP.",
    desde: "$1,200 MXN / hora",
    duracion: "Mínimo 2h",
    color: "text-slate-300",
    border: "border-slate-600/30",
    bg: "bg-slate-800/20",
    tags: ["Mercedes-Benz", "BMW 7", "Suburban", "Uniformado"],
  },
  {
    id: "turismo",
    icon: MapPin,
    name: "Tours & turismo",
    desc: "Recorridos turísticos a Teotihuacán, Xochimilco, Taxco, Valle de Bravo y más. Guía bilingüe opcional. Grupos de 2 a 14 personas.",
    desde: "$1,800 MXN",
    duracion: "Medio o día completo",
    color: "text-emerald-400",
    border: "border-emerald-800/30",
    bg: "bg-emerald-950/15",
    tags: ["Bilingüe", "Teotihuacán", "Xochimilco", "Tours privados"],
  },
  {
    id: "grupos",
    icon: Users,
    name: "Transporte de grupos",
    desc: "Sprinters y autobuses para eventos corporativos, bodas, convenciones y traslados masivos. Hasta 50 personas en una sola unidad.",
    desde: "$3,500 MXN",
    duracion: "Según evento",
    color: "text-violet-400",
    border: "border-violet-800/30",
    bg: "bg-violet-950/15",
    tags: ["Sprinter 15 pax", "Autobús 30-50", "Eventos", "Bodas"],
  },
  {
    id: "mensajeria",
    icon: Route,
    name: "Mensajería & encomiendas",
    desc: "Envíos mismo día dentro de CDMX y zona metropolitana. Seguimiento en tiempo real. Ideal para documentos urgentes, paquetería y materiales.",
    desde: "$280 MXN",
    duracion: "3-4 horas CDMX",
    color: "text-amber-400",
    border: "border-amber-800/30",
    bg: "bg-amber-950/15",
    tags: ["Mismo día", "Tracking", "CDMX & EDOMEX", "Urgente"],
  },
  {
    id: "renta-chofer",
    icon: StarIcon,
    name: "Renta con chófer (diaria)",
    desc: "Chófer profesional por día completo (8h). Vehículo de categoría a elección: sedán, SUV o Suburban. Incluye combustible y casetas.",
    desde: "$4,800 MXN",
    duracion: "8 horas",
    color: "text-cyan-400",
    border: "border-cyan-800/30",
    bg: "bg-cyan-950/15",
    tags: ["8 horas", "Combustible incluido", "Casetas incluidas", "Sedán / SUV"],
  },
]

export const statsTransporte = [
  { value: "12 años", label: "En operación" },
  { value: "80+", label: "Unidades disponibles" },
  { value: "98.7%", label: "Puntualidad" },
  { value: "24/7", label: "Operación continua" },
]
