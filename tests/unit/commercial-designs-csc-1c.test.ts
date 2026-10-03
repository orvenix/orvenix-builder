import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync, readdirSync, statSync } from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import { validateTree } from "../../types/validateTree"
import {
  COMMERCIAL_DEMO_ASSET_PREFIX_V1,
  COMMERCIAL_DESIGN_REGISTRY_V1,
  COMMERCIAL_SECTION_BOUND_ASSET_ROLES_V1,
  DEMO_FACTS_INPUT_BY_DESIGN_V1,
  compileCommercialDesignV1,
  getCommercialDesignV1,
  getDemoFactsV1,
  normalizeBusinessFactsV1,
  resolveCommercialDesignV1,
  validateCommercialDesignV1,
  type BusinessFactsInputV1,
} from "../../lib/orvenix-ai/commercial-designs"
import { CONSTRUCTION_V1 } from "../../lib/orvenix-ai/commercial-designs/designs/construction"
import { SERVICIOS_LOCALES_V1 } from "../../lib/orvenix-ai/commercial-designs/designs/servicios-locales"
import { validateSiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import { getRealTemplate } from "../../lib/realTemplates"
import { getEditorTreeForWeb, isEditorWebId } from "../../lib/editorWebs"
import type { EditorTree } from "../../types/editor"

type Compiled = Awaited<ReturnType<typeof compileCommercialDesignV1>>

const DEMO_DIR = "public/commercial-demo/construction"

/** Customer facts with the SAME evidence coverage as the construction demo pack (fictional, customer-owned upload paths). */
const FULL_CUSTOMER: BusinessFactsInputV1 = {
  businessName: "Obras Cardinal",
  tagline: "Construcción y remodelación residencial",
  description: "Construcción residencial y remodelación con seguimiento fotográfico de cada obra.",
  contact: { whatsapp: "5512345678", email: "hola@obrascardinal.example" },
  hours: "Lunes a sábado, 8:00 a 17:00",
  serviceArea: ["Valle Oriente", "Cumbres"],
  services: [
    { name: "Casas nuevas", description: "Obra residencial completa." },
    { name: "Remodelación", description: "Interiores y fachadas." },
    { name: "Albercas", description: "Albercas y exteriores." },
  ],
  faq: [{ question: "¿Hacen visitas de obra?", answer: "Se agenda por WhatsApp." }],
  projects: [
    {
      id: "casa-roble",
      title: "Casa Roble",
      summary: "Vivienda de dos niveles con fachada de concreto aparente.",
      description: "Obra residencial documentada por etapas.",
      category: "Casas nuevas",
      status: "in-progress",
      assets: [{ src: "/uploads/casa-roble-fachada.webp", alt: "Fachada Casa Roble" }, { src: "/uploads/casa-roble-terraza.webp", alt: "Terraza Casa Roble" }],
      progressAssets: [
        { src: "/uploads/casa-roble-avance-a.webp", alt: "Avance Casa Roble A" },
        { src: "/uploads/casa-roble-avance-b.webp", alt: "Avance Casa Roble B" },
        { src: "/uploads/casa-roble-avance-c.webp", alt: "Avance Casa Roble C" },
      ],
    },
    { id: "jardin-sur", title: "Jardín Sur", summary: "Alberca y jardín.", status: "completed", assets: [{ src: "/uploads/jardin-sur.webp", alt: "Jardín Sur" }] },
  ],
  assets: {
    heroProject: { src: "/uploads/casa-roble-hero.webp", alt: "Casa Roble en obra", sameProjectId: "casa-roble" },
    specialtyService: { src: "/uploads/alberca-cardinal.webp", alt: "Alberca terminada" },
    companyProof: [{ src: "/uploads/cardinal-losa.webp", alt: "Losa en obra" }, { src: "/uploads/cardinal-armado.webp", alt: "Armado de acero" }],
  },
}

const SPARSE_CASES: Array<[string, BusinessFactsInputV1]> = [
  ["phone only", { businessName: "Obras Uno", contact: { phone: "5511112222" } }],
  ["whatsapp only", { businessName: "Obras Dos", contact: { whatsapp: "5511113333" } }],
  ["services, no projects", { businessName: "Obras Tres", contact: { email: "hola@obrastres.example" }, services: [{ name: "Remodelación" }, { name: "Acabados" }] }],
  ["projects, no stats", { businessName: "Obras Cuatro", contact: { phone: "5511114444" }, projects: [{ title: "Casa Norte", summary: "Vivienda unifamiliar.", assets: [{ src: "/uploads/casa-norte.webp" }] }] }],
  ["project images, minimal text", { businessName: "Obras Cinco", contact: { phone: "5511115555" }, assets: { projectGallery: [{ src: "/uploads/obra-1.webp" }, { src: "/uploads/obra-2.webp" }], projectProgress: [{ src: "/uploads/obra-3.webp" }, { src: "/uploads/obra-4.webp" }] } }],
  ["no project evidence", { businessName: "Obras Seis", contact: { whatsapp: "5511116666" }, services: [{ name: "Construcción" }] }],
]

function compileCustomer(facts: BusinessFactsInputV1): Promise<Compiled> {
  return compileCommercialDesignV1({ mode: "customer", designId: "construction", version: 1, facts })
}

/** Customer-visible text: rendered strings, image alts, labels and SEO -- never hrefs/ids. */
function visibleText(compiled: Compiled): string {
  const parts: string[] = []
  for (const page of compiled.plan.pages) {
    parts.push(page.name, page.seo.title ?? "", page.seo.description ?? "")
    for (const node of Object.values(page.tree.nodes)) {
      for (const key of ["text", "content", "label", "alt", "title", "subtitle", "brandName", "ctaLabel"]) {
        const value = (node.props as Record<string, unknown>)[key]
        if (typeof value === "string") parts.push(value)
      }
    }
  }
  return parts.join("\n")
}

function allStrings(value: unknown): string {
  const fragments: string[] = []
  const visit = (entry: unknown) => {
    if (typeof entry === "string") fragments.push(entry)
    else if (Array.isArray(entry)) entry.forEach(visit)
    else if (entry && typeof entry === "object") Object.values(entry as Record<string, unknown>).forEach(visit)
  }
  visit(value)
  return fragments.join("\n")
}

function imageSources(compiled: Compiled): string[] {
  return compiled.plan.pages.flatMap((page) => Object.values(page.tree.nodes).filter((node) => node.type === "image").map((node) => String((node.props as { src?: unknown }).src ?? "")))
}

function ctaHrefs(compiled: Compiled): string[] {
  return compiled.plan.pages.flatMap((page) => Object.values(page.tree.nodes).filter((node) => node.type === "ctaButton").map((node) => String((node.props as { href?: unknown }).href ?? "")))
}

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

/** Fabricated trust patterns (years, counts, percentages, guarantees, credentials, ratings, before/after). */
const TRUST_CLAIM_PATTERNS: Array<[string, RegExp]> = [
  ["years in business", /\b\d+[ \t]*(?:anos|years)\b|\bdesde\s+(?:19|20)\d{2}\b|\banos de experiencia\b|\btrayectoria\b/],
  ["counts", /\+[ \t]?\d+|\b\d{2,}[ \t]*(?:proyectos|obras|clientes|casas)\b/],
  ["percentages", /\d+[ \t]*%/],
  ["satisfaction", /satisfaccion/],
  ["warranty", /garantia|garantizad/],
  ["certification", /certificad|certificacion|licencia|permiso oficial|acreditad/],
  ["insurance", /\basegurad|\bseguro de\b|\bpoliza\b/],
  ["awards", /\bpremio|galardon|reconocimiento\b/],
  ["ratings/reviews", /\brating\b|calificacion|estrellas|★|\bresenas?\b|opiniones de clientes/],
  ["before/after", /\bantes\b|\bdespues\b|\bbefore\b|\bafter\b|transformacion/],
]

function trustClaims(text: string): string[] {
  const normalized = normalize(text)
  return TRUST_CLAIM_PATTERNS.filter(([, pattern]) => pattern.test(normalized)).map(([label]) => label)
}

/** Text of every node under the first section whose composition token starts with `role|`. */
function sectionSubtreeText(tree: EditorTree, role: string): string {
  const section = Object.values(tree.nodes).find((node) => node.type === "section" && String((node.props as { compositionToken?: unknown }).compositionToken ?? "").startsWith(`${role}|`))
  if (!section) return ""
  const parts: string[] = []
  const walk = (id: string) => {
    const node = tree.nodes[id]
    if (!node) return
    for (const value of [node.props.text, node.props.content, node.props.label]) if (typeof value === "string") parts.push(value)
    node.children.forEach(walk)
  }
  walk(section.id)
  return parts.join("\n")
}

function hasProgressBand(tree: EditorTree): boolean {
  const countImages = (id: string): number => {
    const node = tree.nodes[id]
    if (!node) return 0
    return (node.type === "image" && String(node.props.src ?? "").length > 0 ? 1 : 0) + node.children.reduce((sum, child) => sum + countImages(child), 0)
  }
  return Object.values(tree.nodes).some((node) => node.type === "genericWrapper" && String(node.props.className ?? "").includes("bg-stone-900") && countImages(node.id) >= 2)
}

function riffChunkIds(buffer: Buffer): string[] {
  const ids: string[] = []
  let offset = 12
  while (offset + 8 <= buffer.length) {
    ids.push(buffer.toString("ascii", offset, offset + 4))
    const size = buffer.readUInt32LE(offset + 4)
    offset += 8 + size + (size & 1)
  }
  return ids
}

function webpHasMetadata(buffer: Buffer): boolean {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return true
  return riffChunkIds(buffer).some((id) => id === "EXIF" || id === "XMP " || id === "ICCP")
}

let demoPromise: Promise<Compiled> | undefined
let fullPromise: Promise<Compiled> | undefined
const demo = () => (demoPromise ??= compileCommercialDesignV1({ mode: "demo", designId: "construction", version: 1 }))
const fullCustomer = () => (fullPromise ??= compileCustomer(FULL_CUSTOMER))

/* A */
test("CSC-1C A: construction@1 validates as a declarative CommercialDesignV1", () => {
  const validation = validateCommercialDesignV1(CONSTRUCTION_V1)
  assert.equal(validation.ok, true, JSON.stringify("diagnostics" in validation ? validation.diagnostics : []))
  assert.equal(CONSTRUCTION_V1.family, "construction")
  const serialized = JSON.stringify(CONSTRUCTION_V1)
  for (const forbidden of ["<", "className", "tailwind", "/uploads/", "/commercial-demo/", "IMG_", "DSC_", "nts", "rootId", "nodes"]) {
    assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden)
  }
  const bad = { ...CONSTRUCTION_V1, pages: [{ ...CONSTRUCTION_V1.pages[0], sections: [{ role: "gallery", assetRoles: ["galleryPiece"] }] }] }
  const rejected = validateCommercialDesignV1(bad)
  assert.equal(rejected.ok, false)
  assert.ok("diagnostics" in rejected && rejected.diagnostics.some((diagnostic) => diagnostic.code === "asset_role_not_implemented"))
})

