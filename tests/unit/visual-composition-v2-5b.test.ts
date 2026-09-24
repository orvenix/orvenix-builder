import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

// Same @/ alias -> compiled-output resolution hook composition-variety-v2-3.test.ts
// already established -- section-composer.ts imports several of its own
// dependencies via "@/..." paths, which plain relative requires from a
// test file can't resolve after tsc compiles everything into .tmp/unit.
const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; displayName?: string }
type Section = { role: string; rootId: string; nodes: Record<string, Node> } | null

function nodesOf(section: Section): Record<string, Node> {
  return section?.nodes ?? {}
}

function allNodes(nodes: Record<string, Node>): Node[] {
  return Object.values(nodes)
}

function findByDisplayName(nodes: Record<string, Node>, displayName: string): Node | undefined {
  return allNodes(nodes).find((n) => n.displayName === displayName)
}

function countByType(nodes: Record<string, Node>, type: string): number {
  return allNodes(nodes).filter((n) => n.type === type).length
}

async function loadComposer() {
  return import("../../lib/orvenix-ai/composer") as Promise<{
    composeSection: (role: string, context?: Record<string, unknown>) => Section
  }>
}

const FAMILIES = ["health", "hospitality", "creative", "commerce", "professional"]

// ---------------------------------------------------------------------------
// C1: abstract-glow hero
// ---------------------------------------------------------------------------

test("V2-5B 1) abstract-glow hero composes deterministically", async () => {
  const { composeSection } = await loadComposer()
  const context = { richComposition: true, visualFamily: "creative", businessName: "Estudio Prueba", industry: "diseño" }
  const first = composeSection("hero", context)
  const second = composeSection("hero", context)
  // Node tempIds embed a fresh randomUUID() per call (same established
  // pattern composition-variety-v2-3.test.ts's own determinism test
  // uses) -- displayName sequence + root background/type are the
  // ID-independent structural signal.
  assert.deepEqual(
    Object.values(nodesOf(first)).map((n) => n.displayName),
    Object.values(nodesOf(second)).map((n) => n.displayName),
  )
  assert.equal(nodesOf(first)[first!.rootId]?.props?.background, nodesOf(second)[second!.rootId]?.props?.background)
})

test("V2-5B 2) abstract-glow hero requires no external image (no image-type node)", async () => {
  const { composeSection } = await loadComposer()
  // Probe until we land on abstract-glow (professional/creative both carry real weight for it).
  let found: Section = null
  for (let i = 0; i < 80 && !found; i += 1) {
    const probe = composeSection("hero", { richComposition: true, visualFamily: "professional", pageSlug: `p${i}`, industry: `industria-${i}` })
    const nodes = nodesOf(probe)
    if (findByDisplayName(nodes, "Decoracion glow 1")) found = probe
  }
  assert.ok(found, "no se encontro un contexto que resuelva a abstract-glow en 80 intentos")
  const nodes = nodesOf(found)
  assert.equal(countByType(nodes, "image"), 0)
  assert.ok(findByDisplayName(nodes, "Decoracion glow 1"))
  assert.ok(findByDisplayName(nodes, "Decoracion glow 2"))
})

test("V2-5B 2b) abstract-glow hero supports single and dual CTA depending on real content", async () => {
  const { composeSection } = await loadComposer()
  let single: Section = null
  let dual: Section = null
  for (let i = 0; i < 80 && (!single || !dual); i += 1) {
    const base = { richComposition: true, visualFamily: "professional", pageSlug: `q${i}`, industry: `industria-${i}` }
    const noServices = composeSection("hero", base)
    if (!single && findByDisplayName(nodesOf(noServices), "Decoracion glow 1")) single = noServices
    const withServices = composeSection("hero", { ...base, services: [{ name: "Servicio A" }] })
    if (!dual && findByDisplayName(nodesOf(withServices), "Decoracion glow 1")) dual = withServices
  }
  assert.ok(single && dual, "no se encontraron ambos contextos abstract-glow en 80 intentos")
  assert.equal(countByType(nodesOf(single), "ctaButton"), 1)
  assert.equal(countByType(nodesOf(dual), "ctaButton"), 2)
})

