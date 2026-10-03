/**
 * SEC-1 (SEC0-09): the ONE resolver for the session-signing secret.
 *
 * Fail closed: outside an explicit development/test runtime, a missing
 * NEXTAUTH_SECRET / AUTH_SECRET is an error -- the app never silently signs
 * sessions with a publicly known value. Development and tests get a fixed,
 * clearly-labelled local secret so local ergonomics are unchanged.
 *
 * Resolved lazily (at request time), so `next build` never needs the value.
 * Never log or return the secret itself.
 */

const DEVELOPMENT_ONLY_SECRET = "orvenix-local-development-only-secret"

export class AuthSecretMissingError extends Error {
  readonly code = "AUTH_SECRET_MISSING"

  constructor() {
    super("AUTH_SECRET_MISSING: configure NEXTAUTH_SECRET (or AUTH_SECRET) before serving authenticated traffic.")
    this.name = "AuthSecretMissingError"
  }
}

type AuthSecretEnv = { NODE_ENV?: string; NEXTAUTH_SECRET?: string; AUTH_SECRET?: string }

export function resolveAuthSecretV1(env: AuthSecretEnv = process.env as AuthSecretEnv): string {
  const configured = [env.NEXTAUTH_SECRET, env.AUTH_SECRET].find((value) => typeof value === "string" && value.trim().length > 0)
  if (configured) return configured
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") return DEVELOPMENT_ONLY_SECRET
  throw new AuthSecretMissingError()
}
