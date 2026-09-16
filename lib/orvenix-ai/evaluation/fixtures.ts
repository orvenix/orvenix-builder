import {
  calculateSiteCreationTreeHash,
  SITE_CREATION_PLAN_V2_VERSION,
  type SiteCreationPlanV2,
  type SiteCreationPlanV2Page,
} from "@/lib/orvenix-ai/site-creation/plan-v2"
import type { EditorNode, EditorTree, GlobalTheme, NodeProps } from "@/types/editor"
import type { EvaluationContextV1 } from "@/lib/orvenix-ai/evaluation/types"

/**
 * Deterministic, private-data-free SiteCreationPlanV2 fixtures for the
 * evaluation harness's own tests and its regression corpus. Nothing here
 * touches the DB, network, or any AI provider.
 */

export function buildFixtureTheme(overrides: Partial<GlobalTheme> = {}): GlobalTheme {
  return {
    colors: {
      primary: "#1BB3FA",
      secondary: "#1379A8",
      background: "#ffffff",
      text: "#082f49",
      accent: "#1794CC",
    },
    fontHeading: "Inter",
    fontBody: "Inter",
    spacing: { sectionX: "1rem", sectionY: "2rem", stack: "1rem" },
    radius: { card: "1rem", button: "999px" },
    shadow: { soft: "none", strong: "none" },
    motion: { duration: "200ms", easing: "ease" },
    ...overrides,
  }
}

interface NodeSpec {
  id: string
  type: string
  props?: NodeProps
  children?: string[]
}

function buildTree(nodeSpecs: NodeSpec[], theme: GlobalTheme, rootId = nodeSpecs[0]!.id): EditorTree {
  const nodes: Record<string, EditorNode> = {}

  for (const spec of nodeSpecs) {
    nodes[spec.id] = {
      id: spec.id,
      type: spec.type,
      props: spec.props ?? {},
      children: spec.children ?? [],
      version: 1,
    }
  }

  return {
    rootId,
    theme: structuredClone(theme),
    globalTheme: structuredClone(theme),
    nodes,
  }
}

function buildPage(params: {
  slug: string
  name: string
  isHome?: boolean
  theme: GlobalTheme
  nodeSpecs: NodeSpec[]
  rootId?: string
  seoTitle?: string
  seoDescription?: string
}): SiteCreationPlanV2Page {
  const tree = buildTree(params.nodeSpecs, params.theme, params.rootId)

  return {
    slug: params.slug,
    name: params.name,
    isHome: params.isHome ?? false,
    seo: {
      title: params.seoTitle ?? `${params.name} | Demo`,
      description: params.seoDescription ?? `Informacion sobre ${params.name} para clientes.`,
    },
    tree,
    treeHash: calculateSiteCreationTreeHash(tree),
  }
}

function buildPlan(params: {
  identity: SiteCreationPlanV2["identity"]
  theme: GlobalTheme
  pages: SiteCreationPlanV2Page[]
  navigation: SiteCreationPlanV2["navigation"]
  quality?: SiteCreationPlanV2["quality"]
}): SiteCreationPlanV2 {
  return {
    version: SITE_CREATION_PLAN_V2_VERSION,
    identity: params.identity,
    theme: params.theme,
    navigation: params.navigation,
    pages: params.pages,
    quality: params.quality ?? { score: 90, warnings: [], summary: "Fixture determinista de evaluacion." },
  }
}

function navItem(label: string, slug: string) {
  return { label, slug, href: `page:${slug}` }
}

