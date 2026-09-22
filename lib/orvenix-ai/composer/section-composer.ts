import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type {
  ComposedNode,
  ComposedSection,
  SectionCompositionContext,
} from "./types"
import { createComposedNode } from "./node-factory"
import { getPageAwareHeroCopy } from "@/lib/orvenix-ai/content/content-engine"
import { hasSafeContrast } from "@/lib/orvenix-ai/theme/visual-direction"
import { selectVariant } from "./variant-selector"
import {
  CTA_VARIANTS,
  CTA_WEIGHTS,
  FEATURES_VARIANTS,
  FEATURES_WEIGHTS,
  HERO_VARIANTS,
  HERO_WEIGHTS,
  SERVICES_VARIANTS,
  SERVICES_WEIGHTS,
  TRUST_VARIANTS,
  TRUST_WEIGHTS,
} from "./composition-context"
import {
  resolveCtaCopy,
  resolveFeatureItems,
  resolveProcessIntro,
  resolveTrustItems,
} from "./semantic-copy"

function add(
  nodes: Record<string, ComposedNode>,
  node: ComposedNode,
) {
  nodes[node.tempId] = node
  return node.tempId
}

const DARK_ON_LIGHT_TEXT = { heading: "#0f172a", body: "#475569" }
const LIGHT_ON_DARK_TEXT = { heading: "#ffffff", body: "#e2e8f0" }

/**
 * V2-3.1: generic light/dark foreground pairing for a composer-chosen
 * section background. Reuses the already-tested contrast check from
 * theme/visual-direction.ts (V2-1) rather than building a new
 * accessibility engine. Any section content that sits DIRECTLY on the
 * section's own background (not inside its own opaque card) should
 * derive its text color from this instead of assuming a fixed
 * light-on-white palette -- the exact bug class that let a section
 * render dark-on-light-assuming text with no explicit background of its
 * own, silently falling through to Orvenix's own product-chrome dark
 * navy default instead of a color the generated site actually controls.
 */
function readableTextColorsFor(background: string): { heading: string; body: string } {
  return hasSafeContrast(DARK_ON_LIGHT_TEXT.heading, background) ? DARK_ON_LIGHT_TEXT : LIGHT_ON_DARK_TEXT
}

function faqCopy(archetype: SectionCompositionContext["archetype"]) {
  if (archetype === "overview") {
    return {
      title: "Antes de que preguntes",
      intro:
        "Estas son las dudas que más nos comparten antes de dar el siguiente paso. Conoce el detalle completo en la página de servicios.",
      count: 2,
    }
  }

  if (archetype === "catalog") {
    return {
      title: "Preguntas frecuentes sobre nuestros servicios",
      intro:
        "Resolvemos las dudas más comunes sobre cada servicio antes de que tengas que preguntar.",
      count: 4,
    }
  }

  return {
    title: "Preguntas frecuentes",
    intro:
      "Resuelve aquí las dudas más comunes antes de que el cliente tenga que preguntar.",
    count: 4,
  }
}

/** V2-3.1: same fix as trust -- this role never set an explicit section background either (see TRUST_SECTION_BACKGROUND's comment). */
const FAQ_SECTION_BACKGROUND = "#ffffff"

function composeFAQ(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const copy = faqCopy(context.archetype)
  const textColors = readableTextColorsFor(FAQ_SECTION_BACKGROUND)

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título FAQ",
      props: {
        text: copy.title,
        level: 2,
        size: "3xl",
        align: "center",
        color: textColors.heading,
      },
    }),
  )

  const intro = add(
    nodes,
    createComposedNode({
      type: "text",
      displayName: "Introducción FAQ",
      props: {
        content: copy.intro,
        align: "center",
        color: textColors.body,
      },
    }),
  )

  const items: string[] = []

  for (let index = 1; index <= copy.count; index++) {
    const question = add(
      nodes,
      createComposedNode({
        type: "heading",
        displayName: `Pregunta ${index}`,
        props: {
          text: `Pregunta frecuente ${index}`,
          level: 3,
          size: "lg",
        },
      }),
    )

    const answer = add(
      nodes,
      createComposedNode({
        type: "text",
        displayName: `Respuesta ${index}`,
        props: {
          content:
            "Agrega aquí una respuesta clara, breve y útil para el visitante.",
        },
      }),
    )

    const item = add(
      nodes,
      createComposedNode({
        type: "genericWrapper",
        displayName: `FAQ ${index}`,
        props: {
          tag: "article",
          className:
            "rounded-2xl border border-slate-200 bg-white p-5",
        },
        children: [question, answer],
      }),
    )

    items.push(item)
  }

  const grid = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: "Lista FAQ",
      props: {
        tag: "div",
        className: "grid gap-4 md:grid-cols-2",
      },
      children: items,
    }),
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Preguntas frecuentes",
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        align: "left",
        background: FAQ_SECTION_BACKGROUND,
      },
      children: [heading, intro, grid],
    }),
  )

  return {
    role: "faq",
    rootId: root,
    nodes,
    purpose: "Resolver objeciones y dudas frecuentes.",
  }
}

/** V2-3.1: same fix as trust -- this role never set an explicit section background either (see TRUST_SECTION_BACKGROUND's comment). */
const GALLERY_SECTION_BACKGROUND = "#ffffff"

