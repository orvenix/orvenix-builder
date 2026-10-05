import { STRUCTURAL_TREATMENT_MAX_ITEMS } from "@/lib/orvenix-ai/composer/section-composer"
import type { EditorNode, EditorTree } from "@/types/editor"

import type { BusinessFactAssetV1, BusinessFactsV1, BusinessProjectFactV1 } from "./business-facts"

/**
 * CV1-1b: explicit empty states for "demo-shape" commercial designs.
 *
 * The approved demo fixes the SHAPE of a design (how many services, FAQ
 * entries, projects, images; which optional facts exist). A customer who
 * has not provided something yet gets an explicit, editable empty state in
 * that position -- never a demo value, never an invented claim -- so the
 * first editor open keeps the exact composition the customer selected.
 *
 * The public runtime (siteRuntimeContext) strips whatever is still an empty
 * state, so placeholders are never published as content.
 */

export const COMMERCIAL_EMPTY_TEXT_V1 = {
  tagline: "Agrega una frase que describa tu negocio",
  hours: "Agrega tu horario",
  address: "Agrega tu dirección",
  serviceName: "Agrega un servicio",
  serviceDescription: "Describe este servicio para tus clientes.",
  price: "Agrega tu precio",
  faqQuestion: "Agrega una pregunta frecuente",
  faqAnswer: "Escribe aquí la respuesta para tus clientes.",
  projectTitle: "Agrega un proyecto",
  projectSummary: "Describe este proyecto en una frase.",
  projectDescription: "Cuenta el alcance del proyecto, los materiales y lo que necesitaba tu cliente.",
  projectCategory: "Agrega la categoría",
  projectLocation: "Agrega la ubicación",
  testimonialQuote: "Agrega una reseña real de un cliente",
  testimonialAuthor: "Nombre del cliente",
  personName: "Agrega a una persona de tu equipo",
  personRole: "Agrega su puesto",
  benefitTitle: "Agrega cómo atiendes a tus clientes",
  benefitDescription: "Describe un dato real de tu servicio: horario, zona, garantía o forma de contacto.",
  imageAlt: "Agrega tu imagen",
} as const

/** Main services a demo-shape design composes (the composer's structural range). */
export const COMMERCIAL_FIDELITY_MAX_SERVICES_V1 = STRUCTURAL_TREATMENT_MAX_ITEMS

/** Served from public/commercial-placeholder; never an upload, never a demo photo. */
export const COMMERCIAL_EMPTY_IMAGE_PREFIX_V1 = "/commercial-placeholder/"
const EMPTY_IMAGE_FILE = `${COMMERCIAL_EMPTY_IMAGE_PREFIX_V1}agrega-tu-imagen.svg`

/** Marker set on a top-level section that exists only as an empty state (hidden publicly until filled). */
export const COMMERCIAL_EMPTY_SECTION_PROP_V1 = "commercialEmptyState"
/** Root markers: every page of a demo-shape customer site / a page that exists only as an empty state. */
export const COMMERCIAL_FIDELITY_ROOT_PROP_V1 = "commercialDesignFidelity"
export const COMMERCIAL_EMPTY_PAGE_PROP_V1 = "commercialEmptyPage"

const EMPTY_TEXTS: readonly string[] = Object.values(COMMERCIAL_EMPTY_TEXT_V1)
const TEXT_PROP_KEYS = ["text", "content", "label", "title", "description", "quote", "author"] as const

/** Each slot gets a distinct src: asset pools de-duplicate by src. */
export function commercialEmptyImageSrcV1(slot: string): string {
  return `${EMPTY_IMAGE_FILE}?slot=${encodeURIComponent(slot)}`
}

export function isCommercialEmptyImageSrcV1(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(COMMERCIAL_EMPTY_IMAGE_PREFIX_V1)
}

export function isCommercialEmptyTextV1(value: unknown): boolean {
  return typeof value === "string" && EMPTY_TEXTS.some((text) => value.includes(text))
}

