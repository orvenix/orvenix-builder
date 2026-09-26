import type { SectionRole } from "@/lib/orvenix-ai/architect"
import {
  resolveCreativeDirectorSectionOrderV1,
} from "@/lib/orvenix-ai/creative-director/section-order"
import type {
  CompositionPlan,
  PageCompositionPlan,
  SectionInstancePlan,
} from "@/lib/orvenix-ai/architect/composition-plan"
import {
  validateAssistedSiteGenerationProposalV1,
} from "./validator"
import type {
  AssistedSiteGenerationInstanceV1,
  AssistedSiteGenerationProposalV1,
} from "./contract"

export type AssistedGenerationPageGroundingV1 = {
  slug: string
  roles: SectionRole[]
}

export type AssistedGenerationGroundingContextV1 = {
  pages: AssistedGenerationPageGroundingV1[]
  servicesCount?: number
  productsCount?: number
}

export type GroundAssistedGenerationResultV1 =
  | {
      accepted: true
      compositionPlan: CompositionPlan
      normalizedProposal: AssistedSiteGenerationProposalV1
      warnings: string[]
      rejectedReasons: string[]
    }
  | {
      accepted: false
      warnings: string[]
      rejectedReasons: string[]
    }

function defaultSelection(): SectionInstancePlan["selection"] {
  return { mode: "all" }
}

function collectionLimitForRole(role: SectionRole, context: AssistedGenerationGroundingContextV1): number | null {
  if (role === "services") return context.servicesCount ?? 0
  if (role === "products") return context.productsCount ?? 0
  return null
}

function selectionIsGrounded(
  instance: AssistedSiteGenerationInstanceV1,
  context: AssistedGenerationGroundingContextV1,
  reasons: string[],
  path: string,
) {
  const selection = instance.selection ?? defaultSelection()
  const limit = collectionLimitForRole(instance.role, context)

  if (selection.mode === "all") return true

  if (limit === null) {
    reasons.push(`${path}: el rol ${instance.role} no tiene coleccion seleccionable.`)
    return false
  }

  if (selection.mode === "single-item") {
    if (typeof selection.itemIndex !== "number" || selection.itemIndex >= limit) {
      reasons.push(`${path}: itemIndex no existe para ${instance.role}.`)
      return false
    }
    return true
  }

  const indexes = selection.indexes ?? []
  const outOfRange = indexes.find((index) => index >= limit)
  if (typeof outOfRange === "number") {
    reasons.push(`${path}: subset contiene un indice inexistente para ${instance.role}.`)
    return false
  }

  return true
}

function buildInstance(
  pageSlug: string,
  instance: AssistedSiteGenerationInstanceV1,
  index: number,
): SectionInstancePlan {
  return {
    id: `${pageSlug}:${instance.role}:assisted:${index}`,
    role: instance.role,
    selection: instance.selection ?? defaultSelection(),
    ...(instance.composition ? { composition: { ...instance.composition } } : {}),
    provenance: "creative-director",
  }
}

function buildDefaultPagePlan(slug: string, roles: SectionRole[]): PageCompositionPlan {
  return {
    slug,
    instances: roles.map((role, index) => ({
      id: `${slug}:${role}:assisted-default:${index}`,
      role,
      selection: defaultSelection(),
      provenance: "deterministic",
    })),
  }
}

export function groundAssistedSiteGenerationProposalV1(params: {
  proposal: unknown
  context: AssistedGenerationGroundingContextV1
}): GroundAssistedGenerationResultV1 {
  const validation = validateAssistedSiteGenerationProposalV1(params.proposal)

  if (validation.ok === false) {
    return {
      accepted: false,
      warnings: validation.warnings,
      rejectedReasons: validation.errors,
    }
  }

  const pagesBySlug = new Map(params.context.pages.map((page) => [page.slug, page]))
  const acceptedPages: PageCompositionPlan[] = []
  const rejectedReasons: string[] = []
  const warnings = [...validation.warnings]

  for (const [pageIndex, page] of validation.value.pages.entries()) {
    const architecturePage = pagesBySlug.get(page.slug)
    const pagePath = `pages[${pageIndex}]`

    if (!architecturePage) {
      rejectedReasons.push(`${pagePath}: la pagina ${page.slug} no existe en la arquitectura Orvenix.`)
      continue
    }

    const allowedRoles = new Set<SectionRole>(architecturePage.roles)

    let orderedRoles = architecturePage.roles
    if (page.sectionOrder) {
      const resolved = resolveCreativeDirectorSectionOrderV1(architecturePage.roles, page.sectionOrder)
      const requested = page.sectionOrder.join("|")
      if (resolved.join("|") !== requested) {
        rejectedReasons.push(`${pagePath}: sectionOrder no preserva los roles estructurales requeridos.`)
        continue
      }
      orderedRoles = resolved as SectionRole[]
    }

    if (!page.instances?.length) {
      acceptedPages.push(buildDefaultPagePlan(page.slug, orderedRoles))
      continue
    }

    const instances: SectionInstancePlan[] = []
    let pageRejected = false

    for (const [instanceIndex, instance] of page.instances.entries()) {
      const instancePath = `${pagePath}.instances[${instanceIndex}]`
      if (!allowedRoles.has(instance.role)) {
        rejectedReasons.push(`${instancePath}: el rol ${instance.role} no existe en esta pagina.`)
        pageRejected = true
        break
      }

      if (!selectionIsGrounded(instance, params.context, rejectedReasons, instancePath)) {
        pageRejected = true
        break
      }

      instances.push(buildInstance(page.slug, instance, instanceIndex))
    }

    if (pageRejected) continue
    acceptedPages.push({ slug: page.slug, instances })
  }

  if (acceptedPages.length === 0) {
    return {
      accepted: false,
      warnings,
      rejectedReasons: rejectedReasons.length ? rejectedReasons : ["La propuesta asistida no produjo paginas aplicables."],
    }
  }

  if (acceptedPages.length < validation.value.pages.length) {
    warnings.push("Algunas paginas asistidas fueron rechazadas localmente; se conservaron solo las paginas coherentes.")
  }

  return {
    accepted: true,
    compositionPlan: {
      version: 1,
      pages: acceptedPages,
    },
    normalizedProposal: validation.value,
    warnings,
    rejectedReasons,
  }
}
