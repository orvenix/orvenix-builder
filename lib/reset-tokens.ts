import { randomBytes } from "crypto"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const STORE_PATH = join(process.cwd(), "sistema", "reset-tokens.json")
const EXPIRES_MS = 30 * 60 * 1000 // 30 minutos

interface ResetToken {
  token: string
  email: string
  expiresAt: number // epoch ms
  used: boolean
}

function load(): ResetToken[] {
  try {
    if (!existsSync(STORE_PATH)) return []
    return JSON.parse(readFileSync(STORE_PATH, "utf-8")) as ResetToken[]
  } catch {
    return []
  }
}

function save(tokens: ResetToken[]) {
  writeFileSync(STORE_PATH, JSON.stringify(tokens, null, 2), "utf-8")
}

function purgeExpired(tokens: ResetToken[]): ResetToken[] {
  const now = Date.now()
  return tokens.filter(t => !t.used && t.expiresAt > now)
}

export function createResetToken(email: string): string {
  const token = randomBytes(32).toString("hex")
  const all = purgeExpired(load())
  // Eliminar tokens previos del mismo email
  const filtered = all.filter(t => t.email !== email.toLowerCase())
  filtered.push({ token, email: email.toLowerCase(), expiresAt: Date.now() + EXPIRES_MS, used: false })
  save(filtered)
  return token
}

export function validateResetToken(token: string): { valid: true; email: string } | { valid: false } {
  const all = load()
  const entry = all.find(t => t.token === token && !t.used && t.expiresAt > Date.now())
  if (!entry) return { valid: false }
  return { valid: true, email: entry.email }
}

export function consumeResetToken(token: string): boolean {
  const all = load()
  const idx = all.findIndex(t => t.token === token && !t.used && t.expiresAt > Date.now())
  if (idx === -1) return false
  all[idx].used = true
  save(all)
  return true
}
