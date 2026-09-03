import {
  randomUUID,
} from "crypto"

import type {
  EditorNode,
  EditorTree,
} from "@/types/editor"

function normalize(
  value?: string,
) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export interface SectionDiscoveryResult {
  node: EditorNode | null
  score: number
  confidence: "high" | "medium" | "low" | "none"
  evidence: string[]
}

export function canPreviewDestructiveSectionOperation(
  discovery: SectionDiscoveryResult,
) {
  return (
    discovery.confidence === "high" ||
    discovery.confidence === "medium"
  )
}

export function canExecuteDestructiveSectionOperation(
  discovery: SectionDiscoveryResult,
) {
  return (
    discovery.confidence === "high"
  )
}

export function collectSectionSubtreeIds(
  tree: EditorTree,
  rootId: string,
): string[] {
  const result: string[] = []
  const visited =
    new Set<string>()

  function visit(
    nodeId: string,
  ) {
    if (
      visited.has(nodeId)
    ) {
      return
    }

    const node =
      tree.nodes[nodeId]

    if (!node) {
      return
    }

    visited.add(nodeId)
    result.push(nodeId)

    for (
      const childId
      of node.children ?? []
    ) {
      visit(childId)
    }
  }

  visit(rootId)

  return result
}

function sectionAliases(
  keyword: string,
): string[] {
  const value = normalize(keyword)

  const aliases: Record<string, string[]> = {
    navigation: [
      "navigation",
      "navegacion",
      "menu",
      "nav",
      "navbar",
      "header",
      "site nav",
    ],

    hero: [
      "hero",
      "portada",
      "inicio",
      "principal",
      "encabezado",
      "propuesta de valor",
    ],

    servicios: [
      "servicios",
      "servicio",
      "services",
      "service",
      "soluciones",
      "capacidades",
      "capabilities",
      "use cases",
"use case",
"casos de uso",
"caso de uso",
    ],

    testimonios: [
  "testimonios",
  "testimonio",
  "testimonials",
  "testimonial",
  "opiniones",
  "reseñas",
  "reviews",

  /*
   * Composer seguro de Orvenix.
   */
  "experiencias de clientes",
],

    pricing: [
      "pricing",
      "precios",
      "planes",
      "paquetes",
      "tarifas",
      "membresia",
    ],

    features: [
      "features",
      "caracteristicas",
      "beneficios",
      "ventajas",
      "diferenciadores",
    ],

    products: [
      "products",
      "productos",
      "catalogo",
      "tienda",
      "coleccion",
    ],

    cta: [
      "cta",
      "llamada a la accion",
      "conversion",
      "cierre",
    ],

    footer: [
      "footer",
      "pie",
      "pie de pagina",
    ],

    galeria: [
      "galeria",
      "gallery",
      "portfolio",
      "proyectos",
      "trabajos",
      "imagenes",
    ],

    faq: [
      "faq",
      "preguntas frecuentes",
      "preguntas",
      "frequent questions",
    ],

    contacto: [
      "contacto",
      "contact",
      "contactanos",
      "hablemos",
      "escribenos",
    ],

    proceso: [
      "proceso",
      "process",
      "como funciona",
      "pasos",
      "steps",
      "metodologia",
    ],
  }

  return aliases[value] ?? [value]
}

function searchableNodeText(
  node: EditorNode,
): string {
  const primitiveProps: string[] = []

  for (
    const [key, value]
    of Object.entries(node.props ?? {})
  ) {
    if (
      typeof value === "string" &&
      [
        "text",
        "content",
        "title",
        "heading",
        "label",
        "description",
        "eyebrow",
        "subtitle",
      ].includes(key)
    ) {
      primitiveProps.push(value)
    }
  }

  return normalize(
    [
      node.id,
      node.type,
      node.displayName ?? "",
      ...primitiveProps,
    ].join(" "),
  )
}

