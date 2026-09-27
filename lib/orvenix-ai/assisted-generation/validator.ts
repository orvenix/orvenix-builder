import {
  ASSISTED_SITE_GENERATION_CONTRACT_V1_VERSION,
  ASSISTED_SITE_GENERATION_ROLE_KEY_V1,
  ASSISTED_SITE_GENERATION_SECTION_ROLES_V1,
  ASSISTED_SITE_GENERATION_STRATEGY_KEY_V1,
  type AssistedSiteGenerationCompositionV1,
  type AssistedSiteGenerationInstanceV1,
  type AssistedSiteGenerationPageV1,
  type AssistedSiteGenerationProposalV1,
  type AssistedSiteGenerationSelectionV1,
  type AssistedSiteGenerationValidationResultV1,
} from "./contract"
import {
  ROLE_TREATMENT_VOCABULARY,
  type SectionInstanceTreatment,
} from "@/lib/orvenix-ai/architect/composition-plan"
import {
  SECTION_INSTANCE_ALIGNMENTS,
  SECTION_INSTANCE_MEDIA_STRATEGIES,
  SECTION_INSTANCE_SCALES,
  SECTION_TONE_STRATEGIES,
} from "@/lib/orvenix-ai/composer/composition-context"
import { isValidSectionVisualLayoutPlan } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import type { SectionRole } from "@/lib/orvenix-ai/architect"

export const ASSISTED_SITE_GENERATION_LIMITS_V1 = {
  maxPages: 12,
  maxInstancesPerPage: 32,
  maxSubsetIndexes: 12,
  maxSiteNarrativeLength: 600,
  maxSlugLength: 96,
  maxCategoryKeyLength: 60,
} as const

const DANGEROUS_KEYS = new Set([
  "classname",
  "style",
  "css",
  "html",
  "jsx",
  "component",
  "componentname",
  "script",
  "url",
  "href",
  "src",
  "asseturl",
  "imageurl",
])

const TOP_LEVEL_KEYS = ["version", "roleKey", "strategyKey", "siteNarrative", "pages"] as const
const PAGE_KEYS = ["slug", "sectionOrder", "instances"] as const
const INSTANCE_KEYS = ["role", "selection", "composition"] as const
const SELECTION_KEYS = ["mode", "itemIndex", "indexes", "category"] as const
const COMPOSITION_KEYS = ["treatment", "alignment", "scale", "mediaStrategy", "backgroundStrategy", "layout"] as const

const SECTION_ROLES = new Set<string>(ASSISTED_SITE_GENERATION_SECTION_ROLES_V1)
const SELECTION_MODES = new Set(["all", "single-item", "subset", "category"])
const CATEGORY_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALIGNMENTS = new Set<string>(SECTION_INSTANCE_ALIGNMENTS)
const SCALES = new Set<string>(SECTION_INSTANCE_SCALES)
const MEDIA_STRATEGIES = new Set<string>(SECTION_INSTANCE_MEDIA_STRATEGIES)
const BACKGROUND_STRATEGIES = new Set<string>(SECTION_TONE_STRATEGIES)
const ALL_TREATMENTS = new Set<string>(Object.values(ROLE_TREATMENT_VOCABULARY).flat())

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[], errors: string[], path: string) {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(value)) {
    const normalized = key.toLowerCase()
    if (DANGEROUS_KEYS.has(normalized)) {
      errors.push(`${path}.${key} no esta permitido.`)
      continue
    }
    if (!allowedSet.has(key)) errors.push(`${path}.${key} no es un campo reconocido.`)
  }
}

