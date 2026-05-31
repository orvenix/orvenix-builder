import { FileCheck, Home, Users, ScrollText, Building2, Scale } from "lucide-react"

export const brand = {
  name: "Notaría Pública",
  numero: "No. 88",
  notario: "Lic. Arturo Velázquez Ponce",
  tagline: "Fe pública, certeza jurídica",
  email: "atencion@notaria88cdmx.mx",
  phone: "+52 55 5600 3388",
  address: "Av. Insurgentes Norte 860, Gustavo A. Madero, CDMX",
  protocolo: "Protocolo No. 88-CDMX",
  colegiado: "Colegio de Notarios CDMX #2241",
  founded: "1988",
}

export const stats = [
  { value: "35+", label: "Años de servicio" },
  { value: "120K+", label: "Escrituras firmadas" },
  { value: "24h", label: "Tiempo de respuesta" },
  { value: "100%", label: "Actos certificados" },
]

export const tramites = [
  {
    id: "escrituracion",
    icon: Home,
    title: "Escrituración Inmobiliaria",
    desc: "Compraventa de casas, departamentos, locales y terrenos. Verificación de antecedentes registrales, estudios de título y coordinación con el RUG.",
    tags: ["Compraventa", "Donaciones", "Permutas", "Daciones en pago"],
    color: "text-amber-400",
    border: "border-amber-900/30",
    bg: "bg-amber-950/10",
    plazo: "5 a 15 días hábiles",
    nota: "Certificado libre de gravamen incluido",
  },
  {
    id: "testamentos",
    icon: ScrollText,
    title: "Testamentos",
    desc: "Testamento público abierto, redacción de cláusulas patrimoniales, designación de herederos y albaceas. Registro ante el Archivo General de Notarías.",
    tags: ["Público abierto", "Legados", "Fideicomisos", "Herederos"],
    color: "text-yellow-400",
    border: "border-yellow-900/30",
    bg: "bg-yellow-950/10",
    plazo: "Mismo día (cita previa)",
    nota: "Registro AGEN incluido",
  },
  {
    id: "poderes",
    icon: FileCheck,
    title: "Poderes Notariales",
    desc: "Poder general para actos de administración y dominio, poderes especiales, poderes para pleitos y cobranzas, revocación de poderes y ratificaciones.",
    tags: ["Poder general", "Poder especial", "Representación", "Revocación"],
    color: "text-orange-400",
    border: "border-orange-900/30",
    bg: "bg-orange-950/10",
    plazo: "1 a 3 días hábiles",
    nota: "Apostilla disponible",
  },
  {
    id: "sociedades",
    icon: Building2,
    title: "Sociedades Mercantiles",
    desc: "Constitución de SA de CV, S de RL, SAPI, SAS. Protocolización de actas, aumento/reducción de capital, fusiones, escisiones y disoluciones.",
    tags: ["SA de CV", "S de RL", "SAPI", "Fusiones"],
    color: "text-teal-400",
    border: "border-teal-900/30",
    bg: "bg-teal-950/10",
    plazo: "3 a 10 días hábiles",
    nota: "Inscripción RPC incluida",
  },
  {
    id: "actas",
    icon: Users,
    title: "Actas & Certificaciones",
    desc: "Fe de hechos, certificación de documentos, firmas, contratos privados, copias certificadas y resoluciones. Notificaciones y requerimientos notariales.",
    tags: ["Fe de hechos", "Certificación", "Firmas", "Notificaciones"],
    color: "text-blue-400",
    border: "border-blue-900/30",
    bg: "bg-blue-950/10",
    plazo: "El mismo día",
    nota: "Servicios a domicilio disponibles",
  },
  {
    id: "sucesiones",
    icon: Scale,
    title: "Sucesiones & Adjudicaciones",
    desc: "Tramitación de juicios sucesorios notariales, herencias con y sin testamento, adjudicación de bienes y trámites ante el RPPYC.",
    tags: ["Herencias", "Ab intestato", "Adjudicaciones", "RPPYC"],
    color: "text-rose-400",
    border: "border-rose-900/30",
    bg: "bg-rose-950/10",
    plazo: "30 a 90 días hábiles",
    nota: "Asesoría sin costo inicial",
  },
]

export const process = [
  { n: "01", title: "Solicitud de cita", desc: "Contáctanos por teléfono, correo o formulario. Nuestro equipo de atención te asigna cita dentro de las próximas 24 horas." },
  { n: "02", title: "Consulta inicial", desc: "El notario o su representante legal analiza tu caso, identifica el trámite requerido y te informa sobre documentos necesarios y costos aproximados." },
  { n: "03", title: "Integración del expediente", desc: "Reúnes los documentos indicados. Nuestro personal verifica antecedentes registrales, identidades y legalidad del acto." },
  { n: "04", title: "Redacción & revisión", desc: "Redactamos el instrumento notarial. Tienes oportunidad de revisarlo junto al notario antes de la firma." },
  { n: "05", title: "Firma ante Notario", desc: "Las partes comparecen ante el Notario Público para signar el instrumento. El acto queda protocolizado en nuestro libro de protocolo." },
  { n: "06", title: "Inscripción & entrega", desc: "Realizamos la inscripción ante el Registro Público que corresponda. Te entregamos el instrumento original y copias certificadas." },
]

