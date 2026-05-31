export interface Abogado {
  name: string
  role: string
  specialty: string
  exp: string
  avatar: string
  color: string
  cedula: string
  linkedin?: string
}

export const team: Abogado[] = [
  {
    name: "Lic. Carlos Montes de Oca",
    role: "Socio Fundador",
    specialty: "Derecho Mercantil & Corporativo",
    exp: "23 años · Ex-SHCP · Árbitro CANACO",
    avatar: "CM",
    color: "from-slate-600 to-slate-800",
    cedula: "Cédula Prof. 2184730",
  },
  {
    name: "Lic. Patricia Vargas Luna",
    role: "Socia Senior",
    specialty: "Derecho Laboral & IMSS",
    exp: "19 años · Ex-STPS · Conciliadora CFCRL",
    avatar: "PV",
    color: "from-indigo-600 to-indigo-900",
    cedula: "Cédula Prof. 4921085",
  },
  {
    name: "Lic. Roberto Salcedo Ríos",
    role: "Socio Senior",
    specialty: "Derecho Penal & Amparo",
    exp: "16 años · UNAM · Ex-PGR",
    avatar: "RS",
    color: "from-slate-700 to-gray-900",
    cedula: "Cédula Prof. 6037412",
  },
  {
    name: "Lic. Alejandra Torres Medina",
    role: "Asociada Senior",
    specialty: "Derecho Familiar & Sucesiones",
    exp: "12 años · Iberoamericana · Mediadora",
    avatar: "AT",
    color: "from-slate-600 to-blue-900",
    cedula: "Cédula Prof. 7842016",
  },
]

export const processSteps = [
  {
    n: "01",
    title: "Consulta inicial",
    desc: "Primera reunión gratuita de 45 min. Analizamos tu caso, evaluamos viabilidad y te explicamos el camino legal con absoluta claridad.",
  },
  {
    n: "02",
    title: "Análisis jurídico",
    desc: "Revisión exhaustiva de documentos, hechos y marco legal aplicable. Identificamos fortalezas, riesgos y estrategia óptima.",
  },
  {
    n: "03",
    title: "Estrategia & propuesta",
    desc: "Plan de acción personalizado con etapas, tiempos estimados, honorarios transparentes y métricas de avance.",
  },
  {
    n: "04",
    title: "Ejecución & seguimiento",
    desc: "Representación activa con reportes periódicos. Nunca estarás sin información sobre el estado de tu asunto.",
  },
]
