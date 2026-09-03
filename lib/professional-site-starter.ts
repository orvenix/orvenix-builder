import type { EditorTree } from "@/types/editor"
import { buildRichStarterTree } from "@/lib/starterTree"
import {
  createSitePage,
  ensureHomePage,
  listSitePages,
  type SitePageListItem,
} from "@/lib/builder-core/tree/sitePages"

export interface ProfessionalStarterPage {
  name: string
  slug: string
  tree: EditorTree
}

const PROFESSIONAL_NAV_PAGES: Array<Pick<SitePageListItem, "name" | "slug" | "isHome" | "published">> = [
  { name: "Inicio", slug: "home", isHome: true, published: false },
  { name: "Servicios", slug: "servicios", isHome: false, published: false },
  { name: "Nosotros", slug: "nosotros", isHome: false, published: false },
  { name: "Precios", slug: "precios", isHome: false, published: false },
  { name: "Contacto", slug: "contacto", isHome: false, published: false },
]

export function getProfessionalStarterPageList(
  siteId = "draft:constructor:pro",
): SitePageListItem[] {
  return PROFESSIONAL_NAV_PAGES.map((page) => ({
    ...page,
    id: null,
    siteId,
    source: "site-page",
  }))
}

export function buildProfessionalStarterPages(
  homeTree?: EditorTree,
): ProfessionalStarterPage[] {
  const home = buildProfessionalHomeTree(homeTree)

  return [
    { name: "Inicio", slug: "home", tree: home },
    {
      name: "Servicios",
      slug: "servicios",
      tree: buildProfessionalPageTree({
        slug: "servicios",
        eyebrow: "SERVICIOS",
        title: "Soluciones claras para crecer con una presencia digital seria",
        copy:
          "Presenta tus paquetes, procesos y entregables con una estructura facil de editar para que cada cliente entienda que incluye y por que confiar.",
        sections: [
          ["Estrategia y mensaje", "Define propuesta de valor, cliente ideal y llamados a la accion."],
          ["Diseno web editable", "Secciones listas para adaptar colores, textos, botones e imagenes."],
          ["Crecimiento y medicion", "Bases para SEO, analitica, formularios y optimizacion continua."],
        ],
        cta: "Solicitar propuesta",
      }),
    },
    {
      name: "Nosotros",
      slug: "nosotros",
      tree: buildProfessionalPageTree({
        slug: "nosotros",
        eyebrow: "NOSOTROS",
        title: "Una marca confiable necesita explicar quien esta detras",
        copy:
          "Usa esta pagina para contar trayectoria, valores, equipo, garantias y diferenciadores sin saturar al visitante.",
        sections: [
          ["Historia", "Resume origen, experiencia y el problema que tu negocio resuelve mejor que nadie."],
          ["Equipo", "Presenta perfiles, especialidades y credenciales relevantes para construir confianza."],
          ["Metodo", "Explica como trabajas y que puede esperar el cliente desde el primer contacto."],
        ],
        cta: "Conocer el proceso",
      }),
    },
    {
      name: "Precios",
      slug: "precios",
      tree: buildProfessionalPageTree({
        slug: "precios",
        eyebrow: "PLANES",
        title: "Paquetes simples para que el cliente pueda decidir sin friccion",
        copy:
          "Organiza tus planes, rangos o propuestas por nivel. Puedes cambiar precios, beneficios, condiciones y botones desde el editor.",
        sections: [
          ["Inicial", "Ideal para validar una oferta, publicar rapido y recibir contactos."],
          ["Profesional", "Para negocios que necesitan mas secciones, SEO y mensajes de venta solidos."],
          ["A medida", "Para proyectos con integraciones, automatizaciones o requerimientos especiales."],
        ],
        cta: "Elegir plan",
      }),
    },
    {
      name: "Contacto",
      slug: "contacto",
      tree: buildProfessionalPageTree({
        slug: "contacto",
        eyebrow: "CONTACTO",
        title: "Cierra con una accion directa y facil de completar",
        copy:
          "Agrega telefono, WhatsApp, correo, direccion, horarios o formulario. Esta pagina debe reducir dudas y facilitar la conversion.",
        sections: [
          ["WhatsApp", "Responde dudas rapidas y agenda conversaciones con clientes calificados."],
          ["Correo", "Recibe solicitudes detalladas, briefs y documentacion del proyecto."],
          ["Ubicacion y horario", "Aclara zona de servicio, disponibilidad y tiempos de respuesta."],
        ],
        cta: "Enviar mensaje",
      }),
    },
  ]
}

export async function seedProfessionalStarterPages(
  siteId: string,
  homeTree?: EditorTree,
): Promise<void> {
  // Conserva exactamente el Home actual del cliente.
  // Si todavía vive en editorWebsite.tree, ensureHomePage lo migra
  // a SitePage sin cambiar su contenido.
  await ensureHomePage(siteId)

  const existingPages = await listSitePages(siteId)
  const existingSlugs = new Set(existingPages.map((page) => page.slug))

  const pages = buildProfessionalStarterPages(homeTree)

  // El Home existente nunca se reemplaza durante un upgrade.
  // Solo añadimos las páginas profesionales que todavía no existen.
  for (const page of pages) {
    if (page.slug === "home") continue
    if (existingSlugs.has(page.slug)) continue

    await createSitePage(siteId, {
      name: page.name,
      slug: page.slug,
      tree: page.tree,
    })
  }
}



const IDEA_COLORS = {
  paper: "#f7fcff",
  paperAlt: "#eaf7ff",
  surface: "#ffffff",
  border: "#c8e8f7",
  borderStrong: "#8fd6f5",
  ink: "#062f44",
  muted: "#426b7d",
  faint: "#7aa6ba",
  coral: "#1BB3FA",
  coralDim: "#075985",
  coralTint: "#e5f6ff",
  teal: "#1379A8",
  tealTint: "#edf9ff",
  amber: "#1794CC",
  amberTint: "#dff4ff",
}

const IDEA_BRAND = {
  businessName: "Orvenix",
  tagline: "El constructor de sitios web para negocios y agencias en Mexico",
  description:
    "Plataforma para publicar sitios web profesionales en horas, con bloques editables, hosting incluido y una experiencia pensada para Mexico.",
  contact: {
    phone: "55 0000 0000",
    whatsapp: "525500000000",
    email: "hola@orvenix.com",
    address: "Mexico",
  },
}

function ideaTheme(homeTree?: EditorTree) {
  const base = buildRichStarterTree()

  return {
    ...base.theme,
    ...(homeTree?.theme ?? {}),
    colors: {
      ...base.theme?.colors,
      primary: IDEA_COLORS.coral,
      secondary: IDEA_COLORS.teal,
      accent: IDEA_COLORS.amber,
      text: IDEA_COLORS.ink,
      background: IDEA_COLORS.paper,
      ...(homeTree?.theme?.colors ?? {}),
    },
    fontHeading: homeTree?.theme?.fontHeading ?? base.theme?.fontHeading ?? "Sora, Inter, system-ui, sans-serif",
    fontBody: homeTree?.theme?.fontBody ?? base.theme?.fontBody ?? "Inter, system-ui, sans-serif",
    spacing: {
      ...base.theme?.spacing,
      sectionX: "1.5rem",
      sectionY: "3rem",
      ...(homeTree?.theme?.spacing ?? {}),
    },
    radius: {
      ...base.theme?.radius,
      card: "1rem",
      button: "999px",
      ...(homeTree?.theme?.radius ?? {}),
    },
    shadow: {
      ...base.theme?.shadow,
      soft: "0 18px 46px -22px rgba(23, 148, 204, 0.22)",
      strong: "0 28px 74px -28px rgba(7, 89, 133, 0.26)",
      ...(homeTree?.theme?.shadow ?? {}),
    },
  }
}

