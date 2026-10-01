import { randomUUID } from "crypto"

import { composeSectionFromGraphV1, type GraphContinuityV1 } from "@/lib/orvenix-ai/composer/graph"
import type {
  EditorNode,
  NodeProps,
} from "@/types/editor"

import {
  composeSection,
} from "@/lib/orvenix-ai/composer"
import type {
  SectionCompositionContext,
} from "@/lib/orvenix-ai/composer"

import {
  getBlockCapability,
} from "@/lib/orvenix-ai/capabilities"

import type {
  OrvenixSiteArchitecture,
  OrvenixSitePagePlan,
  OrvenixSiteSectionPlan,
} from "@/lib/orvenix-ai/architect"

import type {
  CompiledPageBlueprint,
  CompiledSiteBlueprint,
} from "./types"

import type { CreativeSiteDirectionV1 } from "@/lib/orvenix-ai/creative-director/contract"
import type { NormalizedSiteCreationBusinessEvidenceV1 } from "@/lib/orvenix-ai/site-creation/evidence-normalization"
import { applySectionInstanceToContext } from "./section-instance-context"
import { injectStoreCartShellNodesV1 } from "@/lib/orvenix-ai/commerce/store-shell"

function nodeId(prefix: string) {
  return `ai-${prefix}-${randomUUID()}`
}

function createNode(params: {
  type: string
  displayName: string
  props?: NodeProps
  children?: string[]
  parentId?: string
}): EditorNode {
  const capability = getBlockCapability(params.type)

  if (!capability) {
    throw new Error(
      `Blueprint Compiler: bloque desconocido "${params.type}"`,
    )
  }

  return {
    id: nodeId(params.type),
    type: params.type,
    displayName: params.displayName,
    props: {
      ...capability.defaults,
      ...(params.props ?? {}),
    },
    children: [...(params.children ?? [])],
    version: capability.version ?? 1,
    ...(params.parentId
      ? { parentId: params.parentId }
      : {}),
  }
}

function copyComposedSection(
  source: ReturnType<typeof composeSection>,
  targetNodes: Record<string, EditorNode>,
): string | null {
  if (!source) return null

  const idMap = new Map<string, string>()

  /*
   * Primero asignamos IDs definitivos.
   */
  for (const tempId of Object.keys(source.nodes)) {
    idMap.set(tempId, nodeId("node"))
  }

  /*
   * Después recreamos las relaciones.
   */
  for (const composed of Object.values(source.nodes)) {
    const finalId = idMap.get(composed.tempId)

    if (!finalId) {
      throw new Error(
        `No se pudo resolver el nodo temporal ${composed.tempId}`,
      )
    }

    targetNodes[finalId] = {
      id: finalId,
      type: composed.type,
      displayName: composed.displayName,
      props: {
        ...composed.props,
      },
      children: composed.children.map((child) => {
        const mapped = idMap.get(child)

        if (!mapped) {
          throw new Error(
            `No se pudo resolver el hijo temporal ${child}`,
          )
        }

        return mapped
      }),
      version:
        getBlockCapability(composed.type)?.version ?? 1,
    }
  }

  /*
   * Parent IDs.
   */
  for (const node of Object.values(targetNodes)) {
    for (const childId of node.children) {
      const child = targetNodes[childId]

      if (child) {
        child.parentId = node.id
      }
    }
  }

  return idMap.get(source.rootId) ?? null
}

interface CompileBlueprintOptions {
  preferPrimitiveComposition?: boolean
  /** V2-3: structural-variant tendency input, threaded into every section's SectionCompositionContext. */
  visualFamily?: string
  /** V2-4: optional, already-validated-and-sanitized Creative Director direction, matched per-page by slug below. */
  creativeDirection?: CreativeSiteDirectionV1 | null
  /**
   * V2-5C (fix 1): the ACTUALLY-APPLIED site theme's resolved accent hex
   * -- site-builder.ts now resolves the full theme (applySiteCreationThemeAdvisories,
   * including Design Memory L2 / external theme advisory / Creative
   * Director visualDirection precedence) exactly ONCE, before calling
   * compileSiteBlueprint, and reuses that SAME resolved theme as both
   * this accentColor and the site's final theme -- never two
   * independently-resolved values that could diverge. A REAL,
   * non-fabricated, theme-derived color, never AI-invented. Threaded
   * unconditionally (harmless no-op when richComposition is off for a
   * given page -- see section-composer.ts's resolveToneBackground, only
   * reached when tone==="accent-soft", which itself only happens under
   * richComposition).
   */
  accentColor?: string
  /** PCE-2: the same resolved theme's colors, for theme-derived commerce surfaces (commerce/commerce-surface.ts). */
  themePalette?: SectionCompositionContext["themePalette"]
  /** PCE-2: true only when the commerce architecture built this site. */
  commerceSurfaces?: boolean
  businessEvidence?: NormalizedSiteCreationBusinessEvidenceV1
  /**
   * V2-6.2: real, already-resolved gallery/media assets, threaded into
   * every section's SectionCompositionContext uniformly (same pattern as
   * businessEvidence/accentColor above). Confirmed dormant in every real
   * production code path today (no asset-resolution stage populates it
   * yet) -- this option exists so a real asset CAN reach the composer
   * (eg. the FULL-BLEED MEDIA primitive) once one is available, without
   * ever fabricating a placeholder here. Absent -> byte-identical to
   * every pre-V2-6.2 caller.
   */
  resolvedGalleryAssets?: SectionCompositionContext["resolvedGalleryAssets"]
  resolvedMediaAsset?: SectionCompositionContext["resolvedMediaAsset"]
}

