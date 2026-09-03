import type { EditorNode, EditorTree } from "@/types/editor"

const COLORS = {
  bg: "#eef9ff",
  panel: "#ffffff",
  text: "#062f44",
  muted: "#426b7d",
  faint: "#7aa6ba",
  primary: "#1BB3FA",
  primaryDark: "#075985",
  accent: "#1794CC",
  line: "rgba(7,89,133,0.12)",
}

type Align = "left" | "center" | "right"
type TextSize = "sm" | "md" | "lg"
type HeadingSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"

export function buildRichStarterTree(): EditorTree {
  const nodes: Record<string, EditorNode> = {}

  addSection(nodes, "root", "Landing Orvenix editable", {
    maxWidth: "full",
    paddingY: "none",
    paddingX: "none",
    background:
      "linear-gradient(135deg, rgba(27,179,250,0.20) 0%, rgba(23,148,204,0.14) 42%, rgba(7,89,133,0.08) 100%), linear-gradient(rgba(7,89,133,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(7,89,133,0.035) 1px, transparent 1px), #eef9ff",
  }, [
    "site-nav",
    "sticky-cta-bar",
    "hero-section",
    "premium-showcase-section",
    "logos-section",
    "product-section",
    "signature-section",
    "pain-section",
    "outcomes-section",
    "trust-section",
    "transformation-section",
    "workflow-section",
    "use-cases-section",
    "templates-section",
    "gallery-section",
    "before-after-section",
    "offer-section",
    "comparison-section",
    "included-section",
    "premium-path-section",
    "pricing-section",
    "testimonials-section",
    "lead-section",
    "objections-section",
    "faq-section",
    "cta-section",
    "footer-section",
  ])

  nodes["site-nav"] = {
    id: "site-nav",
    type: "siteNav",
    displayName: "Menu principal Orvenix",
    props: {
      title: "Orvenix",
      subtitle: "Builder para negocios y agencias",
      showHome: true,
      showCta: true,
      ctaLabel: "Probar gratis",
      ctaHref: "#precios",
      layout: "row",
      justify: "end",
      variant: "pill",
      surface: "light",
      chrome: "integrated",
      pages: [
        { label: "Producto", href: "#producto" },
        { label: "Showcase", href: "#showcase" },
        { label: "Casos", href: "#casos" },
        { label: "Precios", href: "#precios" },
        { label: "Contacto", href: "#contacto" },
      ],
    },
    children: [],
    version: 1,
  }

  wrap(nodes, "sticky-cta-bar", "Barra sticky premium", "div", "sticky top-3 z-40 mx-auto hidden w-[min(1120px,calc(100%-2rem))] items-center justify-between gap-4 rounded-full border border-slate-900/10 bg-white/88 px-4 py-3 shadow-[0_24px_70px_-44px_rgba(7,89,133,0.65)] backdrop-blur-xl lg:flex", ["sticky-cta-copy", "sticky-cta-actions"])
  wrap(nodes, "sticky-cta-copy", "Mensaje sticky", "div", "flex min-w-0 items-center gap-3", ["sticky-cta-dot", "sticky-cta-text"])
  wrap(nodes, "sticky-cta-dot", "Indicador sticky", "span", "h-2.5 w-2.5 shrink-0 rounded-full bg-[#1BB3FA] shadow-[0_0_0_6px_rgba(23,148,204,0.16)]", [])
  text(nodes, "sticky-cta-text", "Texto sticky", "Tu landing premium lista para editar, publicar y vender", COLORS.text, "left", "sm")
  wrap(nodes, "sticky-cta-actions", "Acciones sticky", "div", "flex shrink-0 items-center gap-2", ["sticky-cta-secondary", "sticky-cta-primary"])
  button(nodes, "sticky-cta-secondary", "Boton sticky demo", "Ver showcase", "#showcase", "secondary", "sm")
  button(nodes, "sticky-cta-primary", "Boton sticky principal", "Empezar", "#precios", "primary", "sm")

  addSection(nodes, "hero-section", "Hero Orvenix", {
    as: "header",
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(180deg, rgba(238,249,255,0.84), rgba(238,249,255,0.98))",
  }, ["hero-grid"])
  wrap(nodes, "hero-grid", "Hero en dos columnas", "div", "premium-landing-hero-grid grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center", ["hero-copy", "hero-builder"])
  wrap(nodes, "hero-copy", "Contenido hero", "div", "premium-copy-stack space-y-5", ["hero-kicker", "hero-title", "hero-lead", "hero-actions", "hero-trust"])
  text(nodes, "hero-kicker", "Etiqueta hero", "LANDING PREMIUM / LISTA PARA VENDER", COLORS.primaryDark, "left", "sm")
  heading(nodes, "hero-title", "Titulo principal", "Convierte tu oferta en una landing premium que vende desde el primer vistazo", 1, "5xl", COLORS.text, "left")
  text(nodes, "hero-lead", "Descripcion principal", "Una pagina completa con narrativa comercial, imagenes reemplazables, secciones de confianza, precios, FAQ y llamadas a la accion. Cambia marca, fotos y oferta; la experiencia ya se siente terminada.", COLORS.muted, "left", "lg")
  wrap(nodes, "hero-actions", "Acciones hero", "div", "flex flex-wrap items-center gap-3 pt-2", ["hero-primary", "hero-secondary"])
  button(nodes, "hero-primary", "Boton empezar", "Empezar gratis", "#precios", "primary", "lg")
  button(nodes, "hero-secondary", "Boton demo", "Ver como funciona", "#como-funciona", "secondary", "md")
  wrap(nodes, "hero-trust", "Confianza hero", "div", "grid gap-2 pt-2 sm:grid-cols-3", ["hero-meta-1", "hero-meta-2", "hero-meta-3"])
  pill(nodes, "hero-meta-1", "Sin tarjeta de credito")
  pill(nodes, "hero-meta-2", "Publica en minutos")
  pill(nodes, "hero-meta-3", "Hosting y SSL incluidos")

  wrap(nodes, "hero-builder", "Vista previa del builder", "aside", "premium-live-preview rounded-[32px] border border-slate-900/10 bg-white/86 p-4 shadow-[0_34px_100px_-48px_rgba(7,89,133,0.62)] backdrop-blur", ["mock-topbar", "mock-body", "mock-bottom"])
  wrap(nodes, "mock-topbar", "Barra del builder", "div", "mb-4 flex items-center justify-between rounded-2xl border border-slate-900/10 bg-[#dff4ff] px-4 py-3", ["mock-brand", "mock-status"])
  heading(nodes, "mock-brand", "Marca mockup", "Editor Orvenix", 3, "xl", COLORS.text, "left")
  text(nodes, "mock-status", "Estado mockup", "Guardado automatico", COLORS.primary, "right", "sm")
  wrap(nodes, "mock-body", "Editor visual", "div", "grid gap-4 md:grid-cols-[0.74fr_1.26fr]", ["mock-sidebar", "mock-canvas"])
  wrap(nodes, "mock-sidebar", "Panel lateral demo", "div", "rounded-2xl border border-slate-900/10 bg-[#e5f6ff] p-4", ["mock-side-title", "mock-side-1", "mock-side-2", "mock-side-3", "mock-side-4"])
  text(nodes, "mock-side-title", "Titulo panel demo", "Bloques listos", COLORS.primaryDark, "left", "sm")
  pill(nodes, "mock-side-1", "Hero")
  pill(nodes, "mock-side-2", "Texto")
  pill(nodes, "mock-side-3", "Galeria")
  pill(nodes, "mock-side-4", "Formulario")
  wrap(nodes, "mock-canvas", "Lienzo demo", "div", "space-y-3 rounded-2xl border border-slate-900/10 bg-white p-4", ["mock-canvas-1", "mock-canvas-2", "mock-canvas-3"])
  demoBlock(nodes, "mock-canvas-1", "Hero listo", "Titulo, texto y CTA editables")
  demoBlock(nodes, "mock-canvas-2", "Galeria comercial", "Imagenes, tarjetas y beneficios")
  demoBlock(nodes, "mock-canvas-3", "Formulario de contacto", "Datos, WhatsApp y seguimiento")
  wrap(nodes, "mock-bottom", "Resumen mockup", "div", "mt-4 grid gap-3 sm:grid-cols-3", ["mock-stat-1", "mock-stat-2", "mock-stat-3"])
  metric(nodes, "mock-stat-1", "42%", "Mas claridad")
  metric(nodes, "mock-stat-2", "1 clic", "Publicar")
  metric(nodes, "mock-stat-3", "24/7", "Sitio activo")

  addSection(nodes, "premium-showcase-section", "Showcase premium", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(135deg, #075985 0%, #0E5C80 48%, #1794CC 128%)",
    htmlId: "showcase",
  }, ["premium-showcase-shell"])
  wrap(nodes, "premium-showcase-shell", "Experiencia premium", "div", "premium-showcase sales-reveal grid gap-8 rounded-[34px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_38px_120px_-60px_rgba(0,0,0,0.90)] backdrop-blur lg:grid-cols-[0.92fr_1.08fr] lg:p-8", ["premium-showcase-copy", "premium-showcase-visual"])
  wrap(nodes, "premium-showcase-copy", "Texto showcase premium", "div", "space-y-5 self-center", ["showcase-kicker", "showcase-title", "showcase-copy", "showcase-points", "showcase-actions"])
  text(nodes, "showcase-kicker", "Etiqueta showcase", "EXPERIENCIA PREMIUM", "#9ae5ff", "left", "sm")
  heading(nodes, "showcase-title", "Titulo showcase", "Una primera impresion que parece sitio terminado, no plantilla generica", 2, "4xl", "#ffffff", "left")
  text(nodes, "showcase-copy", "Texto showcase", "El cliente no empieza preguntandose que falta. Ve una landing con presencia, profundidad visual, mensajes listos, imagenes reemplazables y CTA colocados donde importan.", "#dff4ff", "left", "md")
  wrap(nodes, "showcase-points", "Puntos premium", "div", "grid gap-3 sm:grid-cols-2", ["showcase-point-1", "showcase-point-2", "showcase-point-3", "showcase-point-4"])
  premiumMiniCard(nodes, "showcase-point-1", "Narrativa completa", "De promesa a contacto")
  premiumMiniCard(nodes, "showcase-point-2", "Visual real", "Fotos y tarjetas editables")
  premiumMiniCard(nodes, "showcase-point-3", "CTA persistente", "Siempre hay siguiente paso")
  premiumMiniCard(nodes, "showcase-point-4", "Lista para publicar", "Sin redisenar desde cero")
  wrap(nodes, "showcase-actions", "Acciones showcase", "div", "flex flex-wrap gap-3 pt-2", ["showcase-primary", "showcase-secondary"])
  button(nodes, "showcase-primary", "Boton showcase principal", "Personalizar esta landing", "#contacto", "primary", "md")
  button(nodes, "showcase-secondary", "Boton showcase secundario", "Ver que incluye", "#incluye", "secondary", "md")
  wrap(nodes, "premium-showcase-visual", "Visual showcase", "div", "relative min-h-[430px] overflow-hidden rounded-[30px] border border-white/10 bg-[#e5f6ff] p-3 shadow-[0_34px_90px_-48px_rgba(0,0,0,0.85)]", ["showcase-image", "showcase-floating-1", "showcase-floating-2", "showcase-floating-3"])
  imageNode(nodes, "showcase-image", "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1400&q=84&auto=format&fit=crop", "Landing premium en una oficina moderna")
  premiumFloat(nodes, "showcase-floating-1", "Listo para vender", "Promesa + prueba + CTA", "top-5 left-5")
  premiumFloat(nodes, "showcase-floating-2", "+6 secciones", "Contenido comercial editable", "bottom-5 left-5")
  premiumFloat(nodes, "showcase-floating-3", "Publicacion", "Un flujo claro hasta el sitio final", "right-5 top-1/2 -translate-y-1/2")

  addCardStrip(nodes, "logos-section", "Marcas de ejemplo", "Empresas que podrian lanzar con Orvenix", [
    "Aurea", "Lumvio", "El Baul", "Nortia", "Cabrera & Asoc.", "Vento",
  ])

  addIntroSection(nodes, "product-section", "Producto", "PRODUCTO", "Todo lo necesario para crear y publicar sin friccion", "El constructor entrega estructura, contenido base y controles simples. El cliente puede cambiar textos, colores, botones, secciones y datos clave sin enfrentarse a una herramienta pesada.", "#ffffff", ["feature-grid"])
  wrap(nodes, "feature-grid", "Funciones principales", "div", "sales-reveal grid gap-4 md:grid-cols-2 lg:grid-cols-3", [])
  addCards(nodes, "feature-grid", "feature", [
    ["Mensaje listo para vender", "Titulares, argumentos y CTA preparados para que el cliente no empiece con una pagina vacia."],
    ["Edicion sin tocar diseno", "La estructura visual ya esta resuelta; solo se cambian textos, fotos, enlaces, colores y precios."],
    ["Secciones comerciales completas", "Promesa, beneficios, proceso, comparativa, testimonios, FAQ y cierre de venta en una sola landing."],
    ["Responsivo automatico", "La pagina conserva lectura profesional en escritorio, tablet y movil sin ajustes complicados."],
    ["Publicacion instantanea", "Guarda, publica y abre el sitio final con un flujo directo."],
    ["Preparada para crecer", "Puede iniciar como landing simple y convertirse despues en sitio Pro con mas paginas y opciones."],
  ])


  addSection(nodes, "signature-section", "Sistema premium de venta", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(135deg, #ffffff 0%, rgba(229,246,255,0.92) 52%, rgba(27,179,250,0.12) 100%)",
    htmlId: "sistema",
  }, ["signature-shell"])
  wrap(nodes, "signature-shell", "Sistema visual premium", "div", "premium-signature sales-reveal grid gap-6 rounded-[36px] border border-slate-900/10 bg-white/88 p-6 shadow-[0_34px_105px_-56px_rgba(7,89,133,0.54)] backdrop-blur lg:grid-cols-[0.88fr_1.12fr] lg:p-8", ["signature-copy", "signature-grid"])
  wrap(nodes, "signature-copy", "Texto sistema premium", "div", "space-y-5 self-center", ["signature-kicker", "signature-title", "signature-copy-text", "signature-actions"])
  text(nodes, "signature-kicker", "Etiqueta sistema", "SISTEMA DE CONVERSION", COLORS.primaryDark, "left", "sm")
  heading(nodes, "signature-title", "Titulo sistema", "No es solo una pagina bonita: es una ruta guiada hasta la compra", 2, "4xl", COLORS.text, "left")
  text(nodes, "signature-copy-text", "Texto sistema", "La landing combina impacto visual, jerarquia, objeciones resueltas y CTA repetidos con intencion. Cada bloque tiene un trabajo comercial claro y sigue siendo editable por el cliente.", COLORS.muted, "left", "md")
  wrap(nodes, "signature-actions", "Botones sistema", "div", "flex flex-wrap gap-3 pt-2", ["signature-primary", "signature-secondary"])
  button(nodes, "signature-primary", "Boton sistema principal", "Personalizar ahora", "#contacto", "primary", "md")
  button(nodes, "signature-secondary", "Boton sistema secundario", "Ver secciones", "#incluye", "secondary", "md")
  wrap(nodes, "signature-grid", "Mapa de conversion", "div", "grid gap-4 sm:grid-cols-2", [])
  addCards(nodes, "signature-grid", "signature", [
    ["Primer impacto", "Hero con promesa fuerte, prueba rapida y CTA visible sin saturar."],
    ["Prueba visual", "Galeria y tarjetas que hacen sentir la oferta real, cercana y profesional."],
    ["Decision simple", "Planes, comparativa y beneficios ordenados para reducir dudas."],
    ["Cierre claro", "Contacto, FAQ y llamada final para convertir interes en accion."],
  ])

  addSection(nodes, "premium-path-section", "Camino premium de compra", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(135deg, #075985 0%, #1379A8 48%, #1BB3FA 128%)",
    htmlId: "camino",
  }, ["premium-path-shell"])
  wrap(nodes, "premium-path-shell", "Ruta de compra", "div", "premium-path sales-reveal grid gap-5 lg:grid-cols-4", ["path-1", "path-2", "path-3", "path-4"])
  transformCard(nodes, "path-1", "01", "Atrae", "Un hero con mensaje de valor, beneficios inmediatos y direccion clara.")
  transformCard(nodes, "path-2", "02", "Convence", "Secciones visuales, prueba social y argumentos listos para editar.")
  transformCard(nodes, "path-3", "03", "Reduce dudas", "FAQ, comparativa y garantias para que el usuario siga avanzando.")
  transformCard(nodes, "path-4", "04", "Convierte", "Botones y contacto colocados donde el visitante ya esta listo para actuar.")

    addIntroSection(nodes, "pain-section", "Dolores del cliente", "POR QUE FUNCIONA", "Evita la pagina bonita que no explica nada", "Muchas plantillas se ven bien, pero obligan al cliente a inventar estrategia, textos y estructura. Esta landing ya guia la venta para que el usuario solo adapte lo esencial.", "linear-gradient(180deg, #ffffff 0%, #eef9ff 100%)", ["pain-grid"])
  wrap(nodes, "pain-grid", "Problemas que resuelve", "div", "sales-reveal grid gap-4 md:grid-cols-3", [])
  addCards(nodes, "pain-grid", "pain", [
    ["No mas bloqueo inicial", "El cliente abre el constructor y ya encuentra una pagina con narrativa, orden y jerarquia."],
    ["Menos decisiones visuales", "Cada seccion tiene un proposito claro para evitar que el usuario pierda tiempo ajustando detalles."],
    ["Mas confianza al publicar", "El sitio no se siente incompleto: tiene contenido suficiente para anunciar, vender y captar contactos."],
  ])

  addSection(nodes, "outcomes-section", "Resultados esperados", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(135deg, rgba(27,179,250,0.12) 0%, #ffffff 48%, rgba(23,148,204,0.16) 100%)",
    htmlId: "resultados",
  }, ["outcomes-shell"])
  wrap(nodes, "outcomes-shell", "Bloque de resultados", "div", "sales-reveal grid gap-6 rounded-[32px] border border-slate-900/10 bg-white/82 p-6 shadow-[0_28px_80px_-48px_rgba(7,89,133,0.45)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr] lg:p-8", ["outcomes-copy", "outcomes-metrics"])
  wrap(nodes, "outcomes-copy", "Texto resultados", "div", "space-y-4", ["outcomes-kicker", "outcomes-title", "outcomes-copy-text", "outcomes-button"])
  text(nodes, "outcomes-kicker", "Etiqueta resultados", "RESULTADOS", COLORS.primaryDark, "left", "sm")
  heading(nodes, "outcomes-title", "Titulo resultados", "Una landing que ya trae el camino de compra dibujado", 2, "4xl", COLORS.text, "left")
  text(nodes, "outcomes-copy-text", "Texto resultados", "Desde el primer scroll, la pagina responde lo que un visitante necesita saber: que haces, por que importa, como funciona, cuanto cuesta y que debe hacer ahora.", COLORS.muted, "left", "md")
  button(nodes, "outcomes-button", "Boton resultados", "Adaptar a mi negocio", "#producto", "primary", "md")
  wrap(nodes, "outcomes-metrics", "Metricas de valor", "div", "grid gap-4 sm:grid-cols-2", ["outcome-1", "outcome-2", "outcome-3", "outcome-4"])
  metric(nodes, "outcome-1", "8+", "Secciones de venta")
  metric(nodes, "outcome-2", "15 min", "Para personalizar base")
  metric(nodes, "outcome-3", "3 CTA", "Momentos de conversion")
  metric(nodes, "outcome-4", "100%", "Contenido editable")

  addIntroSection(nodes, "trust-section", "Confianza y garantia", "CONFIANZA", "Publica con una base que ya se siente lista", "Antes de comprar, el visitante necesita saber que la pagina es clara, segura y facil de adaptar. Esta franja convierte dudas en razones para avanzar.", "#ffffff", ["trust-grid"])
  wrap(nodes, "trust-grid", "Garantias de confianza", "div", "sales-reveal grid gap-4 md:grid-cols-2 lg:grid-cols-4", [])
  addCards(nodes, "trust-grid", "trust", [
    ["Hosting y SSL incluidos", "La pagina nace preparada para publicarse con una presencia seria y segura."],
    ["Cambios sin depender de terceros", "Textos, imagenes, colores y botones se ajustan desde el editor visual."],
    ["Base comercial revisada", "La estructura ya contiene promesa, beneficios, prueba social, precios y cierre."],
    ["Soporte para avanzar", "El cliente no se queda solo frente a una pantalla vacia ni decisiones confusas."],
  ])

  addSection(nodes, "transformation-section", "Transformacion premium", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(180deg, #eef9ff 0%, #ffffff 100%)",
    htmlId: "transformacion",
  }, ["transformation-shell"])
  wrap(nodes, "transformation-shell", "Camino de transformacion", "div", "sales-reveal rounded-[34px] border border-slate-900/10 bg-white/86 p-6 shadow-[0_30px_100px_-56px_rgba(7,89,133,0.55)] backdrop-blur lg:p-8", ["transformation-head", "transformation-steps", "transformation-footer"])
  wrap(nodes, "transformation-head", "Encabezado transformacion", "div", "mx-auto max-w-3xl text-center", ["transformation-kicker", "transformation-title", "transformation-copy"])
  text(nodes, "transformation-kicker", "Etiqueta transformacion", "DE IDEA A SITIO PUBLICADO", COLORS.primaryDark, "center", "sm")
  heading(nodes, "transformation-title", "Titulo transformacion", "Tres pasos visuales para que el cliente sienta avance inmediato", 2, "4xl", COLORS.text, "center")
  text(nodes, "transformation-copy", "Texto transformacion", "La landing no solo muestra informacion: comunica progreso. El usuario entiende que puede partir de una idea simple y terminar con una presencia profesional lista para publicar.", COLORS.muted, "center", "md")
  wrap(nodes, "transformation-steps", "Pasos de transformacion", "div", "mt-8 grid gap-4 lg:grid-cols-3", ["transform-idea", "transform-landing", "transform-published"])
  transformCard(nodes, "transform-idea", "01", "Idea suelta", "Nombre, oferta, fotos y datos principales aun desordenados.")
  transformCard(nodes, "transform-landing", "02", "Landing lista", "Estructura comercial, secciones y mensajes colocados en orden.")
  transformCard(nodes, "transform-published", "03", "Sitio publicado", "Pagina activa, CTA visibles y contenido facil de actualizar.")
  wrap(nodes, "transformation-footer", "Cierre transformacion", "div", "mt-6 flex flex-wrap items-center justify-center gap-3", ["transformation-pill-1", "transformation-pill-2", "transformation-pill-3"])
  pill(nodes, "transformation-pill-1", "Menos bloqueo")
  pill(nodes, "transformation-pill-2", "Mas confianza")
  pill(nodes, "transformation-pill-3", "Publicacion mas rapida")

  addIntroSection(nodes, "workflow-section", "Como funciona", "COMO FUNCIONA", "Un flujo claro para pasar de plantilla a sitio publicado", "La experiencia inicial evita una pantalla vacia, pero sigue dejando libertad para personalizar la marca y el contenido.", "linear-gradient(135deg, #075985 0%, #0E5C80 54%, #1379A8 122%)", ["steps-grid"], true)
  wrap(nodes, "steps-grid", "Pasos del flujo", "div", "sales-reveal grid gap-4 md:grid-cols-4", [])
  addCards(nodes, "steps-grid", "step", [
    ["01 / Elige una plantilla", "Arranca con una estructura profesional y editable."],
    ["02 / Arrastra tus bloques", "Organiza hero, galeria, beneficios, planes y contacto."],
    ["03 / Ajusta marca y contenido", "Cambia nombre, tono, colores, textos e imagenes."],
    ["04 / Publica con un clic", "Activa la pagina y abre el resultado para revisarlo."],
  ], true)

  addIntroSection(nodes, "use-cases-section", "Casos de uso", "CASOS DE USO", "Una misma landing puede adaptarse a muchos negocios", "La estructura esta pensada para que el cliente se reconozca rapidamente: servicios, comercio, profesionales, eventos o proyectos de agencia.", "#ffffff", ["use-cases-grid"])
  wrap(nodes, "use-cases-grid", "Casos por industria", "div", "sales-reveal grid gap-4 md:grid-cols-2 lg:grid-cols-3", [])
  addCards(nodes, "use-cases-grid", "use-case", [
    ["Servicios profesionales", "Consultores, despachos, estudios y agencias pueden explicar valor, proceso y confianza."],
    ["Negocios locales", "Restaurantes, clinicas, gimnasios y salones pueden mostrar servicios, ubicacion y contacto."],
    ["Tiendas y productos", "Marcas con catalogos pequenos pueden presentar beneficios, imagenes y llamada a compra."],
    ["Inmobiliarias", "Propiedades, asesores, zonas y formularios pueden vivir en una estructura clara."],
    ["Cursos y academias", "Programas, temarios, testimonios y registro quedan ordenados desde el inicio."],
    ["Agencias", "Equipos que entregan sitios a clientes pueden partir de una base fuerte y personalizable."],
  ])

  addIntroSection(nodes, "templates-section", "Plantillas", "PLANTILLAS", "Puntos de partida para negocios reales", "Cada tarjeta puede convertirse en una pagina completa para un cliente, manteniendo diferencias visuales y contenido adaptado por industria.", COLORS.bg, ["templates-grid"])
  wrap(nodes, "templates-grid", "Tarjetas de plantillas", "div", "sales-reveal grid gap-4 md:grid-cols-2 lg:grid-cols-3", [])
  addCards(nodes, "templates-grid", "template", [
    ["Restaurantes / Aurea", "Menu, reservas, galeria y CTA para atraer visitas."],
    ["Inmobiliarias / Lumvio", "Propiedades, asesores, zonas y formularios de interes."],
    ["Tiendas artesanales / El Baul", "Catalogo visual, historia de marca y compra directa."],
    ["Servicios profesionales / Nortia", "Credibilidad, proceso, casos y agenda de llamada."],
    ["Despachos legales / Cabrera & Asoc.", "Areas de practica, confianza y contacto claro."],
    ["Eventos / Vento", "Agenda, paquetes, testimonios y registro rapido."],
  ])


  addIntroSection(nodes, "gallery-section", "Galeria visual", "GALERIA", "Una muestra visual que hace sentir el sitio terminado", "Estas imagenes funcionan como proyectos, servicios, espacios, productos o resultados. El cliente puede cambiarlas con doble clic y mantener una pagina rica sin tocar el diseno.", "linear-gradient(180deg, #eef9ff 0%, #ffffff 100%)", ["gallery-grid"])
  wrap(nodes, "gallery-grid", "Galeria de imagenes", "div", "sales-reveal grid gap-5 md:grid-cols-2 lg:grid-cols-3", [])
  addGallery(nodes, [
    ["gallery-1", "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1100&q=82&auto=format&fit=crop", "Espacio profesional listo para presentar una marca", "Proyecto destacado", "Muestra trabajos, oficinas, productos o servicios con una imagen fuerte y texto breve."],
    ["gallery-2", "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1100&q=82&auto=format&fit=crop", "Equipo revisando resultados de negocio", "Equipo y confianza", "Ideal para transmitir cercania, proceso, experiencia y respaldo humano."],
    ["gallery-3", "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1100&q=82&auto=format&fit=crop", "Mesa de trabajo con estrategia y tecnologia", "Proceso claro", "Convierte una explicacion compleja en una historia visual facil de entender."],
    ["gallery-4", "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1100&q=82&auto=format&fit=crop", "Personas trabajando en una experiencia digital", "Servicio premium", "Perfecto para servicios profesionales, agencias, consultorias y negocios en crecimiento."],
    ["gallery-5", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1100&q=82&auto=format&fit=crop", "Interior moderno con ambiente calido", "Ambiente de marca", "Puede representar sucursales, espacios, experiencias o estilo de vida del negocio."],
    ["gallery-6", "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1100&q=82&auto=format&fit=crop", "Grupo colaborando en una mesa de trabajo", "Clientes felices", "Aporta prueba visual para que la pagina no dependa solo de texto."],
  ])

  addSection(nodes, "before-after-section", "Antes y despues", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(135deg, #ffffff 0%, #eef9ff 100%)",
    htmlId: "antes-despues",
  }, ["before-after-shell"])
  wrap(nodes, "before-after-shell", "Comparativa antes y despues", "div", "sales-reveal grid gap-5 lg:grid-cols-[0.95fr_1.05fr]", ["before-card", "after-card"])
  wrap(nodes, "before-card", "Antes", "article", "rounded-[30px] border border-rose-200/70 bg-rose-50/70 p-6 shadow-[0_22px_70px_-46px_rgba(190,18,60,0.35)]", ["before-kicker", "before-title", "before-copy", "before-list"])
  text(nodes, "before-kicker", "Etiqueta antes", "ANTES", "#be123c", "left", "sm")
  heading(nodes, "before-title", "Titulo antes", "Una plantilla bonita que deja todo por resolver", 3, "2xl", COLORS.text, "left")
  text(nodes, "before-copy", "Texto antes", "El cliente debe decidir que escribir, que seccion mover, que imagen usar y como hacer que la pagina venda.", COLORS.muted, "left", "md")
  wrap(nodes, "before-list", "Lista antes", "div", "grid gap-2 pt-2", ["before-1", "before-2", "before-3"])
  pill(nodes, "before-1", "Mensaje poco claro")
  pill(nodes, "before-2", "Demasiadas decisiones")
  pill(nodes, "before-3", "Publicacion insegura")
  wrap(nodes, "after-card", "Despues", "article", "rounded-[30px] border border-[#1BB3FA]/25 bg-[#e5f6ff] p-6 shadow-[0_26px_76px_-42px_rgba(27,179,250,0.50)]", ["after-kicker", "after-title", "after-copy", "after-list", "after-button"])
  text(nodes, "after-kicker", "Etiqueta despues", "DESPUES", COLORS.primaryDark, "left", "sm")
  heading(nodes, "after-title", "Titulo despues", "Una landing con narrativa, prueba y conversion listas", 3, "2xl", COLORS.text, "left")
  text(nodes, "after-copy", "Texto despues", "El usuario reemplaza datos basicos y conserva una estructura profesional que ya guia al visitante hacia el contacto o compra.", COLORS.muted, "left", "md")
  wrap(nodes, "after-list", "Lista despues", "div", "grid gap-2 pt-2", ["after-1", "after-2", "after-3"])
  pill(nodes, "after-1", "Promesa clara")
  pill(nodes, "after-2", "Secciones completas")
  pill(nodes, "after-3", "CTA en momentos clave")
  button(nodes, "after-button", "Boton despues", "Quiero este resultado", "#precios", "primary", "md")

  addSection(nodes, "offer-section", "Oferta comercial", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(135deg, #075985 0%, #0E5C80 52%, #1794CC 130%)",
    htmlId: "oferta",
  }, ["offer-shell"])
  wrap(nodes, "offer-shell", "Oferta lista para editar", "div", "sales-reveal grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center", ["offer-copy", "offer-stack"])
  wrap(nodes, "offer-copy", "Texto oferta", "div", "space-y-4", ["offer-kicker", "offer-title", "offer-text", "offer-actions"])
  text(nodes, "offer-kicker", "Etiqueta oferta", "OFERTA CLARA", "#9ae5ff", "left", "sm")
  heading(nodes, "offer-title", "Titulo oferta", "Todo lo que necesita una landing comercial, sin pedirle al cliente que sea disenador", 2, "4xl", "#ffffff", "left")
  text(nodes, "offer-text", "Texto oferta", "La pagina combina estrategia, estructura y diseno: titulares fuertes, beneficios, proceso, confianza, precios y cierre. Ideal para que un negocio publique rapido con pocos cambios.", "#dff4ff", "left", "md")
  wrap(nodes, "offer-actions", "Acciones oferta", "div", "flex flex-wrap gap-3 pt-2", ["offer-primary", "offer-secondary"])
  button(nodes, "offer-primary", "Boton oferta principal", "Usar esta estructura", "#precios", "primary", "md")
  button(nodes, "offer-secondary", "Boton oferta secundario", "Ver beneficios", "#producto", "secondary", "md")
  wrap(nodes, "offer-stack", "Lista de entregables", "div", "grid gap-3", ["offer-item-1", "offer-item-2", "offer-item-3", "offer-item-4"])
  addCards(nodes, "offer-stack", "offer-item", [
    ["Hero con propuesta clara", "Un primer pantallazo pensado para decir que vendes y por que confiar."],
    ["Beneficios accionables", "Tarjetas listas para convertir caracteristicas en razones de compra."],
    ["Comparativa contra alternativas", "Ayuda al visitante a entender por que elegir esta solucion."],
    ["Cierre con CTA fuerte", "Una ultima seccion que empuja al contacto, compra o publicacion."],
  ], true)

  addIntroSection(nodes, "comparison-section", "Comparativa", "COMPARATIVA", "Menos configuracion, mas sitio terminado", "Esta seccion ayuda a vender la diferencia entre empezar desde cero y arrancar con una landing pensada para conversion.", "#ffffff", ["comparison-grid"])
  wrap(nodes, "comparison-grid", "Tabla comparativa", "div", "sales-reveal grid gap-4 lg:grid-cols-3", [])
  addCards(nodes, "comparison-grid", "comparison", [
    ["Plantilla generica", "Se ve bien, pero el cliente debe inventar el mensaje, ordenar secciones y decidir que quitar."],
    ["Lienzo en blanco", "Da libertad, aunque suele provocar dudas, bloqueo y cambios visuales innecesarios."],
    ["Landing Orvenix", "Ya trae narrativa, estructura editable y contenido suficiente para vender con cambios minimos."],
  ])

  addIntroSection(nodes, "included-section", "Que incluye", "QUE INCLUYE", "Una pagina completa, no solo una portada", "Esta seccion deja claro el alcance de la landing para que el cliente entienda todo lo que ya recibe desde el primer inicio.", "linear-gradient(180deg, #eef9ff 0%, #ffffff 100%)", ["included-grid"])
  wrap(nodes, "included-grid", "Listado de incluidos", "div", "sales-reveal grid gap-4 md:grid-cols-2 lg:grid-cols-3", [])
  addCards(nodes, "included-grid", "included", [
    ["Hero comercial", "Titulo, subtitulo, CTA y confianza inicial listos para adaptar."],
    ["Beneficios y resultados", "Argumentos para explicar valor sin escribir la estrategia desde cero."],
    ["Galeria editable", "Imagenes reemplazables para mostrar proyectos, espacios, productos o servicios."],
    ["Comparativa y objeciones", "Bloques que ayudan a responder dudas antes de que el visitante abandone."],
    ["Precios y planes", "Tarjetas listas para ordenar la oferta y empujar la decision."],
    ["Contacto y cierre", "Captura visual, CTA final y footer profesional para cerrar la experiencia."],
  ])

  addIntroSection(nodes, "pricing-section", "Precios", "PRECIOS", "Planes faciles de comparar", "Los precios quedan consistentes con la oferta publica y se pueden adaptar para promociones, anualidades o paquetes especiales.", "#ffffff", ["pricing-grid"])
  wrap(nodes, "pricing-grid", "Planes", "div", "grid gap-4 lg:grid-cols-4", [])
  addPlans(nodes, [
    ["Starter", "$349/mes", "Para validar una idea con una landing profesional.", "1 sitio publicado"],
    ["Pro", "$799/mes", "Para negocios que necesitan mas edicion y crecimiento.", "Sitio completo editable"],
    ["Business", "$1,690/mes", "Para agencias y equipos con operacion continua.", "Varios sitios y soporte"],
    ["Enterprise", "A cotizar", "Para necesidades a medida, migraciones y equipos.", "Acompanamiento avanzado"],
  ])

  addIntroSection(nodes, "testimonials-section", "Testimonios", "PRUEBA SOCIAL", "Clientes que quieren avanzar sin complicarse", "La prueba social muestra confianza, rapidez y claridad. El cliente puede reemplazar estos testimonios por casos propios.", COLORS.bg, ["testimonials-grid"])
  wrap(nodes, "testimonials-grid", "Testimonios", "div", "sales-reveal grid gap-4 md:grid-cols-3", [])
  addQuotes(nodes, [
    ["Renata Solis", "En una tarde dejamos lista una pagina que antes nos tomaba semanas coordinar."],
    ["Julian Moreno", "El editor se siente simple para el cliente, pero tiene la estructura que necesita una agencia."],
    ["Paola Nieto", "Nos gusto que el sitio ya se veia completo desde el inicio. Solo cambiamos marca y textos."],
  ])

  addSection(nodes, "lead-section", "Captura de contacto", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "left",
    background: "linear-gradient(135deg, #ffffff 0%, rgba(27,179,250,0.10) 46%, rgba(23,148,204,0.18) 100%)",
    htmlId: "contacto",
  }, ["lead-shell"])
  wrap(nodes, "lead-shell", "Bloque de captura", "div", "sales-reveal grid gap-6 rounded-[32px] border border-slate-900/10 bg-white/86 p-6 shadow-[0_28px_90px_-48px_rgba(7,89,133,0.50)] backdrop-blur lg:grid-cols-[0.9fr_1.1fr] lg:p-8", ["lead-copy", "lead-form"])
  wrap(nodes, "lead-copy", "Texto captura", "div", "space-y-4", ["lead-kicker", "lead-title", "lead-copy-text", "lead-proof"])
  text(nodes, "lead-kicker", "Etiqueta captura", "CONTACTO", COLORS.primaryDark, "left", "sm")
  heading(nodes, "lead-title", "Titulo captura", "Convierte el interes en una conversacion real", 2, "4xl", COLORS.text, "left")
  text(nodes, "lead-copy-text", "Texto captura", "Este bloque puede convertirse en formulario, WhatsApp, agenda o solicitud de demo. La estructura ya esta lista para captar prospectos sin perderlos al final de la pagina.", COLORS.muted, "left", "md")
  wrap(nodes, "lead-proof", "Confianza captura", "div", "grid gap-2 sm:grid-cols-2", ["lead-proof-1", "lead-proof-2"])
  pill(nodes, "lead-proof-1", "Respuesta rapida")
  pill(nodes, "lead-proof-2", "Datos editables")
  wrap(nodes, "lead-form", "Formulario visual editable", "div", "rounded-[28px] border border-slate-900/10 bg-[#e5f6ff] p-5 shadow-inner", ["lead-field-name", "lead-field-email", "lead-field-message", "lead-submit", "lead-note"])
  formField(nodes, "lead-field-name", "Nombre", "Escribe tu nombre")
  formField(nodes, "lead-field-email", "Email o WhatsApp", "tu@email.com")
  formField(nodes, "lead-field-message", "Mensaje", "Quiero adaptar esta landing a mi negocio")
  button(nodes, "lead-submit", "Boton formulario", "Solicitar informacion", "#precios", "primary", "lg")
  text(nodes, "lead-note", "Nota formulario", "Puedes conectar este bloque a tu formulario real, WhatsApp o agenda.", COLORS.faint, "left", "sm")

  addIntroSection(nodes, "objections-section", "Objeciones fuertes", "OBJECIONES", "Responde dudas antes de que frenen la compra", "Una landing profesional no esconde las preguntas dificiles. Las convierte en tranquilidad y claridad para avanzar.", "#ffffff", ["objections-grid"])
  wrap(nodes, "objections-grid", "Objeciones frecuentes", "div", "sales-reveal grid gap-4 md:grid-cols-2", [])
  addCards(nodes, "objections-grid", "objection", [
    ["No soy disenador", "No necesitas disenar desde cero. La composicion ya esta hecha para que solo adaptes lo esencial."],
    ["No se que escribir", "La pagina trae textos guia con enfoque comercial: promesa, beneficios, prueba, precios y cierre."],
    ["No tengo fotos listas", "Puedes empezar con imagenes base y reemplazarlas despues desde el editor con doble clic."],
    ["No quiero romper el sitio", "Las secciones mantienen estructura clara para editar contenido sin desarmar el diseno."],
  ])

  addIntroSection(nodes, "faq-section", "Preguntas frecuentes", "FAQ", "Respuestas claras antes de comprar", "Una seccion de preguntas reduce dudas antes del contacto o la compra del plan.", "#ffffff", ["faq-grid"])
  wrap(nodes, "faq-grid", "Lista FAQ", "div", "grid gap-4 md:grid-cols-2", [])
  addCards(nodes, "faq-grid", "faq", [
    ["Necesito saber codigo?", "No. La experiencia esta pensada para editar contenido, secciones y marca desde controles visuales."],
    ["Puedo publicar mi sitio?", "Si. El constructor incluye flujo de guardado y publicacion para abrir la pagina final."],
    ["Puedo cambiar imagenes y textos?", "Si. Los bloques principales son editables para adaptar la pagina al negocio."],
    ["Sirve para agencias?", "Si. El modo avanzado puede crecer con mas paginas, opciones y sitios de clientes."],
    ["Puedo empezar con algo simple?", "Si. El modo basico muestra solo lo esencial para no abrumar al usuario nuevo."],
  ])

  addSection(nodes, "cta-section", "CTA final", {
    maxWidth: "xl",
    paddingY: "xl",
    paddingX: "lg",
    align: "center",
    background: "linear-gradient(135deg, rgba(27,179,250,0.16), rgba(23,148,204,0.22))",
    htmlId: "cierre",
  }, ["cta-card"])
  wrap(nodes, "cta-card", "Cierre comercial", "div", "sales-reveal mx-auto max-w-4xl rounded-[30px] border border-slate-900/10 bg-white/86 p-8 text-center shadow-[0_30px_90px_-50px_rgba(7,89,133,0.55)] backdrop-blur md:p-12", ["cta-kicker", "cta-title", "cta-copy", "cta-actions"])
  text(nodes, "cta-kicker", "Etiqueta CTA", "LISTO PARA PERSONALIZAR", COLORS.primaryDark, "center", "sm")
  heading(nodes, "cta-title", "Titulo CTA", "Cambia unas cuantas piezas y publica una pagina con presencia real", 2, "4xl", COLORS.text, "center")
  text(nodes, "cta-copy", "Texto CTA", "Esta landing completa sirve como punto de partida profesional: suficiente contenido para vender, pocas decisiones para no abrumar y una estructura preparada para crecer.", COLORS.muted, "center", "lg")
  wrap(nodes, "cta-actions", "Botones CTA", "div", "mt-6 flex flex-wrap justify-center gap-3", ["cta-primary", "cta-secondary"])
  button(nodes, "cta-primary", "Boton publicar", "Publicar mi sitio", "#", "primary", "lg")
  button(nodes, "cta-secondary", "Boton editar", "Editar contenido", "#producto", "secondary", "md")

  addSection(nodes, "footer-section", "Footer Orvenix profesional", {
    as: "footer",
    maxWidth: "full",
    paddingY: "xl",
    paddingX: "lg",
    background: "linear-gradient(135deg, #075985 0%, #0E5C80 48%, #1794CC 128%)",
  }, ["footer-shell"])
  wrap(nodes, "footer-shell", "Footer completo", "div", "mx-auto max-w-7xl space-y-8", ["footer-top", "footer-links", "footer-bottom"])
  wrap(nodes, "footer-top", "Cierre superior del footer", "div", "grid gap-6 rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_80px_-48px_rgba(0,0,0,0.75)] backdrop-blur md:grid-cols-[1.12fr_0.88fr] md:p-8", ["footer-brand-panel", "footer-cta-panel"])
  wrap(nodes, "footer-brand-panel", "Marca y confianza", "div", "space-y-5", ["footer-badge", "footer-brand-title", "footer-brand-copy", "footer-proof-row"])
  text(nodes, "footer-badge", "Etiqueta footer", "ORVENIX / SITIOS EDITABLES", "#9ae5ff", "left", "sm")
  heading(nodes, "footer-brand-title", "Titulo footer principal", "Construye, edita y publica una presencia digital que se siente lista desde el primer dia", 2, "4xl", "#ffffff", "left")
  text(nodes, "footer-brand-copy", "Descripcion footer", "Una base profesional para negocios y agencias: estructura clara, secciones editables, enlaces listos y una experiencia pensada para clientes que no quieren complicarse.", "#dff4ff", "left", "md")
  wrap(nodes, "footer-proof-row", "Indicadores footer", "div", "grid gap-3 sm:grid-cols-3", ["footer-proof-1", "footer-proof-2", "footer-proof-3"])
  footerMetric(nodes, "footer-proof-1", "1 clic", "Publicacion")
  footerMetric(nodes, "footer-proof-2", "100%", "Editable")
  footerMetric(nodes, "footer-proof-3", "SSL", "Incluido")
  wrap(nodes, "footer-cta-panel", "CTA footer", "div", "rounded-[26px] border border-white/10 bg-white/[0.08] p-6 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.8)]", ["footer-cta-kicker", "footer-cta-title", "footer-cta-copy", "footer-cta-actions"])
  text(nodes, "footer-cta-kicker", "Etiqueta CTA footer", "SIGUIENTE PASO", "#9ae5ff", "left", "sm")
  heading(nodes, "footer-cta-title", "Titulo CTA footer", "Personaliza esta landing y conviertela en tu sitio real", 3, "2xl", "#ffffff", "left")
  text(nodes, "footer-cta-copy", "Texto CTA footer", "Cambia marca, textos, precios y enlaces. El diseno ya trae la estructura para vender con claridad.", "#dff4ff", "left", "md")
  wrap(nodes, "footer-cta-actions", "Acciones footer", "div", "mt-5 flex flex-wrap gap-3", ["footer-cta-primary", "footer-cta-secondary"])
  button(nodes, "footer-cta-primary", "Boton footer principal", "Empezar gratis", "#precios", "primary", "md")
  button(nodes, "footer-cta-secondary", "Boton footer secundario", "Hablar con ventas", "#contacto", "secondary", "md")
  wrap(nodes, "footer-links", "Columnas de enlaces footer", "div", "grid gap-5 rounded-[26px] border border-white/10 bg-white/[0.035] p-6 md:grid-cols-4", ["footer-product", "footer-resources", "footer-company", "footer-legal"])
  footerColumn(nodes, "footer-product", "Producto", ["Constructor visual", "Plantillas profesionales", "Publicacion con un clic", "Editor simple y Pro"])
  footerColumn(nodes, "footer-resources", "Recursos", ["Demos", "FAQ", "Soporte", "Guia de inicio"])
  footerColumn(nodes, "footer-company", "Empresa", ["Precios", "Contacto", "Afiliados", "Estado del servicio"])
  footerColumn(nodes, "footer-legal", "Legal", ["Privacidad", "Terminos", "SLA", "Cookies"])
  wrap(nodes, "footer-bottom", "Barra inferior footer", "div", "flex flex-col gap-3 border-t border-white/10 pt-6 text-sm md:flex-row md:items-center md:justify-between", ["footer-copy", "footer-status"])
  text(nodes, "footer-copy", "Copyright footer", "(c) 2026 Orvenix. Plataforma SaaS para crear sitios profesionales sin codigo.", "#9fb0bf", "left", "sm")
  wrap(nodes, "footer-status", "Estado footer", "div", "inline-flex w-fit items-center gap-2 rounded-full border border-[#1BB3FA]/25 bg-[#1BB3FA]/10 px-3 py-2", ["footer-status-text"])
  text(nodes, "footer-status-text", "Texto estado footer", "Servicios operativos", "#dff4ff", "left", "sm")

  return {
    version: 1,
    rootId: "root",
    theme: {
      colors: {
        primary: COLORS.primary,
        secondary: COLORS.primaryDark,
        background: COLORS.bg,
        text: COLORS.text,
        accent: COLORS.accent,
      },
      fontHeading: "Inter",
      fontBody: "Inter",
      spacing: { sectionX: "1.75rem", sectionY: "3.5rem", stack: "1.25rem" },
      radius: { card: "1.15rem", button: "0.72rem" },
      shadow: {
        soft: "0 18px 48px rgba(7,89,133,0.10)",
        strong: "0 30px 90px rgba(7,89,133,0.18)",
      },
      motion: {
        duration: "220ms",
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
    seo: {
      title: "Orvenix - Builder para negocios y agencias",
      description: "Crea sitios web profesionales con bloques editables, hosting incluido y publicacion con un clic.",
      keywords: "orvenix, builder web, constructor de sitios, landing editable, paginas profesionales",
      ogImage: "",
    },
    brand: {
      businessName: "Orvenix",
      tagline: "Builder para negocios y agencias",
      description: "Plataforma SaaS para crear, editar y publicar sitios profesionales sin codigo.",
      contact: {
        phone: "+52 55 0000 0000",
        whatsapp: "+52 55 0000 0000",
        email: "hola@orvenix.com",
        address: "Mexico",
      },
    },
    nodes,
  }
}

function addSection(nodes: Record<string, EditorNode>, id: string, displayName: string, props: Record<string, unknown>, children: string[] = []) {
  nodes[id] = { id, type: "section", displayName, props, children, version: 1 }
}

function wrap(nodes: Record<string, EditorNode>, id: string, displayName: string, originalType: string, className: string, children: string[] = []) {
  nodes[id] = { id, type: "genericWrapper", displayName, props: { originalType, className }, children, version: 1 }
}

function heading(nodes: Record<string, EditorNode>, id: string, displayName: string, value: string, level: 1 | 2 | 3 | 4, size: HeadingSize, color: string, align: Align) {
  nodes[id] = {
    id,
    type: "heading",
    displayName,
    props: { text: value, level, size, weight: "extrabold", color, align, marginBottom: "sm" },
    children: [],
    version: 1,
  }
}

function text(nodes: Record<string, EditorNode>, id: string, displayName: string, value: string, color: string, align: Align, size: TextSize = "md") {
  nodes[id] = {
    id,
    type: "text",
    displayName,
    props: { content: value, size, color, align, maxWidth: "lg" },
    children: [],
    version: 1,
  }
}

function button(nodes: Record<string, EditorNode>, id: string, displayName: string, label: string, href: string, variant: "primary" | "secondary", size: "sm" | "md" | "lg") {
  nodes[id] = { id, type: "ctaButton", displayName, props: { label, href, variant, size }, children: [], version: 1 }
}

function pill(nodes: Record<string, EditorNode>, id: string, label: string) {
  wrap(nodes, id, label, "span", "rounded-full border border-slate-900/10 bg-white/75 px-3 py-2 text-center text-sm font-semibold text-[#426b7d] shadow-sm", [`${id}-text`])
  text(nodes, `${id}-text`, label, label, COLORS.muted, "center", "sm")
}

function demoBlock(nodes: Record<string, EditorNode>, id: string, title: string, copy: string) {
  wrap(nodes, id, title, "article", "rounded-2xl border border-slate-900/10 bg-[#eef9ff] p-4 transition-transform hover:-translate-y-1", [`${id}-title`, `${id}-copy`])
  heading(nodes, `${id}-title`, "Titulo", title, 3, "xl", COLORS.text, "left")
  text(nodes, `${id}-copy`, "Texto", copy, COLORS.muted, "left", "sm")
}

function metric(nodes: Record<string, EditorNode>, id: string, value: string, label: string) {
  wrap(nodes, id, label, "div", "rounded-2xl border border-slate-900/10 bg-white/75 p-4 text-center", [`${id}-value`, `${id}-label`])
  heading(nodes, `${id}-value`, "Valor", value, 3, "2xl", COLORS.primaryDark, "center")
  text(nodes, `${id}-label`, "Etiqueta", label, COLORS.muted, "center", "sm")
}

function addIntroSection(nodes: Record<string, EditorNode>, id: string, name: string, kicker: string, title: string, copy: string, background: string, extraChildren: string[], dark = false) {
  addSection(nodes, id, name, { maxWidth: "xl", paddingY: "xl", paddingX: "lg", align: "left", background, htmlId: sectionAnchor(id) }, [id + "-head", ...extraChildren])
  wrap(nodes, `${id}-head`, `Encabezado ${name}`, "div", "mb-10 max-w-3xl space-y-3", [`${id}-kicker`, `${id}-title`, `${id}-copy`])
  text(nodes, `${id}-kicker`, "Etiqueta", kicker, dark ? "#ffe0a8" : COLORS.primaryDark, "left", "sm")
  heading(nodes, `${id}-title`, "Titulo", title, 2, "4xl", dark ? "#ffffff" : COLORS.text, "left")
  text(nodes, `${id}-copy`, "Descripcion", copy, dark ? "#dff4ff" : COLORS.muted, "left", "md")
}

function sectionAnchor(id: string) {
  const anchors: Record<string, string> = {
    "premium-showcase-section": "showcase",
    "product-section": "producto",
    "pain-section": "beneficios",
    "outcomes-section": "resultados",
    "workflow-section": "como-funciona",
    "templates-section": "plantillas",
    "gallery-section": "galeria",
    "trust-section": "confianza",
    "transformation-section": "transformacion",
    "use-cases-section": "casos",
    "before-after-section": "antes-despues",
    "offer-section": "oferta",
    "comparison-section": "comparativa",
    "included-section": "incluye",
    "pricing-section": "precios",
    "lead-section": "contacto",
    "objections-section": "objeciones",
    "faq-section": "faq",
  }
  return anchors[id]
}

function addCardStrip(nodes: Record<string, EditorNode>, sectionId: string, name: string, title: string, items: string[]) {
  addSection(nodes, sectionId, name, { maxWidth: "xl", paddingY: "sm", paddingX: "lg", background: "transparent" }, [`${sectionId}-wrap`])
  const children = items.map((_, index) => `${sectionId}-item-${index + 1}`)
  wrap(nodes, `${sectionId}-wrap`, title, "div", "grid gap-3 rounded-[24px] border border-slate-900/10 bg-white/78 p-4 shadow-[0_18px_55px_-38px_rgba(7,89,133,0.35)] backdrop-blur sm:grid-cols-2 lg:grid-cols-6", children)
  items.forEach((item, index) => {
    const id = `${sectionId}-item-${index + 1}`
    wrap(nodes, id, item, "div", "rounded-2xl border border-slate-900/10 bg-[#e5f6ff] px-4 py-4 text-center", [`${id}-text`])
    heading(nodes, `${id}-text`, item, item, 3, "xl", COLORS.text, "center")
  })
}

function addCards(nodes: Record<string, EditorNode>, parentId: string, prefix: string, data: Array<[string, string]>, dark = false) {
  const parent = nodes[parentId]
  const ids = data.map((_, index) => `${prefix}-${index + 1}`)
  if (parent) parent.children = ids
  data.forEach(([title, copy], index) => {
    const id = `${prefix}-${index + 1}`
    wrap(nodes, id, title, "article", dark
      ? "rounded-[24px] border border-white/15 bg-white/[0.08] p-5 text-left shadow-[0_22px_54px_-38px_rgba(0,0,0,0.7)] backdrop-blur transition-transform hover:-translate-y-1"
      : "rounded-[24px] border border-slate-900/10 bg-white p-5 shadow-[0_18px_48px_-34px_rgba(7,89,133,0.42)] transition-transform hover:-translate-y-1",
      [`${id}-title`, `${id}-copy`])
    heading(nodes, `${id}-title`, "Titulo", title, 3, "xl", dark ? "#ffffff" : COLORS.text, "left")
    text(nodes, `${id}-copy`, "Texto", copy, dark ? "#dff4ff" : COLORS.muted, "left", "md")
  })
}

function addPlans(nodes: Record<string, EditorNode>, plans: Array<[string, string, string, string]>) {
  const ids = plans.map((_, index) => `plan-${index + 1}`)
  nodes["pricing-grid"].children = ids
  plans.forEach(([name, price, copy, badge], index) => {
    const id = `plan-${index + 1}`
    const featured = index === 1
    wrap(nodes, id, name, "article", featured
      ? "rounded-[26px] border border-[#1BB3FA]/35 bg-[#e5f6ff] p-6 shadow-[0_28px_76px_-42px_rgba(27,179,250,0.55)] transition-transform hover:-translate-y-1"
      : "rounded-[26px] border border-slate-900/10 bg-white p-6 shadow-[0_18px_48px_-34px_rgba(7,89,133,0.42)] transition-transform hover:-translate-y-1",
      [`${id}-badge`, `${id}-title`, `${id}-price`, `${id}-copy`, `${id}-button`])
    text(nodes, `${id}-badge`, "Etiqueta", badge, featured ? COLORS.primaryDark : COLORS.faint, "left", "sm")
    heading(nodes, `${id}-title`, "Nombre plan", name, 3, "xl", COLORS.text, "left")
    heading(nodes, `${id}-price`, "Precio", price, 3, "2xl", COLORS.primary, "left")
    text(nodes, `${id}-copy`, "Descripcion", copy, COLORS.muted, "left", "md")
    button(nodes, `${id}-button`, "Boton plan", featured ? "Elegir Pro" : "Elegir plan", "#precios", featured ? "primary" : "secondary", "md")
  })
}

function addQuotes(nodes: Record<string, EditorNode>, quotes: Array<[string, string]>) {
  const ids = quotes.map((_, index) => `quote-${index + 1}`)
  nodes["testimonials-grid"].children = ids
  quotes.forEach(([author, quote], index) => {
    const id = `quote-${index + 1}`
    wrap(nodes, id, author, "blockquote", "rounded-[24px] border border-slate-900/10 bg-white p-6 shadow-[0_18px_48px_-34px_rgba(7,89,133,0.42)]", [`${id}-quote`, `${id}-author`])
    text(nodes, `${id}-quote`, "Cita", `"${quote}"`, COLORS.text, "left", "lg")
    text(nodes, `${id}-author`, "Autor", author, COLORS.primaryDark, "left", "sm")
  })
}

function premiumMiniCard(nodes: Record<string, EditorNode>, id: string, title: string, copy: string) {
  wrap(nodes, id, title, "article", "rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-[0_18px_55px_-40px_rgba(0,0,0,0.85)] backdrop-blur", [id + "-title", id + "-copy"])
  heading(nodes, id + "-title", "Titulo mini premium", title, 3, "xl", "#ffffff", "left")
  text(nodes, id + "-copy", "Texto mini premium", copy, "#dff4ff", "left", "sm")
}

function premiumFloat(nodes: Record<string, EditorNode>, id: string, title: string, copy: string, positionClass: string) {
  wrap(nodes, id, title, "div", "premium-float-card absolute " + positionClass + " max-w-[220px] rounded-2xl border border-white/20 bg-[#075985]/78 p-4 text-white shadow-2xl backdrop-blur-xl", [id + "-title", id + "-copy"])
  heading(nodes, id + "-title", "Titulo flotante", title, 3, "xl", "#ffffff", "left")
  text(nodes, id + "-copy", "Texto flotante", copy, "#dff4ff", "left", "sm")
}

function transformCard(nodes: Record<string, EditorNode>, id: string, number: string, title: string, copy: string) {
  wrap(nodes, id, title, "article", "premium-transform-card relative overflow-hidden rounded-[28px] border border-slate-900/10 bg-[#e5f6ff] p-6 shadow-[0_22px_70px_-48px_rgba(7,89,133,0.52)]", [id + "-number", id + "-title", id + "-copy"])
  text(nodes, id + "-number", "Numero transformacion", number, COLORS.accent, "left", "sm")
  heading(nodes, id + "-title", "Titulo transformacion", title, 3, "2xl", COLORS.text, "left")
  text(nodes, id + "-copy", "Texto transformacion", copy, COLORS.muted, "left", "md")
}

function formField(nodes: Record<string, EditorNode>, id: string, label: string, placeholder: string) {
  wrap(nodes, id, label, "div", "rounded-2xl border border-slate-900/10 bg-white px-4 py-3", [id + "-label", id + "-placeholder"])
  text(nodes, id + "-label", "Etiqueta campo", label, COLORS.primaryDark, "left", "sm")
  text(nodes, id + "-placeholder", "Placeholder campo", placeholder, COLORS.faint, "left", "md")
}

function imageNode(nodes: Record<string, EditorNode>, id: string, src: string, alt: string) {
  nodes[id] = {
    id,
    type: "image",
    displayName: alt,
    props: { src, alt, width: 1100, height: 760, objectFit: "cover" },
    children: [],
    version: 1,
  }
}

function addGallery(nodes: Record<string, EditorNode>, items: Array<[string, string, string, string, string]>) {
  nodes["gallery-grid"].children = items.map(([id]) => id)
  items.forEach(([id, src, alt, title, copy]) => {
    wrap(nodes, id, title, "article", "sales-gallery-card group h-full overflow-hidden rounded-[28px] border border-slate-900/10 bg-white p-3 shadow-[0_24px_70px_-42px_rgba(7,89,133,0.45)]", [id + "-image-wrap", id + "-body"])
    wrap(nodes, id + "-image-wrap", "Imagen " + title, "div", "overflow-hidden rounded-[22px] bg-[#d2efff]", [id + "-image"])
    imageNode(nodes, id + "-image", src, alt)
    wrap(nodes, id + "-body", "Contenido " + title, "div", "space-y-2 p-4", [id + "-title", id + "-copy", id + "-tag"])
    heading(nodes, id + "-title", "Titulo galeria", title, 3, "xl", COLORS.text, "left")
    text(nodes, id + "-copy", "Texto galeria", copy, COLORS.muted, "left", "sm")
    text(nodes, id + "-tag", "Etiqueta editable", "Imagen reemplazable", COLORS.primaryDark, "left", "sm")
  })
}

function footerMetric(nodes: Record<string, EditorNode>, id: string, value: string, label: string) {
  wrap(nodes, id, label, "div", "rounded-2xl border border-white/10 bg-white/[0.07] p-4", [id + "-value", id + "-label"])
  heading(nodes, id + "-value", "Valor footer", value, 3, "2xl", "#ffffff", "left")
  text(nodes, id + "-label", "Etiqueta footer", label, "#dff4ff", "left", "sm")
}

function footerColumn(nodes: Record<string, EditorNode>, id: string, title: string, lines: string[]) {
  const children = [`${id}-title`, ...lines.map((_, index) => `${id}-line-${index + 1}`)]
  wrap(nodes, id, title, "div", "space-y-2", children)
  heading(nodes, `${id}-title`, "Titulo footer", title, 3, "xl", "#ffffff", "left")
  lines.forEach((line, index) => text(nodes, `${id}-line-${index + 1}`, "Texto footer", line, "#dff4ff", "left", "sm"))
}
