import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type {
  ComposedNode,
  ComposedSection,
  SectionCompositionContext,
} from "./types"
import { createComposedNode } from "./node-factory"
import { getPageAwareHeroCopy } from "@/lib/orvenix-ai/content/content-engine"

function add(
  nodes: Record<string, ComposedNode>,
  node: ComposedNode,
) {
  nodes[node.tempId] = node
  return node.tempId
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

function composeFAQ(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const copy = faqCopy(context.archetype)

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

function composeGallery(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}

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
      },
    }),
  )

  const intro = add(
    nodes,
    createComposedNode({
      type: "text",
      displayName: "Descripción galería",
      props: {
        content:
          "Una selección visual que puedes reemplazar con fotografías reales del negocio.",
        align: "center",
      },
    }),
  )

  const images: string[] = []

  for (let index = 1; index <= 6; index++) {
    images.push(
      add(
        nodes,
        createComposedNode({
          type: "image",
          displayName: `Imagen galería ${index}`,
          props: {
            src: "",
            alt: `Imagen del negocio ${index}`,
          },
        }),
      ),
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

function composeTrust(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}

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
      },
    }),
  )

  const cards: string[] = []

  const items = [
    ["Atención profesional", "Explica aquí qué hace confiable al negocio."],
    ["Proceso claro", "Describe cómo trabajas y qué puede esperar el cliente."],
    ["Comunicación directa", "Muestra los canales reales de contacto y seguimiento."],
  ]

  for (const [title, text] of items) {
    const cardTitle = add(
      nodes,
      createComposedNode({
        type: "heading",
        displayName: title,
        props: {
          text: title,
          level: 3,
          size: "lg",
        },
      }),
    )

    const cardText = add(
      nodes,
      createComposedNode({
        type: "text",
        displayName: `${title} descripción`,
        props: {
          content: text,
        },
      }),
    )

    cards.push(
      add(
        nodes,
        createComposedNode({
          type: "genericWrapper",
          displayName: title,
          props: {
            tag: "article",
            className:
              "rounded-2xl border border-slate-200 bg-white p-6",
          },
          children: [cardTitle, cardText],
        }),
      ),
    )
  }

  const grid = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: "Grid confianza",
      props: {
        tag: "div",
        className: "grid gap-4 md:grid-cols-3",
      },
      children: cards,
    }),
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Confianza",
      props: {
        maxWidth: "xl",
        paddingY: "lg",
        paddingX: "lg",
      },
      children: [heading, grid],
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

function composeTestimonials(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}

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

function compositionVariant(
  context: SectionCompositionContext,
  variants: number,
): number {
  const source = [
    context.siteType,
    context.industry,
    context.objective,
    context.audience,
    context.pageName,
    context.pageSlug,
    context.pagePurpose,
    context.archetype,
    context.preferredStyle,
    context.compositionSeed,
  ]
    .filter(Boolean)
    .join("|")

  let hash = 0

  for (let index = 0; index < source.length; index++) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }

  return variants > 0 ? hash % variants : 0
}