function buildProfessionalHomeTree(homeTree?: EditorTree): EditorTree {
  const theme = ideaTheme(homeTree)
  const brand = {
    ...buildRichStarterTree().brand,
    ...(homeTree?.brand ?? {}),
    ...IDEA_BRAND,
    businessName: homeTree?.brand?.businessName ?? IDEA_BRAND.businessName,
  }
  const nodes: EditorTree["nodes"] = {
    root: sectionNode("root", "Sitio Orvenix editable", "none", "none", "left", IDEA_COLORS.paper, [
      "home-nav-shell",
      "home-hero",
      "pro-experience-section",
      "proof-strip",
      "premium-detail-section",
      "features-section",
      "solutions-section",
      "showcase-section",
      "conversion-section",
      "gallery-section",
      "workflow-section",
      "pro-conversion-section",
      "pricing-section",
      "executive-summary-section",
      "clients-section",
      "faq-section",
      "lead-section",
      "home-cta-section",
      "home-footer",
    ], "full"),
    "home-nav-shell": sectionNode("home-nav-shell", "Header profesional", "none", "none", "center", "transparent", ["home-nav"], "full"),
    "home-nav": navNode("home-nav", "Orvenix", "light"),
    "home-hero": sectionNode(
      "home-hero",
      "Hero principal",
      "xl",
      "md",
      "left",
      "linear-gradient(135deg, rgba(27,179,250,0.18) 0%, rgba(255,255,255,0.92) 42%, rgba(19,121,168,0.12) 100%), #f7fcff",
      ["hero-layout"],
      "xl",
    ),
    "hero-layout": wrapperNode("hero-layout", "Hero en dos columnas", "div", "pro-premium-hero grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_460px]", {}, ["hero-content", "hero-mockup"]),
    "hero-content": wrapperNode("hero-content", "Contenido hero", "div", "idea-site-enter premium-copy-stack max-w-2xl", {}, ["hero-eyebrow", "hero-title", "hero-copy", "hero-actions", "hero-note"]),
    "hero-eyebrow": textNode("hero-eyebrow", "Etiqueta", "SITIO PRO / MULTIPAGINA EDITABLE", IDEA_COLORS.coralDim, "left", "sm"),
    "hero-title": headingNode("hero-title", "Titulo principal", "Un sitio completo, elegante y listo para convertir visitantes en clientes", IDEA_COLORS.ink, "left", "5xl"),
    "hero-copy": textNode("hero-copy", "Descripcion principal", "Cinco paginas conectadas, menu editable, secciones de confianza, precios, servicios, contacto y una narrativa profesional. El cliente cambia lo basico y obtiene una presencia digital que se siente hecha a medida.", IDEA_COLORS.muted, "left", "lg"),
    "hero-actions": wrapperNode("hero-actions", "Botones hero", "div", "mt-8 flex flex-wrap gap-3", {}, ["hero-primary", "hero-secondary"]),
    "hero-primary": buttonNode("hero-primary", "Empezar gratis", "page:precios"),
    "hero-secondary": buttonNode("hero-secondary", "Ver una demo en vivo", "page:servicios", "secondary"),
    "hero-note": textNode("hero-note", "Nota", "Sin tarjeta de credito · Cancela cuando quieras", IDEA_COLORS.faint, "left", "sm"),
    "hero-mockup": wrapperNode("hero-mockup", "Mockup editable del constructor", "div", "idea-canvas-frame idea-floating-panel premium-live-preview relative overflow-hidden rounded-[34px] border bg-white p-5 shadow-2xl", { borderColor: IDEA_COLORS.border }, ["mockup-top", "mockup-grid", "mockup-metric"]),
    "mockup-top": wrapperNode("mockup-top", "Barra mockup", "div", "mb-5 flex items-center justify-between", {}, ["mockup-domain", "mockup-label"]),
    "mockup-domain": textNode("mockup-domain", "Dominio", "tunegocio.mx", IDEA_COLORS.ink, "left", "sm"),
    "mockup-label": textNode("mockup-label", "Panel", "Secciones", IDEA_COLORS.coralDim, "right", "sm"),
    "mockup-grid": wrapperNode("mockup-grid", "Bloques del editor", "div", "grid gap-3", {}, ["mockup-block-1", "mockup-block-2", "mockup-block-3", "mockup-block-4"]),
    "mockup-block-1": ideaBlockNode("mockup-block-1", ["mockup-block-1-text"], IDEA_COLORS.coralTint),
    "mockup-block-1-text": textNode("mockup-block-1-text", "Bloque portada", "Portada", IDEA_COLORS.coralDim, "left", "sm"),
    "mockup-block-2": ideaBlockNode("mockup-block-2", ["mockup-block-2-text"], IDEA_COLORS.tealTint),
    "mockup-block-2-text": textNode("mockup-block-2-text", "Bloque texto", "Texto", IDEA_COLORS.teal, "left", "sm"),
    "mockup-block-3": ideaBlockNode("mockup-block-3", ["mockup-block-3-text"], IDEA_COLORS.amberTint),
    "mockup-block-3-text": textNode("mockup-block-3-text", "Bloque galeria", "Galeria", IDEA_COLORS.teal, "left", "sm"),
    "mockup-block-4": ideaBlockNode("mockup-block-4", ["mockup-block-4-text"], IDEA_COLORS.coralTint),
    "mockup-block-4-text": textNode("mockup-block-4-text", "Bloque CTA", "Boton de contacto", IDEA_COLORS.coralDim, "left", "sm"),
    "mockup-metric": wrapperNode("mockup-metric", "Dato flotante del mockup", "div", "idea-mini-metric absolute bottom-5 right-5 rounded-2xl border bg-white/90 px-4 py-3 shadow-xl", { borderColor: IDEA_COLORS.borderStrong }, ["mockup-metric-number", "mockup-metric-label"]),
    "mockup-metric-number": headingNode("mockup-metric-number", "Metrica", "92%", IDEA_COLORS.coralDim, "left", "xl"),
    "mockup-metric-label": textNode("mockup-metric-label", "Etiqueta metrica", "listo para publicar", IDEA_COLORS.muted, "left", "sm"),

    "proof-strip": sectionNode("proof-strip", "Banda de confianza", "md", "md", "center", "linear-gradient(135deg,#075985 0%,#1379A8 55%,#1BB3FA 130%)", ["proof-grid"], "xl"),
    "pro-experience-section": sectionNode("pro-experience-section", "Experiencia premium", "xl", "md", "left", "linear-gradient(135deg,#ffffff 0%,#eaf7ff 52%,rgba(27,179,250,0.14) 100%)", ["pro-experience-shell"], "xl"),
    "pro-experience-shell": wrapperNode("pro-experience-shell", "Suite profesional", "div", "pro-experience-shell grid gap-6 rounded-[36px] border bg-white/88 p-6 shadow-[0_34px_105px_-56px_rgba(7,89,133,0.54)] backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:p-8", { borderColor: IDEA_COLORS.border }, ["pro-experience-copy", "pro-experience-grid"]),
    "pro-experience-copy": wrapperNode("pro-experience-copy", "Texto experiencia Pro", "div", "premium-copy-stack space-y-5 self-center", {}, ["pro-experience-eyebrow", "pro-experience-title", "pro-experience-copy-text", "pro-experience-actions"]),
    "pro-experience-eyebrow": textNode("pro-experience-eyebrow", "Etiqueta experiencia", "EXPERIENCIA DE AGENCIA", IDEA_COLORS.coralDim, "left", "sm"),
    "pro-experience-title": headingNode("pro-experience-title", "Titulo experiencia", "Mas paginas, mejor narrativa y una estructura que escala", IDEA_COLORS.ink, "left", "4xl"),
    "pro-experience-copy-text": textNode("pro-experience-copy-text", "Texto experiencia", "El modo Pro no solo desbloquea opciones: entrega un sitio completo con rutas claras para explicar servicios, generar confianza, comparar planes y cerrar contactos.", IDEA_COLORS.muted, "left", "md"),
    "pro-experience-actions": wrapperNode("pro-experience-actions", "Acciones experiencia", "div", "mt-6 flex flex-wrap gap-3", {}, ["pro-experience-primary", "pro-experience-secondary"]),
    "pro-experience-primary": buttonNode("pro-experience-primary", "Editar sitio Pro", "page:servicios"),
    "pro-experience-secondary": buttonNode("pro-experience-secondary", "Ver contacto", "page:contacto", "secondary"),
    "pro-experience-grid": wrapperNode("pro-experience-grid", "Modulos Pro", "div", "grid gap-4 sm:grid-cols-2", {}, ["pro-experience-1", "pro-experience-2", "pro-experience-3", "pro-experience-4"]),
    "proof-grid": wrapperNode("proof-grid", "Datos de confianza", "div", "grid gap-4 text-white md:grid-cols-4", {}, ["proof-1", "proof-2", "proof-3", "proof-4"]),
    "proof-1": statCardNode("proof-1", ["proof-1-number", "proof-1-label"]),
    "proof-1-number": headingNode("proof-1-number", "Dato 1", "+5", "#ffffff", "center", "2xl"),
    "proof-1-label": textNode("proof-1-label", "Etiqueta dato 1", "paginas listas", "#dff4ff", "center", "sm"),
    "proof-2": statCardNode("proof-2", ["proof-2-number", "proof-2-label"]),
    "proof-2-number": headingNode("proof-2-number", "Dato 2", "24h", "#ffffff", "center", "2xl"),
    "proof-2-label": textNode("proof-2-label", "Etiqueta dato 2", "para adaptar contenido", "#dff4ff", "center", "sm"),
    "proof-3": statCardNode("proof-3", ["proof-3-number", "proof-3-label"]),
    "proof-3-number": headingNode("proof-3-number", "Dato 3", "100%", "#ffffff", "center", "2xl"),
    "proof-3-label": textNode("proof-3-label", "Etiqueta dato 3", "editable por el cliente", "#dff4ff", "center", "sm"),
    "proof-4": statCardNode("proof-4", ["proof-4-number", "proof-4-label"]),
    "proof-4-number": headingNode("proof-4-number", "Dato 4", "SEO", "#ffffff", "center", "2xl"),
    "proof-4-label": textNode("proof-4-label", "Etiqueta dato 4", "base preparada", "#dff4ff", "center", "sm"),

    "features-section": sectionNode("features-section", "Caracteristicas", "xl", "md", "left", IDEA_COLORS.paper, ["features-intro", "features-grid"], "xl"),
    "features-intro": introNode("features-intro", ["features-eyebrow", "features-title", "features-copy"]),
    "features-eyebrow": textNode("features-eyebrow", "Etiqueta plataforma", "Plataforma", IDEA_COLORS.coralDim, "left", "sm"),
    "features-title": headingNode("features-title", "Titulo caracteristicas", "Todo lo que necesita un sitio profesional, en un solo lugar", IDEA_COLORS.ink, "left", "4xl"),
    "features-copy": textNode("features-copy", "Descripcion caracteristicas", "Desde el primer bloque hasta el dominio publicado, Orvenix cubre cada paso sin combinar media docena de herramientas distintas.", IDEA_COLORS.muted, "left", "md"),
    "features-grid": wrapperNode("features-grid", "Grid de caracteristicas", "div", "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", {}, ["feature-1", "feature-2", "feature-3", "feature-4", "feature-5", "feature-6"]),
    "solutions-section": sectionNode("solutions-section", "Soluciones por objetivo", "xl", "md", "left", IDEA_COLORS.paperAlt, ["solutions-header", "solutions-grid"], "xl"),
    "solutions-header": wrapperNode("solutions-header", "Encabezado soluciones", "div", "mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", {}, ["solutions-copy-wrap", "solutions-button"]),
    "solutions-copy-wrap": wrapperNode("solutions-copy-wrap", "Texto soluciones", "div", "max-w-2xl", {}, ["solutions-eyebrow", "solutions-title", "solutions-copy"]),
    "solutions-eyebrow": textNode("solutions-eyebrow", "Etiqueta soluciones", "Soluciones", IDEA_COLORS.coralDim, "left", "sm"),
    "solutions-title": headingNode("solutions-title", "Titulo soluciones", "Un sitio completo segun lo que tu cliente quiere lograr", IDEA_COLORS.ink, "left", "4xl"),
    "solutions-copy": textNode("solutions-copy", "Descripcion soluciones", "Cada tarjeta puede convertirse en servicio, paquete, industria, beneficio o ruta comercial. La estructura esta lista para crecer sin redisenar todo.", IDEA_COLORS.muted, "left", "md"),
    "solutions-button": buttonNode("solutions-button", "Explorar servicios", "page:servicios", "secondary"),
    "solutions-grid": wrapperNode("solutions-grid", "Grid de soluciones", "div", "grid gap-4 md:grid-cols-2 lg:grid-cols-4", {}, ["solution-1", "solution-2", "solution-3", "solution-4"]),
    "solution-1": solutionCardNode("solution-1", ["solution-1-kicker", "solution-1-title", "solution-1-copy", "solution-1-link"]),
    "solution-1-kicker": textNode("solution-1-kicker", "Tipo 1", "Captar clientes", IDEA_COLORS.coralDim, "left", "sm"),
    "solution-1-title": headingNode("solution-1-title", "Solucion 1", "Landing de conversion", IDEA_COLORS.ink, "left", "xl"),
    "solution-1-copy": textNode("solution-1-copy", "Texto solucion 1", "Portada clara, beneficios, prueba social y contacto directo para recibir prospectos.", IDEA_COLORS.muted, "left", "sm"),
    "solution-1-link": buttonNode("solution-1-link", "Editar oferta", "page:servicios", "ghost"),
    "solution-2": solutionCardNode("solution-2", ["solution-2-kicker", "solution-2-title", "solution-2-copy", "solution-2-link"]),
    "solution-2-kicker": textNode("solution-2-kicker", "Tipo 2", "Vender", IDEA_COLORS.coralDim, "left", "sm"),
    "solution-2-title": headingNode("solution-2-title", "Solucion 2", "Catalogo comercial", IDEA_COLORS.ink, "left", "xl"),
    "solution-2-copy": textNode("solution-2-copy", "Texto solucion 2", "Ideal para productos, paquetes, servicios por nivel o botones de WhatsApp/pago.", IDEA_COLORS.muted, "left", "sm"),
    "solution-2-link": buttonNode("solution-2-link", "Ver precios", "page:precios", "ghost"),
    "solution-3": solutionCardNode("solution-3", ["solution-3-kicker", "solution-3-title", "solution-3-copy", "solution-3-link"]),
    "solution-3-kicker": textNode("solution-3-kicker", "Tipo 3", "Confianza", IDEA_COLORS.coralDim, "left", "sm"),
    "solution-3-title": headingNode("solution-3-title", "Solucion 3", "Sitio corporativo", IDEA_COLORS.ink, "left", "xl"),
    "solution-3-copy": textNode("solution-3-copy", "Texto solucion 3", "Paginas internas, equipo, metodologia, preguntas y una narrativa mas solida.", IDEA_COLORS.muted, "left", "sm"),
    "solution-3-link": buttonNode("solution-3-link", "Ver nosotros", "page:nosotros", "ghost"),
    "solution-4": solutionCardNode("solution-4", ["solution-4-kicker", "solution-4-title", "solution-4-copy", "solution-4-link"]),
    "solution-4-kicker": textNode("solution-4-kicker", "Tipo 4", "Escalar", IDEA_COLORS.coralDim, "left", "sm"),
    "solution-4-title": headingNode("solution-4-title", "Solucion 4", "Base multipagina", IDEA_COLORS.ink, "left", "xl"),
    "solution-4-copy": textNode("solution-4-copy", "Texto solucion 4", "Menu conectado y paginas listas para crecer con nuevas secciones sin perder coherencia.", IDEA_COLORS.muted, "left", "sm"),
    "solution-4-link": buttonNode("solution-4-link", "Contactar", "page:contacto", "ghost"),
    "showcase-section": sectionNode("showcase-section", "Presentacion visual", "xl", "md", "left", "linear-gradient(180deg,#ffffff 0%,#f7fcff 100%)", ["showcase-layout"], "xl"),
    "showcase-layout": wrapperNode("showcase-layout", "Bloque visual editable", "div", "grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]", {}, ["showcase-image-wrap", "showcase-copy-wrap"]),
    "showcase-image-wrap": wrapperNode("showcase-image-wrap", "Imagen profesional", "div", "idea-image-frame overflow-hidden rounded-[28px] border bg-white p-3 shadow-2xl", { borderColor: IDEA_COLORS.border }, ["showcase-image"]),
    "showcase-image": imageNode("showcase-image", "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200", "Equipo profesional revisando un sitio web"),
    "showcase-copy-wrap": wrapperNode("showcase-copy-wrap", "Texto de presentacion", "div", "idea-site-enter", {}, ["showcase-eyebrow", "showcase-title", "showcase-copy", "showcase-list", "showcase-button"]),
    "showcase-eyebrow": textNode("showcase-eyebrow", "Etiqueta visual", "Sitio listo para adaptar", IDEA_COLORS.coralDim, "left", "sm"),
    "showcase-title": headingNode("showcase-title", "Titulo visual", "Una estructura completa que el cliente entiende al instante", IDEA_COLORS.ink, "left", "4xl"),
    "showcase-copy": textNode("showcase-copy", "Texto visual", "El cliente no empieza desde cero: recibe una portada fuerte, beneficios claros, paginas internas, precios, testimonios y contacto. Solo cambia lo basico y el sitio ya se siente propio.", IDEA_COLORS.muted, "left", "md"),
    "showcase-list": wrapperNode("showcase-list", "Lista de valor", "div", "mt-6 grid gap-3 sm:grid-cols-2", {}, ["showcase-pill-1", "showcase-pill-2", "showcase-pill-3", "showcase-pill-4"]),
    "showcase-pill-1": premiumPillNode("showcase-pill-1", ["showcase-pill-1-text"]),
    "showcase-pill-1-text": textNode("showcase-pill-1-text", "Punto visual 1", "Textos editables", IDEA_COLORS.ink, "left", "sm"),
    "showcase-pill-2": premiumPillNode("showcase-pill-2", ["showcase-pill-2-text"]),
    "showcase-pill-2-text": textNode("showcase-pill-2-text", "Punto visual 2", "Imagenes reemplazables", IDEA_COLORS.ink, "left", "sm"),
    "showcase-pill-3": premiumPillNode("showcase-pill-3", ["showcase-pill-3-text"]),
    "showcase-pill-3-text": textNode("showcase-pill-3-text", "Punto visual 3", "Menu conectado", IDEA_COLORS.ink, "left", "sm"),
    "showcase-pill-4": premiumPillNode("showcase-pill-4", ["showcase-pill-4-text"]),
    "showcase-pill-4-text": textNode("showcase-pill-4-text", "Punto visual 4", "Botones funcionales", IDEA_COLORS.ink, "left", "sm"),
    "showcase-button": buttonNode("showcase-button", "Ver servicios", "page:servicios", "secondary"),

    "gallery-section": sectionNode("gallery-section", "Casos visuales", "xl", "md", "left", IDEA_COLORS.paper, ["gallery-header", "gallery-grid"], "xl"),
    "gallery-header": wrapperNode("gallery-header", "Encabezado casos", "div", "mb-10 max-w-2xl", {}, ["gallery-eyebrow", "gallery-title", "gallery-copy"]),
    "gallery-eyebrow": textNode("gallery-eyebrow", "Etiqueta casos", "Casos visuales", IDEA_COLORS.coralDim, "left", "sm"),
    "gallery-title": headingNode("gallery-title", "Titulo casos", "Bloques con imagen que hacen sentir el sitio terminado", IDEA_COLORS.ink, "left", "4xl"),
    "gallery-copy": textNode("gallery-copy", "Descripcion casos", "Estas tarjetas pueden mostrar proyectos, servicios, ubicaciones, productos o resultados. El cliente solo cambia imagen y texto.", IDEA_COLORS.muted, "left", "md"),
    "gallery-grid": wrapperNode("gallery-grid", "Grid visual", "div", "grid gap-5 lg:grid-cols-3", {}, ["gallery-1", "gallery-2", "gallery-3"]),
    "gallery-1": galleryCardNode("gallery-1", ["gallery-1-image", "gallery-1-title", "gallery-1-copy"]),
    "gallery-1-image": imageNode("gallery-1-image", "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900", "Oficina creativa con equipo trabajando"),
    "gallery-1-title": headingNode("gallery-1-title", "Caso 1", "Servicios profesionales", IDEA_COLORS.ink, "left", "xl"),
    "gallery-1-copy": textNode("gallery-1-copy", "Texto caso 1", "Presenta consultorias, agencias, despachos o negocios B2B con autoridad.", IDEA_COLORS.muted, "left", "sm"),
    "gallery-2": galleryCardNode("gallery-2", ["gallery-2-image", "gallery-2-title", "gallery-2-copy"]),
    "gallery-2-image": imageNode("gallery-2-image", "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900", "Personas revisando resultados de negocio"),
    "gallery-2-title": headingNode("gallery-2-title", "Caso 2", "Negocio local", IDEA_COLORS.ink, "left", "xl"),
    "gallery-2-copy": textNode("gallery-2-copy", "Texto caso 2", "Convierte informacion basica en una experiencia seria con contacto y confianza.", IDEA_COLORS.muted, "left", "sm"),
    "gallery-3": galleryCardNode("gallery-3", ["gallery-3-image", "gallery-3-title", "gallery-3-copy"]),
    "gallery-3-image": imageNode("gallery-3-image", "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900", "Equipo planificando una estrategia digital"),
    "gallery-3-title": headingNode("gallery-3-title", "Caso 3", "Marca en crecimiento", IDEA_COLORS.ink, "left", "xl"),
    "gallery-3-copy": textNode("gallery-3-copy", "Texto caso 3", "Escala de landing simple a sitio multipagina con mensajes consistentes.", IDEA_COLORS.muted, "left", "sm"),

    "workflow-section": sectionNode("workflow-section", "Proceso profesional", "xl", "md", "center", "linear-gradient(135deg,#075985 0%,#1379A8 100%)", ["workflow-eyebrow", "workflow-title", "workflow-copy", "workflow-grid"], "xl"),
    "workflow-eyebrow": textNode("workflow-eyebrow", "Etiqueta proceso", "Proceso", "#9ae5ff", "center", "sm"),
    "workflow-title": headingNode("workflow-title", "Titulo proceso", "De plantilla profesional a sitio propio en tres pasos", "#ffffff", "center", "4xl"),
    "workflow-copy": textNode("workflow-copy", "Texto proceso", "Un recorrido simple para clientes nuevos: cambian marca, ajustan contenido y publican con confianza.", "#dff4ff", "center", "md"),
    "workflow-grid": wrapperNode("workflow-grid", "Pasos de edicion", "div", "mt-10 grid gap-4 md:grid-cols-3", {}, ["workflow-1", "workflow-2", "workflow-3"]),
    "workflow-1": premiumStepNode("workflow-1", ["workflow-1-number", "workflow-1-title", "workflow-1-copy"]),
    "workflow-1-number": headingNode("workflow-1-number", "Numero paso 1", "01", "#9ae5ff", "left", "xl"),
    "workflow-1-title": headingNode("workflow-1-title", "Paso 1", "Cambia marca y portada", "#ffffff", "left", "xl"),
    "workflow-1-copy": textNode("workflow-1-copy", "Texto paso 1", "Actualiza nombre, descripcion principal, colores y primer llamado a la accion.", "#dff4ff", "left", "sm"),
    "workflow-2": premiumStepNode("workflow-2", ["workflow-2-number", "workflow-2-title", "workflow-2-copy"]),
    "workflow-2-number": headingNode("workflow-2-number", "Numero paso 2", "02", "#9ae5ff", "left", "xl"),
    "workflow-2-title": headingNode("workflow-2-title", "Paso 2", "Ajusta secciones clave", "#ffffff", "left", "xl"),
    "workflow-2-copy": textNode("workflow-2-copy", "Texto paso 2", "Personaliza beneficios, servicios, precios, testimonios y preguntas frecuentes.", "#dff4ff", "left", "sm"),
    "workflow-3": premiumStepNode("workflow-3", ["workflow-3-number", "workflow-3-title", "workflow-3-copy"]),
    "workflow-3-number": headingNode("workflow-3-number", "Numero paso 3", "03", "#9ae5ff", "left", "xl"),
    "workflow-3-title": headingNode("workflow-3-title", "Paso 3", "Conecta y publica", "#ffffff", "left", "xl"),
    "workflow-3-copy": textNode("workflow-3-copy", "Texto paso 3", "Revisa paginas internas, enlaces, botones de contacto y prepara el sitio para salir al publico.", "#dff4ff", "left", "sm"),

    "pricing-section": sectionNode("pricing-section", "Precios", "xl", "md", "center", IDEA_COLORS.paperAlt, ["pricing-eyebrow", "pricing-title", "pricing-copy", "pricing-grid"], "xl"),
    "pricing-eyebrow": textNode("pricing-eyebrow", "Etiqueta precios", "Precios", IDEA_COLORS.coralDim, "center", "sm"),
    "pricing-title": headingNode("pricing-title", "Titulo precios", "Un plan para cada etapa de tu negocio", IDEA_COLORS.ink, "center", "4xl"),
    "pricing-copy": textNode("pricing-copy", "Descripcion precios", "Empieza con lo esencial y sube de plan cuando lo necesites. Precios en pesos mexicanos.", IDEA_COLORS.muted, "center", "md"),
    "pricing-grid": wrapperNode("pricing-grid", "Planes", "div", "mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4", {}, ["plan-starter", "plan-pro", "plan-business", "plan-enterprise"]),
    "clients-section": sectionNode("clients-section", "Testimonios", "xl", "md", "left", IDEA_COLORS.paper, ["clients-eyebrow", "clients-title", "clients-grid"], "xl"),
    "clients-eyebrow": textNode("clients-eyebrow", "Etiqueta clientes", "Clientes", IDEA_COLORS.coralDim, "left", "sm"),
    "clients-title": headingNode("clients-title", "Titulo testimonios", "Negocios y agencias que ya construyen con Orvenix", IDEA_COLORS.ink, "left", "4xl"),
    "clients-grid": wrapperNode("clients-grid", "Grid testimonios", "div", "mt-10 grid gap-4 md:grid-cols-3", {}, ["client-1", "client-2", "client-3"]),
    "faq-section": sectionNode("faq-section", "Preguntas frecuentes", "xl", "md", "center", IDEA_COLORS.paperAlt, ["faq-eyebrow", "faq-title", "faq-grid"], "lg"),
    "faq-eyebrow": textNode("faq-eyebrow", "Etiqueta FAQ", "Preguntas frecuentes", IDEA_COLORS.coralDim, "center", "sm"),
    "faq-title": headingNode("faq-title", "Titulo FAQ", "Antes de que preguntes", IDEA_COLORS.ink, "center", "4xl"),
    "faq-grid": wrapperNode("faq-grid", "Lista de preguntas", "div", "mt-10 grid gap-4", {}, ["faq-1", "faq-2", "faq-3", "faq-4"]),
    "lead-section": sectionNode("lead-section", "Panel de contacto", "xl", "md", "left", "linear-gradient(135deg,#f7fcff 0%,#e5f6ff 100%)", ["lead-layout"], "xl"),
    "lead-layout": wrapperNode("lead-layout", "Contacto y brief", "div", "grid gap-6 lg:grid-cols-[0.9fr_1.1fr]", {}, ["lead-copy-card", "lead-brief-card"]),
    "lead-copy-card": wrapperNode("lead-copy-card", "Mensaje contacto", "div", "idea-lead-card rounded-[28px] border bg-white p-8 shadow-xl", { borderColor: IDEA_COLORS.border }, ["lead-eyebrow", "lead-title", "lead-copy", "lead-actions"]),
    "lead-eyebrow": textNode("lead-eyebrow", "Etiqueta contacto", "Contacto", IDEA_COLORS.coralDim, "left", "sm"),
    "lead-title": headingNode("lead-title", "Titulo contacto", "Cierra con una accion clara y facil de completar", IDEA_COLORS.ink, "left", "4xl"),
    "lead-copy": textNode("lead-copy", "Texto contacto", "Usa este bloque para WhatsApp, formulario, agenda o solicitud de cotizacion. Mantiene el sitio orientado a conversion sin verse agresivo.", IDEA_COLORS.muted, "left", "md"),
    "lead-actions": wrapperNode("lead-actions", "Botones contacto", "div", "mt-6 flex flex-wrap gap-3", {}, ["lead-primary", "lead-secondary"]),
    "lead-primary": buttonNode("lead-primary", "Enviar mensaje", "page:contacto"),
    "lead-secondary": buttonNode("lead-secondary", "Ver planes", "page:precios", "secondary"),
    "lead-brief-card": wrapperNode("lead-brief-card", "Brief visual", "div", "idea-brief-card rounded-[28px] border bg-white p-6 shadow-xl", { borderColor: IDEA_COLORS.border }, ["brief-title", "brief-1", "brief-2", "brief-3", "brief-note"]),
    "brief-title": headingNode("brief-title", "Titulo brief", "Brief rapido editable", IDEA_COLORS.ink, "left", "xl"),
    "brief-1": accordionNode("brief-1", ["brief-1-summary", "brief-1-copy"]),
    "brief-1-summary": summaryNode("brief-1-summary", ["brief-1-title"]),
    "brief-1-title": headingNode("brief-1-title", "Pregunta brief 1", "Que servicio necesita el cliente?", IDEA_COLORS.ink, "left", "lg"),
    "brief-1-copy": textNode("brief-1-copy", "Respuesta brief 1", "Define si busca presencia digital, ventas, reservas, catalogo, captacion o soporte.", IDEA_COLORS.muted, "left", "sm"),
    "brief-2": accordionNode("brief-2", ["brief-2-summary", "brief-2-copy"]),
    "brief-2-summary": summaryNode("brief-2-summary", ["brief-2-title"]),
    "brief-2-title": headingNode("brief-2-title", "Pregunta brief 2", "Que debe cambiar primero?", IDEA_COLORS.ink, "left", "lg"),
    "brief-2-copy": textNode("brief-2-copy", "Respuesta brief 2", "Marca, portada, precios, fotos, testimonios y botones son los cambios mas rapidos.", IDEA_COLORS.muted, "left", "sm"),
    "brief-3": accordionNode("brief-3", ["brief-3-summary", "brief-3-copy"]),
    "brief-3-summary": summaryNode("brief-3-summary", ["brief-3-title"]),
    "brief-3-title": headingNode("brief-3-title", "Pregunta brief 3", "Que falta para publicar?", IDEA_COLORS.ink, "left", "lg"),
    "brief-3-copy": textNode("brief-3-copy", "Respuesta brief 3", "Revisar enlaces, dominio, datos de contacto, SEO basico y una prueba final en movil.", IDEA_COLORS.muted, "left", "sm"),
    "brief-note": textNode("brief-note", "Nota brief", "Acordeones interactivos: el cliente puede abrir, revisar y editar cada punto.", IDEA_COLORS.faint, "left", "sm"),

    "home-cta-section": sectionNode("home-cta-section", "CTA final", "xl", "md", "center", IDEA_COLORS.paper, ["home-cta-card"], "xl"),
    "home-cta-card": wrapperNode("home-cta-card", "Banner CTA editable", "div", "idea-cta-card relative overflow-hidden rounded-[32px] border px-8 py-16 text-center shadow-2xl", { borderColor: IDEA_COLORS.border, background: "linear-gradient(135deg,#ffffff 0%,#eaf7ff 52%,#dff4ff 100%)" }, ["home-cta-title", "home-cta-copy", "home-cta-button"]),
    "home-cta-title": headingNode("home-cta-title", "Titulo CTA", "Tu proximo sitio puede estar publicado hoy", IDEA_COLORS.ink, "center", "4xl"),
    "home-cta-copy": textNode("home-cta-copy", "Texto CTA", "Empieza gratis, arma tu primer bloque en minutos y decide despues si quieres seguir.", IDEA_COLORS.muted, "center", "md"),
    "home-cta-button": buttonNode("home-cta-button", "Crear mi sitio gratis", "/register"),
    "home-footer": footerSection("home-footer", "Orvenix", "Hecho en Mexico · Sitio profesional editable con Orvenix"),
    "home-footer-title": headingNode("home-footer-title", "Marca footer", "Orvenix", "#ffffff", "center", "xl"),
    "home-footer-copy": textNode("home-footer-copy", "Texto footer", "Hecho en Mexico · Sitio profesional editable con Orvenix", "#dff4ff", "center", "sm"),
  }

  nodes["premium-detail-section"] = sectionNode("premium-detail-section", "Detalles premium", "xl", "md", "left", "linear-gradient(180deg,#ffffff 0%,#eaf7ff 100%)", ["premium-detail-header", "premium-detail-grid"], "xl")
  nodes["premium-detail-header"] = wrapperNode("premium-detail-header", "Encabezado premium", "div", "mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", {}, ["premium-detail-copy-wrap", "premium-detail-button"])
  nodes["premium-detail-copy-wrap"] = wrapperNode("premium-detail-copy-wrap", "Texto premium", "div", "max-w-3xl", {}, ["premium-detail-eyebrow", "premium-detail-title", "premium-detail-copy"])
  nodes["premium-detail-eyebrow"] = textNode("premium-detail-eyebrow", "Etiqueta premium", "Experiencia Pro", IDEA_COLORS.coralDim, "left", "sm")
  nodes["premium-detail-title"] = headingNode("premium-detail-title", "Titulo premium", "Una presencia digital con detalles que parecen de agencia", IDEA_COLORS.ink, "left", "4xl")
  nodes["premium-detail-copy"] = textNode("premium-detail-copy", "Descripcion premium", "El paquete Pro no solo agrega paginas: entrega una estructura con jerarquia, confianza, rutas de conversion y secciones listas para que el negocio se vea mas serio desde el primer clic.", IDEA_COLORS.muted, "left", "md")
  nodes["premium-detail-button"] = buttonNode("premium-detail-button", "Ver planes Pro", "page:precios", "secondary")
  nodes["premium-detail-grid"] = wrapperNode("premium-detail-grid", "Grid premium", "div", "grid gap-4 md:grid-cols-2 lg:grid-cols-4", {}, ["premium-detail-1", "premium-detail-2", "premium-detail-3", "premium-detail-4"])


  const proExperienceCards = [
    ["Menu", "Navegacion editable", "Paginas conectadas, CTA visible y labels personalizables desde el panel lateral."],
    ["Contenido", "Secciones con proposito", "Cada franja ayuda a explicar, probar, comparar o convertir al visitante."],
    ["Venta", "CTA mejor distribuidos", "El sitio conserva llamadas claras sin parecer agresivo o generico."],
    ["Escala", "Base para crecer", "Puedes agregar paginas, servicios, casos, precios y contenido nuevo sin perder coherencia."],
  ]
  proExperienceCards.forEach(([tag, title, copy], index) => addCopyCard(nodes, "pro-experience-" + (index + 1), tag, title, copy))

  nodes["pro-conversion-section"] = sectionNode("pro-conversion-section", "Ruta de conversion Pro", "xl", "md", "left", "linear-gradient(135deg,#075985 0%,#0E5C80 52%,#1794CC 130%)", ["pro-conversion-shell"], "xl")
  nodes["pro-conversion-shell"] = wrapperNode("pro-conversion-shell", "Sistema de conversion Pro", "div", "pro-conversion-shell grid gap-5 lg:grid-cols-4", {}, ["pro-route-1", "pro-route-2", "pro-route-3", "pro-route-4"])
  ;[
    ["01", "Home que vende", "Presenta la promesa, la autoridad y el primer CTA sin esfuerzo."],
    ["02", "Servicios claros", "Ordena paquetes, entregables y beneficios para decidir rapido."],
    ["03", "Confianza real", "Cuenta historia, metodologia, prueba social y preguntas frecuentes."],
    ["04", "Contacto directo", "Cierra con formulario, WhatsApp, correo o agenda segun el negocio."],
  ].forEach(([tag, title, copy], index) => {
    const id = "pro-route-" + (index + 1)
    nodes[id] = premiumStepNode(id, [id + "-number", id + "-title", id + "-copy"])
    nodes[id + "-number"] = headingNode(id + "-number", "Paso ruta " + tag, tag, "#9ae5ff", "left", "xl")
    nodes[id + "-title"] = headingNode(id + "-title", "Titulo ruta " + tag, title, "#ffffff", "left", "xl")
    nodes[id + "-copy"] = textNode(id + "-copy", "Texto ruta " + tag, copy, "#dff4ff", "left", "sm")
  })

  const premiumDetails = [
    ["Direccion", "Narrativa lista para vender", "Hero, beneficios, proceso, precios y cierres conectados para guiar al visitante."],
    ["Confianza", "Prueba y credibilidad", "Metricas, testimonios, FAQs y bloques de autoridad que reducen dudas."],
    ["Edicion", "Control sin abrumar", "El cliente cambia lo esencial sin tocar decisiones complejas de diseno."],
    ["Escala", "Base multipagina", "Menu, paginas internas y enlaces preparados para crecer como sitio profesional."],
  ]
  premiumDetails.forEach(([tag, title, copy], index) => addCopyCard(nodes, "premium-detail-" + (index + 1), tag, title, copy))

  nodes["conversion-section"] = sectionNode("conversion-section", "Sistema de conversion", "xl", "md", "left", "#ffffff", ["conversion-layout"], "xl")
  nodes["conversion-layout"] = wrapperNode("conversion-layout", "Layout conversion", "div", "grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center", {}, ["conversion-copy", "conversion-board"])
  nodes["conversion-copy"] = wrapperNode("conversion-copy", "Texto conversion", "div", "idea-site-enter", {}, ["conversion-eyebrow", "conversion-title", "conversion-copy-text", "conversion-button"])
  nodes["conversion-eyebrow"] = textNode("conversion-eyebrow", "Etiqueta conversion", "Conversion", IDEA_COLORS.coralDim, "left", "sm")
  nodes["conversion-title"] = headingNode("conversion-title", "Titulo conversion", "Cada pagina tiene una accion clara, no solo informacion", IDEA_COLORS.ink, "left", "4xl")
  nodes["conversion-copy-text"] = textNode("conversion-copy-text", "Texto conversion", "El visitante encuentra rutas visibles para comparar planes, revisar servicios, conocer la marca y contactar. Eso hace que el sitio se sienta pensado para vender, no solo para verse bonito.", IDEA_COLORS.muted, "left", "md")
  nodes["conversion-button"] = buttonNode("conversion-button", "Optimizar mi sitio", "page:contacto")
  nodes["conversion-board"] = wrapperNode("conversion-board", "Tablero de conversion", "div", "grid gap-4 rounded-[30px] border bg-[#f7fcff] p-5 shadow-2xl md:grid-cols-2", { borderColor: IDEA_COLORS.border }, ["conversion-card-1", "conversion-card-2", "conversion-card-3", "conversion-card-4"])
  const conversionCards = [
    ["Ruta 1", "Descubre", "Hero + confianza inicial"],
    ["Ruta 2", "Compara", "Servicios + planes"],
    ["Ruta 3", "Confirma", "Testimonios + FAQ"],
    ["Ruta 4", "Convierte", "Contacto + CTA final"],
  ]
  conversionCards.forEach(([tag, title, copy], index) => addCopyCard(nodes, "conversion-card-" + (index + 1), tag, title, copy))

  nodes["executive-summary-section"] = sectionNode("executive-summary-section", "Resumen ejecutivo", "xl", "md", "center", "linear-gradient(135deg,#eaf7ff 0%,#ffffff 100%)", ["executive-eyebrow", "executive-title", "executive-copy", "executive-grid"], "xl")
  nodes["executive-eyebrow"] = textNode("executive-eyebrow", "Etiqueta resumen", "Resumen Pro", IDEA_COLORS.coralDim, "center", "sm")
  nodes["executive-title"] = headingNode("executive-title", "Titulo resumen", "Mas que una plantilla: una base comercial completa", IDEA_COLORS.ink, "center", "4xl")
  nodes["executive-copy"] = textNode("executive-copy", "Texto resumen", "Ideal para clientes que quieren verse profesionales sin redisenar todo. Cambian marca, fotos, precios y datos; la estructura ya hace el trabajo pesado.", IDEA_COLORS.muted, "center", "md")
  nodes["executive-grid"] = wrapperNode("executive-grid", "Grid resumen", "div", "mt-10 grid gap-4 md:grid-cols-4", {}, ["executive-1", "executive-2", "executive-3", "executive-4"])
  const executiveCards = [
    ["5", "Paginas conectadas", "Inicio, servicios, nosotros, precios y contacto."],
    ["12+", "Secciones listas", "Bloques comerciales para explicar, probar y convertir."],
    ["100%", "Editable", "Textos, imagenes, botones, precios y enlaces."],
    ["1", "Flujo claro", "Desde primer impacto hasta contacto o compra."],
  ]
  executiveCards.forEach(([tag, title, copy], index) => addCopyCard(nodes, "executive-" + (index + 1), tag, title, copy))

  const features = [
    ["Editor", "Editor de bloques en vivo", "Arrastra, suelta y reordena secciones sobre un lienzo real. Cada cambio se ve al instante."],
    ["Diseno", "Identidad de marca en un clic", "Define colores, tipografias y estilos una sola vez y aplicalos a todo el sitio."],
    ["Publicacion", "Dominio y hosting incluido", "Conecta tu dominio en minutos. Hosting, seguridad y actualizaciones corren por nuestra cuenta."],
    ["Ventas", "Catalogo y pagos", "Agrega productos, precios y botones de pago o WhatsApp sin plugins complicados."],
    ["Velocidad", "Sitios rapidos por diseno", "Cada pagina nace optimizada para cargar rapido y dar buena experiencia desde el primer clic."],
    ["Respaldo", "Historial y deshacer", "Cada edicion queda registrada para experimentar sin miedo y volver atras cuando haga falta."],
  ]
  features.forEach(([tag, title, copy], index) => addCopyCard(nodes, "feature-" + (index + 1), tag, title, copy))

  const plans = [
    ["starter", "Starter", "$249/mes + IVA", "Para un primer sitio profesional.", "1 sitio publicado · Plantillas base · Dominio personalizado · Soporte por correo", "/register?plan=starter", false],
    ["pro", "Pro", "$599/mes + IVA", "Para negocios que ya venden en linea.", "3 sitios publicados · Catalogo y pagos · Secciones avanzadas · Soporte prioritario", "/register?plan=pro", true],
    ["business", "Business", "$1,299/mes + IVA", "Para agencias que atienden clientes.", "10 sitios publicados · Roles de equipo · Marca blanca · Gestor de cuenta", "/register?plan=business", false],
    ["enterprise", "Enterprise", "Cotizacion a la medida", "Para operaciones con necesidades especificas.", "Sitios ilimitados · SLA · Integraciones · Onboarding dedicado", "page:contacto", false],
  ] as const
  plans.forEach(([key, name, price, copy, featuresText, href, highlight]) => {
    const id = "plan-" + key
    const children = highlight ? [id + "-badge", id + "-name", id + "-price", id + "-copy", id + "-features", id + "-button"] : [id + "-name", id + "-price", id + "-copy", id + "-features", id + "-button"]
    nodes[id] = priceCardNode(id, children, highlight)
    if (highlight) nodes[id + "-badge"] = textNode(id + "-badge", "Etiqueta destacado", "MAS ELEGIDO", IDEA_COLORS.coralDim, "left", "sm")
    nodes[id + "-name"] = headingNode(id + "-name", "Plan " + name, name, IDEA_COLORS.ink, "left", "xl")
    nodes[id + "-price"] = headingNode(id + "-price", "Precio " + name, price, IDEA_COLORS.ink, "left", "2xl")
    nodes[id + "-copy"] = textNode(id + "-copy", "Descripcion " + name, copy, IDEA_COLORS.muted, "left", "sm")
    nodes[id + "-features"] = textNode(id + "-features", "Incluye " + name, featuresText, IDEA_COLORS.muted, "left", "sm")
    nodes[id + "-button"] = buttonNode(id + "-button", key === "enterprise" ? "Hablar con ventas" : "Empezar con " + name, href, highlight ? "primary" : "secondary")
  })

  const testimonials = [
    ["Antes tardabamos dos semanas en entregar un sitio. Con Orvenix armamos la primera propuesta en una tarde.", "Renata Duarte"],
    ["Subi el catalogo, conecte WhatsApp y el sitio ya recibia pedidos ese mismo fin de semana.", "Ivan Cardenas"],
    ["Manejamos varios sitios de clientes desde una sola cuenta y mantenemos una experiencia clara.", "Paulina Resendiz"],
  ]
  testimonials.forEach(([copy, name], index) => addQuoteCard(nodes, "client-" + (index + 1), copy, name))

  const faqs = [
    ["Necesito saber programar?", "No. El editor funciona con bloques ya disenados y textos editables desde el lienzo."],
    ["El hosting esta incluido?", "Si. Puedes conectar tu dominio y Orvenix se encarga del hosting y seguridad."],
    ["Puedo cancelar cuando quiera?", "Si. Puedes cambiar o cancelar tu plan desde tu cuenta sin penalizaciones."],
    ["Puedo vender productos?", "Puedes usar un sitio informativo o activar catalogo, pagos y botones de WhatsApp."],
  ]
  faqs.forEach(([question, answer], index) => addFaqCard(nodes, "faq-" + (index + 1), question, answer))

  return {
    version: 1,
    rootId: "root",
    theme,
    seo: {
      title: "Orvenix - Constructor de sitios web para Mexico",
      description:
        "Crea un sitio web bonito y funcional sin complicarte. Bloques editables, hosting incluido y publicacion lista para negocios y agencias.",
      keywords: "constructor web, sitios web Mexico, SaaS, agencias, editor de bloques",
      ogImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200",
    },
    brand,
    nodes,
  }
}