function composeGallery(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const textColors = readableTextColorsFor(GALLERY_SECTION_BACKGROUND)

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título galería",
      props: {
        text: "Conoce nuestro trabajo",
        level: 2,
        size: "3xl",
        align: "center",
        color: textColors.heading,
      },
    }),
  )

  const intro = add(
    nodes,
    createComposedNode({
      type: "text",
      displayName: "Descripción galería",
      props: {
        content: "Una muestra visual de nuestro trabajo y espacio.",
        align: "center",
        color: textColors.body,
      },
    }),
  )

  const images: string[] = []

  for (let index = 1; index <= 6; index++) {
    const image = add(
      nodes,
      createComposedNode({
        type: "image",
        displayName: `Imagen galería ${index}`,
        props: {
          src: "",
          alt: `Imagen del negocio ${index}`,
          objectFit: "cover",
          /*
           * V2-S1.1: real Pexels sources arrive with mixed intrinsic
           * aspect ratios (landscape/portrait). Without a fixed frame,
           * next/image's "h-auto" default lets each cell's height follow
           * the SOURCE photo's own ratio, so a portrait image renders far
           * taller than its landscape neighbors in the same grid row --
           * an irregular, broken-looking grid, independent of which
           * business/provider supplied the photo. `positionMode: "free"`
           * is the SAME existing mechanism the immersive hero variant
           * already uses to make an image fill an absolutely-sized
           * parent with cover (crop, never stretch) behavior; here the
           * parent is the fixed aspect-square cell wrapper below, not an
           * absolutely-positioned overlay -- same primitive, different
           * fixed frame. Source width/height metadata (asset provenance)
           * is never touched, only the CSS presentation.
           */
          positionMode: "free",
        },
      }),
    )
    images.push(
      wrapperNode(nodes, `Celda galería ${index}`, "relative aspect-square overflow-hidden rounded-xl bg-slate-100", [image]),
    )
  }

  const grid = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: "Grid galería",
      props: {
        tag: "div",
        className:
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
      },
      children: images,
    }),
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Galería",
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        background: GALLERY_SECTION_BACKGROUND,
      },
      children: [heading, intro, grid],
    }),
  )

  return {
    role: "gallery",
    rootId: root,
    nodes,
    purpose:
      "Mostrar visualmente productos, espacios, trabajos o resultados.",
  }
}

/**
 * V2-3.1: trust is the only role composer that never set an explicit
 * section `background` -- every sibling (hero/services/features/contact/
 * cta/footer) already does. With no background of its own, the section
 * fell through to Orvenix's own product-chrome default (a dark navy --
 * see app/orvenix-tokens.css's --bg), while its heading/item text still
 * assumed a light background, producing unreadable dark-on-dark text.
 * Giving it the same kind of explicit background every other role
 * already has is the fix; readableTextColorsFor keeps the text correct
 * relative to whatever that background actually is, not a hardcoded
 * assumption, so this stays correct even if the chosen background ever
 * changes.
 */
const TRUST_SECTION_BACKGROUND = "#ffffff"

function composeTrust(context: SectionCompositionContext = {}): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const variant = selectVariant(context, "trust", TRUST_VARIANTS, TRUST_WEIGHTS)
  const textColors = readableTextColorsFor(TRUST_SECTION_BACKGROUND)

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título confianza",
      props: {
        text: "Razones para confiar",
        level: 2,
        size: "3xl",
        align: "center",
        color: textColors.heading,
      },
    }),
  )

  const defaultItems: Array<[string, string]> = [
    ["Atención profesional", "Explica aquí qué hace confiable al negocio."],
    ["Proceso claro", "Describe cómo trabajas y qué puede esperar el cliente."],
    ["Comunicación directa", "Muestra los canales reales de contacto y seguimiento."],
  ]

  /*
   * V2-S2 section 3: when the business supplied real services/products,
   * the first item names what's actually offered instead of staying
   * generic (bounded, no fabricated quality claim). No facts -> returns
   * `defaultItems` unchanged, so the V2-3.1-accepted no-facts render is
   * byte-identical to before.
   */
  const items = resolveTrustItems(context, defaultItems)

  let body: string

  if (variant === "checklist-row") {
    // Items sit directly on the section background (no card of their
    // own) -- they must follow the SAME derived colors as the heading.
    const rows = items.map(([title, text], index) => {
      const iconName = cardIconName("trust", index)
      const icon = iconName ? iconNode(nodes, `${title} ícono`, iconName) : null
      const iconWrap = wrapperNode(nodes, `${title} icono wrap`, "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700", icon ? [icon] : [])
      const cardTitle = headingNode(nodes, title, title, 3, { size: "md", weight: "bold", color: textColors.heading })
      const cardText = textNode(nodes, `${title} descripción`, text, { size: "sm", color: textColors.body })
      const textStack = wrapperNode(nodes, `${title} stack`, "flex flex-col gap-1", [cardTitle, cardText])
      return wrapperNode(nodes, title, "flex items-center gap-4", [iconWrap, textStack])
    })
    body = wrapperNode(nodes, "Checklist confianza", "grid gap-5 sm:grid-cols-3", rows)
  } else {
    // Cards impose their OWN opaque white background regardless of the
    // section's -- their text intentionally stays the fixed dark-on-white
    // default, not derived from TRUST_SECTION_BACKGROUND.
    const cards = items.map(([title, text], index) => {
      const iconName = cardIconName("trust", index)
      const icon = iconName ? iconNode(nodes, `${title} ícono`, iconName) : null
      const cardTitle = headingNode(nodes, title, title, 3, { size: "lg" })
      const cardText = textNode(nodes, `${title} descripción`, text)
      return wrapperNode(nodes, title, "rounded-2xl border border-slate-200 bg-white p-6", icon ? [icon, cardTitle, cardText] : [cardTitle, cardText], "article")
    })
    body = wrapperNode(nodes, "Grid confianza", "grid gap-4 md:grid-cols-3", cards)
  }

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: `Confianza (${variant})`,
      props: {
        maxWidth: "xl",
        paddingY: "lg",
        paddingX: "lg",
        background: TRUST_SECTION_BACKGROUND,
      },
      children: [heading, body],
    }),
  )

  return {
    role: "trust",
    rootId: root,
    nodes,
    purpose:
      "Generar confianza sin inventar testimonios ni estadísticas.",
  }
}

/** V2-3.1: same fix as trust -- this role never set an explicit section background either (see TRUST_SECTION_BACKGROUND's comment). */
const TESTIMONIALS_SECTION_BACKGROUND = "#ffffff"