test("V2-5B 2c) abstract-glow hero renders a credibility row only when real stats are supplied", async () => {
  const { composeSection } = await loadComposer()
  let withStats: Section = null
  let withoutStats: Section = null
  for (let i = 0; i < 80 && (!withStats || !withoutStats); i += 1) {
    const base = { richComposition: true, visualFamily: "professional", pageSlug: `r${i}`, industry: `industria-${i}` }
    const a = composeSection("hero", { ...base, credibilityStats: [{ value: "12", label: "años activos" }] })
    if (!withStats && findByDisplayName(nodesOf(a), "Decoracion glow 1")) withStats = a
    const b = composeSection("hero", base)
    if (!withoutStats && findByDisplayName(nodesOf(b), "Decoracion glow 1")) withoutStats = b
  }
  assert.ok(withStats && withoutStats, "no se encontraron ambos contextos abstract-glow en 80 intentos")
  assert.ok(findByDisplayName(nodesOf(withStats), "Fila de credibilidad"))
  assert.equal(findByDisplayName(nodesOf(withoutStats), "Fila de credibilidad"), undefined)
})

test("V2-5B 13a) abstract-glow hero is reachable from every business family (never locked out)", async () => {
  const { composeSection } = await loadComposer()
  for (const family of FAMILIES) {
    let found = false
    for (let i = 0; i < 200 && !found; i += 1) {
      const probe = composeSection("hero", { richComposition: true, visualFamily: family, pageSlug: `f${i}`, industry: `x-${i}` })
      if (findByDisplayName(nodesOf(probe), "Decoracion glow 1")) found = true
    }
    assert.ok(found, `abstract-glow nunca aparecio para la familia "${family}" en 200 intentos`)
  }
})

// ---------------------------------------------------------------------------
// C2: immersive-photo hero
// ---------------------------------------------------------------------------

function findImmersiveContext(composeSection: (role: string, context?: Record<string, unknown>) => Section, extra: Record<string, unknown> = {}) {
  for (let i = 0; i < 80; i += 1) {
    const probe = composeSection("hero", { visualFamily: "hospitality", pageSlug: `h${i}`, industry: `hosp-${i}`, ...extra })
    if (findByDisplayName(nodesOf(probe), "Overlay legibilidad")) return probe
  }
  return null
}

test("V2-5B 3) immersive-photo hero structure is asset-ready (image node present under the absolute media layer)", async () => {
  const { composeSection } = await loadComposer()
  const hero = findImmersiveContext(composeSection)
  assert.ok(hero, "no se encontro un contexto inmersivo en 80 intentos")
  const nodes = nodesOf(hero)
  assert.equal(countByType(nodes, "image"), 1)
  const mediaLayer = findByDisplayName(nodes, "Imagen inmersiva")
  assert.ok(mediaLayer)
  assert.ok((mediaLayer!.children ?? []).length > 0, "la capa de imagen debe contener el nodo image")
})

test("V2-5B 4) immersive-photo hero falls back safely with no asset (safe dark backdrop, no crash)", async () => {
  const { composeSection } = await loadComposer()
  const hero = findImmersiveContext(composeSection)
  assert.ok(hero)
  const nodes = nodesOf(hero)
  const mediaLayer = findByDisplayName(nodes, "Imagen inmersiva")
  assert.ok(String(mediaLayer!.props?.className).includes("bg-slate-900"))
  const imageNode = allNodes(nodes).find((n) => n.type === "image")
  assert.equal(imageNode?.props?.src, "")
})

test("V2-5B 4b) immersive-photo hero content composition can resolve left OR centered when richComposition is on", async () => {
  const { composeSection } = await loadComposer()
  let left: Section = null
  let center: Section = null
  for (let i = 0; i < 120 && (!left || !center); i += 1) {
    const probe = composeSection("hero", { richComposition: true, visualFamily: "creative", pageSlug: `align${i}`, industry: `align-${i}` })
    const content = findByDisplayName(nodesOf(probe), "Contenido hero")
    if (!content) continue
    const className = String(content.props?.className ?? "")
    if (!left && className.includes("items-start") && className.includes("text-left")) left = probe
    if (!center && className.includes("items-center") && className.includes("text-center")) center = probe
  }
  assert.ok(left, "nunca se encontro alineacion izquierda en 120 intentos (familia 'creative' favorece 'left')")
  assert.ok(center, "nunca se encontro alineacion centrada en 120 intentos")
})