/* B */
test("CSC-1C B: registry exposes construction@1 frozen, alongside servicios-locales@1", () => {
  assert.equal(COMMERCIAL_DESIGN_REGISTRY_V1["construction@1"], CONSTRUCTION_V1)
  assert.equal(getCommercialDesignV1("construction", 1), CONSTRUCTION_V1)
  assert.equal(COMMERCIAL_DESIGN_REGISTRY_V1["servicios-locales@1"], SERVICIOS_LOCALES_V1)
  assert.equal(Object.isFrozen(CONSTRUCTION_V1), true)
  assert.equal(Object.isFrozen(CONSTRUCTION_V1.pages[0].sections), true)
})

/* C */
test("CSC-1C C: no second engine, renderer or compiler exists for construction", () => {
  const designFiles = readdirSync("lib/orvenix-ai/commercial-designs")
  assert.deepEqual(designFiles.filter((file) => /construction/i.test(file)), [])
  assert.deepEqual(readdirSync("lib/orvenix-ai/commercial-designs/designs").sort(), ["construction.ts", "servicios-locales.ts"])
  const design = readFileSync("lib/orvenix-ai/commercial-designs/designs/construction.ts", "utf8")
  assert.doesNotMatch(design, /from "react"|tsx|createElement|function |=>/)
  for (const route of ["app/dev-commercial-review/construction/page.tsx", "app/templates/[id]/demo/page.tsx"]) {
    const source = readFileSync(route, "utf8")
    assert.match(source, /compileCommercialDesignV1/)
    assert.match(source, /PublicRenderer/)
    assert.doesNotMatch(source, /ConstructionRenderer|ConstructionCompiler|getEditorTreeForWeb/)
  }
})

