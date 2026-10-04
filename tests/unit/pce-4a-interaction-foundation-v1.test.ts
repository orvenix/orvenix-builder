import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import Module from "node:module"
import { createElement, type ComponentType, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"

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

// PCE-4A is fully offline. Credentials are deleted and fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("PCE-4A test: network is forbidden")
}) as typeof fetch

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8")
const GLOBALS_CSS = read("app/globals.css")

/** Minimal CSS walker (no dependency): calls back with each style rule, its enclosing at-rules and its declarations. */
function walkCssRules(css: string, visit: (selector: string, atRules: string[], decls: Array<{ prop: string; value: string }>) => void) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const stack: string[] = []
  let buffer = ""
  for (const char of source) {
    if (char === "{") {
      stack.push(buffer.trim())
      buffer = ""
    } else if (char === "}") {
      const prelude = stack.pop() ?? ""
      if (!prelude.startsWith("@") && buffer.includes(":")) {
        const decls = buffer.split(";").map((decl) => decl.trim()).filter(Boolean).map((decl) => {
          const at = decl.indexOf(":")
          return { prop: decl.slice(0, at).trim(), value: decl.slice(at + 1).trim() }
        })
        visit(prelude.replace(/\s+/g, " "), stack.filter((entry) => entry.startsWith("@")), decls)
      }
      buffer = ""
    } else {
      buffer += char
    }
  }
}

/**
 * Declarations ("prop: value;" lines) of the first rule whose selector LIST
 * contains `selector` exactly (optionally the first such rule containing
 * `mustInclude`). Rules inside @media blocks are skipped.
 */
function cssRule(selector: string, mustInclude?: string): string {
  let found: string | null = null
  walkCssRules(GLOBALS_CSS, (ruleSelector, atRules, decls) => {
    if (found !== null || atRules.length > 0) return
    if (!ruleSelector.split(",").map((part) => part.trim()).includes(selector)) return
    const body = decls.map((decl) => `${decl.prop}: ${decl.value};`).join("\n")
    if (!mustInclude || body.includes(mustInclude)) found = body
  })
  assert.notEqual(found, null, `missing CSS rule: ${selector}${mustInclude ? ` containing ${mustInclude}` : ""}`)
  return found!
}

function reducedMotionBlocks(): string {
  const blocks: string[] = []
  let from = 0
  for (;;) {
    const index = GLOBALS_CSS.indexOf("@media (prefers-reduced-motion: reduce) {", from)
    if (index === -1) break
    let depth = 0
    let cursor = GLOBALS_CSS.indexOf("{", index)
    const start = cursor
    for (; cursor < GLOBALS_CSS.length; cursor++) {
      if (GLOBALS_CSS[cursor] === "{") depth++
      if (GLOBALS_CSS[cursor] === "}") depth--
      if (depth === 0) break
    }
    blocks.push(GLOBALS_CSS.slice(start, cursor))
    from = cursor
  }
  return blocks.join("\n")
}

// ─── 1. Canonical semantic motion path ─────────────────────────────────────────

test("motion bucket resolves from the persisted theme.motion.duration (the builder's canonical output)", async () => {
  const { resolveRuntimeMotionBucket, motionBucketFromDuration } = await import("../../lib/builder-core/runtime/motion")
  // Exactly what site-builder writes for each AI motionBucket.
  assert.equal(resolveRuntimeMotionBucket({ motion: { duration: "0ms", easing: "ease" } }), "none")
  assert.equal(resolveRuntimeMotionBucket({ motion: { duration: "180ms", easing: "ease" } }), "subtle")
  assert.equal(resolveRuntimeMotionBucket({ motion: { duration: "320ms", easing: "ease" } }), "expressive")
  // Units are honored (not just the first number in the string).
  assert.equal(motionBucketFromDuration("0.3s"), "expressive")
  assert.equal(motionBucketFromDuration("0.15s"), "subtle")
  assert.equal(motionBucketFromDuration("0"), "none")
})

test("legacy and hostile themes fail safely to the documented legacy default", async () => {
  const { resolveRuntimeMotionBucket, motionBucketFromDuration, RUNTIME_MOTION_BUCKETS } = await import("../../lib/builder-core/runtime/motion")
  // Orvenix's historical default theme duration is 240ms, so legacy themes keep
  // rendering as they always have.
  const legacyDefault = resolveRuntimeMotionBucket({ motion: { duration: "240ms", easing: "ease" } })
  assert.equal(legacyDefault, "expressive")
  for (const legacy of [undefined, null, {}, { motion: undefined }, { colors: undefined }]) {
    assert.equal(resolveRuntimeMotionBucket(legacy as never), legacyDefault)
  }
  for (const hostile of ["", "fast", "calc(1s * 9)", "var(--x)", "1e9px", "<script>", "240ms; color: red"]) {
    assert.equal(motionBucketFromDuration(hostile), null, hostile)
    assert.equal(resolveRuntimeMotionBucket({ motion: { duration: hostile, easing: "ease" } }), legacyDefault, hostile)
  }
  for (const hostile of [42, {}, [], true, null]) {
    assert.equal(resolveRuntimeMotionBucket({ motion: { duration: hostile, easing: "ease" } } as never), legacyDefault)
  }
  assert.equal(resolveRuntimeMotionBucket({ motion: "fast" } as never), legacyDefault)
  // Negative durations can only reduce motion.
  assert.equal(resolveRuntimeMotionBucket({ motion: { duration: "-40ms", easing: "ease" } }), "none")
  // Every resolution is bounded to the vocabulary.
  assert.ok(RUNTIME_MOTION_BUCKETS.includes(resolveRuntimeMotionBucket({ motion: { duration: "999999ms", easing: "x" } })))
})

