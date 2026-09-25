import type { SectionCompositionContext } from "./types"
import { classifyCtaIntent, cleanText, offeringNames, type CtaIntent } from "@/lib/orvenix-ai/content/copy-helpers"

const MAX_LISTED_OFFERINGS = 3

/**
 * V2-S2 (section 10): bounded, grammatical Spanish list join --
 * "A", "A y B", "A, B y C", or "A, B y C y más" once there are more real
 * names than fit in one clean sentence. A naive `names.join(" y ")` for
 * 3+ items produces the exact double-"y" run-on the spec calls out
 * ("...rehabilitación postoperatoria y terapia manual y ..."); this joins
 * with commas and a single trailing "y". The "y más" suffix states a
 * fact (there ARE more items) -- it never becomes a quality claim.
 */
export function joinSpanishList(names: string[], max = MAX_LISTED_OFFERINGS): string {
  const shown = names.slice(0, max)
  if (shown.length === 0) return ""
  const hasMore = names.length > max
  if (shown.length === 1) return hasMore ? `${shown[0]} y más` : shown[0]
  const joined = `${shown.slice(0, -1).join(", ")} y ${shown[shown.length - 1]}`
  return hasMore ? `${joined} y más` : joined
}

export interface OfferingFacts {
  services: string[]
  products: string[]
  /** First real, usable name -- services take precedence over products when a business (unusually) has both. */
  primary: string | null
  kind: "services" | "products" | null
}

/**
 * V2-S2 factual-authority read of the section's already-resolved
 * services/products collections. `context.services`/`context.products`
 * already carry V2-S1's explicit-beats-inferred precedence (business-
 * normalization.ts resolves that once, upstream) -- this layer only
 * consumes the result, it never re-derives or overrides that precedence.
 */
export function offeringFacts(context: SectionCompositionContext): OfferingFacts {
  const services = offeringNames(context.services)
  const products = offeringNames(context.products)
  const kind = services.length ? "services" : products.length ? "products" : null
  const primary = services[0] ?? products[0] ?? null
  return { services, products, primary, kind }
}

export type CopyItem = [string, string]

/**
 * TRUST -- V2-S2 section 3. When the business supplied real services or
 * products, the FIRST trust item names what's actually offered (bounded
 * by joinSpanishList, no quality/experience/award language attached)
 * instead of staying purely generic; the last item swaps to a real
 * location when one was supplied. Every OTHER item -- and the entire
 * array when there are no usable facts at all -- is returned exactly as
 * `defaultItems`, byte-for-byte: the caller's fallback literal is never
 * touched here, so an already-accepted no-facts render (V2-3.1) cannot
 * change from this function existing.
 */
export function resolveTrustItems(
  context: SectionCompositionContext,
  defaultItems: CopyItem[],
): CopyItem[] {
  const facts = offeringFacts(context)
  if (!facts.kind || defaultItems.length === 0) return defaultItems

  const names = facts.kind === "services" ? facts.services : facts.products
  const offeringItem: CopyItem =
    facts.kind === "services"
      ? ["Lo que ofrecemos", `Trabajamos en ${joinSpanishList(names)}.`]
      : ["Lo que encontrarás", `Contamos con ${joinSpanishList(names)}.`]

  const location = cleanText(context.location)
  const items = [...defaultItems]
  items[0] = offeringItem
  if (location && items.length > 1) {
    items[items.length - 1] = ["Ubicación", `Atendemos en ${location}.`]
  }
  return items
}

export interface CtaCopy {
  title: string
  body: string
  label: string
  href: string
}

const CTA_INTENT_LABELS: Record<CtaIntent, string> = {
  appointment: "Agendar ahora",
  quote: "Solicitar cotización",
  contact: "Contactar",
}

/**
 * CTA -- V2-S2 section 4 + V2-S2.1 coherence fix. Resolves heading/body/
 * label as ONE decision instead of personalizing the body in isolation --
 * that isolation was the confirmed V2-S2.1 defect (eg. body "...conseguir
 * solicitudes de cotización." next to a button that said "Agendar ahora",
 * an appointment-booking label the business never asked for). A business
 * with no objective/offerings still returns `fallback` unchanged.
 *
 * - catalog + real PRODUCTS (a menu/catalog surface, eg. a restaurant's
 *   Menú page) ALWAYS wins the label, regardless of objective: a listing
 *   of dishes/items is never a booking or ordering system, so the label
 *   stays an explore/contact action no matter what the business's
 *   unrelated objective text says.
 * - otherwise, when the business supplied an explicit objective, the
 *   label is chosen to match what that objective actually says
 *   (classifyCtaIntent), not the page archetype's unrelated pre-existing
 *   default -- this is the fix itself.
 * - the OVERVIEW archetype's label is the one deliberate exception: a
 *   Home overview CTA is a bridge that always points at "Ver servicios"
 *   (an already-accepted, hard-locked V1/V2-3 invariant -- Home and
 *   Servicios CTAs must keep visibly different labels), never a final
 *   appointment/quote action itself, so its label is never intent-swapped
 *   -- only its body reflects the real objective.
 * - businessObjective always drives the body via the same "para
 *   {objective}" idiom already shipped in content-engine.ts's
 *   conversionPageHeroCopy.
 */