/** A node whose own content is still an empty state. */
export function isCommercialEmptyNodeV1(node: Pick<EditorNode, "type" | "props">): boolean {
  if (node.type === "image") return isCommercialEmptyImageSrcV1(node.props.src)
  return TEXT_PROP_KEYS.some((key) => isCommercialEmptyTextV1(node.props[key]))
}

function emptyImage(slot: string, sameProjectId?: string): BusinessFactAssetV1 {
  return { src: commercialEmptyImageSrcV1(slot), alt: COMMERCIAL_EMPTY_TEXT_V1.imageAlt, ...(sameProjectId ? { sameProjectId } : {}) }
}

function padAssets(customer: BusinessFactAssetV1[], demo: BusinessFactAssetV1[], slot: string, projectIdMap: Map<string, string>): BusinessFactAssetV1[] {
  const out = customer.map((asset) => ({ ...asset }))
  for (let index = out.length; index < demo.length; index += 1) {
    const demoProject = demo[index].sameProjectId
    out.push(emptyImage(`${slot}-${index + 1}`, demoProject ? projectIdMap.get(demoProject) : undefined))
  }
  return out
}

function padProject(customer: BusinessProjectFactV1 | undefined, demo: BusinessProjectFactV1, index: number): BusinessProjectFactV1 {
  const id = customer?.id ?? `proyecto-por-agregar-${index + 1}`
  const base: BusinessProjectFactV1 = customer
    ? { ...customer, assets: customer.assets.map((asset) => ({ ...asset })), progressAssets: customer.progressAssets.map((asset) => ({ ...asset })) }
    : { id, title: COMMERCIAL_EMPTY_TEXT_V1.projectTitle, assets: [], progressAssets: [] }
  // Mirror which optional TEXT fields the demo project shows. Enumerated/factual fields
  // (status, year) are never filled: an empty state must not assert progress or dates.
  if (demo.summary && !base.summary) base.summary = COMMERCIAL_EMPTY_TEXT_V1.projectSummary
  if (demo.description && !base.description) base.description = COMMERCIAL_EMPTY_TEXT_V1.projectDescription
  if (demo.category && !base.category) base.category = COMMERCIAL_EMPTY_TEXT_V1.projectCategory
  if (demo.location && !base.location) base.location = COMMERCIAL_EMPTY_TEXT_V1.projectLocation
  base.assets = padAssets(base.assets, demo.assets, `${id}-imagen`, new Map([[demo.id, id]]))
  base.progressAssets = padAssets(base.progressAssets, demo.progressAssets, `${id}-avance`, new Map([[demo.id, id]]))
  return base
}

/**
 * Shape the customer's facts to the approved demo's shape. Customer values
 * always win and come first; only missing positions get empty states. Prose
 * woven into other copy (description, location, service area), contact
 * channels, social links and the logo are never padded: they cannot be
 * represented as an isolated, strippable empty state.
 */