function withProfessionalChrome(tree: EditorTree, currentPageName: string): EditorTree {
  const nextTree: EditorTree = JSON.parse(JSON.stringify(tree))
  const root = nextTree.nodes[nextTree.rootId]

  if (!root) return nextTree

  const navShellId = "site-nav-shell"
  const navId = "site-nav-main"
  const footerId = "site-footer"

  nextTree.nodes[navId] = navNode(navId, "Orvenix", "light")
  nextTree.nodes[navShellId] = sectionNode(navShellId, "Header profesional", "none", "none", "center", "transparent", [navId], "full")
  nextTree.nodes[footerId] = footerSection(footerId, "Orvenix", currentPageName + " · Sitio profesional editable con Orvenix")
  nextTree.nodes[footerId + "-title"] = headingNode(footerId + "-title", "Marca footer", "Orvenix", "#ffffff", "center", "xl")
  nextTree.nodes[footerId + "-copy"] = textNode(footerId + "-copy", "Texto footer", currentPageName + " · Sitio profesional editable con Orvenix", "#dff4ff", "center", "sm")

  root.children = [
    navShellId,
    ...root.children.filter((childId) => childId !== navId && childId !== navShellId && childId !== footerId),
    footerId,
  ]

  return nextTree
}

function buildProfessionalPageTree({
  slug,
  eyebrow,
  title,
  copy,
  sections,
  cta,
}: {
  slug: string
  eyebrow: string
  title: string
  copy: string
  sections: Array<[string, string]>
  cta: string
}): EditorTree {
  const cardIds = sections.map((_, index) => slug + "-card-" + (index + 1))
  const nodes: EditorTree["nodes"] = {
    root: sectionNode("root", "Pagina " + slug, "none", "none", "left", IDEA_COLORS.paper, [slug + "-hero", slug + "-content", slug + "-cta-section"], "full"),
    [slug + "-hero"]: sectionNode(
      slug + "-hero",
      "Hero de pagina",
      "xl",
      "md",
      "center",
      "linear-gradient(135deg, rgba(27,179,250,0.16) 0%, #ffffff 48%, rgba(19,121,168,0.14) 100%)",
      [slug + "-eyebrow", slug + "-title", slug + "-copy", slug + "-hero-cta"],
      "lg",
    ),
    [slug + "-eyebrow"]: textNode(slug + "-eyebrow", "Etiqueta", eyebrow, IDEA_COLORS.coralDim, "center", "sm"),
    [slug + "-title"]: headingNode(slug + "-title", "Titulo", title, IDEA_COLORS.ink, "center", "4xl"),
    [slug + "-copy"]: textNode(slug + "-copy", "Descripcion", copy, IDEA_COLORS.muted, "center", "lg"),
    [slug + "-hero-cta"]: buttonNode(slug + "-hero-cta", cta, slug === "contacto" ? "mailto:hola@orvenix.com" : "page:contacto"),
    [slug + "-content"]: sectionNode(slug + "-content", "Contenido principal", "xl", "md", "left", slug === "precios" ? IDEA_COLORS.paperAlt : IDEA_COLORS.paper, [slug + "-grid"], "xl"),
    [slug + "-grid"]: wrapperNode(slug + "-grid", "Bloques editables", "div", "grid gap-4 md:grid-cols-3", {}, cardIds),
    [slug + "-cta-section"]: sectionNode(slug + "-cta-section", "CTA final", "xl", "md", "center", IDEA_COLORS.paper, [slug + "-cta-card"], "lg"),
    [slug + "-cta-card"]: wrapperNode(slug + "-cta-card", "Banner CTA", "div", "idea-cta-card rounded-[28px] border bg-white px-8 py-12 text-center shadow-xl", { borderColor: IDEA_COLORS.border }, [slug + "-cta-title", slug + "-cta-copy", slug + "-cta-button"]),
    [slug + "-cta-title"]: headingNode(slug + "-cta-title", "Titulo CTA", "Listo para avanzar con claridad", IDEA_COLORS.ink, "center", "3xl"),
    [slug + "-cta-copy"]: textNode(slug + "-cta-copy", "Texto CTA", "Edita este bloque para guiar al cliente hacia la siguiente accion.", IDEA_COLORS.muted, "center", "md"),
    [slug + "-cta-button"]: buttonNode(slug + "-cta-button", cta, "page:contacto"),
  }

  sections.forEach(([sectionTitle, sectionCopy], index) => addCopyCard(nodes, cardIds[index] ?? slug + "-card-" + (index + 1), "Bloque " + (index + 1), sectionTitle, sectionCopy))

  const tree: EditorTree = {
    version: 1,
    rootId: "root",
    theme: ideaTheme(),
    seo: {
      title: title + " - Orvenix",
      description: copy,
      keywords: slug + ", orvenix, sitio profesional editable",
      ogImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200",
    },
    brand: IDEA_BRAND,
    nodes,
  }

  return withProfessionalChrome(tree, title)
}


