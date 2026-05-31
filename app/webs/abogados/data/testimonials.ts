export interface Testimonio {
  name: string
  handle: string
  avatar: string
  text: string
  area: string
  rating: number
  date: string
}

export const testimonials: Testimonio[] = [
  {
    name: "Grupo Industrial Nortek",
    handle: "Director Jurídico",
    avatar: "GI",
    text: "El despacho Montes de Oca manejó nuestra reestructura corporativa con una precisión y velocidad excepcional. Cumplieron cada plazo sin sorpresas en honorarios. Los recomendaríamos sin dudarlo.",
    area: "Corporativo",
    rating: 5,
    date: "Ene 2026",
  },
  {
    name: "Ing. Fernando Reyes",
    handle: "Cliente particular",
    avatar: "FR",
    text: "Después de un despido injustificado después de 14 años en la empresa, el Lic. Montes recuperó el 100% de mi liquidación más tres meses extra de compensación. Proceso rápido y sin estrés.",
    area: "Laboral",
    rating: 5,
    date: "Mar 2026",
  },
  {
    name: "Dra. Verónica Castillo",
    handle: "Empresaria",
    avatar: "VC",
    text: "La Lic. Vargas manejó mi divorcio con una sensibilidad y profesionalismo que no esperaba. Logró la mejor custodia para mis hijos y una pensión justa. Estaré eternamente agradecida.",
    area: "Familiar",
    rating: 5,
    date: "Feb 2026",
  },
  {
    name: "Constructora Arco Sur",
    handle: "Gerencia Legal",
    avatar: "CA",
    text: "Resolvieron un litigio por usucapión de 3 años que nos tenía paralizado. Su conocimiento del derecho inmobiliario y sus contactos en el registro público fueron clave para el resultado.",
    area: "Inmobiliario",
    rating: 5,
    date: "Dic 2025",
  },
  {
    name: "Sr. Arturo Mendívil",
    handle: "Cliente particular",
    avatar: "AM",
    text: "El Lic. Salcedo logró mi absolución en un proceso penal en el que me vi involucrado injustamente. Su manejo del juicio oral fue impresionante. Defensa de primer nivel.",
    area: "Penal",
    rating: 5,
    date: "Abr 2026",
  },
  {
    name: "TechStart México S.A.S.",
    handle: "CEO & Co-founder",
    avatar: "TM",
    text: "Constituyeron nuestra empresa, redactaron contratos con inversores internacionales y nos asesoran en cumplimiento de LFPDPPP. Son el socio legal que toda startup necesita.",
    area: "Mercantil",
    rating: 5,
    date: "Mar 2026",
  },
]

export const faqs = [
  {
    q: "¿La primera consulta tiene costo?",
    a: "No. Ofrecemos una primera consulta gratuita de 45 minutos para analizar tu caso, orientarte sobre opciones legales disponibles y presentarte una propuesta de honorarios sin compromiso.",
  },
  {
    q: "¿Cuánto tiempo tarda resolver un caso laboral?",
    a: "Con la nueva LFTSE y el sistema de conciliación previa, casos laborales sencillos pueden resolverse en 3-6 meses. Litigios complejos o con audiencias pueden extenderse 12-18 meses. Te daremos un estimado concreto al analizar tu caso.",
  },
  {
    q: "¿Trabajan en CDMX o también en otros estados?",
    a: "Tenemos sede en CDMX y operamos en Estado de México, Jalisco, Nuevo León y Querétaro. Para otros estados coordinamos con abogados corresponsales de nuestra red nacional.",
  },
  {
    q: "¿Cómo se estructuran los honorarios?",
    a: "Honorarios fijos por asesoría, por proyecto o éxito según el tipo de caso. Siempre por escrito en contrato de servicios. Sin cuotas ocultas ni sorpresas. En algunos casos laborales trabajamos a contingencia.",
  },
  {
    q: "¿Puedo contratar servicios de forma remota?",
    a: "Sí. Atendemos clientes en todo México de forma digital. Videollamadas, firma electrónica y gestión documental 100% en línea. Muchos clientes nunca visitan físicamente nuestra oficina.",
  },
]
