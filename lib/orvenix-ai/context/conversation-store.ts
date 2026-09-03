import type {
  OrvenixConversationContext,
  OrvenixConversationTarget,
  OrvenixConversationTurn,
} from "./types"

const contexts =
  new Map<
    string,
    OrvenixConversationContext
  >()

const MAX_TURNS = 30

function key(
  siteId: string,
  pageSlug: string,
) {
  return `${siteId}:${pageSlug}`
}

export function getConversationContext(
  siteId: string,
  pageSlug = "home",
): OrvenixConversationContext {
  const context =
    contexts.get(
      key(siteId, pageSlug),
    )

  if (context) {
    return structuredClone(context)
  }

  return {
    siteId,
    pageSlug,
    turns: [],
  }
}

export function rememberConversationTurn(
  params: {
    siteId: string
    pageSlug?: string

    turn: OrvenixConversationTurn

    successfulTarget?:
      OrvenixConversationTarget
  },
) {
  const pageSlug =
    params.pageSlug ?? "home"

  const context =
    getConversationContext(
      params.siteId,
      pageSlug,
    )

  context.turns.push(
    structuredClone(params.turn),
  )

  if (
    context.turns.length >
    MAX_TURNS
  ) {
    context.turns =
      context.turns.slice(
        -MAX_TURNS,
      )
  }

  if (params.turn.target) {
    context.lastTarget =
      structuredClone(
        params.turn.target,
      )
  }

  if (
    params.successfulTarget
  ) {
    context.lastSuccessfulTarget =
      structuredClone(
        params.successfulTarget,
      )
  }

  contexts.set(
    key(
      params.siteId,
      pageSlug,
    ),
    context,
  )
}

export function clearConversationContext(
  siteId: string,
  pageSlug = "home",
) {
  contexts.delete(
    key(siteId, pageSlug),
  )
}