function createBlockSection(
  section: OrvenixSiteSectionPlan,
  nodes: Record<string, EditorNode>,
  options: CompileBlueprintOptions = {},
  context: SectionCompositionContext = {},
): string | null {
  if (options.preferPrimitiveComposition) {
    const composed = copyComposedSection(
      composeSection(section.role, context),
      nodes,
    )

    if (composed) return composed
  }

  /*
   * Si el arquitecto no encontró un bloque,
   * delegamos al Composition Engine.
   */
  if (!section.blockType) {
    return copyComposedSection(
      composeSection(section.role, context),
      nodes,
    )
  }

  const node = createNode({
    type: section.blockType,
    displayName:
      section.role.charAt(0).toUpperCase() +
      section.role.slice(1),
  })

  nodes[node.id] = node

  return node.id
}

function compilePage(
  page: OrvenixSitePagePlan,
  architecture: OrvenixSiteArchitecture,
  options: CompileBlueprintOptions = {},
): CompiledPageBlueprint {
  const nodes: Record<string, EditorNode> = {}

  const root = createNode({
    type: "section",
    displayName: `${page.name} — Orvenix AI`,
    props: {
      maxWidth: "full",
      paddingY: "none",
      paddingX: "none",
    },
  })

  nodes[root.id] = root

  const children: string[] = []
  const totalSections = page.sections.length

  // V2-4: matched once per page (not per section) -- every section on this page sees the SAME page-level AI hints.
  const pageDirection = options.creativeDirection?.pageDirections?.find((direction) => direction.slug === page.slug)

  /*
   * V2-5C: richComposition becomes true for THIS page only when the
   * validated, sanitized Creative Director direction actually requests
   * one of the V2-5B/V2-5C.1 executable capabilities -- presence of any
   * one of these bounded fields IS the activation signal (section I: "do
   * not globally switch richComposition on"). No creativeDirection, no
   * pageDirection for this slug, or a pageDirection/site direction with
   * none of these fields set (eg. only heroTitleSuggestion) all
   * correctly resolve to false, reproducing exact pre-V2-5C/V2-5B
   * behavior. V2-5C.1: navigation fields are SITE-level (options.creativeDirection,
   * not pageDirection), so a navigation-only decision also activates
   * richComposition for every page uniformly.
   */
  const richComposition = Boolean(
    pageDirection?.heroTreatment ||
      pageDirection?.processTreatment ||
      pageDirection?.twoItemLayoutTreatment ||
      pageDirection?.sectionToneStrategy ||
      options.creativeDirection?.navigationSurfaceStyle ||
      options.creativeDirection?.navigationContainment ||
      options.creativeDirection?.navigationLinkStyle ||
      options.creativeDirection?.navigationCtaEmphasis ||
      options.creativeDirection?.trustTreatment ||
      options.creativeDirection?.testimonialTreatment ||
      options.creativeDirection?.bookingPresentation ||
      options.creativeDirection?.premiumCompositionTreatment ||
      options.creativeDirection?.pricingTreatment,
  )

  // CF-2: page arc positions among this page's graph sections (arc rules are per section).
  const graphSectionIndexes = page.sections.map((section, index) => (section.instance?.composition?.graph !== undefined ? index : -1)).filter((index) => index >= 0)
  let graphPeaks = 0
  let previousGraph: { sectionIndex: number; continuityToNext?: GraphContinuityV1 } | undefined

  for (const [sectionIndex, section] of page.sections.entries()) {
    const baseContext: SectionCompositionContext = {
        visualFamily: options.visualFamily,
        siteType: architecture.siteType,
        industry: architecture.industry,
        objective: architecture.objective,
        businessName: architecture.businessName,
        services: architecture.services,
        products: architecture.products,
        location: architecture.location,
        businessEvidence: options.businessEvidence,
        businessObjective: architecture.businessObjective,
        sitePages: architecture.pages.map((pagePlan) => ({
          name: pagePlan.name,
          slug: pagePlan.slug,
          isHome: pagePlan.slug === "home",
        })),
        pageName: page.name,
        pageSlug: page.slug,
        pagePurpose: page.purpose,
        archetype: page.archetype,
        sectionIndex,
        totalSections,
        compositionSeed: `${architecture.siteType}:${page.slug}:${section.role}:${sectionIndex}`,
        ...(pageDirection?.heroTitleSuggestion ? { aiHeroTitleSuggestion: pageDirection.heroTitleSuggestion } : {}),
        ...(pageDirection?.heroDescriptionSuggestion ? { aiHeroDescriptionSuggestion: pageDirection.heroDescriptionSuggestion } : {}),
        ...(pageDirection?.preferredHeroVariant ? { aiPreferredHeroVariant: pageDirection.preferredHeroVariant } : {}),
        ...(pageDirection?.ctaIntent ? { aiCtaIntent: pageDirection.ctaIntent } : {}),
        ...(pageDirection?.highlightedOfferings ? { aiHighlightedOfferings: pageDirection.highlightedOfferings } : {}),
        ...(pageDirection?.assetIntent ? { aiAssetIntent: pageDirection.assetIntent } : {}),
        ...(options.creativeDirection?.density ? { aiDensity: options.creativeDirection.density } : {}),
        ...(pageDirection?.heroTreatment ? { aiPreferredHeroTreatment: pageDirection.heroTreatment } : {}),
        ...(pageDirection?.processTreatment ? { aiPreferredProcessTreatment: pageDirection.processTreatment } : {}),
        ...(pageDirection?.twoItemLayoutTreatment ? { aiPreferredTwoItemLayoutTreatment: pageDirection.twoItemLayoutTreatment } : {}),
        ...(pageDirection?.sectionToneStrategy ? { aiSectionToneStrategy: pageDirection.sectionToneStrategy } : {}),
        ...(options.creativeDirection?.navigationSurfaceStyle ? { aiPreferredNavigationSurfaceStyle: options.creativeDirection.navigationSurfaceStyle } : {}),
        ...(options.creativeDirection?.navigationContainment ? { aiPreferredNavigationContainment: options.creativeDirection.navigationContainment } : {}),
        ...(options.creativeDirection?.navigationLinkStyle ? { aiPreferredNavigationLinkStyle: options.creativeDirection.navigationLinkStyle } : {}),
        ...(options.creativeDirection?.navigationCtaEmphasis ? { aiPreferredNavigationCtaEmphasis: options.creativeDirection.navigationCtaEmphasis } : {}),
        ...(options.businessEvidence?.people?.length ? { trustPeople: options.businessEvidence.people } : {}),
        ...(options.businessEvidence?.testimonials?.length ? { testimonials: options.businessEvidence.testimonials } : {}),
        ...(options.creativeDirection?.trustTreatment ? { aiPreferredTrustTreatment: options.creativeDirection.trustTreatment } : {}),
        ...(options.creativeDirection?.testimonialTreatment ? { aiPreferredTestimonialTreatment: options.creativeDirection.testimonialTreatment } : {}),
        ...(options.creativeDirection?.bookingPresentation ? { aiPreferredBookingPresentation: options.creativeDirection.bookingPresentation } : {}),
        ...(options.creativeDirection?.premiumCompositionTreatment ? { aiPremiumCompositionTreatment: options.creativeDirection.premiumCompositionTreatment } : {}),
        ...(options.creativeDirection?.pricingTreatment ? { aiPreferredPricingTreatment: options.creativeDirection.pricingTreatment } : {}),
        ...(richComposition ? { richComposition: true } : {}),
        ...(options.accentColor ? { accentColor: options.accentColor } : {}),
        ...(options.themePalette ? { themePalette: options.themePalette } : {}),
        ...(options.commerceSurfaces ? { commerceSurfaces: true } : {}),
        ...(options.resolvedGalleryAssets?.length ? { resolvedGalleryAssets: options.resolvedGalleryAssets } : {}),
        ...(options.resolvedMediaAsset ? { resolvedMediaAsset: options.resolvedMediaAsset } : {}),
    }

    /*
     * V2-6.1: a section's optional `instance` (SectionInstancePlan) gets
     * an isolated, per-instance view derived from baseContext -- never a
     * mutation of it -- so a sibling instance of the same role (eg. a
     * second "services" instance right after this one) starts from the
     * exact same unsliced baseContext again. Absent -> byte-identical
     * pre-V2-6.1 behavior (context === baseContext).
     */
    const context = section.instance
      ? applySectionInstanceToContext(baseContext, section.instance)
      : baseContext

    let childId: string | null = null
    const graph = section.instance?.composition?.graph
    if (graph !== undefined) {
      /*
       * CF-2: a graph section resolves refs against the UNSLICED product
       * facts, and takes Orvenix-resolved CTA/category/detail targets from
       * its instance. Valid -> graph compiler; invalid -> THIS section
       * alone falls back to the V1 path, with the reason recorded.
       */
      const composition = section.instance!.composition!
      const result = composeSectionFromGraphV1({
        graph,
        expectedRole: section.role,
        context: { ...context, products: baseContext.products },
        position: { index: graphSectionIndexes.indexOf(sectionIndex), total: graphSectionIndexes.length, peaksBefore: graphPeaks },
        ...(previousGraph && previousGraph.sectionIndex === sectionIndex - 1 && previousGraph.continuityToNext ? { previousContinuity: previousGraph.continuityToNext } : {}),
        detailHrefByProductIndex: new Map((composition.productDetailLinks ?? []).map((link) => [link.productIndex, link.href])),
        ...(composition.merchandisingComposition ? { preset: composition.merchandisingComposition } : {}),
      })
      if (result.ok === false) {
        childId = createBlockSection(section, nodes, options, context)
        if (childId && nodes[childId]) {
          nodes[childId].props = { ...nodes[childId].props, compositionGraphFallback: { reason: result.reason, codes: [...new Set(result.diagnostics.map((diagnostic) => diagnostic.code))], ...(result.normalizations.length ? { normalizations: result.normalizations } : {}) } }
        }
        previousGraph = undefined
      } else {
        childId = copyComposedSection(result.section, nodes)
        if (result.graph.beat === "peak") graphPeaks += 1
        previousGraph = { sectionIndex, ...(result.graph.continuityToNext ? { continuityToNext: result.graph.continuityToNext } : {}) }
      }
    } else {
      childId = createBlockSection(section, nodes, options, context)
      previousGraph = undefined
    }

    if (!childId) continue

    // CF-3A: record provider copy slots that fell back to Orvenix copy (structured, on the section).
    const copyFallback = section.instance?.composition?.creativeCopyFallback
    if (copyFallback?.length && nodes[childId]) nodes[childId].props = { ...nodes[childId].props, creativeCopyFallback: copyFallback }

    /*
     * CF-3E provenance (observed, not assumed): an accepted provider slot is
     * "applied" only if its exact text is in THIS section's final subtree;
     * otherwise the section had no compatible semantic slot for it. Rejected
     * slots stay in creativeCopyFallback; every other text is Orvenix's own.
     */
    const creativeCopy = section.instance?.composition?.creativeCopy
    if (creativeCopy && nodes[childId]) {
      const texts = new Set<string>()
      const walk = (id: string) => {
        const node = nodes[id]
        if (!node) return
        for (const value of [node.props.text, node.props.content]) if (typeof value === "string") texts.add(value)
        node.children.forEach(walk)
      }
      walk(childId)
      const slots = (["eyebrow", "headline", "intro"] as const).filter((slot) => typeof creativeCopy[slot] === "string")
      nodes[childId].props = {
        ...nodes[childId].props,
        creativeCopyProvenance: {
          applied: slots.filter((slot) => texts.has(creativeCopy[slot]!)),
          noCompatibleSlot: slots.filter((slot) => !texts.has(creativeCopy[slot]!)),
        },
      }
    }

    children.push(childId)

    if (nodes[childId]) {
      nodes[childId].parentId = root.id
    }
  }

  // COMMERCE-1: one existing cart shell per page with bound product cards (shared with the COMMERCE-2A binder).
  root.children = injectStoreCartShellNodesV1(nodes, root.id, children, options.accentColor)

  return {
    name: page.name,
    slug: page.slug,
    tree: {
      rootId: root.id,
      nodes,
      seo: {
        title: page.name,
        description: page.purpose,
      },
    },
  }
}

export function compileSiteBlueprint(
  architecture: OrvenixSiteArchitecture,
  options: CompileBlueprintOptions = {},
): CompiledSiteBlueprint {
  const warnings: string[] = []

  const pages = architecture.pages.map((page) =>
    compilePage(page, architecture, options),
  )

  for (const page of pages) {
    const nodeCount = Object.keys(
      page.tree.nodes,
    ).length

    if (nodeCount < 2) {
      warnings.push(
        `La página "${page.name}" contiene muy pocos nodos.`,
      )
    }
  }

  return {
    architecture,
    pages,
    warnings,
  }
}