function validateSelection(value: unknown, errors: string[], path: string): AssistedSiteGenerationSelectionV1 | null {
  if (!isPlainRecord(value)) {
    errors.push(`${path} debe ser un objeto.`)
    return null
  }

  hasOnlyKeys(value, SELECTION_KEYS, errors, path)

  if (typeof value.mode !== "string" || !SELECTION_MODES.has(value.mode)) {
    errors.push(`${path}.mode no es valido.`)
    return null
  }

  const selection: AssistedSiteGenerationSelectionV1 = { mode: value.mode as AssistedSiteGenerationSelectionV1["mode"] }

  if (value.itemIndex !== undefined) {
    if (typeof value.itemIndex !== "number" || !Number.isInteger(value.itemIndex) || value.itemIndex < 0) {
      errors.push(`${path}.itemIndex debe ser un entero no negativo.`)
    } else {
      selection.itemIndex = value.itemIndex
    }
  }

  if (value.indexes !== undefined) {
    if (!Array.isArray(value.indexes)) {
      errors.push(`${path}.indexes debe ser un arreglo.`)
    } else if (value.indexes.length > ASSISTED_SITE_GENERATION_LIMITS_V1.maxSubsetIndexes) {
      errors.push(`${path}.indexes excede el limite permitido.`)
    } else {
      const seen = new Set<number>()
      const indexes: number[] = []
      for (const [index, item] of value.indexes.entries()) {
        if (typeof item !== "number" || !Number.isInteger(item) || item < 0) {
          errors.push(`${path}.indexes[${index}] debe ser un entero no negativo.`)
          continue
        }
        if (seen.has(item)) {
          errors.push(`${path}.indexes contiene indices duplicados.`)
          continue
        }
        seen.add(item)
        indexes.push(item)
      }
      selection.indexes = indexes
    }
  }

  if (value.category !== undefined) {
    if (typeof value.category !== "string" || value.category.length > ASSISTED_SITE_GENERATION_LIMITS_V1.maxCategoryKeyLength || !CATEGORY_KEY_PATTERN.test(value.category)) {
      errors.push(`${path}.category no es una clave de categoria valida.`)
    } else if (selection.mode !== "category") {
      errors.push(`${path}.category solo es valido con mode "category".`)
    } else {
      selection.category = value.category
    }
  }
  if (selection.mode === "category" && typeof selection.category !== "string") {
    errors.push(`${path}.category es requerido para mode "category".`)
  }

  if (selection.mode === "single-item" && typeof selection.itemIndex !== "number") {
    errors.push(`${path}.itemIndex es requerido para single-item.`)
  }
  if (selection.mode === "subset" && (!selection.indexes || selection.indexes.length === 0)) {
    errors.push(`${path}.indexes es requerido para subset.`)
  }

  return selection
}

function validateComposition(value: unknown, role: SectionRole, errors: string[], path: string): AssistedSiteGenerationCompositionV1 | undefined {
  if (value === undefined) return undefined
  if (!isPlainRecord(value)) {
    errors.push(`${path} debe ser un objeto.`)
    return undefined
  }

  hasOnlyKeys(value, COMPOSITION_KEYS, errors, path)

  const composition: AssistedSiteGenerationCompositionV1 = {}

  if (value.treatment !== undefined) {
    if (typeof value.treatment !== "string" || !ALL_TREATMENTS.has(value.treatment)) {
      errors.push(`${path}.treatment no es valido.`)
    } else if (!ROLE_TREATMENT_VOCABULARY[role]?.includes(value.treatment as SectionInstanceTreatment)) {
      errors.push(`${path}.treatment no es ejecutable para el rol ${role}.`)
    } else {
      composition.treatment = value.treatment as SectionInstanceTreatment
    }
  }

  if (value.alignment !== undefined) {
    if (typeof value.alignment !== "string" || !ALIGNMENTS.has(value.alignment)) errors.push(`${path}.alignment no es valido.`)
    else composition.alignment = value.alignment as AssistedSiteGenerationCompositionV1["alignment"]
  }

  if (value.scale !== undefined) {
    if (typeof value.scale !== "string" || !SCALES.has(value.scale)) errors.push(`${path}.scale no es valido.`)
    else composition.scale = value.scale as AssistedSiteGenerationCompositionV1["scale"]
  }

  if (value.mediaStrategy !== undefined) {
    if (typeof value.mediaStrategy !== "string" || !MEDIA_STRATEGIES.has(value.mediaStrategy)) errors.push(`${path}.mediaStrategy no es valido.`)
    else composition.mediaStrategy = value.mediaStrategy as AssistedSiteGenerationCompositionV1["mediaStrategy"]
  }

  if (value.backgroundStrategy !== undefined) {
    if (typeof value.backgroundStrategy !== "string" || !BACKGROUND_STRATEGIES.has(value.backgroundStrategy)) errors.push(`${path}.backgroundStrategy no es valido.`)
    else composition.backgroundStrategy = value.backgroundStrategy as AssistedSiteGenerationCompositionV1["backgroundStrategy"]
  }

  if (value.layout !== undefined) {
    if (!isValidSectionVisualLayoutPlan(value.layout, role)) errors.push(`${path}.layout no es ejecutable para el rol ${role}.`)
    else composition.layout = { ...value.layout }
  }

  return composition
}

function validateInstance(value: unknown, errors: string[], path: string): AssistedSiteGenerationInstanceV1 | null {
  if (!isPlainRecord(value)) {
    errors.push(`${path} debe ser un objeto.`)
    return null
  }

  hasOnlyKeys(value, INSTANCE_KEYS, errors, path)

  if (typeof value.role !== "string" || !SECTION_ROLES.has(value.role)) {
    errors.push(`${path}.role no es valido.`)
    return null
  }

  const role = value.role as SectionRole
  const selection = value.selection === undefined
    ? undefined
    : validateSelection(value.selection, errors, `${path}.selection`)
  const composition = validateComposition(value.composition, role, errors, `${path}.composition`)

  return {
    role,
    ...(selection ? { selection } : {}),
    ...(composition ? { composition } : {}),
  }
}

