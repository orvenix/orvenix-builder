import type { OrvenixSiteArchitecture, OrvenixSitePagePlan } from "@/lib/orvenix-ai/architect"
import type { CommercialSectionFactsV1, CommercialSectionMediaV1 } from "@/lib/orvenix-ai/composer"
import {
  CREATIVE_DIRECTOR_CONTRACT_V1_VERSION,
  type CreativeDirectorPageDirectionV1,
  type CreativeSiteDirectionV1,
} from "@/lib/orvenix-ai/creative-director/contract"
import { getDefaultStarterEditorTree } from "@/lib/editorWebs"
import type { SiteCreationPlanV2DesignSourceV1 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import type { GlobalTheme } from "@/types/editor"
import type { BusinessFactAssetV1, BusinessFactsV1, BusinessProjectFactV1 } from "./business-facts"
import { COMMERCIAL_SECTION_BOUND_ASSET_ROLES_V1 } from "./contract"
import type {
  CommercialAssetRoleV1,
  CommercialDesignV1,
  CommercialFactKeyV1,
  CommercialPagePinsV1,
  CommercialPageRecipeV1,
  CommercialSectionRoleV1,
} from "./contract"

/**
 * CSC-1B: pure, deterministic resolution of (CommercialDesignV1 +
 * BusinessFactsV1) into the EXISTING builder's inputs:
 *   - OrvenixSiteArchitecture (pages/sections from the recipe, minus
 *     anything whose required facts/assets are missing),
 *   - the shared GlobalTheme (theme seed over the starter theme),
 *   - a CreativeSiteDirectionV1 carrying ONLY the design's bounded pins
 *     (no copy suggestions, no provider involvement),
 *   - strict commercial facts + resolved primary conversion action,
 *   - asset-role bindings and per-page SEO.
 * The SAME resolution runs for the demo showcase and the real customer
 * site; only the facts differ.
 */

export type CommercialOmissionV1 = { page: string; role?: CommercialSectionRoleV1; reason: string }

export interface ResolvedCommercialDesignV1 {
  designSource: SiteCreationPlanV2DesignSourceV1
  architecture: OrvenixSiteArchitecture
  theme: GlobalTheme
  direction: CreativeSiteDirectionV1
  commercialFacts: CommercialSectionFactsV1
  assets: {
    hero?: BusinessFactAssetV1
    serviceImages: BusinessFactAssetV1[]
    logo?: BusinessFactAssetV1
    heroProject?: BusinessFactAssetV1
    featuredProject: BusinessFactAssetV1[]
    projectProgress: BusinessFactAssetV1[]
    specialtyService?: BusinessFactAssetV1
    companyProof: BusinessFactAssetV1[]
    projectGallery: BusinessFactAssetV1[]
  }
  /** CSC-1C: per page slug -> section role -> assets bound by that section's declared asset roles. */
  sectionMedia: Record<string, Partial<Record<CommercialSectionRoleV1, CommercialSectionMediaV1>>>
  seoBySlug: Record<string, { title: string; description: string }>
  /** Section role list per compiled page slug -- the design skeleton actually requested. */
  skeleton: Array<{ slug: string; roles: CommercialSectionRoleV1[] }>
  omissions: CommercialOmissionV1[]
}

const SECTION_PURPOSES: Record<CommercialSectionRoleV1, string> = {
  navigation: "Navegación del sitio.",
  hero: "Presentar el negocio y su acción principal.",
  services: "Mostrar los servicios reales del negocio.",
  features: "Explicar cómo atiende el negocio con datos reales.",
  pricing: "Mostrar precios publicados por el negocio.",
  process: "Explicar cómo empezar.",
  gallery: "Mostrar trabajos reales del negocio.",
  trust: "Mostrar evidencia real de confianza.",
  testimonials: "Mostrar opiniones reales de clientes.",
  faq: "Resolver dudas reales.",
  cta: "Invitar al siguiente paso.",
  contact: "Facilitar el contacto directo.",
  footer: "Cerrar con datos reales del negocio.",
}

const PAGE_PURPOSES: Record<CommercialPageRecipeV1["archetype"], string> = {
  overview: "Presentar el negocio y llevar al contacto.",
  catalog: "Detallar los servicios del negocio.",
  conversion: "Contactar al negocio por sus canales reales.",
}

const RADIUS: Record<CommercialDesignV1["theme"]["radius"], { card: string; button: string }> = {
  sharp: { card: "6px", button: "6px" },
  soft: { card: "18px", button: "14px" },
  pill: { card: "24px", button: "999px" },
}

const SHADOW: Record<CommercialDesignV1["theme"]["shadow"], { soft: string; strong: string }> = {
  none: { soft: "none", strong: "none" },
  soft: { soft: "0 12px 32px rgba(15,23,42,0.08)", strong: "0 24px 60px rgba(15,23,42,0.14)" },
  strong: { soft: "0 18px 44px rgba(15,23,42,0.16)", strong: "0 32px 80px rgba(15,23,42,0.24)" },
}

export function hasCommercialFactV1(facts: BusinessFactsV1, key: CommercialFactKeyV1): boolean {
  const contact = facts.evidence.contact
  switch (key) {
    case "businessName": return Boolean(facts.businessName)
    case "contactChannel": return Boolean(contact?.whatsapp || contact?.phone || contact?.email)
    case "whatsapp": return Boolean(contact?.whatsapp)
    case "phone": return Boolean(contact?.phone)
    case "email": return Boolean(contact?.email)
    case "logo": return Boolean(facts.assets.logo)
    case "tagline": return Boolean(facts.tagline)
    case "address": return Boolean(facts.address)
    case "hours": return Boolean(facts.hours)
    case "serviceArea": return facts.serviceArea.length > 0
    case "services": return facts.services.length > 0
    case "servicePrices": return facts.services.some((service) => Boolean(service.priceLabel))
    case "social": return facts.social.length > 0
    case "faq": return facts.faq.length > 0
    case "testimonials": return Boolean(facts.evidence.testimonials?.length)
    case "people": return Boolean(facts.evidence.people?.length)
    case "projects": return facts.projects.length > 0
    case "projectEvidence": return facts.projects.length > 0 || PROJECT_EVIDENCE_ROLES.some((role) => hasCommercialAssetV1(facts, role))
    case "projectProgress": return facts.projects.some((project) => project.progressAssets.length > 0) || facts.assets.projectProgress.length > 0
    case "projectDetail": return Boolean(projectDetailCandidateV1(facts))
  }
}

const PROJECT_EVIDENCE_ROLES: CommercialAssetRoleV1[] = ["heroProject", "featuredProject", "projectProgress", "companyProof", "projectGallery"]

/** CSC-1C: the first project with a narrative AND its own images -- the only project a detail page may present. */
export function projectDetailCandidateV1(facts: BusinessFactsV1): BusinessProjectFactV1 | undefined {
  return facts.projects.find((project) => Boolean(project.summary || project.description) && project.assets.length + project.progressAssets.length > 0)
}

type ProjectAssetRoleV1 = (typeof COMMERCIAL_SECTION_BOUND_ASSET_ROLES_V1)[number]

function uniqueAssets(assets: BusinessFactAssetV1[], max: number): BusinessFactAssetV1[] {
  const seen = new Set<string>()
  const out: BusinessFactAssetV1[] = []
  for (const asset of assets) {
    if (seen.has(asset.src)) continue
    seen.add(asset.src)
    out.push({ ...asset })
    if (out.length >= max) break
  }
  return out
}

/**
 * CSC-1C: one deterministic pool per project-evidence role. Explicit
 * role assets come first; project facts contribute their own images
 * (main images -> featured/gallery, progress images -> progress). Each
 * asset keeps its curated sameProjectId; nothing is inferred.
 */
function projectAssetPools(facts: BusinessFactsV1): Record<ProjectAssetRoleV1, BusinessFactAssetV1[]> {
  const projectMain = facts.projects.flatMap((project) => project.assets)
  const projectProgress = facts.projects.flatMap((project) => project.progressAssets)
  return {
    heroProject: facts.assets.heroProject ? [{ ...facts.assets.heroProject }] : [],
    featuredProject: uniqueAssets([...facts.assets.featuredProject, ...facts.projects.flatMap((project) => project.assets.slice(0, 1))], 6),
    projectProgress: uniqueAssets([...facts.assets.projectProgress, ...projectProgress], 8),
    specialtyService: facts.assets.specialtyService ? [{ ...facts.assets.specialtyService }] : [],
    companyProof: uniqueAssets(facts.assets.companyProof, 6),
    projectGallery: uniqueAssets([...facts.assets.projectGallery, ...projectMain], 10),
  }
}

function isBoundRole(role: CommercialAssetRoleV1): role is ProjectAssetRoleV1 {
  return (COMMERCIAL_SECTION_BOUND_ASSET_ROLES_V1 as readonly string[]).includes(role)
}

/**
 * CSC-1C: bind a section's declared asset roles (in order) to supplied
 * assets. An asset already bound earlier on the same page (an earlier
 * section or role) is not repeated. A focused (project-detail) section only
 * sees assets of the focused project. Sections declaring no bound role
 * get no binding at all (their CSC-1B behavior is unchanged).
 */
function bindSectionMedia(
  roles: CommercialAssetRoleV1[],
  pools: Record<ProjectAssetRoleV1, BusinessFactAssetV1[]>,
  focus: BusinessProjectFactV1 | undefined,
  seen: Set<string>,
  options: { consumeMediaOnly: boolean },
): CommercialSectionMediaV1 | undefined {
  const declaredRoles = roles.filter(isBoundRole)
  if (!declaredRoles.length) return undefined
  const byRole: CommercialSectionMediaV1["byRole"] = {}
  let media: BusinessFactAssetV1 | undefined
  for (const role of declaredRoles) {
    const pool = focus
      ? role === "projectProgress"
        ? focus.progressAssets
        : role === "heroProject" || role === "featuredProject" || role === "projectGallery"
          ? focus.assets
          : []
      : pools[role]
    const assets = pool.filter((asset) => !seen.has(asset.src) && asset.src !== media?.src).map((asset) => ({ ...asset }))
    if (!assets.length) continue
    // A hero shows only its media; any other section shows (and consumes) every bound asset.
    if (!options.consumeMediaOnly) assets.forEach((asset) => seen.add(asset.src))
    byRole[role] = assets
    media ??= assets[0]
  }
  if (options.consumeMediaOnly && media) seen.add(media.src)
  return { declaredRoles, ...(media ? { media } : {}), byRole, ...(focus ? { focusProjectIds: [focus.id] } : {}) }
}

export function hasCommercialAssetV1(facts: BusinessFactsV1, role: CommercialAssetRoleV1): boolean {
  if (role === "hero") return Boolean(facts.assets.hero)
  if (role === "serviceImage") return facts.assets.serviceImages.length > 0
  if (role === "heroProject") return Boolean(facts.assets.heroProject)
  if (role === "featuredProject") return facts.assets.featuredProject.length > 0 || facts.projects.some((project) => project.assets.length > 0)
  if (role === "projectProgress") return facts.assets.projectProgress.length > 0 || facts.projects.some((project) => project.progressAssets.length > 0)
  if (role === "specialtyService") return Boolean(facts.assets.specialtyService)
  if (role === "companyProof") return facts.assets.companyProof.length > 0
  if (role === "projectGallery") return facts.assets.projectGallery.length > 0 || facts.projects.some((project) => project.assets.length > 0 || project.progressAssets.length > 0)
  return false
}

function missingCondition(facts: BusinessFactsV1, condition: string): boolean {
  if (condition.startsWith("asset:")) return !hasCommercialAssetV1(facts, condition.slice(6) as CommercialAssetRoleV1)
  return !hasCommercialFactV1(facts, condition as CommercialFactKeyV1)
}

function resolvePins(page: CommercialPageRecipeV1, facts: BusinessFactsV1): CommercialPagePinsV1 {
  let pins: CommercialPagePinsV1 = { ...(page.pins ?? {}) }
  for (const fallback of page.pinFallbacks ?? []) {
    if (missingCondition(facts, fallback.whenMissing)) pins = { ...pins, ...fallback.pins }
  }
  return pins
}

function resolvePrimaryCta(design: CommercialDesignV1, facts: BusinessFactsV1, pageSlugs: ReadonlySet<string>): { label: string; href: string } {
  const contact = facts.evidence.contact
  const contactPage = pageSlugs.has("contacto") ? "page:contacto" : undefined
  for (const intent of design.conversion.primary) {
    if (intent === "whatsapp" && contact?.whatsapp) {
      return { label: "Escribir por WhatsApp", href: `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hola ${facts.businessName}, quiero información.`)}` }
    }
    if (intent === "quote") {
      if (contact?.whatsapp) return { label: "Solicitar cotización", href: `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hola ${facts.businessName}, quiero una cotización.`)}` }
      if (contactPage) return { label: "Solicitar cotización", href: contactPage }
    }
    if (intent === "contact") {
      if (contactPage) return { label: "Contactar", href: contactPage }
      if (contact?.phone) return { label: "Llamar ahora", href: `tel:${contact.phone}` }
      if (contact?.email) return { label: "Enviar correo", href: `mailto:${contact.email}` }
    }
  }
  // Minimum facts guarantee at least one channel exists.
  if (contact?.phone) return { label: "Llamar ahora", href: `tel:${contact.phone}` }
  return { label: "Enviar correo", href: `mailto:${contact?.email ?? ""}` }
}

