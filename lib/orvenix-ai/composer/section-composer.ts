import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type {
  ComposedNode,
  ComposedSection,
} from "./types"
import { createComposedNode } from "./node-factory"

function add(
  nodes: Record<string, ComposedNode>,
  node: ComposedNode,
) {
  nodes[node.tempId] = node
  return node.tempId
}

function composeFAQ(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título FAQ",
      props: {
        text: "Preguntas frecuentes",
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
        content:
          "Resuelve aquí las dudas más comunes antes de que el cliente tenga que preguntar.",
        align: "center",
      },
    }),
  )

  const items: string[] = []

  for (let index = 1; index <= 4; index++) {
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

function composeNavigation(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const root = add(nodes, createComposedNode({
    type: "siteNav",
    displayName: "Menu principal",
    props: { title: "Nombre del negocio", subtitle: "Sitio profesional", labelOverrides: "home=Inicio\nservicios=Servicios\nproductos=Productos\nprecios=Precios\ncontacto=Contacto", showHome: true, showCta: true, ctaLabel: "Contactar", ctaHref: "#contacto", layout: "row", justify: "center", variant: "minimal" },
  }))
  return { role: "navigation", rootId: root, nodes, purpose: "Navegacion principal editable del sitio." }
}

function composeHero(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const eyebrow = textNode(nodes, "Etiqueta hero", "Nueva experiencia para clientes exigentes", { size: "sm", color: "#0E5C80" })
  const title = headingNode(nodes, "Titulo hero", "Un sitio profesional que convierte visitas en clientes", 1, { align: "left" })
  const copy = textNode(nodes, "Descripcion hero", "Presenta tu oferta con claridad, confianza y una experiencia visual lista para personalizar sin tocar codigo.", { size: "lg" })
  const primary = add(nodes, createComposedNode({ type: "ctaButton", displayName: "CTA principal", props: { label: "Solicitar informacion", href: "#contacto", variant: "primary", size: "lg" } }))
  const secondary = add(nodes, createComposedNode({ type: "ctaButton", displayName: "CTA secundario", props: { label: "Ver servicios", href: "#servicios", variant: "secondary", size: "lg" } }))
  const actions = wrapperNode(nodes, "Acciones hero", "flex flex-col gap-3 sm:flex-row", [primary, secondary])
  const image = add(nodes, createComposedNode({ type: "image", displayName: "Imagen hero", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } }))
  const media = wrapperNode(nodes, "Visual hero", "overflow-hidden rounded-[2rem] border border-sky-100 bg-sky-50 p-3 shadow-2xl shadow-sky-900/10", [image])
  const content = wrapperNode(nodes, "Contenido hero", "flex flex-col justify-center gap-6", [eyebrow, title, copy, actions])
  const grid = wrapperNode(nodes, "Layout hero", "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]", [content, media])
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Hero desde cero", props: { maxWidth: "xl", paddingY: "xl", paddingX: "lg", background: "#f8fbff" }, children: [grid] }))
  return { role: "hero", rootId: root, nodes, purpose: "Presentar promesa, confianza visual y accion principal." }
}

function composeCardGridSection(role: SectionRole, titleText: string, introText: string, items: Array<[string, string]>): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const heading = headingNode(nodes, "Titulo " + role, titleText, 2, { align: "center" })
  const intro = textNode(nodes, "Intro " + role, introText, { align: "center", size: "lg" })
  const cards = items.map(([title, body]) => {
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body)
    return wrapperNode(nodes, title, "rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10", [cardTitle, cardText], "article")
  })
  const grid = wrapperNode(nodes, "Grid " + role, "grid gap-5 md:grid-cols-3", cards)
  const root = add(nodes, createComposedNode({ type: "section", displayName: titleText, props: { maxWidth: "xl", paddingY: "xl", paddingX: "lg", background: "#ffffff" }, children: [heading, intro, grid] }))
  return { role, rootId: root, nodes, purpose: introText }
}