function validatePage(value: unknown, errors: string[], path: string): AssistedSiteGenerationPageV1 | null {
  if (!isPlainRecord(value)) {
    errors.push(`${path} debe ser un objeto.`)
    return null
  }

  hasOnlyKeys(value, PAGE_KEYS, errors, path)

  if (typeof value.slug !== "string" || value.slug.trim().length === 0 || value.slug.length > ASSISTED_SITE_GENERATION_LIMITS_V1.maxSlugLength) {
    errors.push(`${path}.slug no es valido.`)
    return null
  }

  const page: AssistedSiteGenerationPageV1 = { slug: value.slug.trim() }

  if (value.sectionOrder !== undefined) {
    if (!Array.isArray(value.sectionOrder)) {
      errors.push(`${path}.sectionOrder debe ser un arreglo.`)
    } else {
      const roles: SectionRole[] = []
      for (const [index, role] of value.sectionOrder.entries()) {
        if (typeof role !== "string" || !SECTION_ROLES.has(role)) errors.push(`${path}.sectionOrder[${index}] no es un rol valido.`)
        else roles.push(role as SectionRole)
      }
      page.sectionOrder = roles
    }
  }

  if (value.instances !== undefined) {
    if (!Array.isArray(value.instances)) {
      errors.push(`${path}.instances debe ser un arreglo.`)
    } else if (value.instances.length > ASSISTED_SITE_GENERATION_LIMITS_V1.maxInstancesPerPage) {
      errors.push(`${path}.instances excede el limite permitido.`)
    } else {
      const instances: AssistedSiteGenerationInstanceV1[] = []
      for (const [index, instance] of value.instances.entries()) {
        const normalized = validateInstance(instance, errors, `${path}.instances[${index}]`)
        if (normalized) instances.push(normalized)
      }
      page.instances = instances
    }
  }

  return page
}

export function validateAssistedSiteGenerationProposalV1(value: unknown): AssistedSiteGenerationValidationResultV1 {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isPlainRecord(value)) {
    return { ok: false, errors: ["La propuesta asistida debe ser un objeto."], warnings }
  }

  hasOnlyKeys(value, TOP_LEVEL_KEYS, errors, "$")

  if (value.version !== ASSISTED_SITE_GENERATION_CONTRACT_V1_VERSION) errors.push("$.version no es valido.")
  if (value.roleKey !== ASSISTED_SITE_GENERATION_ROLE_KEY_V1) errors.push("$.roleKey no es valido.")
  if (value.strategyKey !== ASSISTED_SITE_GENERATION_STRATEGY_KEY_V1) errors.push("$.strategyKey no es valido.")

  const proposal: AssistedSiteGenerationProposalV1 = {
    version: ASSISTED_SITE_GENERATION_CONTRACT_V1_VERSION,
    roleKey: ASSISTED_SITE_GENERATION_ROLE_KEY_V1,
    strategyKey: ASSISTED_SITE_GENERATION_STRATEGY_KEY_V1,
    pages: [],
  }

  if (value.siteNarrative !== undefined) {
    if (typeof value.siteNarrative !== "string" || value.siteNarrative.length > ASSISTED_SITE_GENERATION_LIMITS_V1.maxSiteNarrativeLength) {
      errors.push("$.siteNarrative no es valido.")
    } else {
      proposal.siteNarrative = value.siteNarrative.trim()
    }
  }

  if (!Array.isArray(value.pages)) {
    errors.push("$.pages debe ser un arreglo.")
  } else if (value.pages.length === 0) {
    errors.push("$.pages no puede estar vacio.")
  } else if (value.pages.length > ASSISTED_SITE_GENERATION_LIMITS_V1.maxPages) {
    errors.push("$.pages excede el limite permitido.")
  } else {
    const slugs = new Set<string>()
    for (const [index, page] of value.pages.entries()) {
      const normalized = validatePage(page, errors, `$.pages[${index}]`)
      if (!normalized) continue
      if (slugs.has(normalized.slug)) {
        errors.push(`$.pages[${index}].slug esta duplicado.`)
        continue
      }
      slugs.add(normalized.slug)
      proposal.pages.push(normalized)
    }
  }

  return errors.length > 0 ? { ok: false, errors, warnings } : { ok: true, value: proposal, warnings }
}