export function shapeCustomerFactsToDemoV1(customer: BusinessFactsV1, demo: BusinessFactsV1): BusinessFactsV1 {
  const T = COMMERCIAL_EMPTY_TEXT_V1

  // Beyond the composer's structural range a list switches to a generic grid, so a
  // demo-shape design keeps at most this many main services (the start form says so).
  const services = customer.services.slice(0, COMMERCIAL_FIDELITY_MAX_SERVICES_V1).map((service) => ({ ...service }))
  for (let index = services.length; index < demo.services.length; index += 1) services.push({ name: T.serviceName })
  demo.services.forEach((demoService, index) => {
    if (demoService.description && !services[index].description) services[index].description = T.serviceDescription
    if (demoService.priceLabel && !services[index].priceLabel) services[index].priceLabel = T.price
  })

  const faq = customer.faq.map((entry) => ({ ...entry }))
  for (let index = faq.length; index < demo.faq.length; index += 1) faq.push({ question: T.faqQuestion, answer: T.faqAnswer })

  const projects = demo.projects.map((demoProject, index) => padProject(customer.projects[index], demoProject, index))
  projects.push(...customer.projects.slice(demo.projects.length).map((project) => ({ ...project })))
  const projectIdMap = new Map(demo.projects.map((demoProject, index) => [demoProject.id, projects[index].id]))

  const testimonials = [...(customer.evidence.testimonials ?? [])]
  for (let index = testimonials.length; index < (demo.evidence.testimonials?.length ?? 0); index += 1) testimonials.push({ quote: T.testimonialQuote, author: T.testimonialAuthor })
  const people = [...(customer.evidence.people ?? [])]
  for (let index = people.length; index < (demo.evidence.people?.length ?? 0); index += 1) people.push({ name: T.personName, role: T.personRole })

  const single = (value: BusinessFactAssetV1 | undefined, demoValue: BusinessFactAssetV1 | undefined, slot: string) =>
    value ? { ...value } : demoValue ? emptyImage(slot, demoValue.sameProjectId ? projectIdMap.get(demoValue.sameProjectId) : undefined) : undefined

  const hero = single(customer.assets.hero, demo.assets.hero, "hero")
  const heroProject = single(customer.assets.heroProject, demo.assets.heroProject, "proyecto-principal")
  const specialtyService = single(customer.assets.specialtyService, demo.assets.specialtyService, "servicio-especial")

  return {
    ...customer,
    ...(demo.tagline && !customer.tagline ? { tagline: T.tagline } : {}),
    ...(demo.hours && !customer.hours ? { hours: T.hours } : {}),
    ...(demo.address && !customer.address ? { address: T.address } : {}),
    evidence: {
      ...customer.evidence,
      ...(testimonials.length ? { testimonials } : {}),
      ...(people.length ? { people } : {}),
    },
    services,
    faq,
    projects,
    assets: {
      ...customer.assets,
      ...(hero ? { hero } : {}),
      serviceImages: padAssets(customer.assets.serviceImages, demo.assets.serviceImages, "servicio", projectIdMap),
      ...(heroProject ? { heroProject } : {}),
      featuredProject: padAssets(customer.assets.featuredProject, demo.assets.featuredProject, "proyecto-destacado", projectIdMap),
      projectProgress: padAssets(customer.assets.projectProgress, demo.assets.projectProgress, "avance", projectIdMap),
      ...(specialtyService ? { specialtyService } : {}),
      companyProof: padAssets(customer.assets.companyProof, demo.assets.companyProof, "obra", projectIdMap),
      projectGallery: padAssets(customer.assets.projectGallery, demo.assets.projectGallery, "galeria", projectIdMap),
    },
  }
}

function sectionRole(node: EditorNode | undefined): string | undefined {
  const token = node?.props.compositionToken
  return typeof token === "string" ? token.split("|")[0] : undefined
}

/**
 * Editor-side marking (customer compile only):
 *  - the root carries the demo-shape marker (and the empty-page marker when
 *    the page exists only as an empty state),
 *  - top-level sections whose role exists only as an empty state get the
 *    COMMERCIAL_EMPTY_SECTION_PROP_V1 marker,
 *  - image slots the composer left without a source become an explicit
 *    "Agrega tu imagen" empty state (the demo shows the same slot).
 */
export function markCommercialEmptyStatesV1(tree: EditorTree, emptySectionRoles: ReadonlySet<string>, options: { emptyPage?: boolean } = {}): EditorTree {
  const root = tree.nodes[tree.rootId]
  const marked = new Set(root ? root.children.filter((id) => emptySectionRoles.has(sectionRole(tree.nodes[id]) ?? "")) : [])
  const nodes = Object.fromEntries(Object.entries(tree.nodes).map(([id, node]) => {
    if (id === tree.rootId) {
      return [id, { ...node, props: { ...node.props, [COMMERCIAL_FIDELITY_ROOT_PROP_V1]: "demo-shape", ...(options.emptyPage ? { [COMMERCIAL_EMPTY_PAGE_PROP_V1]: true } : {}) } }]
    }
    if (marked.has(id)) return [id, { ...node, props: { ...node.props, [COMMERCIAL_EMPTY_SECTION_PROP_V1]: true } }]
    if (node.type === "image" && (typeof node.props.src !== "string" || !node.props.src.trim())) {
      return [id, { ...node, props: { ...node.props, src: commercialEmptyImageSrcV1(`slot-${id}`), alt: COMMERCIAL_EMPTY_TEXT_V1.imageAlt } }]
    }
    return [id, node]
  }))
  return { ...tree, nodes }
}