test("an invented theme.motionBucket field is NOT a second source of truth", async () => {
  const { resolveRuntimeMotionBucket } = await import("../../lib/builder-core/runtime/motion")
  assert.equal(resolveRuntimeMotionBucket({ motionBucket: "none", motion: { duration: "320ms", easing: "ease" } } as never), "expressive")
  assert.equal(resolveRuntimeMotionBucket({ motionBucket: "expressive", motion: { duration: "0ms", easing: "ease" } } as never), "none")
  // GlobalTheme schema is unchanged: no motionBucket field was added.
  const types = read("types/editor.ts")
  const globalTheme = types.slice(types.indexOf("export interface GlobalTheme"), types.indexOf("export interface SEOMetadata"))
  assert.doesNotMatch(globalTheme, /motionBucket/)
})

test("AI motionBucket -> builder theme -> runtime bucket round-trips for every bucket", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { resolveRuntimeMotionBucket, getRuntimeMotionAttributes } = await import("../../lib/builder-core/runtime/motion")
  for (const motionBucket of ["none", "subtle", "expressive"] as const) {
    const result = await runAutonomousMultiPageSiteBuilder({
      request: "Crea un sitio profesional para una clinica dental",
      forceFreshComposition: true,
      business: { name: "Clinica Aurora", industry: "salud dental", description: "Atencion dental preventiva.", location: "Monterrey", objective: "Conseguir citas" },
      designMemoryPrior: {
        version: 1,
        source: "design_memory",
        mode: "advisory",
        rankingVersion: 1,
        patternVersion: 1,
        level: "L2",
        patternKeyHash: "a".repeat(64),
        evidence: { rankingScore: 0.84, confidence: "high", qualifiedSampleSize: 42, fallbackUsed: false },
        recommendation: {
          context: { industryBucket: "health", siteType: "health", objectiveBucket: "lead_generation", styleBucket: "professional" },
          theme: { motionBucket },
        },
        reason: [],
      },
    })
    assert.equal(resolveRuntimeMotionBucket(result.plan.theme), motionBucket)
    for (const page of result.plan.pages) {
      assert.deepEqual(getRuntimeMotionAttributes(page.tree.theme), { "data-motion": motionBucket })
      assert.equal((page.tree.theme as Record<string, unknown>).motionBucket, undefined)
    }
  }
})

test("Design Memory and runtime share one inversion; provider contract is unchanged", async () => {
  const pattern = read("lib/orvenix-ai/design-memory/design-pattern.ts")
  assert.match(pattern, /import \{ motionBucketFromDuration \} from "..\/..\/builder-core\/runtime\/motion"/)
  assert.match(pattern, /return motionBucketFromDuration\(theme\.motion\?\.duration\)/)

  const { DESIGN_ASSISTANCE_THEME_BUCKETS_V1 } = await import("../../lib/orvenix-ai/assistance/contract")
  assert.deepEqual([...DESIGN_ASSISTANCE_THEME_BUCKETS_V1.motionBucket], ["none", "subtle", "expressive"])
})

// ─── 2. Runtime motion root ────────────────────────────────────────────────────

test("one data-motion root on both renderer root branches; no duplicate CSS-var representation", async () => {
  const source = read("components/editor/DynamicRenderer.tsx")
  assert.equal((source.match(/getRuntimeMotionAttributes\(tree\.theme\)/g) ?? []).length, 1)
  assert.equal((source.match(/\{\.\.\.motionAttributes\}/g) ?? []).length, 2)
  assert.match(source, /<MotionWrapper \{\.\.\.motionProps\} runtimeMode=\{mode\}>/)

  const { getRuntimeThemeStyleVars } = await import("../../lib/builder-core/runtime/rendering")
  const vars = getRuntimeThemeStyleVars({ motion: { duration: "320ms", easing: "ease" } }) as Record<string, unknown>
  assert.equal(Object.keys(vars).some((key) => key.startsWith("--orv-")), false)
})

test("interaction tokens are Orvenix-owned per bucket; none zeroes motion; raw theme duration is not forwarded", () => {
  const base = cssRule(".editor-render-scope", "--orv-interaction-duration")
  for (const token of ["--orv-interaction-duration", "--orv-drawer-duration", "--orv-media-duration", "--orv-motion-distance-sm", "--orv-motion-distance-md", "--orv-motion-media-scale"]) {
    assert.match(base, new RegExp(`${token}:`), token)
  }
  assert.doesNotMatch(base, /--motion-duration/)

  const none = cssRule('.editor-render-scope[data-motion="none"]')
  assert.match(none, /--orv-interaction-duration: 0ms/)
  assert.match(none, /--orv-drawer-duration: 0ms/)
  assert.match(none, /--orv-motion-distance-sm: 0px/)
  assert.match(none, /--orv-motion-distance-md: 0px/)
  assert.match(none, /--orv-motion-media-scale: 1;/)

  // "expressive" reproduces the accepted PCE-3C hover intensities exactly
  // (card lift 4px / 2px, media 1.055) -- interaction intensity only.
  const expressive = cssRule('.editor-render-scope[data-motion="expressive"]')
  assert.match(expressive, /--orv-motion-distance-md: 4px/)
  assert.match(expressive, /--orv-motion-distance-sm: 2px/)
  assert.match(expressive, /--orv-motion-media-scale: 1\.055/)
})