function composeTestimonials(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const textColors = readableTextColorsFor(TESTIMONIALS_SECTION_BACKGROUND)

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título testimonios",
      props: {
        text: "Experiencias de clientes",
        level: 2,
        size: "3xl",
        align: "center",
        color: textColors.heading,
      },
    }),
  )

  const intro = add(
    nodes,
    createComposedNode({
      type: "text",
      displayName: "Descripción testimonios",
      props: {
        content:
          "Agrega aquí opiniones reales de clientes cuando estén disponibles.",
        align: "center",
        color: textColors.body,
      },
    }),
  )

  const cards: string[] = []

  for (let index = 1; index <= 3; index++) {
    const quote = add(
      nodes,
      createComposedNode({
        type: "text",
        displayName: `Testimonio ${index}`,
        props: {
          content:
            "Testimonio pendiente de contenido real.",
        },
      }),
    )

    const author = add(
      nodes,
      createComposedNode({
        type: "heading",
        displayName: `Autor testimonio ${index}`,
        props: {
          text: "Cliente",
          level: 3,
          size: "sm",
        },
      }),
    )

    const card = add(
      nodes,
      createComposedNode({
        type: "genericWrapper",
        displayName: `Tarjeta testimonio ${index}`,
        props: {
          tag: "article",
          className:
            "rounded-2xl border border-slate-200 bg-white p-6",
        },
        children: [
          quote,
          author,
        ],
      }),
    )

    cards.push(card)
  }

  const grid = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: "Grid testimonios",
      props: {
        tag: "div",
        className:
          "grid gap-4 md:grid-cols-3",
      },
      children: cards,
    }),
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Testimonios",
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        background: TESTIMONIALS_SECTION_BACKGROUND,
      },
      children: [
        heading,
        intro,
        grid,
      ],
    }),
  )

  return {
    role: "testimonials",
    rootId: root,
    nodes,
    purpose:
      "Mostrar testimonios reales sin inventar opiniones ni identidades.",
  }
}

function textNode(nodes: Record<string, ComposedNode>, displayName: string, content: string, props: Record<string, unknown> = {}) {
  return add(nodes, createComposedNode({ type: "text", displayName, props: { content, color: "#475569", size: "md", ...props } }))
}

function headingNode(nodes: Record<string, ComposedNode>, displayName: string, value: string, level = 2, props: Record<string, unknown> = {}) {
  return add(nodes, createComposedNode({ type: "heading", displayName, props: { text: value, level, size: level === 1 ? "5xl" : "3xl", weight: "extrabold", color: "#0f172a", ...props } }))
}

function wrapperNode(nodes: Record<string, ComposedNode>, displayName: string, className: string, children: string[], tag = "div") {
  return add(nodes, createComposedNode({ type: "genericWrapper", displayName, props: { tag, className }, children }))
}

/**
 * V2-1: deterministic per-role icon sequences for generated-content
 * iconography. Values are names from the fixed, statically-imported
 * ICON_ALLOWLIST in components/editor/primitives/Icon.tsx -- this list
 * must stay in sync with that allowlist (an unrecognized name renders
 * nothing, it never executes arbitrary code, but it would silently show
 * no icon). Deliberately positional-by-index, not title-keyword-matched:
 * card titles for "services" can be real, business-supplied names (eg.
 * "Fisioterapia deportiva"), so a title-keyword dictionary would only
 * ever work for the generic fallback copy, not real business content.
 * Positional selection works identically for both.
 */
const CARD_ICON_SEQUENCE_BY_ROLE: Partial<Record<SectionRole, string[]>> = {
  trust: ["shield-check", "workflow", "message-circle"],
  services: ["sparkles", "check-circle", "star", "zap"],
  features: ["shield-check", "zap", "star"],
  process: ["list-checks", "workflow", "check-circle"],
}

function cardIconName(role: SectionRole, index: number): string | undefined {
  const sequence = CARD_ICON_SEQUENCE_BY_ROLE[role]
  if (!sequence || sequence.length === 0) return undefined
  return sequence[index % sequence.length]
}

function iconNode(nodes: Record<string, ComposedNode>, displayName: string, name: string) {
  return add(nodes, createComposedNode({ type: "icon", displayName, props: { name, size: 24 } }))
}

function composeNavigation(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const pages = (context.sitePages ?? [])
    .map((page, index) => {
      const slug = page.slug.trim().toLowerCase()
      const label = page.name.trim() || slug

      return {
        label,
        name: label,
        slug,
        href: `page:${slug}`,
        isHome: page.isHome === true || (index === 0 && slug === "home"),
      }
    })
    .filter((page) => page.slug)

  const root = add(nodes, createComposedNode({
    type: "siteNav",
    displayName: "Menu principal",
    props: {
      title: "Nombre del negocio",
      subtitle: "Sitio profesional",
      labelOverrides: pages.length
        ? pages.map((page) => `${page.slug}=${page.label}`).join("\n")
        : "home=Inicio\nservicios=Servicios\nproductos=Productos\nprecios=Precios\ncontacto=Contacto",
      ...(pages.length ? { pages } : {}),
      showHome: true,
      showCta: true,
      ctaLabel: "Contactar",
      ctaHref: "#contacto",
      layout: "row",
      justify: "center",
      variant: "minimal",
    },
  }))
  return { role: "navigation", rootId: root, nodes, purpose: "Navegacion principal editable del sitio." }
}

