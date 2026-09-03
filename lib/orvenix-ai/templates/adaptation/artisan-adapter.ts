import type {
  EditorNode,
  EditorTree,
} from "@/types/editor"

import {
  removeTreeSection,
} from "./tree-utils"

import {
  getBusinessLanguage,
} from "@/lib/orvenix-ai/content"

import type {
  TemplateAdaptationInput,
  TemplateAdaptationResult,
} from "./types"

import {
  detectTemplateNodeRole,
} from "./node-role"

import {
  inspectTemplateNode,
} from "./sanitizer"

function cloneTree(
  tree: EditorTree,
): EditorTree {
  return structuredClone(tree)
}

function businessName(
  input: TemplateAdaptationInput,
) {
  return (
    input.business.name?.trim() ||
    "Tu negocio"
  )
}

function setHeading(
  node: EditorNode,
  value: string,
) {
  if (node.type !== "heading") return false

  node.props = {
    ...node.props,
    text: value,
  }

  return true
}

function setText(
  node: EditorNode,
  value: string,
) {
  if (node.type !== "text") return false

  node.props = {
    ...node.props,
    content: value,
  }

  return true
}

function setButton(
  node: EditorNode,
  label: string,
  href = "#contacto",
) {
  if (node.type !== "ctaButton") {
    return false
  }

  node.props = {
    ...node.props,
    label,
    href,
  }

  return true
}

function descendants(
  tree: EditorTree,
  rootId: string,
): EditorNode[] {
  const result: EditorNode[] = []

  function walk(id: string) {
    const node = tree.nodes[id]

    if (!node) return

    result.push(node)

    for (
      const childId
      of node.children ?? []
    ) {
      walk(childId)
    }
  }

  walk(rootId)

  return result
}

