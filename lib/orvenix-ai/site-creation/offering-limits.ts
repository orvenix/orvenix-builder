/**
 * COMMERCE-2B: the public Site Creation explicit-offering limits, shared by
 * the server normalizer (business-normalization.ts -- the trust boundary)
 * and the client commerce brief (UX only). Pure constants: safe to import
 * from client components.
 */
export const SITE_CREATION_OFFERING_LIMITS_V1 = {
  maxItems: 8,
  maxNameLength: 90,
  maxDescriptionLength: 180,
} as const
