import {
  buildSiteArchitecture,
  type OrvenixSiteArchitecture,
} from "@/lib/orvenix-ai/architect"

import {
  getDefaultStarterEditorTree,
} from "@/lib/editorWebs"

import {
  buildRealTemplateCatalog,
  rankTemplateCatalog,
  adaptArtisanTemplate,
} from "@/lib/orvenix-ai/templates"

import {
  compileSiteBlueprint,
} from "@/lib/orvenix-ai/compiler"

import {
  applyBusinessContent,
} from "@/lib/orvenix-ai/content"

import {
  evaluateTreeQuality,
} from "@/lib/orvenix-ai/quality"

import {
  getVisualDirectionForFamily,
  inferVisualFamily,
  hasSafeContrast,
} from "@/lib/orvenix-ai/theme/visual-direction"

import {
  resolveTreeImageAssets,
} from "@/lib/orvenix-ai/assets/resolve-tree-assets"
import { collapseEmptyImageSlotsV1 } from "@/lib/orvenix-ai/assets/collapse-empty-image-slots"

import {
  resolveCreativeDirectorSectionOrderV1,
} from "@/lib/orvenix-ai/creative-director/section-order"

import {
  resolveAssistedSiteGenerationV1,
} from "@/lib/orvenix-ai/assisted-generation/architecture-bridge"

import {
  createPexelsProvider,
} from "@/lib/orvenix-ai/assets/pexels-provider"

import {
  bindStoreProductRecordsV1,
  normalizeCommercePresentationProductsV1,
} from "@/lib/orvenix-ai/commerce/product-facts"

import {
  resolveCommerceArchitectureV1,
} from "@/lib/orvenix-ai/commerce/architecture"

import { generateFullSiteCreativeBlueprintV1 } from "@/lib/orvenix-ai/full-site-generation/orchestrator"
import { buildFullSiteCreativeRequestV1, retrieveFullSiteCommerceDesignReferencesV1 } from "@/lib/orvenix-ai/full-site-generation/request-context"
import { diagnoseCrossGenerationNoveltyV1, diagnoseSiteCompositionNoveltyV1, isCompositionMemoryV1, type CompositionMemoryV1 } from "@/lib/orvenix-ai/design-memory/composition-memory"
import { motifShapeSignatureV2 } from "@/lib/orvenix-ai/design-reference/motifs"

/** CF-4D: Design Memory is best-effort and must never hold up a customer's site. */
const COMPOSITION_MEMORY_LOAD_TIMEOUT_MS_V1 = 2_000

async function loadCompositionMemorySafelyV1(loader: NonNullable<AutonomousSiteBuilderInput["compositionMemoryLoader"]>, trace: string[]): Promise<CompositionMemoryV1 | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const loaded = await Promise.race([
      loader(),
      new Promise<"timeout">((resolve) => { timer = setTimeout(() => resolve("timeout"), COMPOSITION_MEMORY_LOAD_TIMEOUT_MS_V1) }),
    ])
    if (loaded === "timeout") {
      trace.push("Composition memory: no disponible (tiempo agotado)")
      return undefined
    }
    if (loaded === null || loaded === undefined) return undefined
    if (!isCompositionMemoryV1(loaded)) {
      trace.push("Composition memory: no disponible (formato invalido)")
      return undefined
    }
    return loaded
  } catch {
    // Never surface DB/internal errors: generation continues with exact no-memory behavior.
    trace.push("Composition memory: no disponible")
    return undefined
  } finally {
    if (timer) clearTimeout(timer)
  }
}
import type { FullSiteCreativeLifecycleV1 } from "@/lib/orvenix-ai/full-site-generation/contract"

import {
  buildCommerceProvisioningPlanV1,
  markProductsPendingProvisioningV1,
  type CommerceProvisioningPlanV1,
} from "@/lib/orvenix-ai/commerce/provisioning-plan"

import {
  buildSiteGenerationGuideContext,
  ORVENIX_SITE_CREATION_CHECKLIST,
  ORVENIX_SITE_GENERATION_GUIDE_VERSION,
} from "@/lib/orvenix-ai/guidelines/site-generation-guidelines"

import type {
  AutonomousMultiPageSiteBuilderResult,
  AutonomousSiteBuilderInput,
  AutonomousSiteBuilderResult,
} from "./types"

import {
  buildSiteCreationHref,
  normalizeSiteCreationPlanV2,
  validateSiteCreationPlanV2,
  type SiteCreationPlanV2,
} from "@/lib/orvenix-ai/site-creation/plan-v2"

import type {
  EditorTree,
  GlobalTheme,
} from "@/types/editor"

function inferRequiredCapabilities(
  siteType: string,
) {
  switch (siteType) {
    case "health":
      return [
        "citas",
        "servicios",
        "proceso",
        "faq",
      ]

    case "restaurant":
      return [
        "reservaciones",
        "menu",
        "galeria",
        "contacto",
      ]

    case "agency":
      return [
        "servicios",
        "casos de exito",
        "proceso",
        "formulario",
      ]

    case "ecommerce":
      return [
        "catalogo",
        "productos",
        "carrito",
        "checkout",
      ]

    default:
      return [
        "servicios",
        "contacto",
      ]
  }
}