/** A well-formed multi-page service business site with a working CTA. */
export function goodServiceBusinessPlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["home-heading", "home-text", "home-cta"] },
      { id: "home-heading", type: "heading", props: { text: "Clinica dental Aurora", level: 1 } },
      { id: "home-text", type: "text", props: { content: "Atencion dental preventiva y estetica para toda la familia." } },
      { id: "home-cta", type: "ctaButton", props: { label: "Agenda tu cita", href: "page:contacto" } },
    ],
  })

  const servicios = buildPage({
    slug: "servicios",
    name: "Servicios",
    theme,
    nodeSpecs: [
      { id: "servicios-root", type: "section", children: ["servicios-heading", "servicios-text"] },
      { id: "servicios-heading", type: "heading", props: { text: "Nuestros servicios", level: 2 } },
      { id: "servicios-text", type: "text", props: { content: "Limpieza dental, diseno de sonrisa y ortodoncia para pacientes de todas las edades." } },
    ],
  })

  const contacto = buildPage({
    slug: "contacto",
    name: "Contacto",
    theme,
    nodeSpecs: [
      { id: "contacto-root", type: "section", children: ["contacto-heading", "contacto-cta"] },
      { id: "contacto-heading", type: "heading", props: { text: "Contactanos", level: 2 } },
      { id: "contacto-cta", type: "ctaButton", props: { label: "Escribenos por WhatsApp", href: "https://wa.me/528112345678" } },
    ],
  })

  return buildPlan({
    identity: { name: "Clinica Aurora", industry: "salud dental", location: "Monterrey", description: "Atencion dental preventiva y estetica." },
    theme,
    pages: [home, servicios, contacto],
    navigation: [navItem("Inicio", "home"), navItem("Servicios", "servicios"), navItem("Contacto", "contacto")],
  })
}

/** Objective-appropriate context for goodServiceBusinessPlan(): leads/appointments. */
export const GOOD_SERVICE_BUSINESS_CONTEXT: EvaluationContextV1 = {
  objective: "Conseguir citas por WhatsApp",
}

/** A well-formed informational site with no CTA at all (none required). */
export function goodInformationalBusinessPlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["home-heading", "home-text"] },
      { id: "home-heading", type: "heading", props: { text: "Fundacion Rio Claro", level: 1 } },
      { id: "home-text", type: "text", props: { content: "Difundimos investigacion abierta sobre ecosistemas fluviales de la region." } },
    ],
  })

  const historia = buildPage({
    slug: "historia",
    name: "Historia",
    theme,
    nodeSpecs: [
      { id: "historia-root", type: "section", children: ["historia-heading", "historia-text"] },
      { id: "historia-heading", type: "heading", props: { text: "Nuestra historia", level: 2 } },
      { id: "historia-text", type: "text", props: { content: "Fundada en 2010 para educar sobre la conservacion de rios locales." } },
    ],
  })

  return buildPlan({
    identity: { name: "Fundacion Rio Claro", industry: "educacion ambiental", description: "Organizacion sin fines de lucro." },
    theme,
    pages: [home, historia],
    navigation: [navItem("Inicio", "home"), navItem("Historia", "historia")],
  })
}

/** Context for goodInformationalBusinessPlan(): purely informational, no commerce implied. */
export const GOOD_INFORMATIONAL_BUSINESS_CONTEXT: EvaluationContextV1 = {
  objective: "Informar sobre nuestra historia y mision",
}

/** Smallest possible structurally valid plan: a single home page with real content. */
export function minimalValidPlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["home-heading"] },
      { id: "home-heading", type: "heading", props: { text: "Taller Mecanico Rapido", level: 1 } },
    ],
  })

  return buildPlan({
    identity: { name: "Taller Mecanico Rapido" },
    theme,
    pages: [home],
    navigation: [navItem("Inicio", "home")],
  })
}

/**
 * Multi-page plan with two independent navigation defects the contract
 * validator does not check: a CTA linking to a page that does not exist,
 * and a page nobody links to (not in top-level nav, no internal links).
 */
