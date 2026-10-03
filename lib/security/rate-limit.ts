import { NextResponse } from "next/server"

/**
 * SEC-1 (SEC0-10): minimal application-level rate limiting.
 *
 * LIMITATION (read before relying on it): the default store is IN-PROCESS
 * memory. It is per Node process, resets on restart/deploy and is NOT shared
 * across instances. It bounds abuse of a single-instance deployment; it is
 * not a durable or distributed quota. The `RateLimitStoreV1` interface is the
 * seam for a shared backend (e.g. Redis) later -- swap it with
 * `setRateLimitStoreV1` without touching call sites.
 */

export type RateLimitPolicyV1 = { name: string; limit: number; windowMs: number }

export const RATE_LIMIT_POLICIES_V1 = {
  aiChat: { name: "ai-chat", limit: 20, windowMs: 60_000 },
  sketchToWeb: { name: "sketch-to-web", limit: 10, windowMs: 10 * 60_000 },
  contact: { name: "contact", limit: 5, windowMs: 10 * 60_000 },
  upload: { name: "upload", limit: 30, windowMs: 10 * 60_000 },
  register: { name: "register", limit: 5, windowMs: 60 * 60_000 },
  login: { name: "login", limit: 10, windowMs: 15 * 60_000 },
  forgotPassword: { name: "forgot-password", limit: 5, windowMs: 15 * 60_000 },
  forgotPasswordEmail: { name: "forgot-password-email", limit: 3, windowMs: 15 * 60_000 },
} as const satisfies Record<string, RateLimitPolicyV1>

export interface RateLimitStoreV1 {
  /** Records one hit for `key` and returns the count inside the current window. */
  hit(key: string, windowMs: number, now: number): Promise<{ count: number; resetAt: number }>
}

const MAX_TRACKED_KEYS = 10_000

export class InMemoryRateLimitStoreV1 implements RateLimitStoreV1 {
  private readonly windows = new Map<string, { count: number; resetAt: number }>()

  async hit(key: string, windowMs: number, now: number) {
    const current = this.windows.get(key)
    if (current && current.resetAt > now) {
      current.count += 1
      return { ...current }
    }
    if (this.windows.size >= MAX_TRACKED_KEYS) this.prune(now)
    const fresh = { count: 1, resetAt: now + windowMs }
    this.windows.set(key, fresh)
    return { ...fresh }
  }

  private prune(now: number) {
    for (const [key, window] of this.windows) if (window.resetAt <= now) this.windows.delete(key)
    // Still full of live windows: drop the oldest insertions (bounded memory beats perfect accounting).
    while (this.windows.size >= MAX_TRACKED_KEYS) {
      const oldest = this.windows.keys().next().value
      if (oldest === undefined) break
      this.windows.delete(oldest)
    }
  }
}

let store: RateLimitStoreV1 = new InMemoryRateLimitStoreV1()
let clock: () => number = () => Date.now()

export function setRateLimitStoreV1(next: RateLimitStoreV1, nextClock: () => number = () => Date.now()) {
  store = next
  clock = nextClock
}

export type RateLimitDecisionV1 = { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number }

export async function checkRateLimitV1(policy: RateLimitPolicyV1, identity: string): Promise<RateLimitDecisionV1> {
  const now = clock()
  try {
    const { count, resetAt } = await store.hit(`${policy.name}:${identity}`, policy.windowMs, now)
    if (count > policy.limit) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)) }
    return { ok: true, remaining: policy.limit - count }
  } catch {
    // A broken limiter backend must not take the product down; abuse bounds degrade instead.
    return { ok: true, remaining: 0 }
  }
}

/**
 * Identity for limiting: the authenticated user when known, else the client
 * IP. nginx overwrites `X-Real-IP` with `$remote_addr`; the LAST
 * `X-Forwarded-For` entry is the one nginx appended (earlier entries are
 * client-controlled).
 */
export function rateLimitIdentityV1(request: { headers: { get(name: string): string | null } }, userId?: string | null): string {
  if (userId) return `user:${userId}`
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return `ip:${realIp}`
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean)
  if (forwarded && forwarded.length > 0) return `ip:${forwarded[forwarded.length - 1]}`
  return "ip:unknown"
}

export function rateLimitedResponseV1(decision: { retryAfterSeconds: number }) {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds), "Cache-Control": "no-store" } },
  )
}
