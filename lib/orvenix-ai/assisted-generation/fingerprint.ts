import { createHash } from "node:crypto"

type StrictJson = null | boolean | string | number | StrictJson[] | { [key: string]: StrictJson }

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"])

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function toStrictJson(value: unknown, path = "$", ancestors = new WeakSet<object>()): StrictJson {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value as StrictJson
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error(`${path}: numero no canonico.`)
    return value
  }
  if (typeof value === "undefined") throw new Error(`${path}: undefined no es JSON valido.`)
  if (typeof value === "bigint") throw new Error(`${path}: BigInt no es JSON valido.`)
  if (typeof value === "function") throw new Error(`${path}: funcion no es JSON valido.`)
  if (typeof value === "symbol") throw new Error(`${path}: simbolo no es JSON valido.`)
  if (!value || typeof value !== "object") throw new Error(`${path}: valor no JSON invalido.`)
  if (ancestors.has(value)) throw new Error(`${path}: referencia circular.`)

  ancestors.add(value)

  if (Array.isArray(value)) {
    const output = value.map((entry, index) => toStrictJson(entry, `${path}[${index}]`, ancestors))
    ancestors.delete(value)
    return output
  }

  if (!isPlainRecord(value)) {
    ancestors.delete(value)
    throw new Error(`${path}: objeto no plano.`)
  }

  const output: Record<string, StrictJson> = {}
  for (const [key, entry] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
    if (UNSAFE_KEYS.has(key)) {
      ancestors.delete(value)
      throw new Error(`${path}.${key}: clave reservada.`)
    }
    if (typeof entry === "undefined") continue
    output[key] = toStrictJson(entry, `${path}.${key}`, ancestors)
  }

  ancestors.delete(value)
  return output
}

export function canonicalAssistedGenerationJsonV1(value: unknown): string {
  return JSON.stringify(toStrictJson(value))
}

export function createAssistedGenerationFingerprintV1(value: unknown): string {
  return createHash("sha256").update(canonicalAssistedGenerationJsonV1(value)).digest("hex")
}

export const createAssistedGenerationInputFingerprintV1 = createAssistedGenerationFingerprintV1
export const createAssistedGenerationProposalFingerprintV1 = createAssistedGenerationFingerprintV1