export async function runAutonomousSiteBuilder(
  input: AutonomousSiteBuilderInput,
): Promise<AutonomousSiteBuilderResult> {
  const trace: string[] = []
  const warnings: string[] = []
  const generationGuide = buildSiteGenerationGuideContext({
    request: input.request,
    mode: "site",
  })

  void generationGuide

  trace.push(
    `Guia de generacion aplicada: ${ORVENIX_SITE_GENERATION_GUIDE_VERSION}`,
  )

  /*
   * 1. UNDERSTAND + ARCHITECT
   */
  trace.push("Analizando negocio con criterios de conversion")

  const architecture =
    buildSiteArchitecture({
      request: input.request,

      business: {
        name: input.business.name,
        industry: input.business.industry,
        description:
          input.business.description,
        location: input.business.location,
        audience: input.business.audience,
        objective:
          input.business.objective,
      },
    })

  trace.push(
    `Tipo de sitio detectado: ${architecture.siteType}`,
  )

  /*
   * 2. TEMPLATE INTELLIGENCE
   */
  trace.push(
    `Analizando templates con checklist: ${ORVENIX_SITE_CREATION_CHECKLIST.slice(0, 4).join(" · ")}`,
  )

  const catalog =
    buildRealTemplateCatalog()

  const ranked = input.forceFreshComposition
    ? []
    : rankTemplateCatalog(
      catalog.entries,
      {
        siteType:
          architecture.siteType,

        industry:
          architecture.industry,

        objective:
          architecture.objective,

        preferredStyle:
          input.preferredStyle ??
          "premium editable conversion-oriented",

        requiredCapabilities:
          inferRequiredCapabilities(
            architecture.siteType,
          ),
      },
    )

  if (input.forceFreshComposition) {
    trace.push("Creacion desde cero solicitada: se omite clonacion/adaptacion de templates")
  }

  const selectedTemplate =
    ranked[0] ?? null

  /*
   * 3. TEMPLATE PATH
   */
  if (
    selectedTemplate?.template.tree &&
    selectedTemplate.confidence >= 45
  ) {
    trace.push(
      `Template seleccionado: ${selectedTemplate.template.name}`,
    )

    const adaptation =
      adaptArtisanTemplate({
        tree:
          selectedTemplate.template.tree,

        business: {
          name: input.business.name,
          industry:
            input.business.industry,
          description:
            input.business.description,
          location:
            input.business.location,
          audience:
            input.business.audience,
          objective:
            input.business.objective,
          phone:
            input.business.phone,
          whatsapp:
            input.business.whatsapp,
          email:
            input.business.email,
          address:
            input.business.address,
        },

        services:
          input.business.services,

        pricing:
          input.business.pricing,

        testimonials:
          input.business.testimonials,
      })

    warnings.push(
      ...adaptation.report.warnings,
    )

    trace.push(
      `Template adaptado: ${adaptation.report.originalTemplateNodes} → ${adaptation.report.finalNodes} nodos`,
    )

    if (
      adaptation.report.removedSections.length
    ) {
      trace.push(
        `Secciones eliminadas por seguridad: ${adaptation.report.removedSections.join(", ")}`,
      )
    }

    /*
     * CONTENT PASS
     */
    const tree =
      applyBusinessContent(
        adaptation.tree,
        {
          name: input.business.name,
          industry:
            input.business.industry,
          description:
            input.business.description,
          location:
            input.business.location,
          audience:
            input.business.audience,
          objective:
            input.business.objective,
          phone:
            input.business.phone,
          whatsapp:
            input.business.whatsapp,
          email:
            input.business.email,
          address:
            input.business.address,
          page: {
            name: "Inicio",
            slug: "home",
            purpose:
              architecture.pages[0]
                ?.purpose,
          },
        },
      )

    /*
     * QUALITY
     */
    trace.push(
      "Evaluando calidad",
    )

    const quality =
      evaluateTreeQuality(tree)

    const minimumQuality =
      input.minimumQuality ?? 70

    let repaired = false

    if (
      quality.score <
      minimumQuality
    ) {
      /*
       * Por ahora registramos que necesita repair.
       * El Repair Engine real será la siguiente capa.
       */
      trace.push(
        `Calidad ${quality.score}/${100}; requiere reparación automática`,
      )

      repaired = true
    } else {
      trace.push(
        `Calidad aprobada: ${quality.score}/${100}`,
      )
    }

    return {
      /*
       * "ok" significa que Orvenix AI pudo
       * producir un árbol utilizable.
       *
       * Las advertencias no bloquean por sí
       * solas una generación. Safety Validator
       * y Mutation Policy deciden si puede
       * ejecutarse.
       */
      ok: true,

      architecture,
      selectedTemplate,
      tree,
      quality,
      repaired,
      warnings,
      trace,
    }
  }

  /*
   * 4. FALLBACK
   *
   * Si no existe template suficientemente bueno,
   * construimos desde Site Architect + Composer.
   */
  trace.push(
    "No existe un template suficientemente compatible; usando composicion autonoma guiada por conversion",
  )

  const blueprint =
    compileSiteBlueprint(
      architecture,
      {
        preferPrimitiveComposition: input.forceFreshComposition,
        businessEvidence: input.business.businessEvidence,
      },
    )

  const home =
    blueprint.pages[0]

  if (!home) {
    throw new Error(
      "Orvenix AI no pudo generar la página principal.",
    )
  }

  const tree =
    applyBusinessContent(
      home.tree,
      {
        name: input.business.name,
        industry:
          input.business.industry,
        description:
          input.business.description,
        location:
          input.business.location,
        audience:
          input.business.audience,
        objective:
          input.business.objective,
        phone:
          input.business.phone,
        whatsapp:
          input.business.whatsapp,
        email:
          input.business.email,
        address:
          input.business.address,

        page: {
          name: home.name,
          slug: home.slug,
          purpose:
            architecture.pages[0]
              ?.purpose,
        },
      },
    )

  const quality =
    evaluateTreeQuality(tree)

  return {
    ok: true,

    architecture,
    selectedTemplate: null,
    tree,
    quality,

    repaired:
      quality.score <
      (input.minimumQuality ?? 70),

    warnings:
      blueprint.warnings,

    trace,
  }
}

