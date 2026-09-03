import type {
  EditorNode,
  EditorTree,
} from "@/types/editor"

function normalize(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
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

    for (const childId of node.children ?? []) {
      walk(childId)
    }
  }

  walk(rootId)

  return result
}

function findSectionByKeyword(
  tree: EditorTree,
  keyword: string,
): EditorNode | null {
  const normalizedKeyword =
    normalize(keyword)

  for (const node of Object.values(tree.nodes)) {
    const searchable =
      normalize(
        `${node.id} ${node.displayName ?? ""} ${node.type}`,
      )

    if (
      searchable.includes(
        normalizedKeyword,
      )
    ) {
      return node
    }
  }

  return null
}

export function resolveLocalTarget(params: {
  tree: EditorTree
  request: string
  targetNodeId?: string
}): EditorNode | null {
  const {
    tree,
    request,
    targetNodeId,
  } = params

  /*
   * Selección explícita del editor.
   */
  if (
    targetNodeId &&
    tree.nodes[targetNodeId]
  ) {
    return tree.nodes[targetNodeId]
  }

  const text =
    normalize(request)

  /*
   * HERO
   */
  if (
    text.includes("hero") ||
    text.includes("portada")
  ) {
    const hero =
      findSectionByKeyword(
        tree,
        "portada",
      ) ??
      findSectionByKeyword(
        tree,
        "hero",
      )

    if (!hero) {
      return null
    }

    const nodes =
      descendants(
        tree,
        hero.id,
      )

    /*
     * Si pide título del hero,
     * buscamos primero heading/H1.
     */
    if (
      text.includes("titulo") ||
      text.includes("encabezado")
    ) {
      return (
        nodes.find(
          (node) =>
            node.type === "heading" &&
            Number(node.props.level) === 1,
        ) ??
        nodes.find(
          (node) =>
            node.type === "heading",
        ) ??
        null
      )
    }

    /*
     * Si pide botón.
     */
    if (
      text.includes("boton") ||
      text.includes("cta")
    ) {
      return (
        nodes.find(
          (node) =>
            node.type === "ctaButton",
        ) ??
        null
      )
    }

    /*
     * Si pide imagen.
     */
    if (
      text.includes("imagen") ||
      text.includes("foto")
    ) {
      return (
        nodes.find(
          (node) =>
            node.type === "image",
        ) ??
        null
      )
    }

    /*
     * Hero completo.
     */
    return hero
  }

  /*
   * Nodo por texto general.
   */
  if (text.includes("titulo")) {
    return (
      Object.values(tree.nodes)
        .find(
          (node) =>
            node.type === "heading",
        ) ??
      null
    )
  }

  if (
    text.includes("boton") ||
    text.includes("cta")
  ) {
    return (
      Object.values(tree.nodes)
        .find(
          (node) =>
            node.type === "ctaButton",
        ) ??
      null
    )
  }

  if (
    text.includes("imagen") ||
    text.includes("foto")
  ) {
    return (
      Object.values(tree.nodes)
        .find(
          (node) =>
            node.type === "image",
        ) ??
      null
    )
  }

  return null
}
