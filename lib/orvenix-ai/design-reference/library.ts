import type { BusinessAffinity, DesignReference, DesignReferenceId, VisualFamily } from "./contract"
import { discoverDesignReferences } from "./extract"

/**
 * V2-5A.2 read-only library API. Deterministic extraction from
 * app/webs, recomputed lazily and memoized per process (no DB, no
 * cache invalidation concerns -- the source files only change with a
 * new deploy). This is intentionally the ONLY public surface for now:
 * no retrieval/ranking (that is V2-5A.3), no write API.
 */

let cachedReferences: DesignReference[] | null = null

export function getDesignReferences(): DesignReference[] {
  if (cachedReferences === null) cachedReferences = discoverDesignReferences()
  return cachedReferences
}

export function getDesignReferenceById(id: DesignReferenceId): DesignReference | undefined {
  return getDesignReferences().find((reference) => reference.id === id)
}

export function getDesignReferencesByBusinessAffinity(affinity: BusinessAffinity): DesignReference[] {
  return getDesignReferences().filter((reference) => reference.identity.businessAffinity === affinity)
}

export function getDesignReferencesByVisualFamily(family: VisualFamily): DesignReference[] {
  return getDesignReferences().filter((reference) => reference.identity.visualFamily === family)
}

/** Test-only escape hatch: forces the next getDesignReferences() call to recompute. */
export function resetDesignReferenceCacheForTests(): void {
  cachedReferences = null
}