function imageNode(id: string, src: string, alt: string) {
  return {
    id,
    type: "image",
    displayName: alt,
    props: {
      src,
      alt,
      width: 1200,
      height: 760,
      objectFit: "cover",
    },
    children: [],
    version: 1,
  }
}

function statCardNode(id: string, children: string[]) {
  return wrapperNode(
    id,
    "Dato de confianza",
    "div",
    "idea-stat-card rounded-2xl border border-white/15 bg-white/10 p-5 text-center shadow-xl backdrop-blur-md",
    {},
    children,
  )
}

function premiumPillNode(id: string, children: string[]) {
  return wrapperNode(
    id,
    "Detalle editable",
    "div",
    "idea-premium-pill rounded-full border bg-white px-4 py-3 shadow-sm",
    { borderColor: IDEA_COLORS.border },
    children,
  )
}

function premiumStepNode(id: string, children: string[]) {
  return wrapperNode(
    id,
    "Paso editable",
    "article",
    "idea-step-card h-full rounded-3xl border border-white/12 bg-white/[0.08] p-6 text-left shadow-2xl backdrop-blur-md",
    {},
    children,
  )
}

function navNode(id: string, title: string, surface: "dark" | "light") {
  return {
    id,
    type: "siteNav",
    displayName: "Menu profesional del sitio",
    props: {
      title,
      subtitle: "Sitio profesional",
      showHome: true,
      showCta: true,
      ctaLabel: "Contactar",
      ctaHref: "page:contacto",
      layout: "row",
      justify: "end",
      variant: "pill",
      surface,
      chrome: "integrated",
    },
    children: [],
    version: 1,
  }
}

