import { commercialDesignKeyV1, type CommercialDesignV1 } from "./contract"
import { CLINICA_V1 } from "./designs/clinica"
import { CONTABILIDAD_V1 } from "./designs/contabilidad"
import { CONSTRUCTION_V1 } from "./designs/construction"
import { CONSTRUCTION_V2 } from "./designs/construction-v2"
import { SERVICIOS_LOCALES_V1 } from "./designs/servicios-locales"
import { SERVICIOS_LOCALES_V2 } from "./designs/servicios-locales-v2"

/**
 * CSC-1B: the code-side, immutable commercial design registry, keyed by
 * id@version. Registered objects are deep-frozen: a version's semantics
 * can never be mutated at runtime, and a design change is a NEW version
 * registered next to the old one (existing customer sites keep their own
 * compiled snapshot + designSource provenance either way).
 */

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
  }
  return value
}

// CV1-1b: @2 versions add declared composition + demo-shape fidelity; @1 stays for provenance and its own tests.
const DESIGNS: readonly CommercialDesignV1[] = [SERVICIOS_LOCALES_V1, CONSTRUCTION_V1, SERVICIOS_LOCALES_V2, CONSTRUCTION_V2, CLINICA_V1, CONTABILIDAD_V1]

export const COMMERCIAL_DESIGN_REGISTRY_V1: Readonly<Record<string, CommercialDesignV1>> = deepFreeze(
  Object.fromEntries(DESIGNS.map((design) => [commercialDesignKeyV1(design), design])),
)

export function getCommercialDesignV1(id: unknown, version: unknown): CommercialDesignV1 | null {
  if (typeof id !== "string" || typeof version !== "number" || !Number.isSafeInteger(version)) return null
  const key = `${id}@${version}`
  return Object.prototype.hasOwnProperty.call(COMMERCIAL_DESIGN_REGISTRY_V1, key) ? COMMERCIAL_DESIGN_REGISTRY_V1[key] : null
}

/** Latest registered version of a design id (catalog entries reference an id; creation pins the version). */
export function getLatestCommercialDesignV1(id: unknown): CommercialDesignV1 | null {
  if (typeof id !== "string") return null
  const versions = Object.values(COMMERCIAL_DESIGN_REGISTRY_V1).filter((design) => design.id === id)
  return versions.sort((a, b) => b.version - a.version)[0] ?? null
}