function composeHero(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const variant = selectVariant(context, "hero", HERO_VARIANTS, HERO_WEIGHTS)
  const heroCopy = getPageAwareHeroCopy({
    name: context.businessName,
    industry: context.industry,
    objective: context.businessObjective,
    location: context.location,
    audience: context.audience,
    page: {
      name: context.pageName,
      slug: context.pageSlug,
      purpose: context.pagePurpose,
      archetype: context.archetype,
    },
  })

  const centered = variant === "centered" || variant === "immersive"
  const immersive = variant === "immersive"
  const textColor = immersive ? "#ffffff" : undefined
  const eyebrowColor = immersive ? "#e0f2fe" : "#0E5C80"

  const eyebrow = textNode(
    nodes,
    "Etiqueta hero",
    heroCopy.eyebrow,
    {
      size: "sm",
      color: eyebrowColor,
      align: centered ? "center" : "left",
    },
  )

  const title = headingNode(
    nodes,
    "Titulo hero",
    heroCopy.title,
    1,
    {
      align: centered ? "center" : "left",
      ...(textColor ? { color: textColor } : {}),
    },
  )

  const copy = textNode(
    nodes,
    "Descripcion hero",
    heroCopy.description,
    {
      size: "lg",
      align: centered ? "center" : "left",
      ...(textColor ? { color: "#e2e8f0" } : {}),
    },
  )

  const primary = add(
    nodes,
    createComposedNode({
      type: "ctaButton",
      displayName: "CTA principal",
      props: {
        label: "Solicitar informacion",
        href: "#contacto",
        variant: "primary",
        size: "lg",
      },
    }),
  )

  const secondary = add(
    nodes,
    createComposedNode({
      type: "ctaButton",
      displayName: "CTA secundario",
      props: {
        label: "Ver servicios",
        href: "#servicios",
        variant: "secondary",
        size: "lg",
      },
    }),
  )

  const actions = wrapperNode(
    nodes,
    "Acciones hero",
    centered
      ? "flex flex-col justify-center gap-3 sm:flex-row"
      : "flex flex-col gap-3 sm:flex-row",
    [primary, secondary],
  )

  const image = add(
    nodes,
    createComposedNode({
      type: "image",
      displayName: "Imagen hero",
      props: {
        src: "",
        alt: "Imagen principal del negocio",
        objectFit: "cover",
        ...(immersive ? { positionMode: "free" } : {}),
      },
    }),
  )

  if (immersive) {
    /*
     * Full-bleed media with a permanent gradient scrim: text sits on the
     * solid CSS overlay layer, never directly on unpredictable photo
     * pixels, so readability holds whether or not the image actually
     * loads (src=="" until V2-2's asset resolution fills it -- see
     * autonomous/site-builder.ts). The bg-slate-900 on the media wrapper
     * itself is the safe fallback backdrop when there is no image at
     * all, so an unavailable provider never leaves a blank/broken gap.
     */
    const mediaLayer = wrapperNode(nodes, "Imagen inmersiva", "absolute inset-0 h-full w-full bg-slate-900", [image])
    const scrim = wrapperNode(nodes, "Overlay legibilidad", "absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10", [])
    const content = wrapperNode(
      nodes,
      "Contenido hero",
      "relative z-10 mx-auto flex min-h-[26rem] w-full max-w-4xl flex-col items-center justify-end gap-6 px-4 pb-4 text-center sm:min-h-[30rem]",
      [eyebrow, title, copy, actions],
    )

    const root = add(
      nodes,
      createComposedNode({
        type: "section",
        displayName: "Hero autonomo variante inmersiva",
        props: {
          maxWidth: "full",
          paddingY: "none",
          paddingX: "none",
        },
        children: [wrapperNode(nodes, "Layout hero inmersivo", "relative w-full overflow-hidden", [mediaLayer, scrim, content])],
      }),
    )

    return {
      role: "hero",
      rootId: root,
      nodes,
      purpose: "Presentar promesa, confianza visual y accion principal.",
    }
  }

  const media = wrapperNode(
    nodes,
    "Visual hero",
    variant === "centered"
      ? "mx-auto w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-sky-100 bg-sky-50 p-3 shadow-2xl shadow-sky-900/10"
      : "overflow-hidden rounded-[2rem] border border-sky-100 bg-sky-50 p-3 shadow-2xl shadow-sky-900/10",
    [image],
  )

  const content = wrapperNode(
    nodes,
    "Contenido hero",
    centered
      ? "mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 text-center"
      : "flex flex-col justify-center gap-6",
    [eyebrow, title, copy, actions],
  )

  let layoutChildren: string[]
  let layoutClassName: string

  if (variant === "split-left") {
    layoutChildren = [media, content]
    layoutClassName =
      "grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]"
  } else if (variant === "centered") {
    layoutChildren = [content, media]
    layoutClassName = "flex flex-col gap-12"
  } else {
    layoutChildren = [content, media]
    layoutClassName =
      "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
  }

  const layout = wrapperNode(
    nodes,
    "Layout hero",
    layoutClassName,
    layoutChildren,
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: `Hero autonomo variante ${variant}`,
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        background: variant === "centered" ? "#ffffff" : "#f8fbff",
      },
      children: [layout],
    }),
  )

  return {
    role: "hero",
    rootId: root,
    nodes,
    purpose:
      "Presentar promesa, confianza visual y accion principal.",
  }
}

type CardGridCopy = {
  titleText: string
  introText: string
  items: Array<[string, string]>
}

/**
 * Archetype-specific copy for card-grid roles shared between an overview
 * page and a catalog page (eg. Home vs Servicios). Only overview/catalog
 * are keyed here: conversion pages rarely carry these roles, and when
 * they do the neutral legacy copy below is a fine default.
 */