/* D */
test("CSC-1C D: resolver turns construction + facts into builder inputs deterministically", () => {
  const normalized = normalizeBusinessFactsV1(FULL_CUSTOMER)
  assert.equal(normalized.ok, true)
  if (!normalized.ok) throw new Error("unreachable")
  const first = resolveCommercialDesignV1(CONSTRUCTION_V1, normalized.facts)
  const second = resolveCommercialDesignV1(CONSTRUCTION_V1, normalized.facts)
  assert.deepEqual(first, second)
  assert.deepEqual(first.designSource, { kind: "commercial", id: "construction", version: 1 })
  assert.equal(first.theme.fontHeading, "Oswald")
  assert.notEqual(JSON.stringify(first.theme), JSON.stringify(resolveCommercialDesignV1(SERVICIOS_LOCALES_V1, normalized.facts).theme))
  assert.equal(first.direction.pageDirections.find((page) => page.slug === "home")?.preferredHeroVariant, "immersive")
  assert.equal(first.sectionMedia.home?.hero?.media?.src, "/uploads/casa-roble-hero.webp")
})

/* E */
test("CSC-1C E: full evidence compiles the multipage architecture (home, services, projects, about, contact + detail)", async () => {
  const compiled = await fullCustomer()
  assert.deepEqual(compiled.plan.pages.map((page) => page.slug), ["home", "servicios", "proyectos", "proyecto-destacado", "nosotros", "contacto"])
  assert.equal(compiled.plan.pages.filter((page) => page.isHome).length, 1)
  assert.deepEqual(compiled.resolved.omissions, [])
})

/* F + 31 */
test("CSC-1C F: project detail exists only with authoritative narrative + images (declared omission otherwise)", async () => {
  const withDetail = await fullCustomer()
  const detail = withDetail.plan.pages.find((page) => page.slug === "proyecto-destacado")
  assert.ok(detail)
  assert.equal(detail.seo.title, "Casa Roble · Obras Cardinal")
  const detailText = allStrings(detail.tree)
  assert.match(detailText, /Casa Roble/)
  assert.doesNotMatch(detailText, /Jardín Sur/)

  const titleOnly = await compileCustomer({ ...FULL_CUSTOMER, projects: [{ title: "Casa sin relato", assets: [{ src: "/uploads/x.webp" }] }] })
  assert.equal(titleOnly.plan.pages.some((page) => page.slug === "proyecto-destacado"), false)
  assert.ok(titleOnly.resolved.omissions.some((omission) => omission.page === "proyecto-destacado" && omission.reason === "missing_facts:projectDetail"))
  assert.equal(ctaHrefs(titleOnly).includes("page:proyecto-destacado"), false)

  const noImages = await compileCustomer({ ...FULL_CUSTOMER, projects: [{ title: "Casa sin fotos", summary: "Relato sin imágenes." }] })
  assert.equal(noImages.plan.pages.some((page) => page.slug === "proyecto-destacado"), false)
})

/* G */
test("CSC-1C G: BusinessFacts normalizes generic project evidence without inventing fields", () => {
  const normalized = normalizeBusinessFactsV1({
    businessName: "Obras G",
    contact: { phone: "5512345678" },
    projects: [
      { title: "  Casa <b>Uno</b> ", id: "Casa Uno!", status: "in-progress", year: "2025", location: "Zona Norte", assets: [{ src: "/uploads/a.webp" }], progressAssets: [{ src: "/uploads/b.webp" }, { src: "/uploads/c.webp" }], progressSequence: "chronological" },
      { title: "Casa Dos", id: "casa-uno", status: "finished-soon", year: "hace mucho", assets: [{ src: "javascript:alert(1)" }] },
      { summary: "sin título" },
    ],
  })
  assert.equal(normalized.ok, true)
  if (!normalized.ok) throw new Error("unreachable")
  const [first, second] = normalized.facts.projects
  assert.equal(normalized.facts.projects.length, 2)
  assert.equal(first.title, "Casa bUno/b")
  assert.equal(first.id, "casa-uno")
  assert.equal(first.status, "in-progress")
  assert.equal(first.year, "2025")
  assert.equal(first.progressSequence, "chronological")
  assert.deepEqual(first.progressAssets.map((asset) => asset.sameProjectId), ["casa-uno", "casa-uno"])
  assert.notEqual(second.id, first.id)
  assert.equal(second.status, undefined)
  assert.equal(second.year, undefined)
  assert.deepEqual(second.assets, [])
  for (const key of ["summary", "category", "description"]) assert.equal(key in second, false, key)
})