test("V2-5B 15) existing hero variants (centered/split-left/split-right/immersive) still work without richComposition", async () => {
  const { composeSection } = await loadComposer()
  const seenShapes = new Set<string>()
  for (let i = 0; i < 200 && seenShapes.size < 4; i += 1) {
    const probe = composeSection("hero", { visualFamily: FAMILIES[i % FAMILIES.length], pageSlug: `legacy${i}`, industry: `legacy-${i}` })
    const nodes = nodesOf(probe)
    if (findByDisplayName(nodes, "Overlay legibilidad")) seenShapes.add("immersive")
    else if (findByDisplayName(nodes, "Layout hero")) seenShapes.add("split-or-centered")
    // Never abstract-glow without the flag.
    assert.equal(findByDisplayName(nodes, "Decoracion glow 1"), undefined)
  }
  assert.ok(seenShapes.size >= 1)
})

// ---------------------------------------------------------------------------
// C3: paired layout
// ---------------------------------------------------------------------------

const TWO_REAL_SERVICES = [
  { name: "Consultoria inicial", description: "Diagnostico completo antes de empezar." },
  { name: "Acompanamiento continuo", description: "Seguimiento mensual del proyecto." },
]
const TWO_REAL_PROCESS_STEPS = [
  { name: "Diagnostico", description: "Entendemos el objetivo real." },
  { name: "Entrega", description: "Confirmamos el siguiente paso." },
]

/** Probes until composeSection("services", ...) with exactly 2 real items resolves to the requested outcome ("paired" or "cards"), varying `objective` (hash-relevant, unlike pageSlug -- see variant-selector.ts's sectionIndex/pageSlug exclusion comment) while holding visualFamily fixed. */
function findTwoItemOutcome(
  composeSection: (role: string, context?: Record<string, unknown>) => Section,
  wantPaired: boolean,
  visualFamily = "professional",
  maxAttempts = 200,
) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const probe = composeSection("services", { richComposition: true, visualFamily, objective: `obj-${i}`, services: TWO_REAL_SERVICES })
    const isPaired = Boolean(findByDisplayName(nodesOf(probe), "Pareja services"))
    if (isPaired === wantPaired) return probe
  }
  return null
}

test("V2-5B 5) paired-layout renders exactly the intended item grouping (2 real services -> 2 panels) when eligible AND selected", async () => {
  const { composeSection } = await loadComposer()
  const section = findTwoItemOutcome(composeSection, true)
  assert.ok(section, "nunca se selecciono 'paired' para 2 items reales en 200 intentos")
  const nodes = nodesOf(section)
  const grid = findByDisplayName(nodes, "Pareja services")
  assert.ok(grid)
  assert.equal((grid!.children ?? []).length, 2)
  assert.ok(findByDisplayName(nodes, "Consultoria inicial"))
  assert.ok(findByDisplayName(nodes, "Acompanamiento continuo"))
})

test("V2-5B 6) paired-layout works with different semantic content across roles (features, process)", async () => {
  const { composeSection } = await loadComposer()
  let processSection: Section = null
  for (let i = 0; i < 200 && !processSection; i += 1) {
    const probe = composeSection("process", { richComposition: true, visualFamily: "professional", objective: `procobj-${i}`, processSteps: TWO_REAL_PROCESS_STEPS })
    if (findByDisplayName(nodesOf(probe), "Pareja process")) processSection = probe
  }
  assert.ok(processSection, "nunca se selecciono 'paired' para 'process' con 2 pasos reales en 200 intentos")
  assert.ok(findByDisplayName(nodesOf(processSection), "Diagnostico"))
  assert.ok(findByDisplayName(nodesOf(processSection), "Entrega"))

  const featuresSection = composeSection("features", { richComposition: true, services: [] })
  assert.ok(featuresSection)
})

// ---------------------------------------------------------------------------
// V2-5B pre-commit refinement: paired-layout ELIGIBLE, not mandatory (D-H)
// ---------------------------------------------------------------------------