function getStarterTheme(): GlobalTheme {
  const starter = getDefaultStarterEditorTree()
  const theme = starter.globalTheme ?? starter.theme

  if (!theme) {
    return {}
  }

  return structuredClone(theme)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

const MEMORY_HUE_TOKENS: Record<string, { primary: string; secondary: string; accent: string }> = {
  red: { primary: "#dc2626", secondary: "#991b1b", accent: "#f87171" },
  orange: { primary: "#ea580c", secondary: "#9a3412", accent: "#fb923c" },
  yellow: { primary: "#ca8a04", secondary: "#854d0e", accent: "#facc15" },
  green: { primary: "#16a34a", secondary: "#166534", accent: "#4ade80" },
  cyan: { primary: "#0891b2", secondary: "#155e75", accent: "#22d3ee" },
  blue: { primary: "#1794CC", secondary: "#1379A8", accent: "#1BB3FA" },
  purple: { primary: "#7c3aed", secondary: "#5b21b6", accent: "#a78bfa" },
  pink: { primary: "#db2777", secondary: "#9d174d", accent: "#f472b6" },
  neutral: { primary: "#334155", secondary: "#0f172a", accent: "#64748b" },
}

function themeColors(theme: GlobalTheme): NonNullable<GlobalTheme["colors"]> {
  return theme.colors ?? {
    primary: "#1794CC",
    secondary: "#1379A8",
    background: "#ffffff",
    text: "#0f172a",
    accent: "#1BB3FA",
  }
}

function themeMotion(theme: GlobalTheme): NonNullable<GlobalTheme["motion"]> {
  return theme.motion ?? {
    duration: "180ms",
    easing: "ease",
  }
}

function applyThemeDirection(theme: GlobalTheme, direction: Record<string, unknown>): GlobalTheme {
  const next = structuredClone(theme)

  if (typeof direction.accentHue === "string") {
    const tokens = MEMORY_HUE_TOKENS[direction.accentHue]

    if (tokens) {
      next.colors = {
        ...themeColors(next),
        primary: tokens.primary,
        secondary: tokens.secondary,
        accent: tokens.accent,
      }
    }
  }

  if (direction.mode === "dark") {
    next.colors = {
      ...themeColors(next),
      background: "#06131f",
      text: "#f8fafc",
    }
  } else if (direction.mode === "light") {
    next.colors = {
      ...themeColors(next),
      background: "#ffffff",
      text: "#0f172a",
    }
  }

  if (direction.radiusBucket === "sharp") {
    next.radius = { ...(next.radius ?? {}), card: "4px", button: "6px" }
  } else if (direction.radiusBucket === "soft") {
    next.radius = { ...(next.radius ?? {}), card: "16px", button: "999px" }
  } else if (direction.radiusBucket === "pill") {
    next.radius = { ...(next.radius ?? {}), card: "24px", button: "999px" }
  }

  if (direction.typographyBucket === "serif") {
    next.fontHeading = "Playfair Display"
    next.fontBody = next.fontBody || "Inter"
  } else if (direction.typographyBucket === "mono") {
    next.fontHeading = "JetBrains Mono"
    next.fontBody = "Inter"
  } else if (direction.typographyBucket === "display") {
    next.fontHeading = "Oswald"
    next.fontBody = next.fontBody || "Inter"
  } else if (direction.typographyBucket === "sans") {
    next.fontHeading = "Inter"
    next.fontBody = "Inter"
  }

  if (direction.motionBucket === "none") {
    next.motion = { ...themeMotion(next), duration: "0ms" }
  } else if (direction.motionBucket === "subtle") {
    next.motion = { ...themeMotion(next), duration: "180ms" }
  } else if (direction.motionBucket === "expressive") {
    next.motion = { ...themeMotion(next), duration: "320ms" }
  }

  return next
}

/**
 * V2-1.1: resolves the VisualFamily from already-normalized business
 * facts (industry/description/services/preferredStyle) -- NOT from
 * siteType, which stays a purely architectural concept. siteType is only
 * consulted inside inferVisualFamily as a last-resort fallback hint when
 * no business-facts keyword matched.
 */
function resolveVisualFamily(input: AutonomousSiteBuilderInput, siteType: string) {
  return inferVisualFamily({
    industry: input.business.industry,
    description: input.business.description,
    services: input.business.services,
    preferredStyle: input.preferredStyle,
    siteTypeHint: siteType,
  })
}

/**
 * V2-1: applies the deterministic, visual-family-keyed direction as the
 * new baseline (previously every business silently got the bare starter
 * theme here). A basic contrast check guards the result -- if the
 * selected accent color would fail a minimum contrast ratio against the
 * (unchanged) background, we fall back to the safe "professional" default
 * direction instead of shipping an unreadable combination.
 */
function applyDeterministicVisualDirection(theme: GlobalTheme, input: AutonomousSiteBuilderInput, siteType: string): GlobalTheme {
  const family = resolveVisualFamily(input, siteType)
  const direction = getVisualDirectionForFamily(family)
  const next = applyThemeDirection(theme, direction)

  const { primary, background } = themeColors(next)
  if (!hasSafeContrast(primary, background)) {
    return applyThemeDirection(theme, getVisualDirectionForFamily("professional"))
  }

  return next
}

function applySiteCreationThemeAdvisories(theme: GlobalTheme, input: AutonomousSiteBuilderInput, siteType: string): GlobalTheme {
  const baseline = applyDeterministicVisualDirection(theme, input, siteType)

  const prior = input.designMemoryPrior

  if (prior?.level === "L2" && isPlainRecord(prior.recommendation.theme)) {
    return applyThemeDirection(baseline, prior.recommendation.theme)
  }

  const externalTheme = input.externalThemeAdvisory?.theme
  if (isPlainRecord(externalTheme)) {
    return applyThemeDirection(baseline, externalTheme)
  }

  /*
   * V2-4 section 22: lowest-priority tier -- only reached when neither
   * Design Memory L2 nor the (still-dormant) theme_direction_advisor_v1
   * advisory applied. Reuses applyThemeDirection as-is: any bucket value
   * that isn't a recognized token is simply ignored per-axis by that
   * function already, so an invalid/partial visualDirection safely falls
   * through to the deterministic V2-1 baseline for whichever axes it
   * didn't validly cover.
   */
  const creativeVisualDirection = input.creativeDirection?.visualDirection
  if (isPlainRecord(creativeVisualDirection)) {
    return applyThemeDirection(baseline, creativeVisualDirection)
  }

  return baseline
}

function businessContextForPage(params: {
  input: AutonomousSiteBuilderInput
  page: { name: string; slug: string }
  purpose?: string
}) {
  const {
    input,
    page,
    purpose,
  } = params

  return {
    name: input.business.name,
    industry: input.business.industry,
    description: input.business.description,
    location: input.business.location,
    audience: input.business.audience,
    objective: input.business.objective,
    phone: input.business.businessEvidence?.contact?.phone ?? input.business.phone,
    whatsapp: input.business.businessEvidence?.contact?.whatsapp ?? input.business.whatsapp,
    email: input.business.businessEvidence?.contact?.email ?? input.business.email,
    address: input.business.address,
    businessEvidence: input.business.businessEvidence,
    page: {
      name: page.name,
      slug: page.slug,
      purpose,
    },
  }
}

function omitUndefinedValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(omitUndefinedValues)
  }

  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => typeof entry !== "undefined")
        .map(([key, entry]) => [key, omitUndefinedValues(entry)]),
    )
  }

  return value
}

