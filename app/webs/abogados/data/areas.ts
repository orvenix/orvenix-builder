import { Scale, Building2, Home, Users, ShieldCheck, Briefcase } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface Area {
  id: string
  icon: LucideIcon
  name: string
  desc: string
  casos: string
  tasa: string
  color: string
  border: string
  bg: string
  tags: string[]
}

export const areas: Area[] = [
  {
    id: "laboral",
    icon: Users,
    name: "Derecho Laboral",
    desc: "Asesoría integral para trabajadores y empresas: despidos injustificados, liquidaciones, reinstalaciones, contratos y convenios colectivos.",
    casos: "+620 casos",
    tasa: "94% éxito",
    color: "text-blue-400",
    border: "border-blue-800/30",
    bg: "bg-blue-950/15",
    tags: ["Despidos", "Liquidaciones", "IMSS/INFONAVIT", "Contratos", "Reinstalación"],
  },
  {
    id: "mercantil",
    icon: Briefcase,
    name: "Derecho Mercantil",
    desc: "Constitución de empresas, contratos comerciales, litigios mercantiles, fusiones, adquisiciones y reestructuras corporativas.",
    casos: "+480 casos",
    tasa: "91% éxito",
    color: "text-violet-400",
    border: "border-violet-800/30",
    bg: "bg-violet-950/15",
    tags: ["Contratos", "SA de CV / SAS", "Fusiones", "Litigios", "Due Diligence"],
  },
  {
    id: "familiar",
    icon: Home,
    name: "Derecho Familiar",
    desc: "Divorcios, custodia, pensión alimenticia, adopciones, testamentos, sucesiones y mediación familiar con enfoque humano.",
    casos: "+390 casos",
    tasa: "96% éxito",
    color: "text-rose-400",
    border: "border-rose-800/30",
    bg: "bg-rose-950/15",
    tags: ["Divorcio", "Custodia", "Alimentos", "Sucesiones", "Mediación"],
  },
  {
    id: "penal",
    icon: ShieldCheck,
    name: "Derecho Penal",
    desc: "Defensa penal efectiva en todas las etapas del proceso. Garantizamos el debido proceso y protegemos tus derechos constitucionales.",
    casos: "+270 casos",
    tasa: "88% éxito",
    color: "text-amber-400",
    border: "border-amber-800/30",
    bg: "bg-amber-950/15",
    tags: ["Defensa penal", "Amparo", "Medidas cautelares", "Juicio oral", "LNPP"],
  },
  {
    id: "inmobiliario",
    icon: Building2,
    name: "Derecho Inmobiliario",
    desc: "Compraventa, arrendamientos, escrituración, regularización de predios, condominios y litigios por posesión y usucapión.",
    casos: "+350 casos",
    tasa: "92% éxito",
    color: "text-emerald-400",
    border: "border-emerald-800/30",
    bg: "bg-emerald-950/15",
    tags: ["Escrituración", "Arrendamiento", "Regularización", "Condominios", "Usucapión"],
  },
  {
    id: "corporativo",
    icon: Scale,
    name: "Derecho Corporativo",
    desc: "Gobierno corporativo, compliance, contratos internacionales, propiedad intelectual, protección de datos y regulación sectorial.",
    casos: "+210 casos",
    tasa: "93% éxito",
    color: "text-cyan-400",
    border: "border-cyan-800/30",
    bg: "bg-cyan-950/15",
    tags: ["Compliance", "Contratos", "LFPDPPP", "PI", "M&A"],
  },
]

export const stats = [
  { value: "+2,320", label: "Casos resueltos" },
  { value: "18 años", label: "De experiencia" },
  { value: "92%", label: "Tasa de éxito" },
  { value: "4,800+", label: "Clientes satisfechos" },
]