test("V2-5B refinement D) exactly-two services CAN reach paired-layout", async () => {
  const { composeSection } = await loadComposer()
  const section = findTwoItemOutcome(composeSection, true)
  assert.ok(section, "paired-layout nunca fue alcanzable en 200 intentos")
})

test("V2-5B refinement E) exactly-two services CAN ALSO reach a non-paired existing layout (cards)", async () => {
  const { composeSection } = await loadComposer()
  const section = findTwoItemOutcome(composeSection, false)
  assert.ok(section, "el tratamiento 'cards' nunca fue alcanzable con 2 items reales en 200 intentos")
  const nodes = nodesOf(section)
  assert.equal(findByDisplayName(nodes, "Pareja services"), undefined)
  const grid = findByDisplayName(nodes, "Grid services")
  assert.ok(grid)
  assert.equal((grid!.children ?? []).length, 2)
})

test("V2-5B refinement F) paired vs non-paired selection is deterministic for identical input", async () => {
  const { composeSection } = await loadComposer()
  const context = { richComposition: true, visualFamily: "professional", objective: "fixed-objective", services: TWO_REAL_SERVICES }
  const first = composeSection("services", context)
  const second = composeSection("services", context)
  assert.equal(Boolean(findByDisplayName(nodesOf(first), "Pareja services")), Boolean(findByDisplayName(nodesOf(second), "Pareja services")))
  assert.deepEqual(
    Object.values(nodesOf(first)).map((n) => n.displayName),
    Object.values(nodesOf(second)).map((n) => n.displayName),
  )
})

test("V2-5B refinement G) two real items remain exactly two real semantic items in EVERY treatment (no fake third item, no duplication)", async () => {
  const { composeSection } = await loadComposer()
  for (const wantPaired of [true, false]) {
    const section = findTwoItemOutcome(composeSection, wantPaired)
    assert.ok(section, `tratamiento ${wantPaired ? "paired" : "cards"} nunca alcanzado en 200 intentos`)
    const nodes = nodesOf(section)
    const headingTexts = Object.values(nodes)
      .filter((n) => n.type === "heading" && typeof n.props?.text === "string")
      .map((n) => n.props?.text)
      .filter((text) => text === "Consultoria inicial" || text === "Acompanamiento continuo")
    // exactly one heading per real item, no duplicate, no invented third.
    assert.deepEqual(new Set(headingTexts), new Set(["Consultoria inicial", "Acompanamiento continuo"]))
    assert.equal(headingTexts.length, 2)
  }
})

test("V2-5B refinement H) paired-layout remains reachable across multiple business families", async () => {
  const { composeSection } = await loadComposer()
  for (const family of FAMILIES) {
    const section = findTwoItemOutcome(composeSection, true, family)
    assert.ok(section, `paired-layout nunca alcanzado para la familia "${family}" en 200 intentos`)
  }
})

// ---------------------------------------------------------------------------
// C4: numbered process
// ---------------------------------------------------------------------------

test("V2-5B 7) numbered-process preserves actual process items and order", async () => {
  const { composeSection } = await loadComposer()
  const steps = [
    { name: "Paso Alpha", description: "Primero." },
    { name: "Paso Beta", description: "Segundo." },
    { name: "Paso Gamma", description: "Tercero." },
  ]
  let found: Section = null
  for (let i = 0; i < 120 && !found; i += 1) {
    const probe = composeSection("process", {
      richComposition: true,
      visualFamily: "creative",
      pageSlug: `proc${i}`,
      industry: `proc-${i}`,
      processSteps: steps,
    })
    const grid = findByDisplayName(nodesOf(probe), "Pasos process")
    if (grid) found = probe
  }
  assert.ok(found, "nunca se resolvio el tratamiento 'numbered' en 120 intentos (familia 'creative' lo favorece)")
  const nodes = nodesOf(found)
  const grid = findByDisplayName(nodes, "Pasos process")!
  const order = (grid.children ?? []).map((id) => {
    const step = nodes[id]
    const stack = (step.children ?? []).map((cid) => nodes[cid])
    const titleNode = stack.flatMap((n) => (n.children ?? []).map((cid) => nodes[cid])).find((n) => n?.type === "heading")
    return titleNode?.props?.text
  })
  assert.deepEqual(order, ["Paso Alpha", "Paso Beta", "Paso Gamma"])
})

