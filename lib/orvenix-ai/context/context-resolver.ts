import type {
  EditorTree,
} from "@/types/editor"

import type {
  OrvenixConversationContext,
  OrvenixConversationTarget,
} from "./types"

export interface ContextResolution {
  resolved: boolean

  target?: OrvenixConversationTarget

  source:
    | "none"
    | "last_target"
    | "last_successful_target"

  confidence:
    | "high"
    | "medium"
    | "low"

  reason?: string
}

const contextualPatterns = [
  /\bese\b/i,
  /\besa\b/i,
  /\beso\b/i,

  /\bese elemento\b/i,
  /\besa sección\b/i,

  /\bhazlo\b/i,
  /\bcámbialo\b/i,
  /\bcambialo\b/i,

  /\bponlo\b/i,
  /\bponla\b/i,

  /\bmuévelo\b/i,
  /\bmuevelo\b/i,
  /\bmuévela\b/i,
  /\bmuevela\b/i,

  /\belimínalo\b/i,
  /\beliminalo\b/i,
  /\belimínala\b/i,
  /\beliminala\b/i,

  /\bduplícalo\b/i,
  /\bduplicalo\b/i,
  /\bduplícala\b/i,
  /\bduplicala\b/i,

  /\bcéntralo\b/i,
  /\bcentralo\b/i,
  /\bcéntrala\b/i,
  /\bcentrala\b/i,
]

function referencesPreviousTarget(
  message: string,
) {
  return contextualPatterns.some(
    (pattern) =>
      pattern.test(message),
  )
}

function targetStillExists(
  tree: EditorTree,
  target: OrvenixConversationTarget,
) {
  if (
    target.kind === "node" &&
    target.nodeId
  ) {
    return Boolean(
      tree.nodes[
        target.nodeId
      ],
    )
  }

  if (
    target.kind === "section" &&
    target.sectionId
  ) {
    return Boolean(
      tree.nodes[
        target.sectionId
      ],
    )
  }

  return false
}

export function resolveContextualTarget(
  params: {
    message: string
    tree: EditorTree
    context: OrvenixConversationContext
  },
): ContextResolution {
  if (
    !referencesPreviousTarget(
      params.message,
    )
  ) {
    return {
      resolved: false,
      source: "none",
      confidence: "low",
    }
  }

  const candidates = [
    {
      target:
        params.context.lastSuccessfulTarget,

      source:
        "last_successful_target" as const,
    },

    {
      target:
        params.context.lastTarget,

      source:
        "last_target" as const,
    },
  ]

  for (
    const candidate
    of candidates
  ) {
    if (!candidate.target) {
      continue
    }

    if (
      !targetStillExists(
        params.tree,
        candidate.target,
      )
    ) {
      continue
    }

    return {
      resolved: true,

      target:
        structuredClone(
          candidate.target,
        ),

      source:
        candidate.source,

      confidence: "high",

      reason:
        "La solicitud contiene una referencia contextual y el target anterior sigue existiendo.",
    }
  }

  return {
    resolved: false,
    source: "none",
    confidence: "low",

    reason:
      "La solicitud parece referirse a un elemento anterior, pero ese target ya no existe o no está disponible.",
  }
}