test("resting-layout contract: data-motion and reduced motion only change tokens/animation, never the resting composition", () => {
  const LAYOUT_PROPS = /^(display|position|inset|top|right|bottom|left|width|min-width|max-width|height|min-height|max-height|margin.*|padding.*|gap|row-gap|column-gap|grid.*|flex.*|order|align-.*|justify-.*|place-.*|z-index|overflow.*|visibility|contain|container.*|translate|scale|rotate|float|clear)$/
  // Walker sanity: it really sees rules, at-rule context and declarations.
  let visited = 0
  let sawHoverRule = false
  walkCssRules(GLOBALS_CSS, (selector, atRules, decls) => {
    visited += 1
    if (selector === ".orvenix-cta-button:hover" && atRules.includes("@media (hover: hover)") && decls.some((decl) => decl.prop === "filter")) sawHoverRule = true
  })
  assert.ok(visited > 1000, `walker visited ${visited} rules`)
  assert.ok(sawHoverRule)

  const offenders: string[] = []
  walkCssRules(GLOBALS_CSS, (selector, atRules, decls) => {
    const inReducedMotion = atRules.some((atRule) => atRule.includes("prefers-reduced-motion"))
    const motionScoped = selector.includes("data-motion")
    // Generated-site selectors only (the Orvenix marketing/dashboard CSS is out of scope).
    const generatedSite = /editor-render-scope|editor-motion|orvenix-cta|orvenix-site-nav|orvenix-premium-site-nav|orvenix-cart|data-store-/.test(selector)
    if (!motionScoped && !(inReducedMotion && generatedSite)) return
    for (const decl of decls) {
      if (LAYOUT_PROPS.test(decl.prop)) offenders.push(`${selector} { ${decl.prop} }`)
      // Resting transforms may only be neutralized on interaction states.
      if (decl.prop === "transform" && !/:hover|:active|::before|::after/.test(selector)) offenders.push(`${selector} { transform }`)
    }
  })
  assert.deepEqual(offenders, [])

  // Bucket token rules define custom properties only.
  for (const selector of ['.editor-render-scope[data-motion="expressive"]', '.editor-render-scope[data-motion="none"]']) {
    const decls = cssRule(selector).split(";").map((decl) => decl.trim()).filter(Boolean)
    assert.ok(decls.every((decl) => decl.startsWith("--orv-")), selector)
  }
  // No blanket translate/scale neutralization anywhere (it flattened resting transforms).
  assert.doesNotMatch(GLOBALS_CSS, /translate: none !important|scale: none !important/)
})

test("PCE-3C resting CSS is preserved: CTA base, shine at rest, nav links, motion frame", () => {
  const cta = cssRule(".orvenix-cta-button", "isolation")
  for (const decl of ["position: relative", "isolation: isolate", "overflow: hidden", "gap: 0.45rem", "transform: translateZ(0)"]) assert.match(cta, new RegExp(decl.replace(/[()]/g, "\\$&")), decl)
  assert.doesNotMatch(cta, /will-change/)
  assert.match(cssRule(".orvenix-cta-button", "min-height"), /min-height: 2\.8rem/)
  const before = cssRule(".orvenix-cta-button::before")
  assert.match(before, /transform: translateX\(-130%\)/)
  assert.doesNotMatch(before, /display/)
  const after = cssRule(".orvenix-cta-button::after")
  assert.match(after, /width: 0\.42rem/)
  assert.doesNotMatch(after, /display/)

  // Former permanent will-change -> same stacking context / containing block, no layer promotion.
  const navLink = cssRule(".orvenix-premium-site-nav a", "isolation")
  assert.match(navLink, /isolation: isolate/)
  assert.doesNotMatch(navLink, /will-change/)
  const frame = cssRule(".editor-motion-frame")
  assert.match(frame, /isolation: isolate/)
  assert.match(frame, /translate: 0 0/)
  assert.doesNotMatch(frame, /will-change/)
})

// ─── 3. Reduced motion ─────────────────────────────────────────────────────────

test("reduced motion zeroes interaction tokens and entrance, keeps state changes immediate", async () => {
  const reduced = reducedMotionBlocks()
  assert.match(reduced, /transition-duration: 1ms !important/)
  assert.match(reduced, /\.editor-render-scope,\s*\n\s*\.editor-render-scope\[data-motion\],[^{]*\{[^}]*--orv-motion-distance-md: 0px[^}]*--orv-motion-media-scale: 1;[^}]*--orv-press-scale: 1;/)
  assert.match(reduced, /\.editor-motion-frame,\s*\n\s*\.orvenix-site-nav-mobile-panel \{\s*\n\s*animation: none !important/)
  assert.match(reduced, /\.editor-motion-pending \{\s*\n\s*opacity: 1 !important/)
  assert.match(reduced, /\.orvenix-cta-button:hover::before \{\s*\n\s*transform: translateX\(-130%\) !important/)
  // The pre-existing global safety net is untouched.
  assert.match(reduced, /\.motion-card,\s*\n\s*\.motion-card:hover,\s*\n\s*\.motion-button,\s*\n\s*\.motion-button:hover,\s*\n\s*\.motion-button:active \{\s*\n\s*transform: none;/)

  const { prefersReducedMotion } = await import("../../lib/builder-core/runtime/interaction")
  assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: true }) }), true)
  assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: false }) }), false)
  assert.equal(prefersReducedMotion(undefined), false)
  assert.equal(prefersReducedMotion({ matchMedia: () => { throw new Error("unsupported") } }), false)
})

// ─── 4. Interaction primitives (behavior) ──────────────────────────────────────