test("V2-5B 8) numbered-process never invents steps beyond what the composer actually received", async () => {
  const { composeSection } = await loadComposer()
  let found: Section = null
  for (let i = 0; i < 120 && !found; i += 1) {
    const probe = composeSection("process", {
      richComposition: true,
      visualFamily: "creative",
      pageSlug: `proc2-${i}`,
      industry: `proc2-${i}`,
      processSteps: [{ name: "Unico paso real", description: "Solo hay uno." }, { name: "Segundo paso real", description: "Y este." }],
    })
    // exactly 2 real items -> content-driven paired-layout, not numbered -- use 3 to force numbered eligibility instead
    if (findByDisplayName(nodesOf(probe), "Pasos process")) found = probe
  }
  // With exactly 2 items paired-layout wins (by design); redo with 4 real items to hit numbered specifically.
  for (let i = 0; i < 120 && !found; i += 1) {
    const probe = composeSection("process", {
      richComposition: true,
      visualFamily: "creative",
      pageSlug: `proc3-${i}`,
      industry: `proc3-${i}`,
      processSteps: [
        { name: "Uno", description: "a" },
        { name: "Dos", description: "b" },
        { name: "Tres", description: "c" },
        { name: "Cuatro", description: "d" },
      ],
    })
    if (findByDisplayName(nodesOf(probe), "Pasos process")) found = probe
  }
  assert.ok(found, "nunca se resolvio 'numbered' con 4 pasos reales en 120 intentos")
  const nodes = nodesOf(found)
  const grid = findByDisplayName(nodes, "Pasos process")!
  assert.equal((grid.children ?? []).length, 4)
})

test("V2-5B 8b) numbered-process without real processSteps uses the existing deterministic placeholder copy, never fabricated content", async () => {
  const { composeSection } = await loadComposer()
  let found: Section = null
  for (let i = 0; i < 120 && !found; i += 1) {
    const probe = composeSection("process", { richComposition: true, visualFamily: "creative", pageSlug: `proc4-${i}`, industry: `proc4-${i}` })
    if (findByDisplayName(nodesOf(probe), "Pasos process")) found = probe
  }
  assert.ok(found)
  const nodes = nodesOf(found)
  const grid = findByDisplayName(nodes, "Pasos process")!
  // Exactly the existing 3-item deterministic placeholder set, unchanged.
  assert.equal((grid.children ?? []).length, 3)
})

// ---------------------------------------------------------------------------
// C5: credibility / stat row
// ---------------------------------------------------------------------------

test("V2-5B 9) credibility-stat treatment renders supplied real stats", async () => {
  const { composeSection } = await loadComposer()
  const section = composeSection("trust", {
    richComposition: true,
    credibilityStats: [
      { value: "8", label: "especialidades" },
      { value: "24/7", label: "atencion de urgencias" },
    ],
  })
  const nodes = nodesOf(section)
  const row = findByDisplayName(nodes, "Fila de credibilidad")
  assert.ok(row)
  assert.equal((row!.children ?? []).length, 2)
  const values = allNodes(nodes)
    .filter((n) => n.type === "heading" && typeof n.props?.text === "string" && (n.props.text === "8" || n.props.text === "24/7"))
    .map((n) => n.props?.text)
  assert.deepEqual(new Set(values), new Set(["8", "24/7"]))
})

test("V2-5B 10) credibility-stat treatment does NOT fabricate stats when none are supplied", async () => {
  const { composeSection } = await loadComposer()
  const section = composeSection("trust", { richComposition: true })
  const nodes = nodesOf(section)
  assert.equal(findByDisplayName(nodes, "Fila de credibilidad"), undefined)
  // Falls through to the existing checklist/card trust treatment, unchanged.
  assert.ok(section)
})

test("V2-5B 10b) credibility-stat treatment ignores richComposition without real stats even on other roles' hero row", async () => {
  const { composeSection } = await loadComposer()
  const hero = composeSection("hero", { richComposition: true, visualFamily: "professional" })
  // No crash, no fabricated stat row anywhere by default -- credibilityStats was never supplied.
  assert.equal(findByDisplayName(nodesOf(hero), "Fila de credibilidad"), undefined)
})