function averageScore(scores: number[]) {
  if (!scores.length) return 0

  return Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length,
  )
}

/**
 * V2-5C fix 1: `theme` is now the caller's ALREADY-RESOLVED, authoritative
 * theme (applySiteCreationThemeAdvisories, called exactly once in
 * runAutonomousMultiPageSiteBuilder, before compileSiteBlueprint --
 * see there) rather than being recomputed here from `siteType`. This is
 * the single call to theme resolution for the whole site build; this
 * function no longer calls applySiteCreationThemeAdvisories/getStarterTheme
 * itself, so there is exactly one authority for both the final plan's
 * theme AND the composer's accentColor, never two independently-resolved
 * values that could diverge if advisory state differs between calls.
 */
function createMultiPagePlan(params: {
  input: AutonomousSiteBuilderInput
  theme: GlobalTheme
  pages: Array<{ name: string; slug: string; tree: EditorTree }>
  pageQuality: Array<{ slug: string; score: number }>
  warnings: string[]
  commerceProvisioning?: CommerceProvisioningPlanV1 | null
  designSource?: SiteCreationPlanV2["designSource"]
}): SiteCreationPlanV2 {
  const {
    input,
    theme,
    pages,
    pageQuality,
    warnings,
    commerceProvisioning,
    designSource,
  } = params

  return normalizeSiteCreationPlanV2({
    version: 2,
    identity: {
      name: input.business.name?.trim() || "Sitio Orvenix",
      ...(typeof input.business.industry !== "undefined" ? { industry: input.business.industry } : {}),
      ...(typeof input.business.location !== "undefined" ? { location: input.business.location } : {}),
      ...(typeof input.business.description !== "undefined" || input.request ? { description: input.business.description || input.request } : {}),
    },
    theme,
    navigation: pages.map((page) => ({
      label: page.name,
      slug: page.slug,
      href: buildSiteCreationHref(page.slug),
    })),
    pages: pages.map((page) => ({
      slug: page.slug,
      name: page.name,
      isHome: page.slug === "home",
      seo: {
        title: page.tree.seo?.title || page.name,
        description:
          page.tree.seo?.description ||
          input.business.description ||
          input.request,
      },
      tree: page.tree,
      treeHash: "0".repeat(64),
    })),
    quality: {
      score: averageScore(pageQuality.map((page) => page.score)),
      warnings,
      summary: `Plan multipagina generado en memoria para ${input.business.name?.trim() || "el negocio"}.`,
    },
    // COMMERCE-2A: hash-covered new-store provisioning intent (absent -> byte-identical plan).
    ...(commerceProvisioning ? { commerce: { version: 1 as const, provisioning: commerceProvisioning } } : {}),
    ...(designSource ? { designSource } : {}),
  })
}