/* H */
test("CSC-1C H: construction always compiles in strict-facts mode", async () => {
  const compiled = await fullCustomer()
  assert.ok(compiled.resolved.commercialFacts.primaryCta)
  assert.equal(compiled.generated.plan.designSource?.id, "construction")
  const normalized = normalizeBusinessFactsV1({ businessName: "X", contact: { phone: "5512345678" } })
  assert.equal(normalized.ok, true)
})

/* I, J, K, L, M, N(partial) */
test("CSC-1C I-M: no fabricated trust claims (years, counts, %, warranty, certification, ratings, testimonials) in any compile", async () => {
  const compiles = [await demo(), await fullCustomer(), ...(await Promise.all(SPARSE_CASES.map(([, facts]) => compileCustomer(facts))))]
  for (const compiled of compiles) {
    const text = visibleText(compiled)
    assert.deepEqual(trustClaims(text), [], `${compiled.facts.businessName}: ${trustClaims(text).join(",")}`)
    // Structured plan data too (seo/identity/navigation), minus hrefs which carry encoded URLs.
    assert.deepEqual(trustClaims(JSON.stringify({ identity: compiled.plan.identity, navigation: compiled.plan.navigation, seo: compiled.plan.pages.map((page) => page.seo) })), [])
    const types = new Set(compiled.plan.pages.flatMap((page) => Object.values(page.tree.nodes).map((node) => node.displayName ?? "")))
    assert.equal([...types].some((name) => /testimonio|rese[nñ]a|rating|estad[ií]stica/i.test(name)), false, compiled.facts.businessName)
  }
  // The detector itself catches the reference site's historical claims.
  for (const claim of ["32 años de experiencia", "Desde 1992", "+500 proyectos", "100% satisfacción", "10 años de garantía", "Empresa certificada", "4.9 estrellas"]) {
    assert.notDeepEqual(trustClaims(claim), [], claim)
  }
})

/* N */
test("CSC-1C N: no fabricated location; only supplied service area/project location appear", async () => {
  const noArea = await compileCustomer({ ...FULL_CUSTOMER, serviceArea: undefined, address: undefined, location: undefined })
  const text = visibleText(noArea)
  assert.equal(/zona de servicio:|ubicaci[oó]n:|direcci[oó]n:/i.test(text), false)
  assert.equal(/Valle Oriente|Cumbres|Monterrey|CDMX|Guadalajara/.test(text), false)
  assert.equal(noArea.plan.pages.every((page) => !/ en [A-Z]/.test(page.seo.description ?? "")), true)

  const withLocation = await compileCustomer({ ...FULL_CUSTOMER, projects: [{ ...(FULL_CUSTOMER.projects as Array<Record<string, unknown>>)[0], location: "Colonia Del Valle" }] })
  assert.match(visibleText(withLocation), /Colonia Del Valle/)
})

/* O, P */
test("CSC-1C O-P: progress is same-project documentation, chronological only when declared, never before/after", async () => {
  const unordered = await fullCustomer()
  const text = visibleText(unordered)
  assert.match(text, /Avance de obra · Casa Roble/)
  assert.doesNotMatch(text, /Etapa \d/)
  assert.deepEqual(trustClaims(text).filter((label) => label === "before/after"), [])

  const projects = FULL_CUSTOMER.projects as Array<Record<string, unknown>>
  const chronological = await compileCustomer({ ...FULL_CUSTOMER, projects: [{ ...projects[0], progressSequence: "chronological" }, projects[1]] })
  assert.match(visibleText(chronological), /Etapa 1[\s\S]*Etapa 2[\s\S]*Etapa 3/)

  // The design data and the demo facts data (not explanatory comments) carry no before/after vocabulary.
  for (const data of [CONSTRUCTION_V1, DEMO_FACTS_INPUT_BY_DESIGN_V1.construction]) {
    assert.doesNotMatch(normalize(JSON.stringify(data)), /\bbefore\b|\bafter\b|\bantes\b|\bdespues\b|transformacion/)
  }
})

/* Q */
test("CSC-1C Q: asset roles are generic, validated and URL-safe", () => {
  assert.deepEqual([...COMMERCIAL_SECTION_BOUND_ASSET_ROLES_V1], ["heroProject", "featuredProject", "projectProgress", "specialtyService", "companyProof", "projectGallery"])
  const normalized = normalizeBusinessFactsV1({
    businessName: "Obras Q",
    contact: { phone: "5512345678" },
    assets: {
      heroProject: { src: "javascript:alert(1)" },
      featuredProject: [{ src: "data:image/png;base64,AAAA" }, { src: "https://cdn.example.com/ok.webp" }],
      projectGallery: [{ src: "/uploads/../../etc/passwd" }, { src: "/uploads/ok.webp" }],
      companyProof: [{ src: "http://insecure.example.com/x.jpg" }],
      specialtyService: { src: "/commercial-demo/construction/construction-demo-hero-lg.webp" },
    },
  })
  assert.equal(normalized.ok, true)
  if (!normalized.ok) throw new Error("unreachable")
  assert.equal(normalized.facts.assets.heroProject, undefined)
  assert.deepEqual(normalized.facts.assets.featuredProject.map((asset) => asset.src), ["https://cdn.example.com/ok.webp"])
  assert.deepEqual(normalized.facts.assets.projectGallery.map((asset) => asset.src), ["/uploads/ok.webp"])
  assert.deepEqual(normalized.facts.assets.companyProof, [])
  assert.equal(normalized.facts.assets.specialtyService, undefined, "customer facts can never reference demo derivatives")
})