test("Escape detection and bounded focus trap wrap correctly", async () => {
  const { isEscapeKey, resolveFocusTrapTarget, getFocusableElements } = await import("../../lib/builder-core/runtime/interaction")
  assert.equal(isEscapeKey({ key: "Escape" }), true)
  assert.equal(isEscapeKey({ key: "Esc" }), true)
  assert.equal(isEscapeKey({ key: "Enter" }), false)

  const el = (name: string, hidden = false) => ({ name, focus: () => {}, getAttribute: (attr: string) => (attr === "aria-hidden" && hidden ? "true" : null) })
  const [a, b, c] = [el("a"), el("b"), el("c")]
  const focusables = [a, b, c]
  assert.equal(resolveFocusTrapTarget({ focusables, active: c, shiftKey: false, activeInside: true }), a)
  assert.equal(resolveFocusTrapTarget({ focusables, active: a, shiftKey: true, activeInside: true }), c)
  assert.equal(resolveFocusTrapTarget({ focusables, active: b, shiftKey: false, activeInside: true }), null)
  assert.equal(resolveFocusTrapTarget({ focusables, active: "outside", shiftKey: false, activeInside: false }), a)
  assert.equal(resolveFocusTrapTarget({ focusables, active: "outside", shiftKey: true, activeInside: false }), c)
  assert.equal(resolveFocusTrapTarget({ focusables: [], active: null, shiftKey: false, activeInside: false }), null)

  const hiddenEl = el("hidden", true)
  const container = { querySelectorAll: () => [a, hiddenEl, b], contains: () => true }
  assert.deepEqual(getFocusableElements(container).map((item) => item.name), ["a", "b"])
  assert.deepEqual(getFocusableElements(null), [])
})

test("focus return only targets a trigger that still exists", async () => {
  const { restoreFocus } = await import("../../lib/builder-core/runtime/interaction")
  const calls: unknown[] = []
  assert.equal(restoreFocus({ isConnected: true, focus: (options?: { preventScroll?: boolean }) => { calls.push(options) } }), true)
  assert.deepEqual([...calls], [{ preventScroll: true }])
  assert.equal(restoreFocus({ isConnected: false, focus: () => { calls.push("detached") } }), false)
  assert.equal(restoreFocus(null), false)
  assert.equal(calls.length, 1)
})

test("body scroll lock restores the original overflow, survives nesting and is idempotent", async () => {
  const { lockBodyScroll } = await import("../../lib/builder-core/runtime/interaction")
  const body = { style: { overflow: "auto" } }
  const releaseA = lockBodyScroll(body)
  assert.equal(body.style.overflow, "hidden")
  const releaseB = lockBodyScroll(body)
  releaseA()
  releaseA()
  assert.equal(body.style.overflow, "hidden", "still locked while another lock is held")
  releaseB()
  assert.equal(body.style.overflow, "auto")
  releaseB()
  assert.equal(body.style.overflow, "auto")
  const release = lockBodyScroll(body)
  release()
  assert.equal(body.style.overflow, "auto")
})

// ─── 5. CtaButton ──────────────────────────────────────────────────────────────