/**
 * ASSISTED-4A finalization: a generated customer site must never show a
 * testimonials section it cannot fill with REAL, caller-supplied evidence.
 * The composer's only testimonial source is
 * `businessEvidence.testimonials` (threaded by compileSiteBlueprint), so
 * the same source decides presence here: no usable quote -> the
 * "testimonials" section is omitted from every page instead of rendering
 * placeholder customer-facing content. Never adds or invents anything;
 * pages without a testimonials section are returned by reference.
 */
function omitUngroundedTestimonialSectionsV1(
  architecture: OrvenixSiteArchitecture,
  businessEvidence: AutonomousSiteBuilderInput["business"]["businessEvidence"],
): OrvenixSiteArchitecture {
  const hasGroundedTestimonial = Boolean(businessEvidence?.testimonials?.some((testimonial) => testimonial.quote?.trim()))
  if (hasGroundedTestimonial) return architecture
  if (!architecture.pages.some((page) => page.sections.some((section) => section.role === "testimonials"))) return architecture

  return {
    ...architecture,
    pages: architecture.pages.map((page) =>
      page.sections.some((section) => section.role === "testimonials")
        ? { ...page, sections: page.sections.filter((section) => section.role !== "testimonials") }
        : page,
    ),
  }
}

export async function runAutonomousMultiPageSiteBuilder(
  input: AutonomousSiteBuilderInput,
): Promise<AutonomousMultiPageSiteBuilderResult> {
  const trace: string[] = []
  const warnings: string[] = []
  const commercialDesign = input.commercialDesign
  const generationGuide = buildSiteGenerationGuideContext({
    request: input.request,
    mode: "site",
  })

  void generationGuide

  trace.push(
    `Guia de generacion aplicada: ${ORVENIX_SITE_GENERATION_GUIDE_VERSION}`,
  )
  trace.push(
    "Generando arquitectura multipagina en memoria",
  )

  /*
   * COMMERCE-1: the ONLY two ways product facts enter the architecture.
   * A trusted `commerceStore` binding (real store rows) yields BOUND
   * executable facts; otherwise the caller's products are re-normalized
   * as PRESENTATION facts, which strips any id/binding-looking field so a
   * presentation product can never become executable. Legacy
   * `{ name, description }` products pass through unchanged in content.
   */
  const boundProducts = input.commerceStore
    ? bindStoreProductRecordsV1(input.commerceStore.siteId, input.commerceStore.records)
    : []
  const commerceProducts = boundProducts.length
    ? boundProducts
    : normalizeCommercePresentationProductsV1(input.business.products)

  const builtArchitecture = commercialDesign?.architecture ?? buildSiteArchitecture({
    request: input.request,
    business: {
      name: input.business.name,
      industry: input.business.industry,
      description: input.business.description,
      location: input.business.location,
      audience: input.business.audience,
      objective: input.business.objective,
      services: input.business.services,
      products: commerceProducts,
    },
  })

  /*
   * COMMERCE-2A: trusted new-store provisioning intent. Only when a server
   * caller asked for it, no real store binding was supplied, the site is
   * ecommerce and EVERY product has a grounded price (all-or-nothing, see
   * provisioning-plan.ts). The approved plan rides inside
   * SiteCreationPlanV2.commerce (hash-covered); the products become
   * PENDING (non-executable) cards the confirm step binds to real rows.
   * Pure: no DB access here -- preview stays side-effect free.
   */
  const commerceProvisioningPlan =
    !commercialDesign && input.commerceProvisioning?.mode === "new_store" && !boundProducts.length && builtArchitecture.siteType === "ecommerce"
      ? buildCommerceProvisioningPlanV1(builtArchitecture.products)
      : null
  const provisioningArchitecture = commerceProvisioningPlan && builtArchitecture.products
    ? { ...builtArchitecture, products: markProductsPendingProvisioningV1(builtArchitecture.products, commerceProvisioningPlan) }
    : builtArchitecture

  /*
   * FULL-SITE-4A: optional trusted Full-Site Creative provider. ONE call,
   * sanitized bounded request, validator-authoritative; the accepted
   * blueprint is then treated exactly like any other external proposal
   * (commerce adapter grounding + deterministic fallback). No provider ->
   * byte-identical to COMMERCE-3C.
   */
  let fullSiteLifecycle: FullSiteCreativeLifecycleV1 = { status: "disabled", reasonCode: "disabled" }
  let commerceProposal = input.commerceArchitecture?.proposal
  let commerceMode = input.commerceArchitecture?.mode
  const fullSiteProvider = input.commerceArchitecture?.provider
  const fullSiteProducts = provisioningArchitecture.products ?? []
  let fullSiteMemory: CompositionMemoryV1 | undefined
  let suppliedMotifShapes: string[] = []
  if (fullSiteProvider && provisioningArchitecture.siteType === "ecommerce" && fullSiteProducts.some((product) => product.variants?.length)) {
    // CF-4D: the ONLY place composition memory is read -- where it can causally change motif selection.
    fullSiteMemory = input.compositionMemory ?? (input.compositionMemoryLoader ? await loadCompositionMemorySafelyV1(input.compositionMemoryLoader, trace) : undefined)
    try {
      const request = buildFullSiteCreativeRequestV1({
        industry: input.business.industry,
        objective: input.business.objective,
        location: input.business.location,
        products: fullSiteProducts,
        designReferences: retrieveFullSiteCommerceDesignReferencesV1(),
        creativeDirection: input.creativeDirection,
        compositionMemory: fullSiteMemory,
      })
      suppliedMotifShapes = (request.context.designMotifs ?? []).map((motif) => motifShapeSignatureV2({ ...motif, sectionRole: motif.role }))
      const memory = request.diagnostics.motifMemory
      if (memory.sourceCount) trace.push(`Composition memory: ${memory.usableCount}/${memory.sourceCount} generaciones, ${memory.recentShapeCount} formas recientes, ${memory.downweightedMotifIds.length} motivos atenuados`)
      const generation = await generateFullSiteCreativeBlueprintV1({ provider: fullSiteProvider, requestContext: request.context, grounding: request.grounding })
      fullSiteLifecycle = generation.lifecycle
      if (generation.ok) {
        commerceProposal = generation.blueprint
        commerceMode = "mock-ai"
      }
    } catch {
      fullSiteLifecycle = { status: "failed", reasons: ["provider_error"], reasonCode: "provider_error" }
    }
    trace.push(`Full-Site Creative provider: ${fullSiteLifecycle.status}${"reasonCode" in fullSiteLifecycle && fullSiteLifecycle.reasonCode ? ` (${fullSiteLifecycle.reasonCode})` : ""}`)
  }

  const commerceArchitectureResult = resolveCommerceArchitectureV1({
    architecture: provisioningArchitecture,
    facts: {
      products: provisioningArchitecture.products ?? [],
      mode: commerceMode,
      proposal: commerceProposal,
    },
  })
  const architecture = commercialDesign?.architecture ?? commerceArchitectureResult.architecture
  warnings.push(...commerceArchitectureResult.warnings.map((warning) => `commerce-architecture: ${warning}`))

  if (commerceArchitectureResult.plan) {
    trace.push(`Commerce Architect aplicado: ${commerceArchitectureResult.plan.storeStrategy} / ${commerceArchitectureResult.plan.pages.length} paginas`)
  }
  if (commerceArchitectureResult.fallbackApplied) {
    trace.push("Commerce Architect AI rechazado; fallback deterministico aplicado")
  }

  trace.push(
    `Tipo de sitio detectado: ${architecture.siteType}`,
  )

  /*
   * V2-4 sections 4/19: bounded section-ORDER authority, applied at the
   * architecture stage -- BEFORE compileSiteBlueprint runs, never as a
   * post-hoc reorder of a finished tree. Presence/roles/siteType/
   * archetype are untouched: only each page's OWN `sections` array order
   * can change, and only when the AI's proposed order is a validated
   * permutation of that exact page's existing recipe roles (navigation
   * first, footer last, same role set -- see section-order.ts). Absent
   * creativeDirection, or an invalid/missing order for a given page,
   * `architecture` is unchanged for that page.
   */
  /*
   * ASSISTED-4A finalization: grounded-testimonials-only. Runs FIRST --
   * before the Creative Director's section-order authority, Assisted
   * Generation and compileSiteBlueprint -- so no downstream stage ever
   * sees a testimonials role it cannot fill with real evidence.
   */
  const groundedArchitecture = omitUngroundedTestimonialSectionsV1(architecture, input.business.businessEvidence)

  const effectiveCreativeDirection = commercialDesign?.direction ?? input.creativeDirection

  const orderedArchitecture = effectiveCreativeDirection?.pageDirections?.length
    ? {
        ...groundedArchitecture,
        pages: groundedArchitecture.pages.map((page) => {
          const direction = effectiveCreativeDirection?.pageDirections.find((entry) => entry.slug === page.slug)
          const defaultOrder = page.sections.map((section) => section.role)
          // A CD order may legitimately list "testimonials" (it was planned against the
          // pre-grounding recipe); drop ONLY that grounding-omitted role before the
          // unchanged permutation check -- any other unknown role still invalidates it.
          const preferredOrder = defaultOrder.includes("testimonials")
            ? direction?.preferredSectionOrder
            : direction?.preferredSectionOrder?.filter((role) => role !== "testimonials")
          const finalOrder = resolveCreativeDirectorSectionOrderV1(defaultOrder, preferredOrder)
          if (finalOrder.join("|") === defaultOrder.join("|")) return page
          const sectionByRole = new Map(page.sections.map((section) => [section.role as string, section]))
          return { ...page, sections: finalOrder.map((role) => sectionByRole.get(role)!) }
        }),
      }
    : groundedArchitecture

  /*
   * V2-3: resolved once, early, so structural composition (which
   * section variant each role gets) can see the same VisualFamily the
   * theme and asset pipelines independently resolve later. Deliberately
   * a separate call rather than threading a shared value across theme/
   * asset/composition -- inferVisualFamily is pure, so calling it
   * multiple times with the same inputs is safe and keeps V2-1/V2-2's
   * existing call sites completely untouched.
   */
  const compositionVisualFamily = inferVisualFamily({
    industry: input.business.industry,
    description: input.business.description,
    services: input.business.services,
    preferredStyle: input.preferredStyle,
    siteTypeHint: architecture.siteType,
  })

  /*
   * V2-5C fix 1: the theme is now resolved ONCE, here -- BEFORE
   * compileSiteBlueprint -- and this SAME resolved GlobalTheme is reused
   * both for the composer's accentColor (below) and, unchanged, as the
   * site's actually-applied theme (passed into createMultiPagePlan
   * further down). Previously, an EARLY read called
   * applyDeterministicVisualDirection alone (the baseline only) while
   * the LATE, authoritative call inside createMultiPagePlan additionally
   * layered Design Memory L2 / external theme advisory / Creative
   * Director visualDirection on top -- those two calls could disagree on
   * accent whenever a higher-priority advisory changed it, since only
   * the late call ever saw it. Hoisting applySiteCreationThemeAdvisories
   * itself (not just its baseline) to run first eliminates that
   * divergence structurally: there is now exactly one call, one
   * resolved theme, reused by both consumers -- never two independently-
   * resolved values. Advisory precedence inside applySiteCreationThemeAdvisories
   * is completely unchanged (same function, same inputs, same
   * deterministic output); it simply runs earlier in the sequence.
   */
  const theme = commercialDesign?.theme ?? applySiteCreationThemeAdvisories(getStarterTheme(), input, architecture.siteType)

  /*
   * ASSISTED-2B: the ONLY insertion point for Assisted Generation V1 into
   * the REAL pipeline -- right before compileSiteBlueprint runs, after
   * `orderedArchitecture` (Creative Director's section-order authority)
   * is already final. Absent `input.assistedGeneration` or mode "off"
   * (both the default) -> resolveAssistedSiteGenerationV1 returns
   * `orderedArchitecture` completely unchanged and never invokes any
   * provider; every existing caller of this function is therefore
   * byte-identical. Mode "anthropic" (explicit trusted callers only, see
   * types.ts) builds a bounded request context and feeds the provider's
   * untrusted output through the SAME validate + grounding path below.
   * Mode "deterministic" runs ONLY the ASSISTED-2A
   * deterministic testing provider (never Anthropic/Gemini/any network
   * call) through validate + closed-world grounding; any failure at any
   * stage (provider error, malformed proposal, grounding rejection)
   * automatically falls back to `orderedArchitecture` unmodified -- see
   * architecture-bridge.ts's own safety contract, this call never throws.
   */
  const assistedGenerationResult = commercialDesign
    ? {
        architecture: orderedArchitecture,
        lifecycle: {
          status: "disabled",
          reasonCode: "commercial_design",
        } as const,
      }
    : await resolveAssistedSiteGenerationV1({
        mode: input.assistedGeneration?.mode,
        architecture: orderedArchitecture,
        proposal: input.assistedGeneration?.proposal,
        // ASSISTED-3B (anthropic mode only; ignored otherwise): Creative
        // Director has ALREADY run upstream -- its validated direction is
        // consumed here as sanitized context, never replaced.
        creativeDirection: effectiveCreativeDirection,
        designReferences: input.assistedGeneration?.designReferences,
        provider: input.assistedGeneration?.provider,
        timeoutMs: input.assistedGeneration?.timeoutMs,
      })
  const assistedArchitecture = assistedGenerationResult.architecture

  const blueprint = compileSiteBlueprint(
    assistedArchitecture,
    {
      preferPrimitiveComposition: input.forceFreshComposition,
      visualFamily: compositionVisualFamily,
      creativeDirection: effectiveCreativeDirection,
      accentColor: themeColors(theme).accent,
      // PCE-2: same resolved theme -> theme-derived commerce surfaces (store sections, cards, closing, footer).
      themePalette: themeColors(theme),
      ...(commerceArchitectureResult.plan ? { commerceSurfaces: true } : {}),
      businessEvidence: input.business.businessEvidence,
      ...(commercialDesign ? { strictFacts: true, commercialFacts: commercialDesign.commercialFacts } : {}),
    },
  )

  warnings.push(...blueprint.warnings)
  trace.push(
    `Blueprint multipagina compilado: ${blueprint.pages.length} paginas`,
  )

  if (input.designMemoryPrior?.level === "L2") {
    trace.push("Theme advisory aplicado desde Design Memory L2")
  } else if (input.externalThemeAdvisory) {
    trace.push("Theme advisory aplicado desde Third-Party Assistance")
  }

  const rawPages = blueprint.pages.map((page) => {
    const pagePlan = architecture.pages.find(
      (item) => item.slug === page.slug,
    )
    const pageSeo = commercialDesign?.seoBySlug[page.slug]
    const tree = applyBusinessContent(
      page.tree,
      businessContextForPage({
        input,
        page,
        purpose: pagePlan?.purpose,
      }),
    )

    return {
      name: page.name,
      slug: page.slug,
      tree: omitUndefinedValues({
        ...tree,
        seo: {
          title: pageSeo?.title ?? tree.seo?.title,
          description: pageSeo?.description ?? tree.seo?.description,
        },
      }) as EditorTree,
    }
  })

  /*
   * V2-2: best-effort stock-photo resolution for hero/gallery image
   * placeholders. Runs once, here, BEFORE the Preview plan is built
   * below -- so the resolved src/alt/provenance is what gets persisted
   * and is exactly what Confirm later reuses (no re-query at Confirm
   * time). Asset failure of any kind (no key, timeout, quota, outage)
   * silently preserves today's existing src:"" placeholder behavior;
   * it can never fail site generation.
   */
  const assetVisualFamily = inferVisualFamily({
    industry: input.business.industry,
    description: input.business.description,
    services: input.business.services,
    preferredStyle: input.preferredStyle,
    siteTypeHint: architecture.siteType,
  })

  /*
   * V2-4 section 21: hero is resolved ONCE per site (unchanged caching
   * mechanic, see resolve-tree-assets.ts), so only ONE page's AI asset
   * intent can practically apply -- the Home page's, when present,
   * matching which page's hero is composed/encountered first in every
   * existing site-architect.ts recipe; else the first available
   * pageDirection's intent, as the closest approximation.
   */
  const aiHeroIntent = input.creativeDirection?.pageDirections?.find((direction) => direction.slug === "home")?.assetIntent
    ?? input.creativeDirection?.pageDirections?.[0]?.assetIntent

  const resolvedPages = commercialDesign
    ? rawPages
    : await resolveTreeImageAssets(rawPages, {
        provider: input.assetProvider ?? createPexelsProvider(),
        visualFamily: assetVisualFamily,
        industry: input.business.industry,
        services: input.business.services,
        businessName: input.business.name,
        ...(aiHeroIntent ? { aiHeroIntent } : {}),
      })
  // PCE-2: commerce sites never ship an unresolved image slot -- the composition reflows instead.
  const pages = commerceArchitectureResult.plan
    ? resolvedPages.map((page) => ({ ...page, tree: collapseEmptyImageSlotsV1(page.tree) }))
    : resolvedPages

  const pageQuality = pages.map((page) => {
    const quality = evaluateTreeQuality(page.tree)

    if (quality.problems.length) {
      warnings.push(
        ...quality.problems.map((problem) => `${page.slug}: ${problem}`),
      )
    }

    return {
      slug: page.slug,
      score: quality.score,
    }
  })

  const plan = createMultiPagePlan({
    input,
    theme,
    pages,
    pageQuality,
    warnings,
    commerceProvisioning: commerceProvisioningPlan,
    designSource: commercialDesign?.designSource,
  })
  const validation = validateSiteCreationPlanV2(plan, {
    maxPages: Math.max(architecture.pages.length, 1),
    maxBytes: 1_000_000,
  })

  if (validation.ok === false) {
    throw new Error(
      `Orvenix AI no pudo producir un plan multipagina valido: ${validation.errors.join("; ")}`,
    )
  }

  const minimumQuality = input.minimumQuality ?? 70
  const repaired = pageQuality.some(
    (page) => page.score < minimumQuality,
  )

  trace.push(
    `Plan V2 validado: ${validation.plan.pages.length} paginas, ${validation.byteLength} bytes`,
  )

  // CF-4D: diagnostic-only structural novelty for an APPLIED provider site (no rejection, retry or mutation).
  let novelty: AutonomousMultiPageSiteBuilderResult["fullSiteCreative"]["novelty"]
  if (fullSiteLifecycle.status === "applied") {
    const site = diagnoseSiteCompositionNoveltyV1(validation.plan, { suppliedMotifShapes })
    novelty = { ...site, ...(fullSiteMemory ? { crossGeneration: diagnoseCrossGenerationNoveltyV1(validation.plan, fullSiteMemory) } : {}) }
    trace.push(`Novelty (diagnostico): ${site.metrics.uniqueShapes} formas, ${site.metrics.uniqueSkeletons} esqueletos, ${site.warnings.length} avisos`)
  }

  return {
    ok: true,
    architecture: assistedArchitecture,
    selectedTemplate: null,
    plan: validation.plan,
    planHash: validation.planHash,
    byteLength: validation.byteLength,
    assistedGeneration: assistedGenerationResult.lifecycle,
    fullSiteCreative: {
      lifecycle: fullSiteLifecycle,
      commerceFallbackApplied: fullSiteLifecycle.status === "applied" && commerceArchitectureResult.fallbackApplied,
      ...(novelty ? { novelty } : {}),
    },
    pageQuality,
    repaired,
    warnings: [...new Set([...warnings, ...validation.warnings])],
    trace,
  }
}