function footerSection(id: string, title: string, copy: string) {
  const node = sectionNode(id, "Pie de pagina " + title, "lg", "md", "center", IDEA_COLORS.ink, [id + "-title", id + "-copy"], "full")
  node.props["dataSummary"] = copy
  return node
}

function ideaBlockNode(id: string, children: string[], background: string) {
  return wrapperNode(id, "Bloque del mockup", "div", "idea-canvas-block rounded-2xl border px-4 py-5", { background, borderColor: IDEA_COLORS.border }, children)
}

function introNode(id: string, children: string[]) {
  return wrapperNode(id, "Introduccion de seccion", "div", "max-w-2xl", {}, children)
}

function ideaFeatureCard(id: string, children: string[]) {
  return wrapperNode(id, "Tarjeta editable", "article", "idea-site-card h-full rounded-2xl border bg-white p-6 shadow-sm", { borderColor: IDEA_COLORS.border }, children)
}

function priceCardNode(id: string, children: string[], highlight = false) {
  return wrapperNode(
    id,
    "Plan editable",
    "article",
    "idea-price-card h-full rounded-2xl border bg-white p-6 shadow-sm" + (highlight ? " idea-price-card-highlight" : ""),
    { borderColor: highlight ? IDEA_COLORS.coral : IDEA_COLORS.border },
    children,
  )
}


