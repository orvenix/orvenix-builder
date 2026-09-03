import { randomUUID } from "crypto"

import type {
  EditorNode,
  NodeProps,
} from "@/types/editor"

import {
  composeSection,
} from "@/lib/orvenix-ai/composer"

import {
  getBlockCapability,
} from "@/lib/orvenix-ai/capabilities"

import type {
  OrvenixSiteArchitecture,
  OrvenixSitePagePlan,
  OrvenixSiteSectionPlan,
} from "@/lib/orvenix-ai/architect"

import type {
  CompiledPageBlueprint,
  CompiledSiteBlueprint,
} from "./types"

function nodeId(prefix: string) {
  return `ai-${prefix}-${randomUUID()}`
}

function createNode(params: {
  type: string
  displayName: string
  props?: NodeProps
  children?: string[]
  parentId?: string
}): EditorNode {
  const capability = getBlockCapability(params.type)

  if (!capability) {
    throw new Error(
      `Blueprint Compiler: bloque desconocido "${params.type}"`,
    )
  }

  return {
    id: nodeId(params.type),
    type: params.type,
    displayName: params.displayName,
    props: {
      ...capability.defaults,
      ...(params.props ?? {}),
    },
    children: [...(params.children ?? [])],
    version: capability.version ?? 1,
    ...(params.parentId
      ? { parentId: params.parentId }
      : {}),
  }
}

function copyComposedSection(
  source: ReturnType<typeof composeSection>,
  targetNodes: Record<string, EditorNode>,
): string | null {
  if (!source) return null

  const idMap = new Map<string, string>()

  /*
   * Primero asignamos IDs definitivos.
   */
  for (const tempId of Object.keys(source.nodes)) {
    idMap.set(tempId, nodeId("node"))
  }

  /*
   * Después recreamos las relaciones.
   */
  for (const composed of Object.values(source.nodes)) {
    const finalId = idMap.get(composed.tempId)

    if (!finalId) {
      throw new Error(
        `No se pudo resolver el nodo temporal ${composed.tempId}`,
      )
    }

    targetNodes[finalId] = {
      id: finalId,
      type: composed.type,
      displayName: composed.displayName,
      props: {
        ...composed.props,
      },
      children: composed.children.map((child) => {
        const mapped = idMap.get(child)

        if (!mapped) {
          throw new Error(
            `No se pudo resolver el hijo temporal ${child}`,
          )
        }

        return mapped
      }),
      version:
        getBlockCapability(composed.type)?.version ?? 1,
    }
  }

  /*
   * Parent IDs.
   */
  for (const node of Object.values(targetNodes)) {
    for (const childId of node.children) {
      const child = targetNodes[childId]

      if (child) {
        child.parentId = node.id
      }
    }
  }

  return idMap.get(source.rootId) ?? null
}

interface CompileBlueprintOptions {
  preferPrimitiveComposition?: boolean
}

function createBlockSection(
  section: OrvenixSiteSectionPlan,
  nodes: Record<string, EditorNode>,
  options: CompileBlueprintOptions = {},
): string | null {
  if (options.preferPrimitiveComposition) {
    const composed = copyComposedSection(
      composeSection(section.role),
      nodes,
    )

    if (composed) return composed
  }

  /*
   * Si el arquitecto no encontró un bloque,
   * delegamos al Composition Engine.
   */
  if (!section.blockType) {
    return copyComposedSection(
      composeSection(section.role),
      nodes,
    )
  }

  const node = createNode({
    type: section.blockType,
    displayName:
      section.role.charAt(0).toUpperCase() +
      section.role.slice(1),
  })

  nodes[node.id] = node

  return node.id
}

function compilePage(
  page: OrvenixSitePagePlan,
  options: CompileBlueprintOptions = {},
): CompiledPageBlueprint {
  const nodes: Record<string, EditorNode> = {}

  const root = createNode({
    type: "section",
    displayName: `${page.name} — Orvenix AI`,
    props: {
      maxWidth: "full",
      paddingY: "none",
      paddingX: "none",
    },
  })

  nodes[root.id] = root

  const children: string[] = []

  for (const section of page.sections) {
    const childId = createBlockSection(
      section,
      nodes,
      options,
    )

    if (!childId) continue

    children.push(childId)

    if (nodes[childId]) {
      nodes[childId].parentId = root.id
    }
  }

  root.children = children

  return {
    name: page.name,
    slug: page.slug,
    tree: {
      rootId: root.id,
      nodes,
      seo: {
        title: page.name,
        description: page.purpose,
      },
    },
  }
}

export function compileSiteBlueprint(
  architecture: OrvenixSiteArchitecture,
  options: CompileBlueprintOptions = {},
): CompiledSiteBlueprint {
  const warnings: string[] = []

  const pages = architecture.pages.map((page) =>
    compilePage(page, options),
  )

  for (const page of pages) {
    const nodeCount = Object.keys(
      page.tree.nodes,
    ).length

    if (nodeCount < 2) {
      warnings.push(
        `La página "${page.name}" contiene muy pocos nodos.`,
      )
    }
  }

  return {
    architecture,
    pages,
    warnings,
  }
}