export function discoverRootSection(
  tree: EditorTree,
  keyword: string,
): SectionDiscoveryResult {
  const root = tree.nodes[tree.rootId]

  if (!root) {
    return {
      node: null,
      score: 0,
      confidence: "none",
      evidence: [],
    }
  }

  const aliases = sectionAliases(keyword)

  let best: SectionDiscoveryResult = {
    node: null,
    score: 0,
    confidence: "none",
    evidence: [],
  }

  for (const sectionId of root.children ?? []) {
    const section = tree.nodes[sectionId]

    if (!section) continue

    const subtreeIds =
      collectSectionSubtreeIds(
        tree,
        sectionId,
      )

    let score = 0
    const evidence: string[] = []

    /*
     * 1. ID / displayName del root:
     * evidencia muy fuerte.
     */
    const rootText =
      normalize(
        `${section.id} ${section.displayName ?? ""}`,
      )

    for (const alias of aliases) {
      const needle = normalize(alias)

      if (
        needle &&
        rootText.includes(needle)
      ) {
        score += 50

        evidence.push(
          `root coincide con "${alias}"`,
        )
      }
    }

    /*
     * 2. Analizar subtree.
     */
    for (const nodeId of subtreeIds) {
      const node = tree.nodes[nodeId]

      if (!node) continue

      const haystack =
        searchableNodeText(node)

      for (const alias of aliases) {
        const needle =
          normalize(alias)

        if (
          !needle ||
          !haystack.includes(needle)
        ) {
          continue
        }

        /*
         * Heading = evidencia fuerte.
         */
        if (node.type === "heading") {
          score += 15

          evidence.push(
            `heading "${node.id}" coincide con "${alias}"`,
          )

          continue
        }

        /*
         * Navegación/CTA puede ayudar,
         * pero no debe decidir por sí sola.
         */
        if (
          node.type === "ctaButton" ||
          node.type === "siteNav"
        ) {
          score += 3

          evidence.push(
            `${node.type} "${node.id}" menciona "${alias}"`,
          )

          continue
        }

        /*
         * Texto común:
         * peso mínimo.
         */
        score += 1
      }
    }

    const confidence:
      SectionDiscoveryResult["confidence"] =
      score >= 50
        ? "high"
        : score >= 25
          ? "medium"
          : score >= 10
            ? "low"
            : "none"

    if (score > best.score) {
      best = {
        node: section,
        score,
        confidence,
        evidence,
      }
    }
  }

  return best
}

export function findRootSection(
  tree: EditorTree,
  keyword: string,
): EditorNode | null {
  return (
    discoverRootSection(
      tree,
      keyword,
    ).node
  )
}

export function removeRootSection(
  tree: EditorTree,
  sectionId: string,
): {
  removedIds: string[]
  changedIds: string[]
  index: number
} {
  if (
    sectionId === tree.rootId
  ) {
    throw new Error(
      "No se puede eliminar el root del árbol.",
    )
  }

  const root =
    tree.nodes[tree.rootId]

  if (!root) {
    throw new Error(
      "El árbol no contiene un root válido.",
    )
  }

  const index =
    (root.children ?? [])
      .indexOf(sectionId)

  if (index < 0) {
    throw new Error(
      "El nodo solicitado no es una sección raíz de la página.",
    )
  }

  const removedIds =
    collectSectionSubtreeIds(
      tree,
      sectionId,
    )

  /*
   * Primero desconectamos la sección.
   */
  root.children.splice(
    index,
    1,
  )

  /*
   * Después eliminamos todo su subárbol.
   */
  for (
    const nodeId
    of removedIds
  ) {
    delete tree.nodes[nodeId]
  }

  return {
    removedIds,
    changedIds: [
      root.id,
    ],
    index,
  }
}


export interface MoveRootSectionResult {
  changedIds: string[]
  previousIndex: number
  nextIndex: number
}

export function moveRootSection(params: {
  tree: EditorTree
  sectionId: string
  beforeSectionId?: string
  afterSectionId?: string
}): MoveRootSectionResult {
  const {
    tree,
    sectionId,
    beforeSectionId,
    afterSectionId,
  } = params

  if (sectionId === tree.rootId) {
    throw new Error(
      "No se puede mover el root del árbol.",
    )
  }

  const root =
    tree.nodes[tree.rootId]

  if (!root) {
    throw new Error(
      "El árbol no contiene un root válido.",
    )
  }

  const children =
    root.children ?? []

  const previousIndex =
    children.indexOf(sectionId)

  if (previousIndex < 0) {
    throw new Error(
      "La sección que se intenta mover no pertenece directamente al root.",
    )
  }

  if (
    beforeSectionId === sectionId ||
    afterSectionId === sectionId
  ) {
    throw new Error(
      "Una sección no puede moverse respecto de sí misma.",
    )
  }

  if (
    beforeSectionId &&
    afterSectionId
  ) {
    throw new Error(
      "MOVE solo puede usar before o after, no ambos.",
    )
  }

  /*
   * Primero quitamos el elemento.
   */
  children.splice(
    previousIndex,
    1,
  )

  let nextIndex =
    children.length

  if (beforeSectionId) {
    const targetIndex =
      children.indexOf(
        beforeSectionId,
      )

    if (targetIndex < 0) {
      /*
       * Restauración defensiva.
       */
      children.splice(
        previousIndex,
        0,
        sectionId,
      )

      throw new Error(
        "La sección destino BEFORE no pertenece al root.",
      )
    }

    nextIndex = targetIndex
  }

  if (afterSectionId) {
    const targetIndex =
      children.indexOf(
        afterSectionId,
      )

    if (targetIndex < 0) {
      children.splice(
        previousIndex,
        0,
        sectionId,
      )

      throw new Error(
        "La sección destino AFTER no pertenece al root.",
      )
    }

    nextIndex =
      targetIndex + 1
  }

  children.splice(
    nextIndex,
    0,
    sectionId,
  )

  return {
    changedIds: [root.id],
    previousIndex,
    nextIndex,
  }
}