/* R */
test("CSC-1C R: sameProjectId groups only curated evidence and binds progress to its own project", async () => {
  const normalized = normalizeBusinessFactsV1({
    businessName: "Obras R",
    contact: { phone: "5512345678" },
    projects: [{ id: "a", title: "Proyecto A", assets: [{ src: "/uploads/IMG_20260101_120000.webp" }] }],
    assets: { projectProgress: [{ src: "/uploads/IMG_20260101_120001.webp" }, { src: "/uploads/IMG_20260101_120002.webp", sameProjectId: "Proyecto A!" }] },
  })
  assert.equal(normalized.ok, true)
  if (!normalized.ok) throw new Error("unreachable")
  // Never derived from filenames/dates: the unlabeled progress image stays ungrouped.
  assert.equal(normalized.facts.assets.projectProgress[0].sameProjectId, undefined)
  assert.equal(normalized.facts.assets.projectProgress[1].sameProjectId, "proyecto-a")
  assert.equal(normalized.facts.projects[0].assets[0].sameProjectId, "a")

  const compiled = await fullCustomer()
  const home = compiled.resolved.sectionMedia.home?.gallery
  assert.ok(home)
  assert.ok((home.byRole.projectProgress ?? []).every((asset) => asset.sameProjectId === "casa-roble"))
  const detail = compiled.resolved.sectionMedia["proyecto-destacado"]?.gallery
  assert.deepEqual(detail?.focusProjectIds, ["casa-roble"])
  assert.ok([...(detail?.byRole.projectGallery ?? []), ...(detail?.byRole.projectProgress ?? [])].every((asset) => asset.sameProjectId === "casa-roble"))
})

/* S, U (sparse, no image) */
test("CSC-1C S/U: sparse facts still compile a coherent site with declared degradation", async () => {
  for (const [label, facts] of SPARSE_CASES) {
    const compiled = await compileCustomer(facts)
    const slugs = compiled.plan.pages.map((page) => page.slug)
    assert.deepEqual(slugs.slice(0, 1), ["home"], label)
    assert.ok(slugs.includes("nosotros") && slugs.includes("contacto"), label)
    assert.ok(compiled.plan.pages.every((page) => validateTree(page.tree).rootId === page.tree.rootId), label)
    assert.equal(ctaHrefs(compiled).some((href) => href === "#" || href === "#servicios" || href === "#contacto"), false, `${label}: dead link`)
    for (const href of ctaHrefs(compiled).filter((entry) => entry.startsWith("page:"))) assert.ok(slugs.includes(href.slice(5)), `${label}: ${href}`)
    for (const omission of compiled.resolved.omissions) assert.match(omission.reason, /^missing_/, label)
    const srcs = imageSources(compiled).filter(Boolean)
    assert.ok(srcs.every((src) => src.startsWith("/uploads/")), label)
  }
  const phoneOnly = await compileCustomer(SPARSE_CASES[0][1])
  assert.deepEqual(phoneOnly.plan.pages.map((page) => page.slug), ["home", "nosotros", "contacto"])
  assert.equal(phoneOnly.resolved.direction.pageDirections[0].preferredHeroVariant, "centered", "no hero photo -> typographic hero")
  assert.equal(imageSources(phoneOnly).filter(Boolean).length, 0)

  const imagesOnly = await compileCustomer(SPARSE_CASES[4][1])
  assert.ok(imagesOnly.plan.pages.some((page) => page.slug === "proyectos"), "images without project facts still earn a portfolio page")
  assert.equal(imagesOnly.plan.pages.some((page) => page.slug === "proyecto-destacado"), false)
  assert.doesNotMatch(visibleText(imagesOnly), /Ver proyecto\b/)
})

/* T */
test("CSC-1C T: no project evidence -> no projects page and no project module, services/process/contact carry the site", async () => {
  const compiled = await compileCustomer(SPARSE_CASES[5][1])
  assert.deepEqual(compiled.plan.pages.map((page) => page.slug), ["home", "servicios", "nosotros", "contacto"])
  assert.ok(compiled.resolved.omissions.some((omission) => omission.page === "proyectos" && omission.reason === "missing_facts:projectEvidence"))
  assert.ok(compiled.resolved.omissions.some((omission) => omission.page === "home" && omission.role === "gallery"))
  assert.equal(compiled.resolved.skeleton.find((page) => page.slug === "home")?.roles.includes("gallery"), false)
  assert.doesNotMatch(visibleText(compiled), /Proyectos|Avance de obra/)
})

/* V */
test("CSC-1C V: customer compiles never receive demo facts", async () => {
  const demoFacts = getDemoFactsV1("construction")
  assert.ok(demoFacts)
  assert.equal(demoFacts.kind, "demo")
  await assert.rejects(() => compileCommercialDesignV1({ mode: "customer", designId: "construction", version: 1, facts: demoFacts }), /DemoFactsPack/)
  for (const compiled of [await fullCustomer(), ...(await Promise.all(SPARSE_CASES.map(([, facts]) => compileCustomer(facts))))]) {
    const text = normalize(allStrings(compiled.plan))
    for (const leak of ["constructora ejemplo norte", "5500000000", "contacto@example.com", "(ejemplo)", "residencia contemporanea", "residencia-ejemplo", "sitio de ejemplo"]) {
      assert.equal(text.includes(leak), false, `${compiled.facts.businessName}: ${leak}`)
    }
  }
})

/* W */
test("CSC-1C W: customer compiles never receive demo assets (CUSTOMER_NTS_DEMO_ASSET_LEAK=0)", async () => {
  let leaks = 0
  for (const compiled of [await fullCustomer(), ...(await Promise.all(SPARSE_CASES.map(([, facts]) => compileCustomer(facts))))]) {
    leaks += allStrings(compiled.plan).split(COMMERCIAL_DEMO_ASSET_PREFIX_V1).length - 1
    leaks += allStrings(compiled.resolved).split(COMMERCIAL_DEMO_ASSET_PREFIX_V1).length - 1
  }
  assert.equal(leaks, 0)
  const injected = await compileCustomer({ ...FULL_CUSTOMER, assets: { heroProject: { src: "/commercial-demo/construction/construction-demo-hero-lg.webp" } }, projects: undefined })
  assert.equal(allStrings(injected.plan).includes(COMMERCIAL_DEMO_ASSET_PREFIX_V1), false)
  const demoSrcs = imageSources(await demo()).filter(Boolean)
  assert.ok(demoSrcs.length > 0 && demoSrcs.every((src) => src.startsWith("/commercial-demo/construction/")))
})