export const equipo = [
  { name: "Lic. Arturo Velázquez Ponce", role: "Notario Público No. 88", specialty: "Derecho notarial inmobiliario y corporativo", exp: "UNAM · 35 años de ejercicio notarial", avatar: "AV", color: "from-amber-700 to-yellow-900", cedula: "Brev. Notarial CDMX #2241" },
  { name: "Lic. Valeria Romero", role: "Notaria Asociada", specialty: "Sucesiones y derecho familiar", exp: "IBERO · 12 años en práctica notarial", avatar: "VR", color: "from-orange-700 to-amber-900", cedula: "Cédula DGP-84412" },
  { name: "Lic. Héctor Paredes", role: "Abogado Corporativo", specialty: "Sociedades mercantiles y M&A", exp: "ITAM · 10 años · Ex-BBVA Legal", avatar: "HP", color: "from-stone-600 to-zinc-800", cedula: "Cédula DGP-79830" },
  { name: "Lic. Mónica Estrella", role: "Abogada Registral", specialty: "Derecho registral y RPPYC", exp: "La Salle · 8 años · Especialista RPPYC CDMX", avatar: "ME", color: "from-teal-700 to-emerald-900", cedula: "Cédula DGP-91205" },
]

export const testimonials = [
  { name: "Ing. Carlos Díaz", handle: "Comprador · Residencia Polanco", avatar: "CD", rating: 5, text: "La escritura de nuestra casa la tramitó la Notaría 88 en tiempo récord. Toda la documentación perfecta y el equipo muy claro en cada paso.", date: "Feb 2025", tramite: "Escrituración" },
  { name: "Miriam Soto", handle: "Heredera · Sucesión familiar", avatar: "MS", rating: 5, text: "El trámite de herencia lo temía mucho pero la Lic. Romero lo hizo sencillo y humano. Resolvieron en 45 días lo que pensaba que tardaría años.", date: "Ene 2025", tramite: "Sucesión" },
  { name: "Grupo Empresarial Nova", handle: "CFO · GE Nova SA de CV", avatar: "GN", rating: 5, text: "Constituimos nuestra holding con la Notaría 88. Asesoría jurídica impecable, rapidez en el RPC y Lic. Paredes siempre disponible.", date: "Mar 2025", tramite: "Sociedad mercantil" },
  { name: "Alejandra Fuentes", handle: "Cliente · Poder notarial especial", avatar: "AF", rating: 5, text: "Necesitaba un poder con apostilla para España urgente. En 3 días hábiles lo tenía listo y apostillado. Servicio extraordinario.", date: "Dic 2024", tramite: "Poder con apostilla" },
  { name: "Familia Reyes-López", handle: "Otorgantes · Testamentos", avatar: "FR", rating: 5, text: "Hicimos los testamentos de toda la familia en una tarde. El Lic. Velázquez nos explicó cada cláusula. Ahora tenemos paz mental.", date: "Nov 2024", tramite: "Testamento" },
  { name: "Sofía Peña", handle: "Vendedora · Local Comercial", avatar: "SP", rating: 5, text: "Vendí mi local comercial y el proceso fue transparente. La notaría coordinó con el banco del comprador y todo salió perfectamente en fecha.", date: "Oct 2024", tramite: "Escrituración comercial" },
]

export const faqs = [
  { q: "¿Qué documentos necesito para escriturar una propiedad?", a: "Título de propiedad anterior, identificaciones oficiales de las partes (INE/Pasaporte), RFC con homoclave, CURP, boleta predial al corriente, paz y salvo de mantenimiento y, si aplica, constancia de no adeudo de hipoteca." },
  { q: "¿Cuánto cobran por sus servicios?", a: "Los honorarios notariales están regulados por el Arancel del Notariado del Distrito Federal. Te damos un presupuesto transparente antes de iniciar. Los gastos de escrituración (ISAI, derechos de registro, honorarios) se detallan sin letra pequeña." },
  { q: "¿Puedo hacer trámites sin acudir físicamente a la notaría?", a: "Para la firma del instrumento es obligatoria la comparecencia personal. Sin embargo, para solicitudes, cotizaciones y entrega de documentos ofrecemos atención digital y en algunos casos servicio a domicilio dentro de la CDMX." },
  { q: "¿Qué es la apostilla y cuándo la necesito?", a: "La apostilla es una certificación que valida documentos mexicanos en países firmantes del Convenio de La Haya. La necesitas para trámites en el extranjero: visas, herencias internacionales, poderes para uso fuera de México." },
  { q: "¿Pueden hacer el testamento si estoy fuera de la ciudad?", a: "Si no puedes acudir a la notaría, en casos excepcionales el notario puede constituirse en el domicilio del testador. Contáctanos para evaluar tu situación." },
  { q: "¿Cuánto tarda una escritura de compraventa?", a: "En promedio de 10 a 20 días hábiles contando desde la integración completa del expediente hasta la entrega. El tiempo depende de la rapidez del registro público y la institución financiera involucrada." },
]