export function brokenNavigationPlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["home-heading", "home-cta"] },
      { id: "home-heading", type: "heading", props: { text: "Estudio Legal Ferrer", level: 1 } },
      { id: "home-cta", type: "ctaButton", props: { label: "Ver precios", href: "page:precios" } },
    ],
  })

  const servicios = buildPage({
    slug: "servicios",
    name: "Servicios",
    theme,
    nodeSpecs: [
      { id: "servicios-root", type: "section", children: ["servicios-heading"] },
      { id: "servicios-heading", type: "heading", props: { text: "Areas de practica", level: 2 } },
    ],
  })

  const contacto = buildPage({
    slug: "contacto",
    name: "Contacto",
    theme,
    nodeSpecs: [
      { id: "contacto-root", type: "section", children: ["contacto-heading"] },
      { id: "contacto-heading", type: "heading", props: { text: "Contacto", level: 2 } },
    ],
  })

  return buildPlan({
    identity: { name: "Estudio Legal Ferrer" },
    theme,
    pages: [home, servicios, contacto],
    // "contacto" is intentionally absent from navigation and unlinked from any page content.
    navigation: [navItem("Inicio", "home"), navItem("Servicios", "servicios")],
  })
}

/** A non-home page with no content at all (root node, zero children). */
export function emptyPagePlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["home-heading"] },
      { id: "home-heading", type: "heading", props: { text: "Panaderia Sol", level: 1 } },
    ],
  })

  const servicios = buildPage({
    slug: "servicios",
    name: "Servicios",
    theme,
    nodeSpecs: [{ id: "servicios-root", type: "section", children: [] }],
  })

  return buildPlan({
    identity: { name: "Panaderia Sol" },
    theme,
    pages: [home, servicios],
    navigation: [navItem("Inicio", "home"), navItem("Servicios", "servicios")],
  })
}

/** Home page with zero real content: hard failure (STRUCTURE_HOME_EMPTY). */
export function emptyHomePlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [{ id: "home-root", type: "section", children: [] }],
  })

  return buildPlan({
    identity: { name: "Sitio Vacio" },
    theme,
    pages: [home],
    navigation: [navItem("Inicio", "home")],
  })
}

/** Lorem ipsum, an explicit placeholder marker, and excessive duplicate copy. */
export function duplicatePlaceholderContentPlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()
  const repeatedCopy = "Somos la mejor opcion para tu negocio en la region metropolitana."

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["home-heading", "home-text"] },
      { id: "home-heading", type: "heading", props: { text: "Lorem ipsum dolor sit amet", level: 1 } },
      { id: "home-text", type: "text", props: { content: repeatedCopy } },
    ],
  })

  const servicios = buildPage({
    slug: "servicios",
    name: "Servicios",
    theme,
    nodeSpecs: [
      { id: "servicios-root", type: "section", children: ["servicios-heading", "servicios-text"] },
      { id: "servicios-heading", type: "heading", props: { text: "TODO: contenido pendiente", level: 2 } },
      { id: "servicios-text", type: "text", props: { content: repeatedCopy } },
    ],
  })

  const contacto = buildPage({
    slug: "contacto",
    name: "Contacto",
    theme,
    nodeSpecs: [
      { id: "contacto-root", type: "section", children: ["contacto-text"] },
      { id: "contacto-text", type: "text", props: { content: repeatedCopy } },
    ],
  })

  return buildPlan({
    identity: { name: "Negocio Generico" },
    theme,
    pages: [home, servicios, contacto],
    navigation: [navItem("Inicio", "home"), navItem("Servicios", "servicios"), navItem("Contacto", "contacto")],
  })
}

/** Fails SiteCreationPlanV2's own contract validator (two home pages). Raw/untyped on purpose. */
export function invalidStructuralPlan(): unknown {
  const theme = buildFixtureTheme()

  const home = buildPage({ slug: "home", name: "Inicio", isHome: true, theme, nodeSpecs: [{ id: "home-root", type: "section", children: [] }] })
  const alsoHome = buildPage({ slug: "otro", name: "Otro", isHome: true, theme, nodeSpecs: [{ id: "otro-root", type: "section", children: [] }] })

  return buildPlan({
    identity: { name: "Plan Invalido" },
    theme,
    pages: [home, alsoHome],
    navigation: [navItem("Inicio", "home"), navItem("Otro", "otro")],
  })
}