export function resolveCtaCopy(
  context: SectionCompositionContext,
  fallback: CtaCopy,
): CtaCopy {
  const facts = offeringFacts(context)
  const objective = cleanText(context.businessObjective)
  const isOverview = context.archetype === "overview"
  const isProductCatalog = context.archetype === "catalog" && facts.kind === "products"

  const { title, href } = fallback
  let { body, label } = fallback

  if (isProductCatalog) {
    /*
     * V2-5G: grounded in the already-resolved, real siteType
     * classification (never invented here) -- a restaurant's product
     * listing is a menu, not a generic catalog, so its CTA wording says
     * so. Every other products+catalog business (ecommerce, or any
     * other siteType with real products) keeps the existing "Ver
     * catálogo" wording, unchanged.
     */
    const isRestaurantMenu = context.siteType === "restaurant"
    body = isRestaurantMenu ? "Contáctanos para conocer más sobre nuestro menú." : "Contáctanos para conocer más sobre lo que ofrecemos."
    label = isRestaurantMenu ? "Ver menú" : "Ver catálogo"
  }

  if (objective) {
    body = `Escríbenos para ${objective.toLowerCase()}.`
    if (!isProductCatalog && !isOverview) {
      label = CTA_INTENT_LABELS[classifyCtaIntent(objective)]
    }
  } else if (context.aiCtaIntent && !isProductCatalog && !isOverview) {
    /*
     * V2-4 section 20: the real businessObjective ALWAYS wins (the branch
     * above) -- this AI fallback is reachable ONLY when there is no
     * usable real objective to classify from. Preserves S2.1: a real
     * quote objective can never be turned into an appointment CTA by AI
     * input, because this branch never runs when `objective` is truthy.
     */
    label = CTA_INTENT_LABELS[context.aiCtaIntent]
  }

  return { title, body, label, href }
}

/**
 * FEATURES -- V2-S2 section 5. Deliberately does NOT name real services/
 * products (that's what the "services"/"products" role's own real-offering
 * listing already does -- see realOfferingItems in section-composer.ts);
 * doing so here would just be the exact "same list twice" duplication the
 * spec forbids. The only factual signal used is the real offering COUNT,
 * which differentiates the business (a real number, never a quality
 * claim) without listing a single name. Only the LAST item is replaced --
 * the rest of `defaultItems` (and all of it, when there is no factual
 * basis) returns unchanged.
 */
export function resolveFeatureItems(
  context: SectionCompositionContext,
  defaultItems: CopyItem[],
): CopyItem[] {
  const facts = offeringFacts(context)
  if (!facts.kind || defaultItems.length === 0) return defaultItems

  const count = facts.kind === "services" ? facts.services.length : facts.products.length
  const noun =
    facts.kind === "services"
      ? count === 1
        ? "servicio"
        : "servicios"
      : count === 1
        ? "producto"
        : "productos"

  const items = [...defaultItems]
  items[items.length - 1] = ["Variedad disponible", `Cuenta con ${count} ${noun} para elegir.`]
  return items
}

/**
 * PROCESS -- V2-S2 section 6. No step is ever invented: the intro line is
 * the only thing this touches, and only when the business explicitly
 * stated its own objective (the same explicit-fact idiom used by CTA/hero
 * elsewhere). Numbered steps stay exactly the caller's existing neutral,
 * action-oriented literals -- there is no structured "process facts"
 * input to personalize them from, and inventing consultation/booking/
 * delivery steps is explicitly forbidden.
 */
export function resolveProcessIntro(
  context: SectionCompositionContext,
  defaultIntro: string,
): string {
  const objective = cleanText(context.businessObjective)
  if (!objective) return defaultIntro
  return `Así te ayudamos a ${objective.toLowerCase()}.`
}
