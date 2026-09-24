import type {
  AccentTendency,
  AlignmentTendency,
  AssetPlacement,
  AssetStrategy,
  BackgroundRhythm,
  ContactPattern,
  ContrastTendency,
  CtaArrangement,
  CtaStrategy,
  DensityTendency,
  DesignPersonality,
  DesignReferenceId,
  DistinctiveTrait,
  HeroBackgroundTreatment,
  HeroMediaStrategy,
  RadiusTendency,
  SectionTreatment,
  ShadowTendency,
  ThemeMode,
  VisualFamily,
} from "@/lib/orvenix-ai/design-reference/contract"
import type {
  ContributionRole,
  DesignReferenceRetrievalResult,
  DesignReferenceSelection,
  DiversityReason,
} from "@/lib/orvenix-ai/design-reference/retrieval-contract"

/**
 * V2-5C: the SANITIZED, provider-neutral representation of a selected
 * DesignReference that the Creative Director is actually allowed to see.
 *
 * By construction this can carry no source copy/URLs/PII: DesignReference
 * itself has no free-text field anywhere (design-reference/contract.ts's
 * module header; sanitize.ts is the defense-in-depth verification of
 * that invariant) -- every field below is copied from a bounded-
 * vocabulary token, a small closed enum array, or a rounded score that
 * already exists on the retrieval SELECTION. This module does not widen
 * that surface; it narrows it further, to only what is useful DESIGN
 * REASONING (never retrieval-implementation diagnostics like
 * candidatePoolIds/appliedWeights/scoreComponents, which describe HOW
 * retrieval scored things, not WHAT the design grammar is).
 *
 * `id` exists for traceability only (eg. logging/diagnostics) -- nothing
 * in this module or downstream (testing-provider.ts, contract.ts) maps
 * an id to a treatment; see creative-director-reference-augmented-v2-5c
 * tests for the explicit proof of that invariant.
 */
export interface CreativeDesignReferenceV1 {
  id: DesignReferenceId
  relevance: {
    contributionRoles: ContributionRole[]
    diversityReason: DiversityReason
    relevanceScore: number
  }
  visualGrammar: {
    visualFamily: VisualFamily
    designPersonality: DesignPersonality
    mode: ThemeMode
    accent: AccentTendency
    radius: RadiusTendency
    shadow: ShadowTendency
    contrast: ContrastTendency
  }
  heroGrammar: {
    backgroundTreatment: HeroBackgroundTreatment
    alignment: AlignmentTendency
    mediaStrategy: HeroMediaStrategy
    ctaArrangement: CtaArrangement
  }
  sectionGrammar: {
    recurringTreatments: SectionTreatment[]
    density: DensityTendency
    backgroundRhythm: BackgroundRhythm
  }
  assetGrammar: {
    strategy: AssetStrategy
    placement: AssetPlacement
  }
  conversionGrammar: {
    ctaStrategy: CtaStrategy
    contactPattern: ContactPattern
  }
  distinctiveTraits: DistinctiveTrait[]
}

/** Hard cap mirroring retrieval's own MAX_RESULT_COUNT -- defense in depth, never a place a longer list could sneak into the CD request. */
const MAX_REFERENCE_CONTEXT_SIZE = 4

function sanitizeSelection(selection: DesignReferenceSelection): CreativeDesignReferenceV1 {
  const reference = selection.reference

  return {
    id: reference.id,
    relevance: {
      contributionRoles: [...selection.contributionRoles],
      diversityReason: selection.diversityReason,
      relevanceScore: selection.relevanceScore,
    },
    visualGrammar: {
      visualFamily: reference.identity.visualFamily,
      designPersonality: reference.identity.designPersonality,
      mode: reference.themeGrammar.mode,
      accent: reference.themeGrammar.accent,
      radius: reference.themeGrammar.radius,
      shadow: reference.themeGrammar.shadow,
      contrast: reference.themeGrammar.contrast,
    },
    heroGrammar: {
      backgroundTreatment: reference.heroGrammar.backgroundTreatment,
      alignment: reference.heroGrammar.alignment,
      mediaStrategy: reference.heroGrammar.mediaStrategy,
      ctaArrangement: reference.heroGrammar.ctaArrangement,
    },
    sectionGrammar: {
      recurringTreatments: [...reference.sectionGrammar.recurringTreatments],
      density: reference.sectionGrammar.density,
      backgroundRhythm: reference.compositionGrammar.backgroundRhythm,
    },
    assetGrammar: {
      strategy: reference.assetGrammar.strategy,
      placement: reference.assetGrammar.placement,
    },
    conversionGrammar: {
      ctaStrategy: reference.conversionGrammar.ctaStrategy,
      contactPattern: reference.conversionGrammar.contactPattern,
    },
    distinctiveTraits: [...reference.distinctiveTraits],
  }
}

/**
 * Builds the sanitized reference context the Creative Director request
 * actually carries, from ONE retrieveDesignReferences() result (see
 * retrieval-query.ts / site-creation/creative-direction.ts for where
 * that single per-request call happens). Never selects a "winning"
 * reference -- every returned selection is included, up to the bound.
 */
export function buildCreativeDirectorReferenceContextV1(
  result: DesignReferenceRetrievalResult,
): CreativeDesignReferenceV1[] {
  return result.selections.slice(0, MAX_REFERENCE_CONTEXT_SIZE).map(sanitizeSelection)
}