const CARD_GRID_ARCHETYPE_COPY: Partial<Record<SectionRole, Record<"overview" | "catalog", CardGridCopy>>> = {
  services: {
    overview: {
      titleText: "Lo que hacemos por ti",
      introText: "Un vistazo rapido a como podemos ayudarte. Conoce el detalle completo en la pagina de servicios.",
      items: [["Atencion personalizada", "Resolvemos lo que necesitas con un proceso claro y directo."], ["Resultados medibles", "Nos enfocamos en el resultado que buscas, no solo en la tarea."]],
    },
    catalog: {
      titleText: "Nuestro catalogo de servicios",
      introText: "Explora cada servicio a detalle y encuentra el que mejor resuelve lo que buscas.",
      items: [["Diagnostico inicial", "Entendemos tu situacion antes de proponer cualquier solucion."], ["Plan a la medida", "Disenamos un plan especifico para tu caso, no una plantilla generica."], ["Seguimiento cercano", "Acompanamos cada etapa para asegurar el resultado esperado."], ["Entrega y cierre", "Cerramos el proceso con claridad sobre lo logrado y los siguientes pasos."]],
    },
  },
  features: {
    overview: {
      titleText: "Por que elegirnos",
      introText: "Las razones principales por las que los clientes se quedan con nosotros.",
      items: [["Mas confianza", "Presenta pruebas, garantias o detalles que reduzcan dudas."], ["Menos friccion", "Haz facil pedir informacion, reservar, comprar o cotizar."]],
    },
    catalog: {
      titleText: "Beneficios de cada opcion",
      introText: "Compara a detalle lo que obtienes en cada alternativa antes de decidir.",
      items: [["Ventajas claras", "Cada opcion tiene beneficios especificos que puedes comparar antes de elegir."], ["Menos dudas", "Encuentra el detalle que necesitas para decidir con confianza."], ["Experiencia cuidada", "Cada punto de contacto esta pensado para que el proceso se sienta profesional."]],
    },
  },
  process: {
    overview: {
      titleText: "Como te ayudamos",
      introText: "Un resumen rapido del camino que recorres con nosotros.",
      items: [["1. Cuentanos tu objetivo", "Recibe la informacion clave sin formularios largos."], ["2. Activamos el siguiente paso", "Cierra con una accion concreta y facil de completar."]],
    },
    catalog: {
      titleText: "Nuestro proceso paso a paso",
      introText: "Asi es como avanzamos juntos desde el primer contacto hasta el resultado final.",
      items: [["1. Compartes el contexto", "Nos cuentas que necesitas sin formularios largos ni pasos innecesarios."], ["2. Analizamos las opciones", "Revisamos las alternativas disponibles y te mostramos la ruta mas clara."], ["3. Avanzamos juntos", "Confirmamos los detalles y damos el siguiente paso de forma concreta."]],
    },
  },
  products: {
    overview: {
      titleText: "Lo mas destacado",
      introText: "Una muestra rapida de lo que puedes encontrar en el catalogo completo.",
      items: [["Producto estrella", "Describe el beneficio principal, precio o diferencial."], ["Opcion recomendada", "Resalta el producto ideal para la mayoria de clientes."]],
    },
    catalog: {
      titleText: "Explora el catalogo completo",
      introText: "Compara opciones y elige la que mejor se adapta a lo que buscas.",
      items: [["Variedad disponible", "Compara varias opciones antes de decidir cual se adapta mejor a lo que buscas."], ["Detalle por opcion", "Cada producto incluye la informacion que necesitas para comparar con confianza."], ["Listo para elegir", "Encuentra la combinacion de caracteristicas y valor que mejor te convenga."]],
    },
  },
  pricing: {
    overview: {
      titleText: "Opciones para todos los presupuestos",
      introText: "Un vistazo rapido a los planes disponibles.",
      items: [["Inicial", "Para comenzar con lo esencial y validar interes."], ["Premium", "Para clientes que quieren una experiencia mas completa."]],
    },
    catalog: {
      titleText: "Elige la opcion ideal",
      introText: "Presenta precios, paquetes u ofertas sin confundir al comprador.",
      items: [["Basico", "Cubre lo esencial para comenzar sin complicaciones."], ["Estandar", "El equilibrio entre alcance, soporte y valor que buscan la mayoria de clientes."], ["Avanzado", "Para quienes buscan la experiencia mas completa disponible."]],
    },
  },
  content: {
    overview: {
      titleText: "Lo esencial de un vistazo",
      introText: "Los puntos clave que todo visitante deberia conocer primero.",
      items: [["Detalle importante", "Explica aqui un punto clave que ayude a decidir."], ["Siguiente paso", "Guia al visitante hacia la accion mas importante."]],
    },
    catalog: {
      titleText: "Contenido a detalle",
      introText: "Toda la informacion relevante organizada para que puedas revisarla con calma.",
      items: [["Contexto completo", "Cada aspecto relevante queda explicado antes de que tengas que preguntar."], ["Puntos clave", "Cada seccion resalta lo que realmente importa antes de decidir."], ["Proximo paso", "Una guia clara de que hacer despues de revisar el contenido."]],
    },
  },
}

function cardGridCopy(role: SectionRole, archetype: SectionCompositionContext["archetype"], legacy: CardGridCopy): CardGridCopy {
  if (archetype === "overview" || archetype === "catalog") {
    return CARD_GRID_ARCHETYPE_COPY[role]?.[archetype] ?? legacy
  }

  return legacy
}

/**
 * Real, business-supplied services take over the "services" role's card
 * items when available -- overview gets a short, deterministic teaser
 * subset (never the full catalog), catalog gets all of them. Every other
 * card-grid role (features/products/pricing/process/content) keeps its
 * existing archetype-keyed scaffolding untouched.
 */
const OVERVIEW_SERVICE_TEASER_COUNT = 2

/**
 * V2-S1: generalized from the original services-only `realServiceItems`
 * -- consumes any real, business-supplied offering collection
 * (services OR products) with the same teaser/full-catalog archetype
 * behavior. `fallbackDescription` is role-aware so a dish name doesn't
 * get a service-flavored sentence ("...y como puede ayudarte") stitched
 * onto it; it is always GENERIC presentation copy, never an invented
 * fact (no price/ingredient/claim is ever synthesized here).
 */
function realOfferingItems(
  offerings: SectionCompositionContext["services"],
  archetype: SectionCompositionContext["archetype"],
  fallbackDescription: (name: string) => string,
): Array<[string, string]> {
  const usable = (offerings ?? [])
    .map((offering) => ({
      name: offering.name?.trim(),
      description: offering.description?.trim(),
    }))
    .filter(
      (offering): offering is { name: string; description: string | undefined } =>
        Boolean(offering.name),
    )

  if (!usable.length) return []

  const selected =
    archetype === "overview"
      ? usable.slice(0, OVERVIEW_SERVICE_TEASER_COUNT)
      : usable

  return selected.map((offering) => [
    offering.name,
    offering.description || fallbackDescription(offering.name),
  ])
}

/** Guardrail (V2-3 Section 12): fancy asymmetric/editorial treatments only make sense for a small, curated item count -- long real-service lists fall back to the safe grid automatically instead of producing an oversized featured card or a very long editorial scroll. */
const STRUCTURAL_TREATMENT_MAX_ITEMS = 6

function cardsLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  gridClassName: string,
): string {
  const cards = items.map(([title, body], index) => {
    const iconName = cardIconName(role, index)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body)
    const children = icon ? [icon, cardTitle, cardText] : [cardTitle, cardText]
    return wrapperNode(nodes, title, "rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10", children, "article")
  })
  return wrapperNode(nodes, "Grid " + role, gridClassName, cards)
}

/** FEATURES: alternating icon/text rows instead of a grid -- visual rhythm down the page. */
function alternatingRowsLayout(nodes: Record<string, ComposedNode>, role: SectionRole, items: Array<[string, string]>): string {
  const rows = items.map(([title, body], index) => {
    const iconName = cardIconName(role, index)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const iconWrap = wrapperNode(nodes, title + " icono wrap", "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700", icon ? [icon] : [])
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body)
    const textStack = wrapperNode(nodes, title + " stack", "flex flex-col gap-2", [cardTitle, cardText])
    const reversed = index % 2 === 1
    return wrapperNode(
      nodes,
      title + " fila",
      `flex flex-col items-center gap-6 border-b border-slate-100 py-6 last:border-0 sm:items-center sm:text-left ${reversed ? "sm:flex-row-reverse sm:text-right" : "sm:flex-row"}`,
      [iconWrap, textStack],
    )
  })
  return wrapperNode(nodes, "Filas " + role, "flex flex-col", rows)
}

/** FEATURES: compact icon/list matrix -- denser, no card chrome, scan-friendly. */
function compactMatrixLayout(nodes: Record<string, ComposedNode>, role: SectionRole, items: Array<[string, string]>): string {
  const entries = items.map(([title, body], index) => {
    const iconName = cardIconName(role, index)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const cardTitle = headingNode(nodes, title, title, 3, { size: "lg", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body, { size: "sm" })
    const header = icon
      ? wrapperNode(nodes, title + " header", "flex items-center gap-2", [icon, cardTitle])
      : cardTitle
    return wrapperNode(nodes, title, "flex flex-col gap-1.5 rounded-xl bg-slate-50 p-4", [header, cardText])
  })
  return wrapperNode(nodes, "Matriz " + role, "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", entries)
}

/** SERVICES: numbered editorial list, no card borders -- reads like a menu/spec sheet rather than a grid. */
function editorialListLayout(nodes: Record<string, ComposedNode>, role: SectionRole, items: Array<[string, string]>): string {
  const rows = items.map(([title, body], index) => {
    const number = textNode(nodes, title + " numero", String(index + 1).padStart(2, "0"), { size: "sm", color: "#94a3b8" })
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body)
    const textStack = wrapperNode(nodes, title + " stack", "flex flex-col gap-2", [cardTitle, cardText])
    return wrapperNode(nodes, title + " fila", "flex items-start gap-5 border-b border-slate-100 py-6 last:border-0", [number, textStack])
  })
  return wrapperNode(nodes, "Lista " + role, "flex flex-col", rows)
}