function composeHero(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const variant = compositionVariant(context, 3)
  const heroCopy = getPageAwareHeroCopy({
    industry: context.industry,
    objective: context.objective,
    audience: context.audience,
    page: {
      name: context.pageName,
      slug: context.pageSlug,
      purpose: context.pagePurpose,
      archetype: context.archetype,
    },
  })

  const centered = variant === 2
  const eyebrow = textNode(
    nodes,
    "Etiqueta hero",
    heroCopy.eyebrow,
    {
      size: "sm",
      color: "#0E5C80",
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
    },
  )

  const copy = textNode(
    nodes,
    "Descripcion hero",
    heroCopy.description,
    {
      size: "lg",
      align: centered ? "center" : "left",
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
      },
    }),
  )

  const media = wrapperNode(
    nodes,
    "Visual hero",
    variant === 2
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

  if (variant === 1) {
    layoutChildren = [media, content]
    layoutClassName =
      "grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]"
  } else if (variant === 2) {
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
      displayName: `Hero autonomo variante ${variant + 1}`,
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        background: variant === 2 ? "#ffffff" : "#f8fbff",
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

function realServiceItems(
  services: SectionCompositionContext["services"],
  archetype: SectionCompositionContext["archetype"],
): Array<[string, string]> {
  const usable = (services ?? [])
    .map((service) => ({
      name: service.name?.trim(),
      description: service.description?.trim(),
    }))
    .filter(
      (service): service is { name: string; description: string | undefined } =>
        Boolean(service.name),
    )

  if (!usable.length) return []

  const selected =
    archetype === "overview"
      ? usable.slice(0, OVERVIEW_SERVICE_TEASER_COUNT)
      : usable

  return selected.map((service) => [
    service.name,
    service.description ||
      `Conoce mas sobre ${service.name.toLowerCase()} y como puede ayudarte.`,
  ])
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
      ? realServiceItems(context.services, context.archetype)
      : []
  const finalItems = realItems.length ? realItems : copy.items
  const nodes: Record<string, ComposedNode> = {}
  const heading = headingNode(nodes, "Titulo " + role, copy.titleText, 2, { align: "center" })
  const intro = textNode(nodes, "Intro " + role, copy.introText, { align: "center", size: "lg" })
  const cards = finalItems.map(([title, body]) => {
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body)
    return wrapperNode(nodes, title, "rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10", [cardTitle, cardText], "article")
  })
  /*
   * "services" is the flagship role shared between overview and catalog
   * pages: give catalog a visibly different grid (fewer, wider columns)
   * instead of layering layout variance onto every role.
   */
  const gridClassName = role === "services" && context.archetype === "catalog"
    ? "grid gap-6 md:grid-cols-2"
    : "grid gap-5 md:grid-cols-3"
  const grid = wrapperNode(nodes, "Grid " + role, gridClassName, cards)
  const root = add(nodes, createComposedNode({ type: "section", displayName: copy.titleText, props: { maxWidth: "xl", paddingY: "xl", paddingX: "lg", background: "#ffffff" }, children: [heading, intro, grid] }))
  return { role, rootId: root, nodes, purpose: copy.introText }
}

function composeServices(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("services", "Servicios pensados para vender mejor", "Organiza tu oferta para que el visitante entienda rapido que haces y por que debe contactarte.", [["Servicio principal", "Explica el resultado mas valioso que obtiene tu cliente."], ["Acompanamiento experto", "Muestra como guias al cliente antes, durante y despues del servicio."], ["Entrega clara", "Convierte tu proceso en una razon para confiar y avanzar."]], context) }
function composeFeatures(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("features", "Beneficios que se entienden al instante", "Transforma caracteristicas en razones claras para elegir tu negocio.", [["Mas confianza", "Presenta pruebas, garantias o detalles que reduzcan dudas."], ["Menos friccion", "Haz facil pedir informacion, reservar, comprar o cotizar."], ["Mejor experiencia", "Cuida cada punto de contacto para que el sitio se sienta profesional."]], context) }
function composeProcess(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("process", "Un proceso simple para empezar", "Ayuda al cliente a saber que pasara despues de dar clic.", [["1. Cuentanos tu objetivo", "Recibe la informacion clave sin formularios largos."], ["2. Revisamos la mejor ruta", "Muestra una propuesta clara y adaptada al caso."], ["3. Activamos el siguiente paso", "Cierra con una accion concreta y facil de completar."]], context) }
function composeProducts(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("products", "Productos destacados", "Muestra opciones faciles de comparar y listas para llevar al usuario a comprar.", [["Producto estrella", "Describe el beneficio principal, precio o diferencial."], ["Opcion recomendada", "Resalta el producto ideal para la mayoria de clientes."], ["Paquete premium", "Presenta la alternativa con mayor valor percibido."]], context) }
function composePricing(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("pricing", "Elige la opcion ideal", "Presenta precios, paquetes u ofertas sin confundir al comprador.", [["Inicial", "Para comenzar con lo esencial y validar interes."], ["Recomendado", "La opcion con mejor balance entre alcance, soporte y crecimiento."], ["Premium", "Para clientes que quieren una experiencia mas completa."]], context) }

function composeContact(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const heading = headingNode(nodes, "Titulo contacto", "Hablemos de tu proyecto", 2, { align: "left" })
  const copy = textNode(nodes, "Texto contacto", "Deja claro el siguiente paso y facilita que el visitante te escriba, agende o solicite una cotizacion.", { size: "lg" })
  const phone = textNode(nodes, "Telefono", "WhatsApp: +52 000 000 0000")
  const email = textNode(nodes, "Correo", "Correo: contacto@tumarca.com")
  const cta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "Boton contacto", props: { label: "Enviar mensaje", href: "#", variant: "primary", size: "lg" } }))
  const card = wrapperNode(nodes, "Tarjeta contacto", "rounded-[1.75rem] border border-sky-100 bg-white p-8 shadow-xl shadow-sky-900/10", [heading, copy, phone, email, cta], "article")
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
  const copy = ctaCopy(context.archetype)
  const heading = headingNode(nodes, "Titulo CTA", copy.title, 2, { align: "center", color: "#ffffff" })
  const body = textNode(nodes, "Texto CTA", copy.body, { align: "center", color: "#dbeafe", size: "lg" })
  const cta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "CTA final", props: { label: copy.label, href: copy.href, variant: "primary", size: "lg" } }))
  const stack = wrapperNode(nodes, "Contenido CTA", "mx-auto flex max-w-3xl flex-col items-center gap-6 text-center", [heading, body, cta])
  const root = add(nodes, createComposedNode({ type: "section", displayName: "CTA final", props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background: "#0A3E57" }, children: [stack] }))
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
  const copy = textNode(nodes, "Descripcion footer", "Sitio profesional listo para personalizar, publicar y convertir visitantes en clientes.", { color: "#cbd5e1" })
  const links = textNode(nodes, "Links footer", footerNavText(context.sitePages), { color: "#e2e8f0" })
  const brandStack = wrapperNode(nodes, "Marca y descripcion", "space-y-3", [brand, copy])
  const stack = wrapperNode(nodes, "Contenido footer", "mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-center", [brandStack, links])
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Footer", props: { maxWidth: "full", paddingY: "lg", paddingX: "lg", background: "#071826" }, children: [stack] }))
  return { role: "footer", rootId: root, nodes, purpose: "Cerrar navegacion, marca y datos basicos." }
}

function composeContent(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("content", "Contenido principal", "Agrega informacion importante del negocio con una estructura clara y editable.", [["Detalle importante", "Explica aqui un punto clave que ayude a decidir."], ["Diferencial", "Cuenta que hace especial esta oferta frente a otras opciones."], ["Siguiente paso", "Guia al visitante hacia la accion mas importante."]], context) }

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
      return composeContact()

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
      return composeTrust()

    case "testimonials":
      return composeTestimonials()

    default:
      return null
  }
}
