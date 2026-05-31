import { readFileSync } from "node:fs"

let cachedKnowledge: string | null = null

export function getChatKnowledgeContext(): string {
  if (cachedKnowledge !== null) return cachedKnowledge

  // SOLO este archivo curado y seguro para el chatbot.
  // NUNCA incluir data/, sistema/, .env, código fuente o datos de usuarios.
  try {
    cachedKnowledge = readFileSync("docs/chatbot-knowledge.md", "utf8").slice(0, 25_000)
  } catch {
    cachedKnowledge = ""
  }
  return cachedKnowledge
}