function solutionCardNode(id: string, children: string[]) {
  return wrapperNode(
    id,
    "Solucion editable",
    "article",
    "idea-solution-card group h-full rounded-[26px] border bg-white p-6 shadow-sm",
    { borderColor: IDEA_COLORS.border },
    children,
  )
}

function galleryCardNode(id: string, children: string[]) {
  return wrapperNode(
    id,
    "Caso visual editable",
    "article",
    "idea-gallery-card h-full overflow-hidden rounded-[28px] border bg-white p-3 shadow-xl",
    { borderColor: IDEA_COLORS.border },
    children,
  )
}

function accordionNode(id: string, children: string[]) {
  return wrapperNode(
    id,
    "Acordeon editable",
    "details",
    "idea-accordion rounded-2xl border bg-white p-5 shadow-sm",
    { borderColor: IDEA_COLORS.border },
    children,
  )
}

function summaryNode(id: string, children: string[]) {
  return wrapperNode(
    id,
    "Titulo desplegable",
    "summary",
    "idea-accordion-summary cursor-pointer list-none",
    {},
    children,
  )
}

function addCopyCard(nodes: EditorTree["nodes"], id: string, tag: string, title: string, copy: string) {
  nodes[id] = ideaFeatureCard(id, [id + "-tag", id + "-title", id + "-copy"])
  nodes[id + "-tag"] = textNode(id + "-tag", "Categoria", tag, IDEA_COLORS.coralDim, "left", "sm")
  nodes[id + "-title"] = headingNode(id + "-title", title, title, IDEA_COLORS.ink, "left", "xl")
  nodes[id + "-copy"] = textNode(id + "-copy", "Texto", copy, IDEA_COLORS.muted, "left", "sm")
}

