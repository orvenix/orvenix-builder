/**
 * Discrete purpose a generated page serves, independent of its slug/name.
 * Kept intentionally small — grow it only when a real page shape needs a
 * distinct recipe, never to special-case one specific business.
 */
export type PageArchetype =
  | "overview"
  | "catalog"
  | "conversion"