function composeServices(): ComposedSection { return composeCardGridSection("services", "Servicios pensados para vender mejor", "Organiza tu oferta para que el visitante entienda rapido que haces y por que debe contactarte.", [["Servicio principal", "Explica el resultado mas valioso que obtiene tu cliente."], ["Acompanamiento experto", "Muestra como guias al cliente antes, durante y despues del servicio."], ["Entrega clara", "Convierte tu proceso en una razon para confiar y avanzar."]]) }
function composeFeatures(): ComposedSection { return composeCardGridSection("features", "Beneficios que se entienden al instante", "Transforma caracteristicas en razones claras para elegir tu negocio.", [["Mas confianza", "Presenta pruebas, garantias o detalles que reduzcan dudas."], ["Menos friccion", "Haz facil pedir informacion, reservar, comprar o cotizar."], ["Mejor experiencia", "Cuida cada punto de contacto para que el sitio se sienta profesional."]]) }
function composeProcess(): ComposedSection { return composeCardGridSection("process", "Un proceso simple para empezar", "Ayuda al cliente a saber que pasara despues de dar clic.", [["1. Cuentanos tu objetivo", "Recibe la informacion clave sin formularios largos."], ["2. Revisamos la mejor ruta", "Muestra una propuesta clara y adaptada al caso."], ["3. Activamos el siguiente paso", "Cierra con una accion concreta y facil de completar."]]) }
function composeProducts(): ComposedSection { return composeCardGridSection("products", "Productos destacados", "Muestra opciones faciles de comparar y listas para llevar al usuario a comprar.", [["Producto estrella", "Describe el beneficio principal, precio o diferencial."], ["Opcion recomendada", "Resalta el producto ideal para la mayoria de clientes."], ["Paquete premium", "Presenta la alternativa con mayor valor percibido."]]) }
function composePricing(): ComposedSection { return composeCardGridSection("pricing", "Elige la opcion ideal", "Presenta precios, paquetes u ofertas sin confundir al comprador.", [["Inicial", "Para comenzar con lo esencial y validar interes."], ["Recomendado", "La opcion con mejor balance entre alcance, soporte y crecimiento."], ["Premium", "Para clientes que quieren una experiencia mas completa."]]) }

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

function composeCTA(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const heading = headingNode(nodes, "Titulo CTA", "Convierte esta visita en una oportunidad real", 2, { align: "center", color: "#ffffff" })
  const copy = textNode(nodes, "Texto CTA", "Cierra con una accion clara, directa y facil de tomar.", { align: "center", color: "#dbeafe", size: "lg" })
  const cta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "CTA final", props: { label: "Comenzar ahora", href: "#contacto", variant: "primary", size: "lg" } }))
  const stack = wrapperNode(nodes, "Contenido CTA", "mx-auto flex max-w-3xl flex-col items-center gap-6 text-center", [heading, copy, cta])
  const root = add(nodes, createComposedNode({ type: "section", displayName: "CTA final", props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background: "#0A3E57" }, children: [stack] }))
  return { role: "cta", rootId: root, nodes, purpose: "Cerrar con llamada a la accion." }
}

function composeFooter(): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const brand = headingNode(nodes, "Marca footer", "Nombre del negocio", 3, { size: "xl", color: "#ffffff" })
  const copy = textNode(nodes, "Descripcion footer", "Sitio profesional listo para personalizar, publicar y convertir visitantes en clientes.", { color: "#cbd5e1" })
  const links = textNode(nodes, "Links footer", "Inicio · Servicios · Precios · Contacto", { color: "#e2e8f0" })
  const brandStack = wrapperNode(nodes, "Marca y descripcion", "space-y-3", [brand, copy])
  const stack = wrapperNode(nodes, "Contenido footer", "mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-center", [brandStack, links])
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Footer", props: { maxWidth: "full", paddingY: "lg", paddingX: "lg", background: "#071826" }, children: [stack] }))
  return { role: "footer", rootId: root, nodes, purpose: "Cerrar navegacion, marca y datos basicos." }
}

function composeContent(): ComposedSection { return composeCardGridSection("content", "Contenido principal", "Agrega informacion importante del negocio con una estructura clara y editable.", [["Detalle importante", "Explica aqui un punto clave que ayude a decidir."], ["Diferencial", "Cuenta que hace especial esta oferta frente a otras opciones."], ["Siguiente paso", "Guia al visitante hacia la accion mas importante."]]) }

export function composeSection(
  role: SectionRole,
): ComposedSection | null {
  switch (role) {
    case "navigation":
      return composeNavigation()

    case "hero":
      return composeHero()

    case "services":
      return composeServices()

    case "features":
      return composeFeatures()

    case "products":
      return composeProducts()

    case "pricing":
      return composePricing()

    case "process":
      return composeProcess()

    case "contact":
      return composeContact()

    case "cta":
      return composeCTA()

    case "footer":
      return composeFooter()

    case "content":
      return composeContent()

    case "faq":
      return composeFAQ()

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