function subtreeHasEmptyState(tree: EditorTree, id: string): boolean {
  const node = tree.nodes[id]
  if (!node) return false
  return isCommercialEmptyNodeV1(node) || node.children.some((child) => subtreeHasEmptyState(tree, child))
}

/** A demo-shape customer page: the public runtime must resolve its empty states. */
export function isDemoShapeCommercialTreeV1(tree: EditorTree): boolean {
  return tree.nodes[tree.rootId]?.props[COMMERCIAL_FIDELITY_ROOT_PROP_V1] === "demo-shape"
}

/** A page that exists only as an empty state and still has something to fill: not public. */
export function isHiddenCommercialPageV1(tree: EditorTree): boolean {
  const root = tree.nodes[tree.rootId]
  return root?.props[COMMERCIAL_EMPTY_PAGE_PROP_V1] === true && subtreeHasEmptyState(tree, tree.rootId)
}

/**
 * Public runtime: what is still an empty state is not published.
 *  - a marked empty-state section is hidden while anything in it is still empty,
 *  - any other empty-state node is removed,
 *  - a button pointing at a hidden page (`page:<slug>`) is removed,
 *  - a site navigation item pointing at a hidden page is removed (SiteNav renders its inline `pages`),
 *  - a container left without children by that removal is removed too.
 * Trees without empty states are returned unchanged (by reference).
 */
export function stripCommercialEmptyStatesV1(tree: EditorTree, options: { hiddenPageSlugs?: ReadonlySet<string> } = {}): EditorTree {
  const hiddenPageHrefs = new Set([...(options.hiddenPageSlugs ?? [])].map((slug) => `page:${slug}`))
  const linksHiddenPage = (node: EditorNode) => node.type === "ctaButton" && hiddenPageHrefs.has(String(node.props.href ?? ""))
  const navItemLinksHiddenPage = (item: unknown) => hiddenPageHrefs.has(String((item as { href?: unknown } | null)?.href ?? ""))
  const navLinksHiddenPage = (node: EditorNode) => node.type === "siteNav" && Array.isArray(node.props.pages) && node.props.pages.some(navItemLinksHiddenPage)
  if (!Object.values(tree.nodes).some((node) => isCommercialEmptyNodeV1(node) || node.props[COMMERCIAL_EMPTY_SECTION_PROP_V1] === true || linksHiddenPage(node) || navLinksHiddenPage(node))) return tree

  const keptChildren = new Map<string, string[]>()
  const dropped = new Set<string>()

  const visit = (id: string): boolean => {
    const node = tree.nodes[id]
    if (!node) return false
    const keep = (() => {
      if (id !== tree.rootId) {
        if (node.props[COMMERCIAL_EMPTY_SECTION_PROP_V1] === true && subtreeHasEmptyState(tree, id)) return false
        if (isCommercialEmptyNodeV1(node) || linksHiddenPage(node)) return false
      }
      const children = node.children.filter((child) => visit(child))
      keptChildren.set(id, children)
      // A container emptied by stripping is removed (never an intentionally empty node).
      return id === tree.rootId || node.children.length === 0 || children.length > 0
    })()
    if (!keep) dropped.add(id)
    return keep
  }
  visit(tree.rootId)

  const removed = new Set<string>()
  const removeSubtree = (id: string) => {
    if (removed.has(id)) return
    removed.add(id)
    tree.nodes[id]?.children.forEach(removeSubtree)
  }
  dropped.forEach(removeSubtree)

  const nodes: Record<string, EditorNode> = {}
  for (const [id, node] of Object.entries(tree.nodes)) {
    if (removed.has(id)) continue
    const kept = keptChildren.has(id) ? { ...node, children: keptChildren.get(id)! } : node
    nodes[id] = navLinksHiddenPage(kept)
      ? { ...kept, props: { ...kept.props, pages: (kept.props.pages as unknown[]).filter((item) => !navItemLinksHiddenPage(item)) } }
      : kept
  }
  return { ...tree, nodes }
}
