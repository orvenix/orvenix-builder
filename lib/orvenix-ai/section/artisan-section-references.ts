import type { EditorTree } from "@/types/editor"

export type ArtisanSectionIntent = "navigation" | "hero" | "services" | "gallery" | "pricing" | "contact" | "testimonials"

type ArtisanReference = {
  id: string
  label: string
  source: string
  keywords: string[]
  palette: {
    background: string
    surface: string
    text: string
    muted: string
    accent: string
  }
  roles: Partial<Record<ArtisanSectionIntent, {
    layout: string
    pattern: string
    title: string
    copy: string
    cta: string
    blocks: string[]
    image: string
  }>>
}

const REFERENCES: ArtisanReference[] = [
  {
    id: "restaurant",
    label: "Restaurante premium",
    source: "app/webs/restaurante",
    keywords: ["restaurante", "comida", "chef", "menu", "reservar", "mesa", "cafeteria", "bar"],
    palette: { background: "#fff8f1", surface: "#ffffff", text: "#24160f", muted: "#6f5748", accent: "#d27a2c" },
    roles: {
      hero: { layout: "split visual con reserva inmediata", pattern: "promesa sensorial, foto dominante, horario/reserva y CTA visible", title: "Una experiencia que empieza antes del primer bocado", copy: "Presenta ambiente, especialidad y reserva en una sección cálida, visual y fácil de adaptar.", cta: "Reservar mesa", blocks: ["badge", "headline", "copy", "cta", "imagen", "dato de horario"], image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80" },
      services: { layout: "cartas de platos/experiencias", pattern: "tres categorías claras con beneficios y llamada a explorar", title: "Momentos diseñados para compartir", copy: "Organiza menú, eventos y reservas en bloques simples para que el visitante decida rápido.", cta: "Ver experiencia", blocks: ["intro", "3 cards", "botones"], image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80" },
      gallery: { layout: "galería editorial de ambiente", pattern: "imágenes grandes, detalles del espacio y texto mínimo", title: "Una muestra visual que abre el apetito", copy: "Presenta espacios, platillos y momentos para que el visitante imagine la experiencia.", cta: "Ver menú", blocks: ["galería", "3 imágenes", "microcopy"], image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
      testimonials: { layout: "reseñas editoriales", pattern: "citas breves, ambiente y reputación local", title: "Clientes que vuelven por la experiencia", copy: "Usa testimonios cortos para reforzar sabor, servicio y ambiente.", cta: "Quiero reservar", blocks: ["2 testimonios", "prueba social", "cta"], image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80" },
      contact: { layout: "reserva + ubicación", pattern: "horarios, ubicación, WhatsApp y CTA final", title: "Reserva tu próxima visita", copy: "Haz que el cliente encuentre dirección, horarios y contacto sin fricción.", cta: "Contactar por WhatsApp", blocks: ["horario", "ubicacion", "cta"], image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80" },
    },
  },
  {
    id: "clinic",
    label: "Clínica y salud",
    source: "app/webs/clinica",
    keywords: ["clinica", "salud", "doctor", "medico", "dentista", "psicologo", "cita", "consultorio"],
    palette: { background: "#f5fbff", surface: "#ffffff", text: "#123247", muted: "#577084", accent: "#1ca7d8" },
    roles: {
      hero: { layout: "hero de confianza con cita", pattern: "especialidad, tranquilidad, credenciales y CTA a cita", title: "Atención médica clara, humana y profesional", copy: "Comunica confianza desde el primer pantallazo con un camino directo para agendar.", cta: "Agendar cita", blocks: ["credencial", "headline", "copy", "cta", "foto clínica"], image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80" },
      services: { layout: "especialidades en grid limpio", pattern: "servicios médicos por necesidad del paciente", title: "Especialidades explicadas sin saturar", copy: "Muestra áreas de atención, beneficios y siguiente paso con tono profesional.", cta: "Ver disponibilidad", blocks: ["3 especialidades", "proceso", "cta"], image: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1200&q=80" },
      gallery: { layout: "galería clínica serena", pattern: "instalaciones, equipo y confianza visual", title: "Espacios pensados para atenderte con calma", copy: "Muestra instalaciones, consultorios o equipo médico con una composición sobria y editable.", cta: "Conocer clínica", blocks: ["galería", "instalaciones", "confianza"], image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80" },
      testimonials: { layout: "confianza + resultados", pattern: "testimonios sobrios y datos de atención", title: "Pacientes que se sienten acompañados", copy: "Refuerza seguridad, explicación clara y seguimiento cercano.", cta: "Solicitar valoración", blocks: ["quotes", "métricas", "cta"], image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80" },
      contact: { layout: "agenda + datos de contacto", pattern: "formulario visual, WhatsApp y ubicación", title: "Agenda una valoración", copy: "Da al paciente una ruta simple para resolver dudas y confirmar horario.", cta: "Agendar ahora", blocks: ["datos", "horario", "cta"], image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80" },
    },
  },
  {
    id: "legal",
    label: "Despacho jurídico / servicios profesionales",
    source: "app/webs/abogados + app/webs/contabilidad",
    keywords: ["abogado", "abogados", "legal", "contador", "contabilidad", "fiscal", "consultoria", "notaria"],
    palette: { background: "#f8f7f3", surface: "#ffffff", text: "#1f2933", muted: "#667085", accent: "#315c8a" },
    roles: {
      hero: { layout: "autoridad sobria", pattern: "problema legal/fiscal, experiencia y consulta", title: "Asesoría profesional para decisiones importantes", copy: "Presenta autoridad, claridad y un siguiente paso confiable sin sonar genérico.", cta: "Agendar consulta", blocks: ["badge", "headline", "credenciales", "cta"], image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80" },
      services: { layout: "áreas de práctica", pattern: "servicios organizados por problema y resultado", title: "Soluciones claras para cada etapa", copy: "Convierte servicios complejos en opciones fáciles de entender y solicitar.", cta: "Solicitar diagnóstico", blocks: ["3 áreas", "beneficios", "cta"], image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80" },
      pricing: { layout: "paquetes consultivos", pattern: "planes con alcance y recomendación", title: "Opciones transparentes para avanzar", copy: "Presenta paquetes de diagnóstico, mensualidad o acompañamiento premium.", cta: "Elegir asesoría", blocks: ["3 planes", "incluye", "cta"], image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80" },
      gallery: { layout: "casos visuales profesionales", pattern: "tarjetas sobrias para áreas, casos o resultados", title: "Casos y áreas con presencia profesional", copy: "Ordena experiencia, áreas de práctica y pruebas visuales sin saturar al visitante.", cta: "Ver servicios", blocks: ["casos", "3 tarjetas", "cta"], image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80" },
      testimonials: { layout: "casos y confianza", pattern: "resultado, acompañamiento, cierre", title: "Confianza construida con claridad", copy: "Muestra cómo el servicio resolvió incertidumbre y facilitó decisiones.", cta: "Hablar con un asesor", blocks: ["2 casos", "quote", "cta"], image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80" },
    },
  },
  {
    id: "realestate",
    label: "Inmobiliaria premium",
    source: "app/webs/inmobiliaria",
    keywords: ["inmobiliaria", "propiedad", "casa", "departamento", "renta", "venta", "bienes raices", "agente"],
    palette: { background: "#f4f8fb", surface: "#ffffff", text: "#172433", muted: "#5f7184", accent: "#1379a8" },
    roles: {
      hero: { layout: "propiedad destacada + búsqueda", pattern: "zona, tipo de inmueble, confianza y visita", title: "Propiedades que se sienten listas para visitar", copy: "Combina imagen fuerte, filtros simples y CTA de visita para captar leads mejor calificados.", cta: "Agendar visita", blocks: ["imagen", "datos", "cta", "filtros"], image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" },
      services: { layout: "servicios para comprar/vender", pattern: "venta, renta, valuación y acompañamiento", title: "Acompañamiento inmobiliario de principio a cierre", copy: "Explica servicios por objetivo del cliente y reduce dudas antes del contacto.", cta: "Solicitar valoración", blocks: ["3 servicios", "proceso", "cta"], image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80" },
      gallery: { layout: "propiedades destacadas", pattern: "imágenes amplias, datos rápidos y CTA de visita", title: "Propiedades que invitan a conocer más", copy: "Integra inmuebles, zonas o proyectos con una galería clara y comercial.", cta: "Ver propiedades", blocks: ["propiedades", "3 tarjetas", "datos"], image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80" },
      testimonials: { layout: "casos de compra/venta", pattern: "historias breves con zona, necesidad y resultado", title: "Historias reales detrás de cada cierre", copy: "La prueba social ayuda a que compradores y propietarios contacten con más confianza.", cta: "Quiero asesoría", blocks: ["2 casos", "métrica", "cta"], image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80" },
    },
  },
  {
    id: "commerce",
    label: "Tienda / eCommerce",
    source: "app/webs/tienda + app/webs/vistamoda",
    keywords: ["tienda", "ecommerce", "producto", "catalogo", "moda", "ropa", "comprar", "checkout"],
    palette: { background: "#f7fbff", surface: "#ffffff", text: "#102033", muted: "#5d6b7a", accent: "#1bb3fa" },
    roles: {
      hero: { layout: "oferta + producto estrella", pattern: "producto visual, beneficio y compra rápida", title: "Productos listos para enamorar y vender", copy: "Muestra la oferta principal con imagen, confianza de compra y CTA claro.", cta: "Comprar ahora", blocks: ["producto", "precio", "beneficios", "cta"], image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" },
      services: { layout: "categorías comerciales", pattern: "categorías, beneficios de envío/pago y producto destacado", title: "Categorías que guían la compra", copy: "Ayuda al visitante a encontrar rápido qué comprar y por qué confiar.", cta: "Ver catálogo", blocks: ["3 categorías", "envío", "pago seguro"], image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80" },
      pricing: { layout: "paquetes/productos", pattern: "tres opciones con recomendada y CTA", title: "Elige la opción ideal", copy: "Presenta productos o paquetes con precio, beneficio y decisión rápida.", cta: "Elegir producto", blocks: ["3 productos", "precio", "cta"], image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80" },
      gallery: { layout: "vitrina de productos", pattern: "producto visual, categoría y decisión rápida", title: "Una vitrina que hace fácil comprar", copy: "Muestra categorías, productos destacados o colecciones con imágenes reemplazables.", cta: "Ver catálogo", blocks: ["productos", "3 tarjetas", "cta"], image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80" },
      testimonials: { layout: "reseñas de compra", pattern: "confianza, entrega, calidad", title: "Clientes que compran con confianza", copy: "Refuerza calidad, rapidez y atención antes del checkout.", cta: "Ver productos", blocks: ["reseñas", "badges", "cta"], image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80" },
    },
  },
]

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export function detectArtisanSectionIntent(prompt: string): ArtisanSectionIntent {
  const text = normalize(prompt)

  if (
    text.includes("menu") ||
    text.includes("menú") ||
    text.includes("navegacion") ||
    text.includes("navegación") ||
    text.includes("navbar") ||
    text.includes("header")
  ) {
    return "navigation"
  }

  if (
    text.includes("galeria") ||
    text.includes("galería") ||
    text.includes("portfolio") ||
    text.includes("portafolio") ||
    text.includes("proyectos") ||
    text.includes("imagenes") ||
    text.includes("imágenes")
  ) {
    return "gallery"
  }

  if (
    text.includes("precio") ||
    text.includes("precios") ||
    text.includes("plan") ||
    text.includes("planes") ||
    text.includes("paquete") ||
    text.includes("paquetes") ||
    text.includes("membresia")
  ) {
    return "pricing"
  }

  if (
    text.includes("testimonio") ||
    text.includes("testimonios") ||
    text.includes("resena") ||
    text.includes("resenas") ||
    text.includes("opinion") ||
    text.includes("clientes") ||
    text.includes("prueba social")
  ) {
    return "testimonials"
  }

  if (
    text.includes("contacto") ||
    text.includes("whatsapp") ||
    text.includes("agenda") ||
    text.includes("agendar") ||
    text.includes("reservar") ||
    text.includes("cotizar")
  ) {
    return "contact"
  }

  if (
    text.includes("servicio") ||
    text.includes("servicios") ||
    text.includes("beneficio") ||
    text.includes("beneficios") ||
    text.includes("caracteristica") ||
    text.includes("caracteristicas") ||
    text.includes("oferta") ||
    text.includes("ofrecemos")
  ) {
    return "services"
  }

  return "hero"
}

export function getArtisanSectionReference(prompt: string, intent: ArtisanSectionIntent) {
  const q = normalize(prompt)
  const scored = REFERENCES
    .map((ref) => ({
      ref,
      score: ref.keywords.reduce((total, keyword) => total + (q.includes(normalize(keyword)) ? keyword.length : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)

  const exact = scored.find((item) => item.score > 0 && item.ref.roles[intent])?.ref
  if (exact) return exact

  return REFERENCES.find((ref) => ref.roles[intent]) ?? REFERENCES[0]
}

export function buildArtisanSectionReferenceContext(prompt: string, intent: ArtisanSectionIntent) {
  const primary = getArtisanSectionReference(prompt, intent)
  const role = primary?.roles[intent]
  const alternatives = REFERENCES
    .filter((ref) => ref.id !== primary?.id && ref.roles[intent])
    .slice(0, 3)
    .map((ref) => "- " + ref.label + ": " + ref.roles[intent]?.pattern)
    .join("\n")

  if (!primary || !role) return ""

  return [
    "REFERENCIA ARTESANAL PRINCIPAL",
    "Fuente: " + primary.source,
    "Industria: " + primary.label,
    "Layout: " + role.layout,
    "Patrón: " + role.pattern,
    "Bloques esperados: " + role.blocks.join(", "),
    "Paleta sugerida: fondo " + primary.palette.background + ", superficie " + primary.palette.surface + ", texto " + primary.palette.text + ", acento " + primary.palette.accent,
    "Copy base editable: título \"" + role.title + "\", texto \"" + role.copy + "\", CTA \"" + role.cta + "\"",
    "",
    "REFERENCIAS SECUNDARIAS PARA VARIAR EL DISEÑO",
    alternatives,
  ].join("\n")
}

export function buildArtisanInspiredFallbackTree(id: string, prompt: string, intent: ArtisanSectionIntent): EditorTree {
  const reference = getArtisanSectionReference(prompt, intent)
  const role = reference?.roles[intent]
  const palette = reference?.palette ?? REFERENCES[0].palette
  const baseTitle = role?.title ?? "Una sección profesional lista para adaptar"
  const baseCopy = role?.copy ?? "Contenido editable inspirado en estructuras reales de Orvenix para lanzar con mejor presencia."
  const cta = role?.cta ?? "Solicitar información"
  const image = role?.image ?? "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
  const root = id + "-section"
  const wrap = id + "-wrap"
  const intro = id + "-intro"
  const visual = id + "-visual"
  const grid = id + "-grid"
  const cards = [id + "-card-1", id + "-card-2", id + "-card-3"]
  const cardCopy = getCardsForIntent(intent, reference?.label ?? "Sitio profesional")

  const nodes: EditorTree["nodes"] = {
    [root]: {
      id: root,
      type: "section",
      displayName: "Sección IA - " + (role?.layout ?? intent),
      props: {
        maxWidth: "full",
        paddingY: "xl",
        paddingX: "lg",
        align: "left",
        background: "linear-gradient(135deg, " + palette.background + " 0%, #ffffff 58%, " + palette.accent + "18 100%)",
      },
      children: [wrap],
      version: 1,
    },
    [wrap]: {
      id: wrap,
      type: "genericWrapper",
      displayName: "Composición artesanal editable",
      props: {
        originalType: "div",
        className: "grid items-center gap-8 rounded-[32px] border p-5 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)] lg:grid-cols-[1.02fr_0.98fr] lg:p-8",
        style: { borderColor: palette.accent + "33", background: "rgba(255,255,255,0.78)", backdropFilter: "blur(18px)" },
      },
      children: [intro, visual],
      version: 1,
    },
    [intro]: {
      id: intro,
      type: "genericWrapper",
      displayName: "Texto principal editable",
      props: { originalType: "div", className: "space-y-5" },
      children: [id + "-badge", id + "-heading", id + "-text", id + "-cta", grid],
      version: 1,
    },
    [id + "-badge"]: {
      id: id + "-badge",
      type: "text",
      displayName: "Etiqueta de contexto",
      props: { content: "Inspirado en " + (reference?.label ?? "sitios reales Orvenix"), size: "sm", align: "left", color: palette.accent, maxWidth: "md" },
      children: [],
      version: 1,
    },
    [id + "-heading"]: {
      id: id + "-heading",
      type: "heading",
      displayName: "Título principal",
      props: { text: personalizeTitle(baseTitle, prompt), level: 2, size: intent === "hero" ? "5xl" : "4xl", weight: "extrabold", align: "left", color: palette.text, marginBottom: "sm" },
      children: [],
      version: 1,
    },
    [id + "-text"]: {
      id: id + "-text",
      type: "text",
      displayName: "Texto principal",
      props: { content: baseCopy, size: "lg", align: "left", color: palette.muted, maxWidth: "lg" },
      children: [],
      version: 1,
    },
    [id + "-cta"]: {
      id: id + "-cta",
      type: "ctaButton",
      displayName: "Botón principal",
      props: { label: cta, href: "#contacto", variant: "primary", size: "lg" },
      children: [],
      version: 1,
    },
    [grid]: {
      id: grid,
      type: "genericWrapper",
      displayName: "Puntos editables",
      props: { originalType: "div", className: "grid gap-3 pt-3 sm:grid-cols-3" },
      children: cards,
      version: 1,
    },
    [visual]: {
      id: visual,
      type: "genericWrapper",
      displayName: "Imagen y detalle visual",
      props: { originalType: "figure", className: "overflow-hidden rounded-[28px] border bg-white p-3 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.55)]", style: { borderColor: palette.accent + "30" } },
      children: [id + "-image", id + "-caption"],
      version: 1,
    },
    [id + "-image"]: {
      id: id + "-image",
      type: "image",
      displayName: "Imagen reemplazable",
      props: { src: image, alt: baseTitle, width: 1200, height: 820, objectFit: "cover" },
      children: [],
      version: 1,
    },
    [id + "-caption"]: {
      id: id + "-caption",
      type: "text",
      displayName: "Nota visual",
      props: { content: "Cambia esta imagen, textos y CTA desde el editor para adaptarlo a la marca del cliente.", size: "sm", align: "left", color: palette.muted, maxWidth: "lg" },
      children: [],
      version: 1,
    },
  }

  cardCopy.forEach(([title, copy], index) => {
    const cardId = cards[index]
    nodes[cardId] = {
      id: cardId,
      type: "genericWrapper",
      displayName: title,
      props: { originalType: "article", className: "rounded-2xl border bg-white/80 p-4 transition-transform hover:-translate-y-1", style: { borderColor: palette.accent + "24" } },
      children: [cardId + "-title", cardId + "-copy"],
      version: 1,
    }
    nodes[cardId + "-title"] = {
      id: cardId + "-title",
      type: "heading",
      displayName: "Título " + title,
      props: { text: title, level: 3, size: "xl", weight: "bold", align: "left", color: palette.text, marginBottom: "sm" },
      children: [],
      version: 1,
    }
    nodes[cardId + "-copy"] = {
      id: cardId + "-copy",
      type: "text",
      displayName: "Texto " + title,
      props: { content: copy, size: "sm", align: "left", color: palette.muted, maxWidth: "md" },
      children: [],
      version: 1,
    }
  })

  return { rootId: root, nodes }
}

function personalizeTitle(title: string, prompt: string) {
  const subject = prompt
    .replace(/^(crea|genera|haz|quiero|necesito|diseña?)\s+/i, "")
    .replace(/\b(una|un|seccion|sección|bloque|hero|landing)\b/gi, "")
    .trim()

  if (!subject || subject.length < 8 || title.toLowerCase().includes(subject.toLowerCase())) return title
  if (title.length > 72) return title
  return title + " para " + subject
}

function getCardsForIntent(intent: ArtisanSectionIntent, label: string): Array<[string, string]> {
  if (intent === "navigation") {
    return [
      ["Ruta clara", "Inicio, servicios y contacto deben estar visibles sin saturar."],
      ["Acción principal", "El CTA del menú lleva al siguiente paso comercial."],
      ["Marca presente", "Logo, tono y navegación se sienten parte del sitio."],
    ]
  }

  if (intent === "gallery") {
    return [
      ["Imagen principal", "Muestra un proyecto, producto, espacio o resultado memorable."],
      ["Detalle editable", "Cada tarjeta puede cambiar foto, título y descripción."],
      ["Prueba visual", "Ayuda a que el sitio se sienta completo y confiable."],
    ]
  }

  if (intent === "pricing") {
    return [
      ["Inicial", "Una opción clara para empezar sin fricción."],
      ["Profesional", "La alternativa recomendada para vender con más confianza."],
      ["Premium", "Acompañamiento completo para necesidades más exigentes."],
    ]
  }

  if (intent === "testimonials") {
    return [
      ["Confianza", "Muestra resultados o experiencias reales del cliente."],
      ["Claridad", "Reduce dudas antes de que el visitante pida información."],
      ["Decisión", "Cierra con una razón concreta para contactar."],
    ]
  }

  if (intent === "contact") {
    return [
      ["Respuesta rápida", "Indica horario o canal principal de atención."],
      ["Datos claros", "Añade ubicación, teléfono, WhatsApp o correo."],
      ["Siguiente paso", "Explica qué ocurrirá después de contactar."],
    ]
  }

  if (intent === "services") {
    return [
      ["Servicio clave", "Describe la oferta principal y el problema que resuelve."],
      ["Proceso", "Aclara tiempos, forma de trabajo y expectativas."],
      ["Resultado", "Conecta el servicio con un beneficio medible."],
    ]
  }

  return [
    ["Presencia", "Estructura visual inspirada en " + label + "."],
    ["Confianza", "Copy, prueba y CTA listos para editar."],
    ["Conversión", "Diseñado para llevar al visitante al siguiente paso."],
  ]
}