function addQuoteCard(nodes: EditorTree["nodes"], id: string, copy: string, name: string) {
  nodes[id] = ideaFeatureCard(id, [id + "-stars", id + "-copy", id + "-name"])
  nodes[id + "-stars"] = textNode(id + "-stars", "Calificacion", "★★★★★", IDEA_COLORS.amber, "left", "sm")
  nodes[id + "-copy"] = textNode(id + "-copy", "Testimonio", copy, IDEA_COLORS.muted, "left", "sm")
  nodes[id + "-name"] = headingNode(id + "-name", name, name, IDEA_COLORS.ink, "left", "lg")
}

function addFaqCard(nodes: EditorTree["nodes"], id: string, question: string, answer: string) {
  nodes[id] = accordionNode(id, [id + "-summary", id + "-a"])
  nodes[id + "-summary"] = summaryNode(id + "-summary", [id + "-q"])
  nodes[id + "-q"] = headingNode(id + "-q", question, question, IDEA_COLORS.ink, "left", "lg")
  nodes[id + "-a"] = textNode(id + "-a", "Respuesta", answer, IDEA_COLORS.muted, "left", "sm")
}

function sectionNode(
  id: string,
  displayName: string,
  paddingY: "none" | "sm" | "md" | "lg" | "xl",
  paddingX: "none" | "sm" | "md" | "lg",
  align: "left" | "center" | "right",
  background: string,
  children: string[],
  maxWidth: "sm" | "md" | "lg" | "xl" | "full" = "lg",
) {
  return {
    id,
    type: "section",
    displayName,
    props: {
      maxWidth,
      paddingY,
      paddingX,
      align,
      background,
    },
    children,
    version: 1,
  }
}