/* X */
test("CSC-1C X: demo and customer with equivalent evidence share the structural fingerprint; degradation changes it", async () => {
  const [demoCompiled, customer] = [await demo(), await fullCustomer()]
  assert.equal(demoCompiled.structuralFingerprint, customer.structuralFingerprint)
  assert.deepEqual(demoCompiled.resolved.skeleton, customer.resolved.skeleton)
  const sparse = await compileCustomer(SPARSE_CASES[0][1])
  assert.notEqual(sparse.structuralFingerprint, customer.structuralFingerprint)
  assert.equal(sparse.plan.designSource?.id, customer.plan.designSource?.id)
})

/* Y, Z */
test("CSC-1C Y/Z: every construction page is a valid EditorTree that survives serialization with project composition intact", async () => {
  for (const compiled of [await demo(), await fullCustomer()]) {
    for (const page of compiled.plan.pages) {
      const validated = validateTree(page.tree)
      const roundTrip = validateTree(JSON.parse(JSON.stringify(validated)) as EditorTree)
      assert.deepEqual(roundTrip, validated, page.slug)
      for (const [id, node] of Object.entries(roundTrip.nodes)) {
        for (const child of node.children) assert.ok(roundTrip.nodes[child], `${page.slug}:${id}->${child}`)
      }
    }
    const projects = compiled.plan.pages.find((page) => page.slug === "proyectos")
    assert.ok(projects)
    const reparsed = JSON.parse(JSON.stringify(projects.tree)) as EditorTree
    assert.ok(hasProgressBand(reparsed), "progress band survives serialization")
    assert.ok(Object.values(reparsed.nodes).filter((node) => node.type === "image" && String(node.props.src).length > 0).length >= 4)
  }
  const plan = (await fullCustomer()).plan
  const validation = validateSiteCreationPlanV2(plan, { maxPages: 8, maxBytes: 1_000_000 })
  assert.equal(validation.ok, true)
})

/* AA */
test("CSC-1C AA: output uses only blocks registered in the shared PublicRenderer/DynamicRenderer registry", async () => {
  const registry = readFileSync("components/editor/blocks/registry.ts", "utf8")
  const block = registry.slice(registry.indexOf("export const blockRegistry"))
  const registered = new Set([...block.matchAll(/^ {2}"?([A-Za-z][\w-]*)"?: \{$/gm)].map((match) => match[1]))
  assert.ok(registered.has("section") && registered.has("siteNav"))
  for (const compiled of [await demo(), await fullCustomer()]) {
    const types = new Set(compiled.plan.pages.flatMap((page) => Object.values(page.tree.nodes).map((node) => node.type)))
    for (const type of types) assert.ok(registered.has(type), type)
  }
  const renderer = readFileSync("components/PublicRenderer.tsx", "utf8")
  assert.doesNotMatch(renderer, /construction/i)
})

/* AB */
test("CSC-1C AB: plan carries the commercial designSource for construction@1", async () => {
  for (const compiled of [await demo(), await fullCustomer()]) {
    assert.deepEqual(compiled.plan.designSource, { kind: "commercial", id: "construction", version: 1 })
  }
})

/* AC (+34) */
test("CSC-1C AC: the existing commercial action previews construction@1 with mocked persistence (no DB writes)", async () => {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const completed: Array<Record<string, unknown>> = []
  let dbWrites = 0
  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@anthropic-ai/sdk") return class Anthropic {}
    if (request === "next/cache") return { revalidatePath: () => undefined }
    if (request === "@/lib/auth-session") return { getAuthSession: async () => ({ user: { id: "user_1", role: "CLIENT" } }) }
    if (request === "@/lib/plan-guard") return { requireAIPlan: async () => undefined, requireCanCreateWebsite: async () => undefined }
    if (request === "@/lib/auth") return { canManageSite: async () => true }
    if (request === "@/lib/orvenix-ai/site-creation/preview-store") {
      return {
        reserveSiteCreationPreviewAttempt: async ({ clientAttemptKey }: { clientAttemptKey: string }) => ({ id: `preview_${clientAttemptKey.replace(/[^a-z0-9]/gi, "_")}`, userId: "user_1", status: "planning" }),
        getCompletedSiteCreationPreviewForAttempt: async () => null,
        completeSiteCreationPreviewAttempt: async (record: Record<string, unknown>) => {
          completed.push(record)
          return { ...record, id: String(record.previewId), status: "completed", type: "ai_site_creation_preview" }
        },
        failSiteCreationPreviewAttempt: async () => true,
        getSiteCreationPreviewFailureMessage: (error: unknown) => (error instanceof Error ? error.message : "error"),
        getSiteCreationPreviewForExecute: async () => null,
        createDraftSiteFromPersistedPreview: async () => {
          dbWrites += 1
          return { siteId: "never", nextRoute: "/editor/never", verified: true }
        },
        rememberSiteCreationPreview: async () => {
          dbWrites += 1
          return null
        },
      }
    }
    return originalLoad.call(this, request, parent, isMain)
  }
  try {
    delete require.cache[path.join(process.cwd(), ".tmp/unit/app/actions/ai.js")]
    const action = await import("../../app/actions/ai")
    const result = await action.createSiteFromCommercialDesignAction({ mode: "preview", designId: "construction", version: 1, clientAttemptKey: "csc-1c-preview", facts: FULL_CUSTOMER })
    assert.equal(result.success, true, "message" in result ? String(result.message) : "")
    assert.equal(completed.length, 1)
    const plan = completed[0].plan as { designSource?: unknown; pages: Array<{ slug: string }> }
    assert.deepEqual(plan.designSource, { kind: "commercial", id: "construction", version: 1 })
    assert.ok(plan.pages.some((page) => page.slug === "proyectos"))
    // Confirmation stays the existing execute path: an unconfirmed execute never creates a site.
    const unconfirmed = await action.createSiteFromCommercialDesignAction({ mode: "execute", designId: "construction", version: 1, confirmed: false, previewId: "preview_csc_1c_preview" })
    assert.equal(unconfirmed.success, false)
    assert.equal(dbWrites, 0)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
  }
})