/**
 * CSC-1C: Orvenix-authored hero copy for pages whose intent is evident from
 * their fact requirements -- built ONLY from authoritative facts (project
 * title/summary, business name/description/service area), never AI and
 * never a claim. Every other page keeps the existing page-aware hero copy.
 */
function factHeroCopy(page: CommercialPageRecipeV1, facts: BusinessFactsV1, detailProject: BusinessProjectFactV1 | undefined): { title: string; description: string } | undefined {
  const area = facts.serviceArea.length ? ` en ${facts.serviceArea.slice(0, 3).join(", ")}` : ""
  if (page.requiresFacts?.includes("projectDetail") && detailProject) {
    return { title: detailProject.title, description: detailProject.summary ?? `Proyecto de ${facts.businessName}.` }
  }
  if (page.slug !== "home" && page.requiresFacts?.includes("projectEvidence")) {
    return { title: `Proyectos de ${facts.businessName}`, description: `Fotografías y datos de obras de ${facts.businessName}${area}.` }
  }
  if (page.slug !== "home" && page.archetype === "overview") {
    return { title: `Conoce a ${facts.businessName}`, description: facts.description ?? `Platica tu proyecto con ${facts.businessName}${area}.` }
  }
  return undefined
}

function seoTitle(design: CommercialDesignV1, pageName: string, businessName: string): string {
  return design.seo.titlePattern === "business-page" ? `${businessName} · ${pageName}` : `${pageName} · ${businessName}`
}

