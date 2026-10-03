/**
 * SEC-1 (SEC0-05): the only request shape /api/chat forwards to the provider.
 * Text-only `user`/`assistant` turns, bounded per message and in total; any
 * other block type (images, documents, tool use), role or field is dropped.
 */

export type ChatTurnV1 = { role: "user" | "assistant"; content: string }

export const CHAT_MAX_BODY_BYTES_V1 = 32 * 1024
export const CHAT_MAX_TURNS_V1 = 10
export const CHAT_MAX_TURN_CHARS_V1 = 2_000
export const CHAT_MAX_TOTAL_CHARS_V1 = 8_000

export function normalizeChatMessagesV1(raw: unknown): ChatTurnV1[] {
  if (!Array.isArray(raw)) return []
  const turns: ChatTurnV1[] = []
  for (const entry of raw.slice(-CHAT_MAX_TURNS_V1)) {
    if (!entry || typeof entry !== "object") continue
    const { role, content } = entry as { role?: unknown; content?: unknown }
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue
    const text = content.trim().slice(0, CHAT_MAX_TURN_CHARS_V1)
    if (text) turns.push({ role, content: text })
  }

  // Keep the most recent turns within the total budget.
  let total = 0
  let start = turns.length
  while (start > 0 && total + turns[start - 1].content.length <= CHAT_MAX_TOTAL_CHARS_V1) {
    total += turns[start - 1].content.length
    start -= 1
  }
  const bounded = turns.slice(start)

  // The provider conversation must start with a user turn and end with one.
  while (bounded.length > 0 && bounded[0].role !== "user") bounded.shift()
  if (bounded.length === 0 || bounded[bounded.length - 1].role !== "user") return []
  return bounded
}