/**
 * A node's `children` array references an id absent from `nodes`. The
 * contract validator only checks that rootId exists; it never walks
 * `children`, so this passes `validateSiteCreationPlanV2` and is only
 * caught by the evaluation harness's structure dimension.
 */
export function danglingChildRefPlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["home-heading", "missing-node"] },
      { id: "home-heading", type: "heading", props: { text: "Ferreteria Central", level: 1 } },
    ],
  })

  return buildPlan({
    identity: { name: "Ferreteria Central" },
    theme,
    pages: [home],
    navigation: [navItem("Inicio", "home")],
  })
}

/**
 * Two nodes reference each other as children, forming a cycle. This is
 * representable as plain JSON (string ids, no object self-reference), so
 * it passes the contract's strict-JSON and shape checks; only the
 * evaluation harness's graph walk detects it.
 */
export function cycleInTreePlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme()

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["node-a"] },
      { id: "node-a", type: "genericWrapper", children: ["node-b"] },
      { id: "node-b", type: "genericWrapper", children: ["node-a"] },
    ],
  })

  return buildPlan({
    identity: { name: "Sitio Ciclico" },
    theme,
    pages: [home],
    navigation: [navItem("Inicio", "home")],
  })
}

/** Theme with colliding text/background colors and an out-of-range opacity prop. */
export function designInconsistentPlan(): SiteCreationPlanV2 {
  const theme = buildFixtureTheme({
    colors: {
      primary: "#1BB3FA",
      secondary: "#1379A8",
      background: "#ffffff",
      text: "#FFFFFF",
      accent: "#1794CC",
    },
  })

  const home = buildPage({
    slug: "home",
    name: "Inicio",
    isHome: true,
    theme,
    nodeSpecs: [
      { id: "home-root", type: "section", children: ["home-heading", "home-text"] },
      { id: "home-heading", type: "heading", props: { text: "Estudio de Diseno Prisma", level: 1 } },
      { id: "home-text", type: "text", props: { content: "Diseno grafico y branding para marcas emergentes.", styleOpacity: 4 } },
    ],
  })

  return buildPlan({
    identity: { name: "Estudio de Diseno Prisma" },
    theme,
    pages: [home],
    navigation: [navItem("Inicio", "home")],
  })
}

export interface EvaluationCorpusEntryV1 {
  name: string
  buildPlan: () => unknown
  context?: EvaluationContextV1
}

/** Small, representative regression corpus (see README) for comparing Builder versions over time. */
export const SITE_GENERATION_EVALUATION_CORPUS_V1: readonly EvaluationCorpusEntryV1[] = [
  { name: "good-service-business", buildPlan: goodServiceBusinessPlan, context: GOOD_SERVICE_BUSINESS_CONTEXT },
  { name: "good-informational-business", buildPlan: goodInformationalBusinessPlan, context: GOOD_INFORMATIONAL_BUSINESS_CONTEXT },
  { name: "minimal-valid", buildPlan: minimalValidPlan },
  { name: "broken-navigation", buildPlan: brokenNavigationPlan },
  { name: "empty-page", buildPlan: emptyPagePlan },
  { name: "empty-home", buildPlan: emptyHomePlan },
  { name: "duplicate-placeholder-content", buildPlan: duplicatePlaceholderContentPlan },
  { name: "invalid-structural-plan", buildPlan: invalidStructuralPlan },
  { name: "dangling-child-ref", buildPlan: danglingChildRefPlan },
  { name: "node-cycle", buildPlan: cycleInTreePlan },
  { name: "design-inconsistent", buildPlan: designInconsistentPlan },
]