function wrapperNode(
  id: string,
  displayName: string,
  originalType: string,
  className: string,
  style: Record<string, unknown>,
  children: string[],
) {
  return {
    id,
    type: "genericWrapper",
    displayName,
    props: {
      originalType,
      className,
      style,
    },
    children,
    version: 1,
  }
}

function headingNode(
  id: string,
  displayName: string,
  text: string,
  color: string,
  align: "left" | "center" | "right",
  size: string,
) {
  return {
    id,
    type: "heading",
    displayName,
    props: {
      text,
      level: 2,
      size,
      weight: "extrabold",
      color,
      align,
      marginBottom: "sm",
    },
    children: [],
    version: 1,
  }
}

function textNode(
  id: string,
  displayName: string,
  content: string,
  color: string,
  align: "left" | "center" | "right",
  size: string,
) {
  return {
    id,
    type: "text",
    displayName,
    props: {
      content,
      size,
      color,
      align,
      maxWidth: "lg",
    },
    children: [],
    version: 1,
  }
}

function buttonNode(
  id: string,
  label: string,
  href: string,
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
) {
  return {
    id,
    type: "ctaButton",
    displayName: label,
    props: {
      label,
      href,
      variant,
      size: "lg",
    },
    children: [],
    version: 1,
  }
}