/** SERVICES: first item featured large, remaining items stacked smaller beside it. Falls back to a plain grid when there's only one item (nothing to be "supporting"). */
function asymmetricFeaturedLayout(nodes: Record<string, ComposedNode>, role: SectionRole, items: Array<[string, string]>): string {
  const [[featuredTitle, featuredBody], ...rest] = items

  const featuredIconName = cardIconName(role, 0)
  const featuredIcon = featuredIconName ? iconNode(nodes, featuredTitle + " ícono", featuredIconName) : null
  const featuredHeading = headingNode(nodes, featuredTitle, featuredTitle, 3, { size: "2xl", weight: "extrabold" })
  const featuredText = textNode(nodes, featuredTitle + " texto", featuredBody, { size: "lg" })
  const featuredChildren = featuredIcon ? [featuredIcon, featuredHeading, featuredText] : [featuredHeading, featuredText]
  const featured = wrapperNode(nodes, featuredTitle + " destacado", "flex flex-col justify-center gap-4 rounded-[2rem] bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-8", featuredChildren, "article")

  if (rest.length === 0) return featured

  const supportingItems = rest.map(([title, body], index) => {
    const iconName = cardIconName(role, index + 1)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const cardTitle = headingNode(nodes, title, title, 3, { size: "lg", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body, { size: "sm" })
    const children = icon ? [icon, cardTitle, cardText] : [cardTitle, cardText]
    return wrapperNode(nodes, title, "flex flex-col gap-1.5 rounded-xl border border-slate-100 p-4", children)
  })
  const supporting = wrapperNode(nodes, "Servicios secundarios", "flex flex-col gap-3", supportingItems)

  return wrapperNode(nodes, "Asimetrico " + role, "grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-stretch", [featured, supporting])
}

function composeCardGridSection(
  role: SectionRole,
  titleText: string,
  introText: string,
  items: Array<[string, string]>,
  context: SectionCompositionContext = {},
): ComposedSection {
  const copy = cardGridCopy(role, context.archetype, { titleText, introText, items })
  const realItems =
    role === "services"
      ? realOfferingItems(context.services, context.archetype, (name) => `Conoce mas sobre ${name.toLowerCase()} y como puede ayudarte.`)
      : role === "products"
        ? realOfferingItems(context.products, context.archetype, (name) => `Descubre mas sobre ${name.toLowerCase()}.`)
        : []
  /*
   * V2-S2 sections 5/6: features/process get a small, fact-gated copy
   * override (never a real-offering listing -- that would just duplicate
   * the services/products role's own grid). Every other role's `copy`
   * passes through unchanged.
   */
  const personalizedItems = role === "features" ? resolveFeatureItems(context, copy.items) : copy.items
  const personalizedIntro = role === "process" ? resolveProcessIntro(context, copy.introText) : copy.introText
  const finalItems = realItems.length ? realItems : personalizedItems
  const nodes: Record<string, ComposedNode> = {}
  const heading = headingNode(nodes, "Titulo " + role, copy.titleText, 2, { align: "center" })
  const intro = textNode(nodes, "Intro " + role, personalizedIntro, { align: "center", size: "lg" })

  /*
   * "services" is the flagship role shared between overview and catalog
   * pages: give catalog a visibly different default grid (fewer, wider
   * columns) instead of layering layout variance onto every role.
   */
  const defaultGridClassName = role === "services" && context.archetype === "catalog"
    ? "grid gap-6 md:grid-cols-2"
    : "grid gap-5 md:grid-cols-3"

  const canUseStructuralTreatment = finalItems.length >= 2 && finalItems.length <= STRUCTURAL_TREATMENT_MAX_ITEMS

  let grid: string
  let layoutVariant = "cards"

  if (role === "features" && canUseStructuralTreatment) {
    layoutVariant = selectVariant(context, "features", FEATURES_VARIANTS, FEATURES_WEIGHTS)
    if (layoutVariant === "alternating-rows") grid = alternatingRowsLayout(nodes, role, finalItems)
    else if (layoutVariant === "compact-matrix") grid = compactMatrixLayout(nodes, role, finalItems)
    else grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
  } else if (role === "services" && canUseStructuralTreatment) {
    layoutVariant = selectVariant(context, "services", SERVICES_VARIANTS, SERVICES_WEIGHTS)
    if (layoutVariant === "editorial-list") grid = editorialListLayout(nodes, role, finalItems)
    else if (layoutVariant === "asymmetric-featured") grid = asymmetricFeaturedLayout(nodes, role, finalItems)
    else grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
  } else {
    grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
  }

  const root = add(nodes, createComposedNode({ type: "section", displayName: `${copy.titleText} (${layoutVariant})`, props: { maxWidth: "xl", paddingY: "xl", paddingX: "lg", background: "#ffffff" }, children: [heading, intro, grid] }))
  return { role, rootId: root, nodes, purpose: copy.introText }
}

function composeServices(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("services", "Servicios pensados para vender mejor", "Organiza tu oferta para que el visitante entienda rapido que haces y por que debe contactarte.", [["Servicio principal", "Explica el resultado mas valioso que obtiene tu cliente."], ["Acompanamiento experto", "Muestra como guias al cliente antes, durante y despues del servicio."], ["Entrega clara", "Convierte tu proceso en una razon para confiar y avanzar."]], context) }
function composeFeatures(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("features", "Beneficios que se entienden al instante", "Transforma caracteristicas en razones claras para elegir tu negocio.", [["Mas confianza", "Presenta pruebas, garantias o detalles que reduzcan dudas."], ["Menos friccion", "Haz facil pedir informacion, reservar, comprar o cotizar."], ["Mejor experiencia", "Cuida cada punto de contacto para que el sitio se sienta profesional."]], context) }
function composeProcess(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("process", "Un proceso simple para empezar", "Ayuda al cliente a saber que pasara despues de dar clic.", [["1. Cuentanos tu objetivo", "Recibe la informacion clave sin formularios largos."], ["2. Revisamos la mejor ruta", "Muestra una propuesta clara y adaptada al caso."], ["3. Activamos el siguiente paso", "Cierra con una accion concreta y facil de completar."]], context) }
function composeProducts(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("products", "Productos destacados", "Muestra opciones faciles de comparar y listas para llevar al usuario a comprar.", [["Producto estrella", "Describe el beneficio principal, precio o diferencial."], ["Opcion recomendada", "Resalta el producto ideal para la mayoria de clientes."], ["Paquete premium", "Presenta la alternativa con mayor valor percibido."]], context) }
function composePricing(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("pricing", "Elige la opcion ideal", "Presenta precios, paquetes u ofertas sin confundir al comprador.", [["Inicial", "Para comenzar con lo esencial y validar interes."], ["Recomendado", "La opcion con mejor balance entre alcance, soporte y crecimiento."], ["Premium", "Para clientes que quieren una experiencia mas completa."]], context) }

/**
 * The "contact" role is used two ways: as Contacto's ONLY content section
 * (archetype="conversion" -- that page has no separate "hero" role in any
 * architecture recipe, so this IS its purpose-bearing header), and as a
 * supplementary mid-page block on Home (which already has its own hero
 * H1). Only the former should gain a real H1 / conversion copy / second
 * CTA -- giving both would produce two H1s and an unreviewed extra CTA on
 * Home. The conversion-only branch deliberately reuses
 * getPageAwareHeroCopy's existing conversion-archetype copy (already
 * location+objective aware) instead of composeHero's full 2-column
 * structure, keeping Contacto materially shorter than Home/Servicios.
 */
function composeContact(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const isConversionPage = context.archetype === "conversion"

  let titleText = "Hablemos de tu proyecto"
  let descriptionText =
    "Deja claro el siguiente paso y facilita que el visitante te escriba, agende o solicite una cotizacion."

  if (isConversionPage) {
    const heroCopy = getPageAwareHeroCopy({
      name: context.businessName,
      location: context.location,
      objective: context.businessObjective,
      page: {
        name: context.pageName,
        slug: context.pageSlug ?? "contacto",
        purpose: context.pagePurpose,
        archetype: "conversion",
      },
    })
    titleText = heroCopy.title
    descriptionText = heroCopy.description
  }

  const heading = headingNode(nodes, "Titulo contacto", titleText, isConversionPage ? 1 : 2, { align: "left" })
  const copy = textNode(nodes, "Texto contacto", descriptionText, { size: "lg" })
  const phone = textNode(nodes, "Telefono", "WhatsApp: +52 000 000 0000")
  const email = textNode(nodes, "Correo", "Correo: contacto@tumarca.com")
  const primaryCta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "Boton contacto", props: { label: "Enviar mensaje", href: "#", variant: "primary", size: "lg" } }))

  const contentChildren = [heading, copy, phone, email]

  if (isConversionPage) {
    const secondaryCta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "Boton contacto secundario", props: { label: "Ver servicios", href: "#servicios", variant: "secondary", size: "lg" } }))
    const actions = wrapperNode(nodes, "Acciones contacto", "flex flex-col gap-3 sm:flex-row", [primaryCta, secondaryCta])
    contentChildren.push(actions)
  } else {
    contentChildren.push(primaryCta)
  }

  const card = wrapperNode(nodes, "Tarjeta contacto", "rounded-[1.75rem] border border-sky-100 bg-white p-8 shadow-xl shadow-sky-900/10", contentChildren, "article")
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Contacto", props: { maxWidth: "lg", paddingY: "xl", paddingX: "lg", background: "#eef8ff" }, children: [card] }))
  return { role: "contact", rootId: root, nodes, purpose: "Facilitar contacto y siguiente paso." }
}