/* AD */
test("CSC-1C AD: SiteNav lists only compiled pages with valid page links and the real primary action", async () => {
  for (const compiled of [await demo(), await fullCustomer(), await compileCustomer(SPARSE_CASES[0][1])]) {
    const slugs = new Set(compiled.plan.pages.map((page) => page.slug))
    for (const page of compiled.plan.pages) {
      const nav = Object.values(page.tree.nodes).find((node) => node.type === "siteNav")
      assert.ok(nav, page.slug)
      const serialized = JSON.stringify(nav.props)
      for (const match of serialized.matchAll(/page:([a-z0-9-]+)/g)) assert.ok(slugs.has(match[1]), `${page.slug}: ${match[1]}`)
      assert.doesNotMatch(serialized, /javascript:|data:/i)
    }
  }
})

/* AE */
test("CSC-1C AE: footer renders only supplied contact facts, never registration/legal claims", async () => {
  const compiled = await compileCustomer({ businessName: "Obras Pie", contact: { email: "hola@obraspie.example" } })
  const footerText = sectionSubtreeText(compiled.plan.pages[0].tree, "footer")
  assert.match(footerText, /Correo: hola@obraspie\.example/)
  assert.doesNotMatch(footerText, /WhatsApp:|Teléfono:|Horario:|Zona de servicio:|RFC|registro|licencia|©/i)
})