function seoDescription(page: CommercialPageRecipeV1, facts: BusinessFactsV1): string {
  if (page.requiresFacts?.includes("projectDetail")) {
    const project = projectDetailCandidateV1(facts)
    if (project) return `${project.title} · ${facts.businessName}${project.summary ? `: ${project.summary}` : "."}`
  }
  const services = facts.services.slice(0, 3).map((service) => service.name).join(", ")
  const area = facts.serviceArea.length ? ` en ${facts.serviceArea.slice(0, 3).join(", ")}` : ""
  if (page.archetype === "conversion") return `Contacta a ${facts.businessName}${area}.`
  if (services) return `${facts.businessName}: ${services}${area}.`
  return facts.description ?? `${facts.businessName}${area}.`
}

function buildTheme(design: CommercialDesignV1): GlobalTheme {
  const starter = getDefaultStarterEditorTree()
  const base = structuredClone(starter.globalTheme ?? starter.theme ?? {}) as GlobalTheme
  return {
    ...base,
    colors: { ...design.theme.colors },
    fontHeading: design.theme.fontHeading,
    fontBody: design.theme.fontBody,
    radius: { ...RADIUS[design.theme.radius] },
    shadow: { ...SHADOW[design.theme.shadow] },
  }
}

export function resolveCommercialDesignV1(design: CommercialDesignV1, facts: BusinessFactsV1): ResolvedCommercialDesignV1 {
  const omissions: CommercialOmissionV1[] = []

  const keptPages = design.pages.filter((page) => {
    const missing = (page.requiresFacts ?? []).filter((key) => !hasCommercialFactV1(facts, key))
    if (missing.length) omissions.push({ page: page.slug, reason: `missing_facts:${missing.join(",")}` })
    return missing.length === 0
  })
  const pageSlugs = new Set(keptPages.map((page) => page.slug))
  const detailProject = projectDetailCandidateV1(facts)

  const skeleton: ResolvedCommercialDesignV1["skeleton"] = []
  const pages: OrvenixSitePagePlan[] = keptPages.map((page) => {
    const roles: CommercialSectionRoleV1[] = []
    const sections = page.sections.filter((section) => {
      const missingFacts = (section.requiresFacts ?? []).filter((key) => !hasCommercialFactV1(facts, key))
      const missingAssets = (section.requiresAssets ?? []).filter((role) => !hasCommercialAssetV1(facts, role))
      if (missingFacts.length || missingAssets.length) {
        omissions.push({ page: page.slug, role: section.role, reason: [...missingFacts.map((key) => `missing_fact:${key}`), ...missingAssets.map((role) => `missing_asset:${role}`)].join(",") })
        return false
      }
      roles.push(section.role)
      return true
    })
    skeleton.push({ slug: page.slug, roles })
    return {
      name: page.name,
      slug: page.slug,
      purpose: PAGE_PURPOSES[page.archetype],
      archetype: page.archetype,
      sections: sections.map((section) => ({ role: section.role, blockType: null, purpose: SECTION_PURPOSES[section.role] })),
    }
  })

  const pageDirections: CreativeDirectorPageDirectionV1[] = keptPages.map((page) => {
    const pins = resolvePins(page, facts)
    const heroCopy = factHeroCopy(page, facts, detailProject)
    return {
      slug: page.slug,
      narrativeGoal: "commercial-design",
      ...(heroCopy ? { heroTitleSuggestion: heroCopy.title, heroDescriptionSuggestion: heroCopy.description } : {}),
      ...(pins.heroVariant ? { preferredHeroVariant: pins.heroVariant } : {}),
      ...(pins.heroTreatment ? { heroTreatment: pins.heroTreatment } : {}),
      ...(pins.processTreatment ? { processTreatment: pins.processTreatment } : {}),
      ...(pins.sectionToneStrategy ? { sectionToneStrategy: pins.sectionToneStrategy } : {}),
    }
  })

  const chrome = design.chrome
  const direction: CreativeSiteDirectionV1 = {
    version: CREATIVE_DIRECTOR_CONTRACT_V1_VERSION,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "commercial-design",
    ...(chrome.density ? { density: chrome.density } : {}),
    ...(chrome.navigationSurfaceStyle ? { navigationSurfaceStyle: chrome.navigationSurfaceStyle } : {}),
    ...(chrome.navigationContainment ? { navigationContainment: chrome.navigationContainment } : {}),
    ...(chrome.navigationLinkStyle ? { navigationLinkStyle: chrome.navigationLinkStyle } : {}),
    ...(chrome.navigationCtaEmphasis ? { navigationCtaEmphasis: chrome.navigationCtaEmphasis } : {}),
    ...(chrome.trustTreatment ? { trustTreatment: chrome.trustTreatment } : {}),
    ...(chrome.pricingTreatment ? { pricingTreatment: chrome.pricingTreatment } : {}),
    pageDirections,
  }

  const commercialFacts: CommercialSectionFactsV1 = {
    ...(facts.address ? { address: facts.address } : {}),
    ...(facts.hours ? { hours: facts.hours } : {}),
    ...(facts.serviceArea.length ? { serviceArea: [...facts.serviceArea] } : {}),
    ...(chrome.showLogo && facts.assets.logo ? { logoUrl: facts.assets.logo.src } : {}),
    ...(facts.tagline ? { tagline: facts.tagline } : {}),
    ...(facts.social.length ? { social: facts.social.map((entry) => ({ ...entry })) } : {}),
    ...(facts.faq.length ? { faq: facts.faq.map((entry) => ({ ...entry })) } : {}),
    ...(facts.projects.length
      ? {
          projects: facts.projects.map((project) => ({
            id: project.id,
            title: project.title,
            ...(project.summary ? { summary: project.summary } : {}),
            ...(project.category ? { category: project.category } : {}),
            ...(project.location ? { location: project.location } : {}),
            ...(project.status ? { status: project.status } : {}),
            ...(project.year ? { year: project.year } : {}),
            ...(project.description ? { description: project.description } : {}),
            ...(project.progressSequence ? { progressSequence: project.progressSequence } : {}),
          })),
        }
      : {}),
    ...(() => {
      const projectsPage = keptPages.find((page) => page.slug !== "home" && page.requiresFacts?.includes("projectEvidence"))
      return projectsPage ? { projectsHref: `page:${projectsPage.slug}` } : {}
    })(),
    ...(detailProject ? (() => {
      const detailPage = keptPages.find((page) => page.requiresFacts?.includes("projectDetail"))
      return detailPage ? { projectDetailHref: `page:${detailPage.slug}` } : {}
    })() : {}),
    footerPreset: chrome.footerPreset,
    primaryCta: resolvePrimaryCta(design, facts, pageSlugs),
  }

  const architecture: OrvenixSiteArchitecture = {
    siteType: design.siteType,
    industry: design.catalog.name,
    objective: "Conseguir solicitudes de servicio",
    pages,
    businessName: facts.businessName,
    ...(facts.services.length ? { services: facts.services.map((service) => ({ ...service })) } : {}),
    ...(facts.location ? { location: facts.location } : {}),
  }

  const pools = projectAssetPools(facts)
  const sectionMedia: ResolvedCommercialDesignV1["sectionMedia"] = {}
  for (const page of keptPages) {
    const focus = page.requiresFacts?.includes("projectDetail") ? detailProject : undefined
    const seenOnPage = new Set<string>()
    for (const section of page.sections) {
      if (!section.assetRoles?.length || !skeleton.find((entry) => entry.slug === page.slug)?.roles.includes(section.role)) continue
      const bound = bindSectionMedia(section.assetRoles, pools, focus, seenOnPage, { consumeMediaOnly: section.role === "hero" })
      if (bound) (sectionMedia[page.slug] ??= {})[section.role] = bound
    }
  }

  const seoBySlug = Object.fromEntries(keptPages.map((page) => {
    const pageTitle = page.requiresFacts?.includes("projectDetail") && detailProject ? detailProject.title : page.name
    return [page.slug, { title: seoTitle(design, pageTitle, facts.businessName), description: seoDescription(page, facts) }]
  }))

  return {
    designSource: { kind: "commercial", id: design.id, version: design.version },
    architecture,
    theme: buildTheme(design),
    direction,
    commercialFacts,
    assets: {
      ...(facts.assets.hero ? { hero: facts.assets.hero } : {}),
      serviceImages: facts.assets.serviceImages.map((asset) => ({ ...asset })),
      ...(facts.assets.logo ? { logo: facts.assets.logo } : {}),
      ...(facts.assets.heroProject ? { heroProject: { ...facts.assets.heroProject } } : {}),
      featuredProject: pools.featuredProject,
      projectProgress: pools.projectProgress,
      ...(facts.assets.specialtyService ? { specialtyService: { ...facts.assets.specialtyService } } : {}),
      companyProof: pools.companyProof,
      projectGallery: pools.projectGallery,
    },
    sectionMedia,
    seoBySlug,
    skeleton,
    omissions,
  }
}