function ctaCopy(archetype: SectionCompositionContext["archetype"]) {
  if (archetype === "overview") {
    return {
      title: "Descubre todo lo que podemos hacer por ti",
      body: "Conoce el detalle completo de nuestros servicios y encuentra la opcion ideal.",
      label: "Ver servicios",
      href: "#servicios",
    }
  }

  if (archetype === "catalog") {
    return {
      title: "¿Listo para dar el siguiente paso?",
      body: "Agenda una valoracion y resolvemos juntos cual es la mejor opcion para ti.",
      label: "Agendar ahora",
      href: "#contacto",
    }
  }

  return {
    title: "Convierte esta visita en una oportunidad real",
    body: "Cierra con una accion clara, directa y facil de tomar.",
    label: "Comenzar ahora",
    href: "#contacto",
  }
}

function composeCTA(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  /*
   * V2-S2 section 4: layers real, explicit facts (offering kind +
   * businessObjective) onto the existing archetype fallback. No facts ->
   * `copy` is `ctaCopy(context.archetype)` unchanged.
   */
  const copy = resolveCtaCopy(context, ctaCopy(context.archetype))
  const variant = selectVariant(context, "cta", CTA_VARIANTS, CTA_WEIGHTS)

  if (variant === "split-panel") {
    const heading = headingNode(nodes, "Titulo CTA", copy.title, 2, { align: "left", color: "#ffffff" })
    const body = textNode(nodes, "Texto CTA", copy.body, { align: "left", color: "#dbeafe", size: "lg" })
    const textStack = wrapperNode(nodes, "Texto CTA stack", "flex flex-col gap-4", [heading, body])
    const cta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "CTA final", props: { label: copy.label, href: copy.href, variant: "primary", size: "lg" } }))
    const actionWrap = wrapperNode(nodes, "Accion CTA", "flex items-center justify-start lg:justify-end", [cta])
    const panel = wrapperNode(nodes, "Panel CTA", "mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.3fr_1fr]", [textStack, actionWrap])
    const root = add(nodes, createComposedNode({ type: "section", displayName: "CTA final (panel)", props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background: "#0A3E57" }, children: [panel] }))
    return { role: "cta", rootId: root, nodes, purpose: "Cerrar con llamada a la accion." }
  }

  const heading = headingNode(nodes, "Titulo CTA", copy.title, 2, { align: "center", color: "#ffffff" })
  const body = textNode(nodes, "Texto CTA", copy.body, { align: "center", color: "#dbeafe", size: "lg" })
  const cta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "CTA final", props: { label: copy.label, href: copy.href, variant: "primary", size: "lg" } }))
  const stack = wrapperNode(nodes, "Contenido CTA", "mx-auto flex max-w-3xl flex-col items-center gap-6 text-center", [heading, body, cta])
  const root = add(nodes, createComposedNode({ type: "section", displayName: "CTA final (banner)", props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background: "#0A3E57" }, children: [stack] }))
  return { role: "cta", rootId: root, nodes, purpose: "Cerrar con llamada a la accion." }
}

/**
 * Legacy fallback nav text, preserved verbatim for callers that don't
 * supply sitePages (eg. pre-existing tests, non-multipage composition).
 */
const FOOTER_NAV_FALLBACK = "Inicio · Servicios · Precios · Contacto"

function footerNavText(
  sitePages: SectionCompositionContext["sitePages"],
): string {
  const names = (sitePages ?? [])
    .map((page) => page.name?.trim())
    .filter((name): name is string => Boolean(name))

  return names.length ? names.join(" · ") : FOOTER_NAV_FALLBACK
}

function composeFooter(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const brandName = context.businessName?.trim() || "Nombre del negocio"
  const brand = headingNode(nodes, "Marca footer", brandName, 3, { size: "xl", color: "#ffffff" })
  const copy = textNode(nodes, "Descripcion footer", "Gracias por tu visita. Contactanos para conocer mas.", { color: "#cbd5e1" })
  const links = textNode(nodes, "Links footer", footerNavText(context.sitePages), { color: "#e2e8f0" })
  const brandStack = wrapperNode(nodes, "Marca y descripcion", "space-y-3", [brand, copy])
  const stack = wrapperNode(nodes, "Contenido footer", "mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-center", [brandStack, links])
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Footer", props: { maxWidth: "full", paddingY: "lg", paddingX: "lg", background: "#071826" }, children: [stack] }))
  return { role: "footer", rootId: root, nodes, purpose: "Cerrar navegacion, marca y datos basicos." }
}

function composeContent(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("content", "Contenido principal", "Informacion clara y organizada sobre lo que ofrecemos.", [["Detalle importante", "Explica aqui un punto clave que ayude a decidir."], ["Diferencial", "Cuenta que hace especial esta oferta frente a otras opciones."], ["Siguiente paso", "Guia al visitante hacia la accion mas importante."]], context) }

export function composeSection(
  role: SectionRole,
  context: SectionCompositionContext = {},
): ComposedSection | null {
  switch (role) {
    case "navigation":
      return composeNavigation(context)

    case "hero":
      return composeHero(context)

    case "services":
      return composeServices(context)

    case "features":
      return composeFeatures(context)

    case "products":
      return composeProducts(context)

    case "pricing":
      return composePricing(context)

    case "process":
      return composeProcess(context)

    case "contact":
      return composeContact(context)

    case "cta":
      return composeCTA(context)

    case "footer":
      return composeFooter(context)

    case "content":
      return composeContent(context)

    case "faq":
      return composeFAQ(context)

    case "gallery":
      return composeGallery()

    case "trust":
      return composeTrust(context)

    case "testimonials":
      return composeTestimonials()

    default:
      return null
  }
}