/* AF */
test("CSC-1C AF: every CTA target is a resolved page link or a safe contact URL", async () => {
  const safe = /^(?:page:[a-z0-9-]+|https:\/\/wa\.me\/\d+(?:\?text=[^\s"'<>]*)?|tel:\+?\d{6,15}|mailto:[^\s"'<>]+@[^\s"'<>]+)$/
  for (const compiled of [await demo(), await fullCustomer(), ...(await Promise.all(SPARSE_CASES.map(([, facts]) => compileCustomer(facts))))]) {
    const slugs = new Set(compiled.plan.pages.map((page) => page.slug))
    for (const href of ctaHrefs(compiled)) {
      assert.match(href, safe, `${compiled.facts.businessName}: ${href}`)
      if (href.startsWith("page:")) assert.ok(slugs.has(href.slice(5)), href)
    }
  }
  const full = await fullCustomer()
  assert.ok(ctaHrefs(full).includes("page:proyecto-destacado"))
  assert.ok(ctaHrefs(full).includes("page:servicios"))
})

/* AG */
test("CSC-1C AG: injected markup/scripts in facts never reach the output as markup or executable URLs", async () => {
  const compiled = await compileCustomer({
    businessName: "Obras <script>alert(1)</script>",
    contact: { whatsapp: "5512345678", email: "x@y.example" },
    description: "<img src=x onerror=alert(1)> Remodelación",
    services: [{ name: "<svg onload=alert(1)>Losas", description: "{{constructor}} `x`" }],
    projects: [{ title: "Casa <iframe src=javascript:alert(1)>", summary: "<script>bad()</script>", assets: [{ src: "javascript:alert(1)" }, { src: "/uploads/ok.webp", alt: "<b onmouseover=x>" }] }],
    social: { instagram: "javascript:alert(1)", facebook: "https://facebook.com/obras" },
    assets: { logo: { src: "data:image/svg+xml,<svg onload=alert(1)>" }, heroProject: { src: "/uploads/hero.svg" } },
  })
  // Facts become inert plain text (markup characters stripped; React escapes text), never markup or executable targets.
  assert.equal(/[<>{}`]/.test(allStrings(compiled.plan.pages.map((page) => page.tree.nodes))), false)
  assert.equal(/[<>{}`]/.test(allStrings({ identity: compiled.plan.identity, seo: compiled.plan.pages.map((page) => page.seo) })), false)
  for (const page of compiled.plan.pages) {
    for (const node of Object.values(page.tree.nodes)) {
      for (const key of ["href", "src", "logoUrl", "ctaHref"]) {
        const value = (node.props as Record<string, unknown>)[key]
        if (typeof value === "string") assert.doesNotMatch(value.trim(), /^(?:javascript|data|vbscript):/i, `${key}=${value}`)
      }
    }
  }
  assert.equal(imageSources(compiled).some((src) => src.endsWith(".svg")), false)
  assert.ok(imageSources(compiled).includes("/uploads/ok.webp"))
})

/* AH */
test("CSC-1C AH: Servicios Locales keeps its identity, pages and demo/customer parity", async () => {
  assert.equal(validateCommercialDesignV1(SERVICIOS_LOCALES_V1).ok, true)
  const slDemo = await compileCommercialDesignV1({ mode: "demo", designId: "servicios-locales", version: 1 })
  assert.deepEqual(slDemo.plan.pages.map((page) => page.slug), ["home", "servicios", "contacto"])
  assert.equal(slDemo.resolved.theme.fontHeading, "Inter")
  assert.deepEqual(slDemo.resolved.sectionMedia, {}, "servicios-locales declares no project roles: no new bindings")
  assert.notEqual(slDemo.structuralFingerprint, (await demo()).structuralFingerprint)
  assert.equal(allStrings(slDemo.plan).includes(COMMERCIAL_DEMO_ASSET_PREFIX_V1), false)
})

/* AI */
test("CSC-1C AI: non-commercial builder paths are untouched by commercial-only switches", () => {
  const builder = readFileSync("lib/orvenix-ai/autonomous/site-builder.ts", "utf8")
  assert.match(builder, /\.\.\.\(input\.commercialDesign \? \{ preserveDecidedCtaHrefs: true \} : \{\}\)/)
  assert.match(builder, /\.\.\.\(commercialDesign \? \{ strictFacts: true, commercialFacts: commercialDesign\.commercialFacts, commercialSectionMedia: commercialDesign\.sectionMedia \} : \{\}\)/)
  assert.doesNotMatch(builder, /commercialGalleryAssets|commercialMediaAsset/)
  const composer = readFileSync("lib/orvenix-ai/composer/section-composer.ts", "utf8")
  assert.match(composer, /const boundHeroMedia = context\.strictFacts \? context\.commercialSectionMedia\?\.media : undefined/)
  assert.match(composer, /return context\.commercialSectionMedia \? composeCommercialGalleryV1\(context, context\.commercialSectionMedia\) : undefined/)
})

/* 35 + catalog */
test("CSC-1C catalog: one Construction entry resolves to construction@1 with a compiled live showcase", () => {
  const template = getRealTemplate("construction")
  assert.ok(template)
  assert.equal(template.commercialDesignId, "construction")
  assert.equal(template.commercialDesignVersion, 1)
  assert.equal(template.livePath, "/templates/construction/demo")
  assert.equal(readdirSync("app/webs").includes("construction"), false, "compiled showcases are not app/webs design references")
  assert.equal(template.preview.startsWith("/commercial-demo/construction/"), true)
  assert.equal(statSync(path.join("public", template.preview)).isFile(), true)
  assert.equal(getRealTemplate("arquitectura")?.livePath, "/webs/arquitectura", "existing architecture showcase is not replaced")
  assert.equal(isEditorWebId("construction"), true)
  assert.equal(validateTree(getEditorTreeForWeb("construction")).rootId.length > 0, true)
  const showcase = readFileSync("app/templates/[id]/demo/page.tsx", "utf8")
  assert.match(showcase, /compileCommercialDesignV1\(\{ mode: "demo", designId, version \}\)/)
  assert.match(showcase, /template\?\.commercialDesignId/)
  assert.match(showcase, /notFound\(\)/)
  assert.match(showcase, /index: false/)
})

/* AL */
test("CSC-1C AL: dev review route is production-guarded before compiling and offers full + sparse states", () => {
  const source = readFileSync("app/dev-commercial-review/construction/page.tsx", "utf8")
  const guard = source.indexOf('if (process.env.NODE_ENV === "production") notFound()')
  assert.ok(guard > 0)
  assert.ok(guard < source.indexOf("await compileState("))
  assert.match(source, /FULL EVIDENCE/)
  assert.match(source, /SPARSE FACTS/)
  assert.match(source, /width: 834/)
  assert.match(source, /width: 390/)
  assert.doesNotMatch(source, /\.nts|\/home\/|IMG_|DSC_/)
})

/* AM (+40) */
test("CSC-1C AM: curated demo derivatives are metadata-free, generically named and bounded", () => {
  // The checker itself detects metadata on a SYNTHETIC fixture (no real metadata in tests).
  const chunk = (id: string, payload: Buffer) => {
    const header = Buffer.alloc(8)
    header.write(id, 0, "ascii")
    header.writeUInt32LE(payload.length, 4)
    return Buffer.concat([header, payload, Buffer.alloc(payload.length & 1)])
  }
  const synthetic = (chunks: Buffer[]) => {
    const body = Buffer.concat([Buffer.from("WEBP", "ascii"), ...chunks])
    const header = Buffer.alloc(8)
    header.write("RIFF", 0, "ascii")
    header.writeUInt32LE(body.length, 4)
    return Buffer.concat([header, body])
  }
  assert.equal(webpHasMetadata(synthetic([chunk("VP8X", Buffer.alloc(10)), chunk("VP8 ", Buffer.alloc(4)), chunk("EXIF", Buffer.from("synthetic"))])), true)
  assert.equal(webpHasMetadata(synthetic([chunk("VP8 ", Buffer.alloc(4))])), false)

  const files = readdirSync(DEMO_DIR)
  assert.ok(files.length > 0 && files.length <= 12, `bounded curated set: ${files.length}`)
  let totalBytes = 0
  for (const file of files) {
    assert.match(file, /^construction-demo-[a-z]+(?:-\d{2})?-(?:lg|md)\.webp$/, file)
    const buffer = readFileSync(path.join(DEMO_DIR, file))
    totalBytes += buffer.length
    assert.equal(webpHasMetadata(buffer), false, `${file}: METADATA_STRIPPED`)
    assert.equal(/GPSInfo|Exif\0\0|<x:xmpmeta/.test(buffer.toString("latin1")), false, file)
  }
  assert.ok(totalBytes < 4 * 1024 * 1024, "no accidental archive import")

  const referenced = new Set([...JSON.stringify(DEMO_FACTS_INPUT_BY_DESIGN_V1.construction).matchAll(/\/commercial-demo\/construction\/([a-z0-9-]+\.webp)/g)].map((match) => match[1]))
  for (const file of referenced) assert.ok(files.includes(file), `missing derivative ${file}`)

  for (const source of ["lib/orvenix-ai/commercial-designs/demo-facts.ts", "lib/orvenix-ai/commercial-designs/designs/construction.ts", "lib/realTemplates.ts", "lib/editorWebs.ts"]) {
    const text = readFileSync(source, "utf8")
    assert.doesNotMatch(text, /IMG_\d|DSC_\d|alberca\.JPG|\.nts construccion|\/home\/orvenix|latitude|longitude|GPS/i, source)
  }
})

test("CSC-1C AM: no compiled demo output serializes filesystem paths or original filenames", async () => {
  const serialized = JSON.stringify((await demo()).plan)
  assert.doesNotMatch(serialized, /\/home\/|\/var\/lib|\.nts|IMG_\d|DSC_\d|\.JPG|file:\/\//i)
  assert.doesNotMatch(serialized, /\/uploads\/demo-construction/)
})