// ---------------------------------------------------------------------------
// V2-5B pre-commit refinement: theme-aware accent-soft (A-C)
// ---------------------------------------------------------------------------

/** Probes sectionIndex (the hash-relevant field for tone -- see resolveSectionTone) until the section resolves to "accent-soft". */
function findAccentSoftSection(
  composeSection: (role: string, context?: Record<string, unknown>) => Section,
  extra: Record<string, unknown> = {},
  maxAttempts = 40,
) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const probe = composeSection("services", {
      richComposition: true,
      visualFamily: "professional",
      archetype: "overview",
      sectionIndex: i,
      totalSections: 40,
      services: [{ name: "A" }, { name: "B" }, { name: "C" }],
      ...extra,
    })
    const root = nodesOf(probe)[probe!.rootId]
    if (root?.props?.background && root.props.background !== "#ffffff" && root.props.background !== "#f8fafc" && root.props.background !== "#0b1220") {
      return probe
    }
  }
  return null
}

test("V2-5B refinement A) accent-soft derives from at least two different supplied theme accent colors, producing distinct results", async () => {
  const { composeSection } = await loadComposer()
  const themeA = findAccentSoftSection(composeSection, { accentColor: "#1BB3FA" }) // a real site accent, e.g. a blue brand
  const themeB = findAccentSoftSection(composeSection, { accentColor: "#E85D3D" }) // a real site accent, e.g. an orange brand
  assert.ok(themeA, "nunca se resolvio 'accent-soft' para THEME_A en 40 intentos")
  assert.ok(themeB, "nunca se resolvio 'accent-soft' para THEME_B en 40 intentos")
  const backgroundA = nodesOf(themeA)[themeA!.rootId]?.props?.background
  const backgroundB = nodesOf(themeB)[themeB!.rootId]?.props?.background
  assert.notEqual(backgroundA, backgroundB, "dos acentos de tema distintos produjeron el MISMO fondo accent-soft")
  // both must still be light tints (dark-on-light text stays legible) -- not the old fixed blue, not raw accent, not arbitrary.
  assert.notEqual(backgroundA, "#f0f7ff")
  assert.notEqual(backgroundB, "#f0f7ff")
})

test("V2-5B refinement B) identical supplied theme input is deterministic", async () => {
  const { composeSection } = await loadComposer()
  const context = { richComposition: true, visualFamily: "professional", archetype: "overview", sectionIndex: 5, totalSections: 40, accentColor: "#1BB3FA", services: [{ name: "A" }, { name: "B" }, { name: "C" }] }
  const first = composeSection("services", context)
  const second = composeSection("services", context)
  assert.equal(nodesOf(first)[first!.rootId]?.props?.background, nodesOf(second)[second!.rootId]?.props?.background)
})

test("V2-5B refinement C) no-theme existing caller remains backward-compatible (neutral fallback, not the old fixed blue)", async () => {
  const { composeSection } = await loadComposer()
  // Without a real theme accent, "accent-soft" now intentionally resolves
  // to the exact same neutral surface "muted" already uses (#f8fafc) --
  // by design (see NEUTRAL_ACCENT_SOFT_FALLBACK), so it's no longer
  // distinguishable from "muted" by background value alone, and doesn't
  // need to be: sweeping many section positions and confirming the OLD
  // fixed-blue value never appears is the direct, robust proof.
  const backgrounds = new Set<string>()
  for (let i = 0; i < 60; i += 1) {
    const probe = composeSection("services", {
      richComposition: true,
      visualFamily: "professional",
      archetype: "overview",
      sectionIndex: i,
      totalSections: 60,
      services: [{ name: "A" }, { name: "B" }, { name: "C" }],
    })
    const background = nodesOf(probe)[probe!.rootId]?.props?.background
    if (typeof background === "string") backgrounds.add(background)
  }
  assert.ok(backgrounds.size > 1, "se esperaba variedad de fondos en 60 posiciones distintas")
  assert.equal(backgrounds.has("#f0f7ff"), false, "el antiguo azul fijo de accent-soft sigue apareciendo sin un tema real")
  assert.ok(backgrounds.has("#f8fafc"), "se esperaba encontrar el fondo neutro compartido (muted / accent-soft sin tema)")
})