test("CtaButton renders canonical accessible states without commerce logic", async () => {
  const { CtaButton } = await import("../../components/editor/primitives/CtaButton")
  const Cta = CtaButton as unknown as ComponentType<Record<string, unknown>>
  const normal = renderToStaticMarkup(createElement(Cta, { id: "cta", label: "Reservar", href: "#contacto", variant: "primary" }))
  assert.match(normal, /<a [^>]*href="#contacto"/)
  assert.match(normal, /orvenix-cta-button/)
  assert.match(normal, /--orv-focus-ring:#1BB3FA/i)
  assert.match(normal, /transition-duration:var\(--orv-interaction-duration, 240ms\)/)
  assert.doesNotMatch(normal, /aria-disabled|aria-busy/)
  assert.doesNotMatch(normal, /transition-property:[^;"]*filter/)
  assert.match(normal, /<span[^>]*aria-hidden="true"[^>]*>→<\/span>/)

  const busy = renderToStaticMarkup(createElement(Cta, { id: "cta", label: "Enviando", href: "#contacto", busy: true }))
  assert.doesNotMatch(busy, /href=/)
  assert.match(busy, /aria-busy="true"/)
  assert.match(busy, /aria-disabled="true"/)
  assert.match(busy, /role="link"/)

  const disabled = renderToStaticMarkup(createElement(Cta, { id: "cta", label: "Agotado", href: "#contacto", disabled: true }))
  assert.match(disabled, /aria-disabled="true"/)
  assert.doesNotMatch(disabled, /aria-busy/)

  // CTA base visual contract: PCE-3C resting classes per variant and size are unchanged.
  const resting: Record<string, string[]> = {
    primary: ["bg-gradient-to-br", "from-[#1BB3FA]", "via-[#1794CC]", "to-[#075985]", "text-white", "font-black", "shadow-[0_16px_34px_-16px_rgba(27,179,250,0.68)]"],
    secondary: ["border", "border-[#1BB3FA]/24", "bg-white/70", "text-[#075985]", "font-black", "backdrop-blur"],
    ghost: ["text-[#1379A8]", "font-black", "underline-offset-4"],
    danger: ["bg-red-600", "text-white", "font-semibold"],
  }
  for (const [variant, classes] of Object.entries(resting)) {
    for (const [size, sizeClasses] of Object.entries({ sm: "px-3 py-1.5 text-xs rounded-lg", md: "px-5 py-2.5 text-sm rounded-full", lg: "px-7 py-4 text-base rounded-full" })) {
      const html = renderToStaticMarkup(createElement(Cta, { id: "cta", label: "X", href: "#x", variant, size }))
      const classList = new Set((html.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/))
      for (const cls of [...classes, ...sizeClasses.split(" "), "orvenix-cta-button", `orvenix-cta-${variant}`, "inline-flex", "items-center", "tracking-[0.01em]"]) {
        assert.ok(classList.has(cls), `${variant}/${size} keeps ${cls}`)
      }
    }
  }

  const source = read("components/editor/primitives/CtaButton.tsx")
  assert.doesNotMatch(source, /useCartStore|checkout|addItem|Mercado Pago/)
})

test("CtaButton CSS layer: theme focus ring, token hover (PCE-3C at expressive), no permanent will-change or filter transition", () => {
  const base = cssRule(".orvenix-cta-button", "isolation")
  assert.doesNotMatch(base, /will-change/)
  assert.doesNotMatch(base, /transition-property:[^;]*filter/)
  assert.match(base, /transition-duration: var\(--orv-interaction-duration/)
  assert.match(cssRule(".orvenix-cta-button:focus-visible"), /outline: 2px solid var\(--orv-focus-ring/)
  const hoverAt = GLOBALS_CSS.indexOf("\n  .orvenix-cta-button:hover {")
  assert.notEqual(hoverAt, -1)
  assert.match(GLOBALS_CSS.slice(GLOBALS_CSS.lastIndexOf("@media", hoverAt), hoverAt), /@media \(hover: hover\) \{/)
  const hover = GLOBALS_CSS.slice(hoverAt, GLOBALS_CSS.indexOf("}", hoverAt))
  assert.match(hover, /translateY\(calc\(var\(--orv-motion-distance-sm/)
  assert.match(hover, /filter: saturate\(1\.08\) contrast\(1\.02\)/)
  // expressive = the accepted PCE-3C hover exactly; shine sweep + dot are expressive-only.
  assert.match(GLOBALS_CSS, /\[data-motion="expressive"\] \.orvenix-cta-button:hover \{\s*\n\s*transform: translateY\(-3px\) scale\(1\.015\);/)
  assert.match(GLOBALS_CSS, /\[data-motion="expressive"\] \.orvenix-cta-button:hover::before \{\s*\n\s*transform: translateX\(130%\);/)
  assert.match(cssRule(".orvenix-cta-button:active:not([aria-disabled=\"true\"])"), /opacity/)
  // Only one focus-visible definition for the CTA exists.
  assert.equal((GLOBALS_CSS.match(/\n\.orvenix-cta-button:focus-visible \{/g) ?? []).length, 1)
})

// ─── 6. CartDrawer ─────────────────────────────────────────────────────────────

test("CartDrawer SSR: labelled dialog, inert when closed, modal when open", async () => {
  const { useCartStore } = await import("../../store/useCartStore")
  const { CartDrawer } = await import("../../components/editor/blocks/store/CartDrawer")
  const Drawer = CartDrawer as unknown as ComponentType<Record<string, unknown>>

  const closed = renderToStaticMarkup(createElement(Drawer, {}))
  assert.match(closed, /role="dialog"/)
  const labelledBy = closed.match(/aria-labelledby="([^"]+)"/)?.[1]
  assert.ok(labelledBy)
  assert.match(closed, new RegExp(`id="${labelledBy!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>Carrito<`))
  assert.match(closed, /<aside[^>]*inert=""/)
  assert.match(closed, /<aside[^>]*aria-hidden="true"/)
  assert.match(closed, /<aside[^>]*data-state="closed"/)
  assert.doesNotMatch(closed, /aria-modal/)
  assert.match(closed, /aria-label="Cerrar carrito"/)
  assert.match(closed, /orvenix-cart-overlay[^"]*"[^>]*data-state="closed"/)

  // Zustand's SSR snapshot is the store's initial-state object, so the open
  // state is rendered by temporarily mutating that object (restored after).
  const initialState = useCartStore.getInitialState() as { isOpen: boolean; items: unknown[] }
  const saved = { isOpen: initialState.isOpen, items: initialState.items }
  let open: string
  try {
    initialState.isOpen = true
    initialState.items = [{ variantId: "v1", productId: "p1", productName: "Taza", priceMxn: 10000, quantity: 2 }]
    open = renderToStaticMarkup(createElement(Drawer, {}))
  } finally {
    Object.assign(initialState, saved)
  }
  assert.match(open, /<aside[^>]*aria-modal="true"/)
  assert.match(open, /<aside[^>]*data-state="open"/)
  assert.doesNotMatch(open, /<aside[^>]*inert=/)
  assert.doesNotMatch(open, /<aside[^>]*aria-hidden=/)
  assert.match(open, /aria-label="Disminuir cantidad de Taza"/)
  assert.match(open, /aria-label="Aumentar cantidad de Taza"/)
  assert.match(open, /aria-label="Quitar Taza del carrito"/)
  assert.match(open, /aria-busy|Ir a pagar/)
})

test("CartDrawer wires Escape, focus trap, focus return and scroll-lock cleanup through the shared primitives", () => {
  const source = read("components/editor/blocks/store/CartDrawer.tsx")
  const effect = source.slice(source.indexOf("const wasOpenRef = useRef(false);"), source.indexOf("const handleCheckout"))
  assert.match(effect, /document\.addEventListener\("keydown", handleKeyDown\)/)
  assert.match(effect, /document\.removeEventListener\("keydown", handleKeyDown\)/)
  assert.match(effect, /if \(isEscapeKey\(event\)\) \{\s*\n\s*event\.preventDefault\(\);\s*\n\s*close\(\);/)
  assert.match(effect, /resolveFocusTrapTarget\(/)
  assert.match(effect, /const releaseScrollLock = lockBodyScroll\(document\.body\)/)
  assert.match(effect, /return \(\) => \{[\s\S]*releaseScrollLock\(\);[\s\S]*\}/)
  assert.match(effect, /restoreFocus\(triggerRef\.current\)/)
  assert.match(effect, /closeButtonRef\.current\?\.focus\(/)
  assert.match(effect, /findVisibleCartTrigger\(\)/)

  // Both cart triggers are discoverable return targets and expose dialog state.
  for (const file of ["components/editor/primitives/SiteNav.tsx", "components/editor/blocks/store/CartButton.tsx"]) {
    const trigger = read(file)
    assert.match(trigger, /data-cart-trigger=""/, file)
    assert.match(trigger, /aria-haspopup="dialog"/, file)
    assert.match(trigger, /aria-expanded=\{/, file)
  }
})

test("CartDrawer motion: overlay fade + drawer slide from tokens; closed state is hidden and inert to pointer", () => {
  assert.match(cssRule(".orvenix-cart-overlay"), /opacity var\(--orv-drawer-duration/)
  assert.match(cssRule(".orvenix-cart-drawer"), /transform var\(--orv-drawer-duration/)
  const closedDrawer = cssRule('.orvenix-cart-drawer[data-state="closed"]')
  assert.match(closedDrawer, /translateX\(100%\)/)
  assert.match(closedDrawer, /visibility: hidden/)
  assert.match(closedDrawer, /pointer-events: none/)
  assert.match(cssRule('.orvenix-cart-overlay[data-state="closed"]'), /pointer-events: none/)
  assert.doesNotMatch(read("components/editor/blocks/store/CartDrawer.tsx"), /backdrop-blur/)
})

test("Cart Continuity V1 persistence wiring is untouched by PCE-4A", () => {
  const source = read("components/editor/blocks/store/CartDrawer.tsx")
  assert.match(source, /const resolvedPersistenceSiteId = pathname\?\.startsWith\("\/p\/"\) \? \(siteId \|\| storeSiteId\) : null;/)
  assert.match(source, /setCartSite\(resolvedPersistenceSiteId\);/)
  assert.match(source, /if \(event\.key === storageKey\) syncCartFromStorage\(\);/)
  assert.match(source, /fetch\(`\/api\/store\/\$\{encodeURIComponent\(resolvedSiteId\)\}\/checkout`/)
  assert.match(source, /variantId: i\.variantId,\s*\n\s*quantity: i\.quantity,/)
})

// ─── 7. SiteNav mobile menu ────────────────────────────────────────────────────

test("SiteNav mobile menu: aria state, Escape + focus return, focus entry, link close without focus theft", () => {
  const source = read("components/editor/primitives/SiteNav.tsx")
  assert.match(source, /aria-expanded=\{mobileOpen\}/)
  assert.match(source, /aria-controls=\{mobilePanelId\}/)
  assert.match(source, /id=\{mobilePanelId\}/)
  assert.match(source, /hidden=\{!mobileOpen\}/)

  const effect = source.slice(source.indexOf("useEffect(() => {\n    if (!mobileOpen) return;"), source.indexOf("const closeMobileMenuAfterNavigation"))
  assert.match(effect, /getFocusableElements<HTMLElement>\(mobilePanelRef\.current\)\[0\]\?\.focus/)
  assert.match(effect, /if \(!isEscapeKey\(event\)\) return;/)
  assert.match(effect, /setMobileOpen\(false\);\s*\n\s*restoreFocus\(mobileTriggerRef\.current\);/)
  // VE-3: the listener lives on the nav's own document (isolated editor frame), falling back to `document` on public pages.
  assert.match(effect, /const navDocument = mobileTriggerRef\.current\?\.ownerDocument \?\? document;/)
  assert.match(effect, /navDocument\.addEventListener\("keydown", handleKeyDown\)/)
  assert.match(effect, /return \(\) => navDocument\.removeEventListener\("keydown", handleKeyDown\)/)

  const afterNav = source.slice(source.indexOf("const closeMobileMenuAfterNavigation"), source.indexOf("const currentPageSlug"))
  assert.doesNotMatch(afterNav, /focus/)
  const panel = source.slice(source.indexOf("id={mobilePanelId}"))
  assert.equal((panel.match(/closeMobileMenuAfterNavigation\(\)/g) ?? []).length, 2)

  // Routes remain canonical.
  assert.match(source, /buildEditorPageUrl\(pathname, searchParams\?\.toString\(\) \?\? "", slug\)/)
  assert.match(source, /resolveRuntimeHref\(websiteId, effectiveCtaHref, hrefMode\)/)

  // Open motion is CSS-owned and gated.
  assert.match(cssRule(".orvenix-site-nav-mobile-panel:not([hidden])"), /animation: orv-menu-open var\(--orv-interaction-duration/)
  assert.match(cssRule('.editor-render-scope[data-motion="none"] .orvenix-site-nav-mobile-panel'), /animation: none/)
})

// ─── 8. MotionWrapper ──────────────────────────────────────────────────────────

test("MotionWrapper: editor keeps the frame but never plays entrance; public plays without blur; SSR stays visible", async () => {
  const { MotionWrapper } = await import("../../components/editor/MotionWrapper")
  type Props = Omit<Parameters<typeof MotionWrapper>[0], "children"> & { children?: ReactNode }
  const Wrapper = MotionWrapper as ComponentType<Props>
  const child = createElement("span", null, "Visible")

  const edit = renderToStaticMarkup(createElement(Wrapper, { motionAnimation: "fade-up", motionBlur: 12, runtimeMode: "edit" }, child))
  assert.match(edit, /class="editor-motion-frame editor-motion-ease-smooth"/)
  assert.doesNotMatch(edit, /editor-motion-enter-/)
  assert.match(edit, /<span>Visible<\/span>/)

  const preview = renderToStaticMarkup(createElement(Wrapper, { motionAnimation: "fade-up", motionBlur: 12, runtimeMode: "preview" }, child))
  assert.match(preview, /editor-motion-enter-fade-up/)
  assert.doesNotMatch(preview, /blur/)

  for (const trigger of ["scroll", "click", "hover"] as const) {
    const html = renderToStaticMarkup(createElement(Wrapper, { motionAnimation: "fade-up", motionTrigger: trigger, runtimeMode: "preview" }, child))
    assert.doesNotMatch(html, /editor-motion-enter-|editor-motion-pending|opacity/, trigger)
    assert.match(html, /<span>Visible<\/span>/)
  }

  // Layout safety: the editor and public wrapper are the SAME element with the
  // same classes and styles (only the entrance class differs), and the frame
  // exists exactly when it did at PCE-3C (configured animation or transition).
  assert.equal(preview.replace(" editor-motion-enter-fade-up", ""), edit)
  for (const props of [{ motionTransition: "lift" }, { motionAnimation: "scale" }, { motionAnimation: "fade", motionTrigger: "scroll" }] as const) {
    const editHtml = renderToStaticMarkup(createElement(Wrapper, { ...props, runtimeMode: "edit" }, child))
    const publicHtml = renderToStaticMarkup(createElement(Wrapper, { ...props, runtimeMode: "preview" }, child))
    assert.equal(publicHtml.replace(/ editor-motion-enter-[a-z-]+/, ""), editHtml, JSON.stringify(props))
    assert.match(editHtml, /^<div class="editor-motion-frame/)
  }

  const plain = renderToStaticMarkup(createElement(Wrapper, { runtimeMode: "preview" }, child))
  assert.equal(plain, "<span>Visible</span>")
})

test("MotionWrapper scroll trigger never hides content already in view", () => {
  const source = read("components/editor/MotionWrapper.tsx")
  const scroll = source.slice(source.indexOf('if (motionTrigger === "scroll")'), source.indexOf("const replay"))
  assert.match(scroll, /if \(firstCallback\) \{[\s\S]*if \(entry\.isIntersecting\) \{[\s\S]*observer\.disconnect\(\);\s*\n\s*return;/)
  assert.match(scroll, /el\.classList\.add\("editor-motion-pending"\)/)
  // Threshold 0: content taller than the viewport can always be revealed.
  assert.match(scroll, /\{ threshold: 0 \}/)
  assert.match(source, /if \(prefersReducedMotion\(/)
  // Only the frame's own element is observed (no per-card observers are added).
  assert.equal((source.match(/new IntersectionObserver/g) ?? []).length, 1)
})

test("MotionWrapper CSS/export: no blur, no permanent will-change, reduced-motion guard in exported CSS", async () => {
  for (const name of ["fade-up", "fade-down", "slide-left", "slide-right", "scale"]) {
    const at = GLOBALS_CSS.indexOf(`@keyframes editor-motion-${name} {`)
    assert.notEqual(at, -1)
    assert.doesNotMatch(GLOBALS_CSS.slice(at, GLOBALS_CSS.indexOf("}\n}", at)), /blur/, name)
  }
  assert.doesNotMatch(cssRule(".editor-motion-frame"), /will-change|filter|blur/)
  assert.doesNotMatch(GLOBALS_CSS, /\.editor-motion-enter-[a-z-]+[^{]*\{[^}]*will-change/)
  assert.match(cssRule(".editor-motion-pending"), /opacity: 0/)

  const { exportAnimationCss } = await import("../../components/editor/MotionWrapper")
  const exported = exportAnimationCss({ type: "fade-up", distance: 12, blur: 12, hoverEffect: "lift" })
  assert.doesNotMatch(exported, /blur/)
  assert.match(exported, /@media \(prefers-reduced-motion: reduce\)/)
  assert.equal(exportAnimationCss({ type: "none" }), "/* Sin animaciones configuradas */")

  const panel = read("components/editor/sidebar/AnimationsPanel.tsx")
  assert.doesNotMatch(panel, /Blur inicial/)
})

// ─── 9. ProductCard coordination (PCE-3 preserved) ─────────────────────────────

test("ProductCard treatments keep their PCE-3C resting identity; PCE-4A only tokenizes hover intensity", async () => {
  const { ProductCard } = await import("../../components/editor/blocks/store/ProductCard")
  const Card = ProductCard as unknown as ComponentType<Record<string, unknown>>
  // Frozen PCE-3C resting root classes (committed 6efdf6a) and hover-lift size.
  const pce3c = {
    "compact-catalog": { resting: "group flex flex-col overflow-hidden rounded-[1.15rem] border shadow-[0_14px_36px_-32px_rgba(15,23,42,0.58)]", lift: "sm" },
    editorial: { resting: "group flex flex-col overflow-hidden rounded-[1.7rem] border shadow-[0_28px_86px_-56px_rgba(15,23,42,0.74)]", lift: "md" },
    "image-led": { resting: "group relative flex flex-col overflow-hidden rounded-[1.7rem] border shadow-[0_28px_90px_-56px_rgba(15,23,42,0.82)]", lift: "md" },
    featured: { resting: "group relative flex min-h-full flex-col overflow-hidden rounded-[2rem] border shadow-[0_36px_120px_-62px_rgba(15,23,42,0.9)]", lift: "md" },
    horizontal: { resting: "group flex flex-col overflow-hidden rounded-[1.35rem] border shadow-[0_22px_55px_-42px_rgba(15,23,42,0.65)] sm:flex-row", lift: "md" },
  } as const
  const interactionOnly = (cls: string) => /^(hover:|group-hover:|active:|focus-visible:|transition|duration-|ease-)/.test(cls)
  const restingSignatures = new Set<string>()
  for (const [treatment, expected] of Object.entries(pce3c)) {
    const html = renderToStaticMarkup(createElement(Card, {
      productId: "p1", variantId: "v1", productName: "Taza", priceMxn: 12900,
      imageUrl: "https://images.pexels.com/photos/1/taza.jpg", treatment,
    }))
    const root = html.match(/<[a-z]+ [^>]*data-store-card-treatment="([^"]+)"[^>]*>/)
    assert.ok(root, treatment)
    assert.equal(root![1], treatment)
    const rootClasses = (root![0].match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/).filter(Boolean)
    const resting = rootClasses.filter((cls) => !interactionOnly(cls))
    assert.deepEqual(new Set(resting), new Set(expected.resting.split(" ")), `${treatment} resting classes`)
    restingSignatures.add(resting.join(" "))
    // Identity kept: every treatment still lifts (token intensity) and emphasizes media.
    assert.ok(rootClasses.includes(`hover:-translate-y-[var(--orv-motion-distance-${expected.lift},${expected.lift === "md" ? "4px" : "2px"})]`), `${treatment} lift`)
    const image = html.match(/<img [^>]*data-store-media="image"[^>]*>/)?.[0] ?? ""
    assert.match(image, /class="object-cover transition-transform duration-\[var\(--orv-media-duration,700ms\)\] ease-out group-hover:scale-\[var\(--orv-motion-media-scale,1\.055\)\]"/, `${treatment} media`)
    assert.match(html, /focus-visible:ring-2/)
    assert.match(html, /active:scale-\[var\(--orv-press-scale,0\.98\)\]/)
  }
  assert.equal(restingSignatures.size, 5, "treatments remain visually distinct at rest")
  assert.equal(networkAttempts, 0)
})

test("commerce vocabulary is unchanged and the review fixture exercises all of it; motion bucket changes only the duration", async () => {
  const { FULL_SITE_MERCHANDISING_COMPOSITIONS_V1, FULL_SITE_PRODUCT_CARD_TREATMENTS_V1 } = await import("../../lib/orvenix-ai/full-site-generation/contract")
  assert.deepEqual([...FULL_SITE_MERCHANDISING_COMPOSITIONS_V1].sort(), ["alternating-story", "category-spotlight", "dense-catalog", "editorial-collection", "featured-plus-grid", "product-rail"])
  assert.deepEqual([...FULL_SITE_PRODUCT_CARD_TREATMENTS_V1].sort(), ["compact-catalog", "editorial", "featured", "horizontal", "image-led"])

  const { buildVocabularyReviewTree } = await import("../../app/dev-interaction-review/review-fixtures")
  const trees = (["none", "subtle", "expressive"] as const).map((bucket) => buildVocabularyReviewTree(bucket))
  const [tree] = trees
  const nodes = Object.values(tree.nodes)
  const compositions = new Set(nodes.map((node) => node.props.commerceComposition).filter(Boolean))
  for (const composition of FULL_SITE_MERCHANDISING_COMPOSITIONS_V1) assert.ok(compositions.has(composition), composition)
  const treatments = new Set(nodes.filter((node) => node.type === "store-product-card").map((node) => node.props.treatment))
  for (const treatment of FULL_SITE_PRODUCT_CARD_TREATMENTS_V1) assert.ok(treatments.has(treatment), treatment)
  assert.ok(nodes.some((node) => node.type === "siteNav" && node.props.showCart === true))
  assert.ok(nodes.some((node) => node.type === "store-cart-drawer"))
  assert.ok(nodes.some((node) => node.type === "ctaButton"))
  // Every child reference resolves (a real composed tree, not a loose list).
  for (const node of nodes) for (const child of node.children) assert.ok(tree.nodes[child], `${node.id} -> ${child}`)

  // Buckets differ ONLY in theme.motion.duration -- composition is identical.
  const { resolveRuntimeMotionBucket } = await import("../../lib/builder-core/runtime/motion")
  assert.deepEqual(trees.map((entry) => resolveRuntimeMotionBucket(entry.theme)), ["none", "subtle", "expressive"])
  // The composer mints random ids, so trees are compared structurally from the root.
  type ReviewTree = typeof tree
  const shape = (entry: ReviewTree, id: string): unknown => {
    const node = entry.nodes[id]
    return { type: node.type, props: node.props, children: node.children.map((child) => shape(entry, child)) }
  }
  for (const entry of trees.slice(1)) {
    assert.deepEqual(shape(entry, entry.rootId), shape(tree, tree.rootId))
    assert.deepEqual({ ...entry.theme, motion: undefined }, { ...tree.theme, motion: undefined })
  }

  // The accepted-artifact review keeps the PCE-3C tree and only swaps the duration.
  const { buildPce3cReviewTree } = await import("../../app/dev-interaction-review/review-fixtures")
  const source = { ...tree, theme: { ...tree.theme, motion: { duration: "220ms", easing: "ease" } } }
  const reviewed = buildPce3cReviewTree({ slug: "home", tree: source }, "pce3-catalog", new Set(["home"]), "none")
  assert.equal(reviewed.theme?.motion?.duration, "0ms")
  assert.deepEqual(Object.keys(reviewed.nodes).sort(), Object.keys(source.nodes).sort())
  assert.equal(networkAttempts, 0)
})
