import { randomUUID } from "crypto"
import {
  getBlockCapability,
} from "@/lib/orvenix-ai/capabilities"
import type { ComposedNode } from "./types"
import type { NodeProps } from "@/types/editor"

function id(prefix: string) {
  return `ai-${prefix}-${randomUUID()}`
}

export function createComposedNode(params: {
  type: string
  displayName: string
  props?: NodeProps
  children?: string[]
  prefix?: string
}): ComposedNode {
  const capability = getBlockCapability(params.type)

  if (!capability) {
    throw new Error(
      `Orvenix AI intentó usar un bloque inexistente: ${params.type}`
    )
  }

  return {
    tempId: id(params.prefix ?? params.type),
    type: params.type,
    displayName: params.displayName,
    props: {
      ...capability.defaults,
      ...(params.props ?? {}),
    },
    children: [...(params.children ?? [])],
  }
}