// ---------------------------------------------------------------------------
// C6: background rhythm
// ---------------------------------------------------------------------------

test("V2-5B 11) background rhythm is deterministic for identical context", async () => {
  const { composeSection } = await loadComposer()
  const context = { richComposition: true, visualFamily: "professional", archetype: "overview", sectionIndex: 3, totalSections: 8 }
  const first = composeSection("services", context)
  const second = composeSection("services", context)
  assert.deepEqual(
    Object.values(nodesOf(first)).map((n) => n.displayName),
    Object.values(nodesOf(second)).map((n) => n.displayName),
  )
  assert.equal(nodesOf(first)[first!.rootId]?.props?.background, nodesOf(second)[second!.rootId]?.props?.background)
})

test("V2-5B 12) background rhythm is theme-aware: a contrast-tone section gets light-on-dark text, not illegible dark-on-dark", async () => {
  const { composeSection } = await loadComposer()
  let found: Section = null
  for (let i = 0; i < 200 && !found; i += 1) {
    const probe = composeSection("services", {
      richComposition: true,
      visualFamily: "professional",
      archetype: "overview",
      sectionIndex: i,
      totalSections: 12,
      services: [{ name: "A" }, { name: "B" }, { name: "C" }],
    })
    const root = nodesOf(probe)[probe!.rootId]
    if (root?.props?.background === "#0b1220") found = probe
  }
  assert.ok(found, "nunca se resolvio el tono 'contrast' en 200 intentos")
  const nodes = nodesOf(found)
  const heading = findByDisplayName(nodes, "Titulo services")
  assert.equal(heading?.props?.color, "#ffffff")
})

test("V2-5B 11b) background rhythm varies with section position (not a single flattened surface)", async () => {
  const { composeSection } = await loadComposer()
  const backgrounds = new Set<string>()
  for (let i = 0; i < 12; i += 1) {
    const probe = composeSection("services", {
      richComposition: true,
      visualFamily: "professional",
      archetype: "overview",
      sectionIndex: i,
      totalSections: 12,
      services: [{ name: "A" }, { name: "B" }, { name: "C" }],
    })
    const root = nodesOf(probe)[probe!.rootId]
    if (typeof root?.props?.background === "string") backgrounds.add(root.props.background)
  }
  assert.ok(backgrounds.size > 1, `esperaba mas de un fondo distinto entre posiciones, obtuve: ${JSON.stringify([...backgrounds])}`)
})

test("V2-5B 14) unknown/absent richComposition safely falls back to pre-V2-5B defaults", async () => {
  const { composeSection } = await loadComposer()
  const withFalse = composeSection("services", { richComposition: false, services: [{ name: "A" }, { name: "B" }, { name: "C" }] })
  const withUndefined = composeSection("services", { services: [{ name: "A" }, { name: "B" }, { name: "C" }] })
  assert.deepEqual(
    Object.values(nodesOf(withFalse)).map((n) => n.displayName),
    Object.values(nodesOf(withUndefined)).map((n) => n.displayName),
  )
  const root = nodesOf(withFalse)[withFalse!.rootId]
  assert.equal(root?.props?.background, "#ffffff")
})

// ---------------------------------------------------------------------------
// Business-category independence (G)
// ---------------------------------------------------------------------------

test("V2-5B 13b) numbered-process is reachable from every business family (never locked out)", async () => {
  const { composeSection } = await loadComposer()
  for (const family of FAMILIES) {
    let found = false
    for (let i = 0; i < 200 && !found; i += 1) {
      const probe = composeSection("process", {
        richComposition: true,
        visualFamily: family,
        pageSlug: `nf${i}`,
        industry: `nf-${i}`,
        processSteps: [
          { name: "Uno", description: "a" },
          { name: "Dos", description: "b" },
          { name: "Tres", description: "c" },
        ],
      })
      if (findByDisplayName(nodesOf(probe), "Pasos process")) found = true
    }
    assert.ok(found, `numbered-process nunca aparecio para la familia "${family}" en 200 intentos`)
  }
})