export interface DuplicateRootSectionResult {
  rootSectionId: string
  addedIds: string[]
  changedIds: string[]
}

export function duplicateRootSection(params: {
  tree: EditorTree
  sectionId: string
  insertIndex?: number
}): DuplicateRootSectionResult {
  const {
    tree,
    sectionId,
    insertIndex,
  } = params

  if (sectionId === tree.rootId) {
    throw new Error(
      "No se puede duplicar el root del árbol.",
    )
  }

  const root =
    tree.nodes[tree.rootId]

  if (!root) {
    throw new Error(
      "El árbol no contiene un root válido.",
    )
  }

  const originalIndex =
    (root.children ?? [])
      .indexOf(sectionId)

  if (originalIndex < 0) {
    throw new Error(
      "La sección que se intenta duplicar no pertenece directamente al root.",
    )
  }

  const sourceIds =
    collectSectionSubtreeIds(
      tree,
      sectionId,
    )

  const idMap =
    new Map<string, string>()

  for (const sourceId of sourceIds) {
    idMap.set(
      sourceId,
      `ai-section-node-${randomUUID()}`,
    )
  }

  /*
   * Crear primero todos los nodos.
   */
  for (const sourceId of sourceIds) {
    const source =
      tree.nodes[sourceId]

    if (!source) {
      throw new Error(
        `No existe el nodo origen ${sourceId}.`,
      )
    }

    const newId =
      idMap.get(sourceId)

    if (!newId) {
      throw new Error(
        `No se pudo generar ID para ${sourceId}.`,
      )
    }

    const cloned =
      structuredClone(source)

    cloned.id = newId

    cloned.children =
      (source.children ?? []).map(
        (childId) => {
          const mapped =
            idMap.get(childId)

          if (!mapped) {
            throw new Error(
              `No se pudo mapear el hijo ${childId}.`,
            )
          }

          return mapped
        },
      )

    /*
     * parentId se corrige después.
     */
    delete cloned.parentId

    tree.nodes[newId] =
      cloned
  }

  /*
   * Reconstruir parentId internos.
   */
  for (const sourceId of sourceIds) {
    const source =
      tree.nodes[sourceId]

    const clonedId =
      idMap.get(sourceId)

    if (
      !source ||
      !clonedId
    ) {
      continue
    }

    const cloned =
      tree.nodes[clonedId]

    if (!cloned) continue

    if (sourceId === sectionId) {
      cloned.parentId =
        root.id
    } else if (source.parentId) {
      const mappedParent =
        idMap.get(
          source.parentId,
        )

      if (!mappedParent) {
        throw new Error(
          `No se pudo resolver parentId de ${sourceId}.`,
        )
      }

      cloned.parentId =
        mappedParent
    }
  }

  const duplicatedRootId =
    idMap.get(sectionId)

  if (!duplicatedRootId) {
    throw new Error(
      "No se pudo resolver el root duplicado.",
    )
  }

  const resolvedInsertIndex =
    Math.max(
      0,
      Math.min(
        insertIndex ??
          originalIndex + 1,
        root.children.length,
      ),
    )

  root.children.splice(
    resolvedInsertIndex,
    0,
    duplicatedRootId,
  )

  return {
    rootSectionId:
      duplicatedRootId,

    addedIds:
      [...idMap.values()],

    changedIds:
      [root.id],
  }
}

export function reorderRootSections(
  tree: EditorTree,
  orderedSectionIds: string[],
): {
  changedIds: string[]
} {
  const root =
    tree.nodes[tree.rootId]

  if (!root) {
    throw new Error(
      "El árbol no contiene un root válido.",
    )
  }

  const current =
    [...(root.children ?? [])]

  if (
    orderedSectionIds.length !==
    current.length
  ) {
    throw new Error(
      "REORDER debe conservar exactamente el mismo número de secciones.",
    )
  }

  const currentSet =
    new Set(current)

  const requestedSet =
    new Set(
      orderedSectionIds,
    )

  if (
    requestedSet.size !==
    orderedSectionIds.length
  ) {
    throw new Error(
      "REORDER contiene IDs duplicados.",
    )
  }

  for (const id of currentSet) {
    if (!requestedSet.has(id)) {
      throw new Error(
        `REORDER perdió la sección ${id}.`,
      )
    }
  }

  for (const id of requestedSet) {
    if (!currentSet.has(id)) {
      throw new Error(
        `REORDER introdujo una sección desconocida: ${id}.`,
      )
    }
  }

  root.children =
    [...orderedSectionIds]

  return {
    changedIds: [root.id],
  }
}