export function adaptArtisanTemplate(
  input: TemplateAdaptationInput,
): TemplateAdaptationResult {

  const originalTemplateNodes =
  Object.keys(input.tree.nodes).length

  const tree = cloneTree(input.tree)

  const language =
    getBusinessLanguage(input.business)

  const name = businessName(input)

  const location =
    input.business.location?.trim()

  const locationPhrase =
    location ? ` en ${location}` : ""

  let adaptedNodes = 0
  let sanitizedNodes = 0

  const removedSections: string[] = []
const pendingSections: string[] = []

  const warnings: string[] = []

  const finalWarnings: string[] = []

for (
  const node
  of Object.values(tree.nodes)
) {
  const inspection =
    inspectTemplateNode(node)

  if (
    inspection.unsafeFact ||
    inspection.templateLanguage
  ) {
    finalWarnings.push(
      ...inspection.reasons.map(
        (reason) =>
          `${node.id}: ${reason}`,
      ),
    )
  }
}

  /*
   * Primero inspeccionamos TODO el árbol.
   */
  for (
    const node
    of Object.values(tree.nodes)
  ) {
    const inspection =
      inspectTemplateNode(node)

    if (
      inspection.unsafeFact ||
      inspection.templateLanguage
    ) {
      sanitizedNodes++

      warnings.push(
        ...inspection.reasons.map(
          (reason) =>
            `${node.id}: ${reason}`,
        ),
      )
    }
  }

  const root =
    tree.nodes[tree.rootId]

  if (!root) {
    throw new Error(
      "El template no tiene nodo raíz.",
    )
  }

  for (
  const sectionId
  of [...(root.children ?? [])]
) {
    const section =
      tree.nodes[sectionId]

    if (!section) continue

    const role =
      detectTemplateNodeRole(section)

    const nodes =
      descendants(tree, sectionId)

      /*
 * PRICING POLICY
 *
 * Nunca transferimos precios del template.
 */
if (role === "pricing") {
  const pricing = input.pricing ?? []

  if (pricing.length === 0) {
    removeTreeSection(
      tree,
      sectionId,
    )

    removedSections.push(
      "pricing",
    )

    sanitizedNodes +=
      nodes.length

    continue
  }

  const headings =
    nodes.filter(
      (node) =>
        node.type === "heading",
    )

  const texts =
    nodes.filter(
      (node) =>
        node.type === "text",
    )

  const buttons =
    nodes.filter(
      (node) =>
        node.type === "ctaButton",
    )

  if (headings[0]) {
    setHeading(
      headings[0],
      "Opciones disponibles",
    )

    adaptedNodes++
  }

  if (texts[0]) {
    setText(
      texts[0],
      "Consulta las opciones disponibles y elige la que mejor se adapte a tus necesidades.",
    )

    adaptedNodes++
  }

  /*
   * El template tiene normalmente:
   *
   * heading sección
   * heading nombre
   * heading precio
   * ...
   */
  for (
    let index = 0;
    index < pricing.length;
    index++
  ) {
    const item = pricing[index]

    const nameHeading =
      headings[1 + index * 2]

    const priceHeading =
      headings[2 + index * 2]

    const description =
      texts[index + 1]

    const button =
      buttons[index]

    if (nameHeading) {
      setHeading(
        nameHeading,
        item.name,
      )

      adaptedNodes++
    }

    if (priceHeading) {
      setHeading(
        priceHeading,
        item.price,
      )

      adaptedNodes++
    }

    if (
      description &&
      item.description
    ) {
      setText(
        description,
        item.description,
      )

      adaptedNodes++
    }

    if (button) {
      setButton(
        button,
        language.primaryAction,
      )

      adaptedNodes++
    }
  }

  continue
}

if (role === "proof") {
  const supplied =
    input.proof ?? []

  const safeDefaults = [
    {
      title: "Atención clara",
      description:
        "Información sencilla para que puedas entender tus opciones y próximos pasos.",
    },
    {
      title: "Trato cercano",
      description:
        "Una experiencia pensada para mantener una comunicación directa durante el proceso.",
    },
    {
      title: "Proceso sencillo",
      description:
        "Pasos claros desde el primer contacto hasta la atención.",
    },
  ]

  const items =
    supplied.length > 0
      ? supplied
      : safeDefaults

  const headings =
    nodes.filter(
      (node) =>
        node.type === "heading",
    )

  const texts =
    nodes.filter(
      (node) =>
        node.type === "text",
    )

  for (
    let index = 0;
    index < Math.min(
      items.length,
      headings.length,
      texts.length,
    );
    index++
  ) {
    setHeading(
      headings[index],
      items[index].title,
    )

    setText(
      texts[index],
      items[index].description,
    )

    adaptedNodes += 2
  }

  continue
}

if (role === "process") {
  const supplied =
    input.process ?? []

  const safeDefaults = [
    {
      title: "1. Contacto",
      description:
        "Cuéntanos qué necesitas y comparte la información necesaria para comenzar.",
    },
    {
      title: "2. Valoración",
      description:
        "Revisamos tu situación y definimos contigo los siguientes pasos.",
    },
    {
      title: "3. Atención",
      description:
        "Continuamos con el servicio acordado y mantenemos una comunicación clara.",
    },
  ]

  const items =
    supplied.length > 0
      ? supplied
      : safeDefaults

  const headings =
    nodes.filter(
      (node) =>
        node.type === "heading",
    )

  const texts =
    nodes.filter(
      (node) =>
        node.type === "text",
    )

  if (headings[0]) {
    setHeading(
      headings[0],
      "Así funciona",
    )

    adaptedNodes++
  }

  if (texts[0]) {
    setText(
      texts[0],
      "Un proceso sencillo para saber qué esperar en cada etapa.",
    )

    adaptedNodes++
  }

  for (
    let index = 0;
    index < items.length;
    index++
  ) {
    const heading =
      headings[index + 1]

    const text =
      texts[index + 1]

    if (heading) {
      setHeading(
        heading,
        items[index].title,
      )

      adaptedNodes++
    }

    if (text) {
      setText(
        text,
        items[index].description,
      )

      adaptedNodes++
    }
  }

  continue
}

/*
 * TESTIMONIAL POLICY
 *
 * Nunca publicamos testimonios demo.
 */
if (role === "testimonials") {
  const testimonials =
    input.testimonials ?? []

  if (testimonials.length === 0) {
    removeTreeSection(
      tree,
      sectionId,
    )

    removedSections.push(
      "testimonials",
    )

    sanitizedNodes +=
      nodes.length

    continue
  }

  const headings =
    nodes.filter(
      (node) =>
        node.type === "heading",
    )

  const texts =
    nodes.filter(
      (node) =>
        node.type === "text",
    )

  if (headings[0]) {
    setHeading(
      headings[0],
      "Experiencias de nuestros clientes",
    )

    adaptedNodes++
  }

  if (texts[0]) {
    setText(
      texts[0],
      "Opiniones compartidas por clientes reales.",
    )

    adaptedNodes++
  }

  for (
    let index = 0;
    index < testimonials.length;
    index++
  ) {
    const testimonial =
      testimonials[index]

    const quote =
      texts[index + 1]

    const author =
      headings[index + 1]

    if (quote) {
      setText(
        quote,
        testimonial.quote,
      )

      adaptedNodes++
    }

    if (author) {
      setHeading(
        author,
        testimonial.author,
      )

      adaptedNodes++
    }
  }

  continue
}

    /*
     * NAVIGATION
     */
    if (role === "navigation") {
      for (const node of nodes) {
        if (node.type !== "siteNav") {
          continue
        }

        node.props = {
          ...node.props,
          title: name,
          subtitle:
            input.business.industry ??
            "",
          ctaLabel:
            language.primaryAction,
          ctaHref: "#contacto",
        }

        adaptedNodes++
      }

      continue
    }

    /*
     * HERO
     */
    if (role === "hero") {
      const headings =
        nodes.filter(
          (node) =>
            node.type === "heading",
        )

      const texts =
        nodes.filter(
          (node) =>
            node.type === "text",
        )

      const buttons =
        nodes.filter(
          (node) =>
            node.type === "ctaButton",
        )

      if (headings[0]) {
        setHeading(
          headings[0],
          name,
        )

        adaptedNodes++
      }

      if (texts[0]) {
        setText(
          texts[0],
          `${language.categorySingular}${locationPhrase}`,
        )

        adaptedNodes++
      }

      if (texts[1]) {
        const description =
          input.business.description?.trim() ||
          `Conoce nuestros ${language.servicePlural}${locationPhrase} con una atención clara y cercana.`

        setText(
          texts[1],
          description,
        )

        adaptedNodes++
      }

      if (buttons[0]) {
        setButton(
          buttons[0],
          language.primaryAction,
        )

        adaptedNodes++
      }

      /*
       * Nota de plantilla debajo de imagen.
       */
      if (texts[2]) {
        setText(
          texts[2],
          "",
        )

        sanitizedNodes++
      }

      continue
    }

    /*
     * SERVICES
     */
    if (role === "services") {
      const headings =
        nodes.filter(
          (node) =>
            node.type === "heading",
        )

      const texts =
        nodes.filter(
          (node) =>
            node.type === "text",
        )

      const buttons =
        nodes.filter(
          (node) =>
            node.type === "ctaButton",
        )

      if (headings[0]) {
        setHeading(
          headings[0],
          `Conoce nuestros ${language.servicePlural}`,
        )

        adaptedNodes++
      }

      if (texts[0]) {
        setText(
          texts[0],
          "Explora las principales opciones disponibles y encuentra la que mejor se adapte a tus necesidades.",
        )

        adaptedNodes++
      }

      const services =
        input.services ?? []

      /*
       * headings[0] = título de sección.
       * headings[1...] = tarjetas.
       *
       * texts[0] = descripción de sección.
       * texts[1...] = tarjetas.
       */
      for (
        let index = 0;
        index < services.length;
        index++
      ) {
        const service =
          services[index]

        const heading =
          headings[index + 1]

        const text =
          texts[index + 1]

        const button =
          buttons[index]

        if (heading) {
          setHeading(
            heading,
            service.name,
          )

          adaptedNodes++
        }

        if (
          text &&
          service.description
        ) {
          setText(
            text,
            service.description,
          )

          adaptedNodes++
        }

        if (button) {
          setButton(
            button,
            language.primaryAction,
          )

          adaptedNodes++
        }
      }

      continue
    }

    /*
     * CONTACT
     */
    if (role === "contact") {
      const headings =
        nodes.filter(
          (node) =>
            node.type === "heading",
        )

      const texts =
        nodes.filter(
          (node) =>
            node.type === "text",
        )

      const buttons =
        nodes.filter(
          (node) =>
            node.type === "ctaButton",
        )

      if (headings[0]) {
        setHeading(
          headings[0],
          "Hablemos",
        )

        adaptedNodes++
      }

      if (texts[0]) {
        setText(
          texts[0],
          `Cuéntanos qué necesitas y te ayudaremos a dar el siguiente paso.`,
        )

        adaptedNodes++
      }

      if (texts[1]) {
  setText(
    texts[1],
    "",
  )

  sanitizedNodes++
}

      if (buttons[0]) {
        setButton(
          buttons[0],
          language.primaryAction,
        )

        adaptedNodes++
      }

      continue
    }

    /*
     * FOOTER
     */
    if (role === "footer") {
      const headings =
        nodes.filter(
          (node) =>
            node.type === "heading",
        )

      const texts =
        nodes.filter(
          (node) =>
            node.type === "text",
        )

      if (headings[0]) {
        setHeading(
          headings[0],
          name,
        )

        adaptedNodes++
      }

      if (texts[0]) {
        setText(
          texts[0],
          input.business.industry ??
            language.categorySingular,
        )

        adaptedNodes++
      }
    }
  }

  /*
 * VALIDACIÓN FINAL DEL ÁRBOL
 *
 * Inspeccionamos exclusivamente el árbol ya adaptado.
 * No arrastramos advertencias del template original.
 */
const postAdaptationWarnings: string[] = []

for (const node of Object.values(tree.nodes)) {
  const inspection =
    inspectTemplateNode(node)

  if (
    !inspection.unsafeFact &&
    !inspection.templateLanguage
  ) {
    continue
  }

  for (const reason of inspection.reasons) {
    postAdaptationWarnings.push(
      `${node.id}: ${reason}`,
    )
  }
}

const finalNodes =
  Object.keys(tree.nodes).length

return {
  tree,

  report: {
    originalTemplateNodes,
    finalNodes,
    adaptedNodes,
    sanitizedNodes,

    preservedNodes:
      Math.max(
        0,
        finalNodes -
          adaptedNodes,
      ),

    removedSections,
    pendingSections,
    warnings: postAdaptationWarnings,
  },
}
}
