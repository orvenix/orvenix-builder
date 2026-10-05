import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"

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

// Same server-render harness as the VE-1 parity tests: static navigation + SSR-safe zustand.
const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function harnessLoad(request: unknown, parent: unknown, isMain: unknown) {
  if (request === "next/navigation") {
    return { useRouter: () => ({ push() {}, replace() {}, prefetch() {} }), usePathname: () => "/editor/site_x", useSearchParams: () => new URLSearchParams() }
  }
  if (request === "zustand/vanilla") {
    const real = originalLoad.call(this, request, parent, isMain) as { createStore: (fn: unknown) => { getState: () => unknown; getInitialState: () => unknown } }
    return {
      ...real,
      createStore: (fn: unknown) => {
        const api = real.createStore(fn)
        api.getInitialState = api.getState
        return api
      },
    }
  }
  return originalLoad.call(this, request, parent, isMain)
}
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined, clear: () => undefined },
})

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import {
  COMMERCIAL_DESIGN_ROOT_MARKER,
  EDITOR_MODE_PROFILES,
  editorExperienceForProfile,
  editorModeStorageKey,
  editorProfileForExperience,
  getEditorModeCapabilities,
  isCommercialDesignTree,
  resolveInitialEditorModeProfile,
  type EditorModeProfile,
} from "../../lib/editor/editor-mode-profile"
import { getExperienceCapabilities } from "../../components/editor/experience/experience-config"
import { EditorExperienceContext } from "../../components/editor/experience/ExperienceContext"
import type { EditorExperienceValue } from "../../components/editor/experience/types"
import { useEditorStore } from "../../components/editor/store/useEditorStore"
import { DynamicRenderer } from "../../components/editor/DynamicRenderer"
import {
  COMMERCIAL_FIDELITY_ROOT_PROP_V1,
  compileCommercialDesignV1,
  isDemoShapeCommercialTreeV1,
} from "../../lib/orvenix-ai/commercial-designs"
import { resolveRuntimeHref, resolveSiteNavItemTarget } from "../../lib/builder-core/tree/pageLinks"
import { getProtectedReason } from "../../lib/editor/context-capabilities"
import { validateTree } from "../../types/validateTree"
import type { EditorTree } from "../../types/editor"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

let commercialTree: EditorTree | undefined
async function commercialSiteTree(): Promise<EditorTree> {
  if (!commercialTree) {
    const compiled = await compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 2, facts: { businessName: "Plomería Hernández", contact: { whatsapp: "8112345678" }, services: [{ name: "Fugas" }] } })
    commercialTree = validateTree(clone(compiled.plan.pages[0].tree))
  }
  return clone(commercialTree)
}

function legacyTree(): EditorTree {
  return validateTree({
    rootId: "root",
    nodes: {
      root: { id: "root", type: "section", props: {}, children: ["title"], version: 1 },
      title: { id: "title", type: "heading", props: { text: "Mi sitio", level: 1 }, children: [], parentId: "root", version: 1 },
    },
  })
}

function experienceValue(profile: EditorModeProfile): EditorExperienceValue {
  const mode = editorExperienceForProfile(profile)
  return { mode, profile, isClient: mode === "client", isStudio: mode === "studio", canSwitchMode: true, setMode: () => undefined, capabilities: getEditorModeCapabilities(profile) }
}

/* ------------------------------ contract ------------------------------ */

test("CV1-2 contract: two profiles over the ONE central capability table", () => {
  assert.deepEqual([...EDITOR_MODE_PROFILES], ["simple", "pro"])
  assert.equal(editorExperienceForProfile("simple"), "client")
  assert.equal(editorExperienceForProfile("pro"), "studio")
  for (const profile of EDITOR_MODE_PROFILES) {
    assert.equal(editorProfileForExperience(editorExperienceForProfile(profile)), profile)
    assert.deepEqual(getEditorModeCapabilities(profile), getExperienceCapabilities(editorExperienceForProfile(profile)))
  }
  // No component branches on the profile name: capabilities are the only switch.
  const offenders = ["components/editor/EditableNode.tsx", "components/editor/selection/CustomerEditableNode.tsx", "hooks/useKeyboardShortcuts.ts", "components/editor/experience/client/ClientContentPanel.tsx"]
    .filter((file) => /profile\s*===\s*["']simple["']|["']simple["']\s*===\s*profile/.test(read(file)))
  assert.deepEqual(offenders, [])
})

test("CV1-2 Simple exposes no advanced structural capability", () => {
  const simple = getEditorModeCapabilities("simple")
  for (const key of ["showAdvancedInspector", "showTechnicalLayers", "allowFreePosition", "allowResize", "allowStructureEditing", "allowDestructiveActions", "allowDeveloperTools"] as const) {
    assert.equal(simple[key], false, key)
  }
  // Business-safe navigation stays available.
  assert.equal(simple.allowSectionReorder, true)
  assert.equal(simple.allowSelectionNavigation, true)
  // Multi-select / free drag / resize are wired to these flags in the canvas.
  const editableNode = read("components/editor/EditableNode.tsx")
  assert.match(editableNode, /additive: !isClient &&/)
  assert.match(editableNode, /capabilities\.allowResize && isFreePosition/)
  assert.match(editableNode, /capabilities\.allowFreePosition/)
  // Removing a whole section from the content list is a Pro-only destructive edit.
  assert.match(read("components/editor/experience/client/ClientContentPanel.tsx"), /capabilities\.allowDestructiveActions && \(/)
  // The canvas context bar gates duplicate/remove section by the same central capabilities.
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  assert.match(bar, /modeCapabilities\.allowStructureEditing && \(\s*<IconButton label="Duplicar sección"/)
  assert.match(bar, /modeCapabilities\.allowDestructiveActions && \(\s*<IconButton\s+label="Eliminar sección"/)
})

test("CV1-2 Pro preserves every existing editor capability", () => {
  assert.deepEqual(getEditorModeCapabilities("pro"), getExperienceCapabilities("studio"))
  for (const [key, value] of Object.entries(getEditorModeCapabilities("pro"))) assert.equal(value, true, key)
})

/* ---------------------------- commercial origin ---------------------------- */

test("CV1-2 origin: a site from an Orvenix design is detected from its persisted tree marker", async () => {
  assert.equal(COMMERCIAL_DESIGN_ROOT_MARKER.prop, COMMERCIAL_FIDELITY_ROOT_PROP_V1, "editor marker mirrors the compiler's root marker")
  const tree = await commercialSiteTree()
  assert.equal(isCommercialDesignTree(tree), true)
  assert.equal(isCommercialDesignTree(tree), isDemoShapeCommercialTreeV1(tree))
  // Survives the DB JSON round trip and the editor's validateTree on load.
  assert.equal(isCommercialDesignTree(validateTree(clone(tree))), true)
  assert.equal(isCommercialDesignTree(legacyTree()), false)
  assert.equal(isCommercialDesignTree(null), false)
})

test("CV1-2 default: commercial sites open in Simple for everyone; others keep their previous default", async () => {
  const tree = await commercialSiteTree()
  assert.equal(resolveInitialEditorModeProfile({ tree, userRole: "client" }), "simple")
  assert.equal(resolveInitialEditorModeProfile({ tree, userRole: "admin" }), "simple")
  assert.equal(resolveInitialEditorModeProfile({ tree: legacyTree(), userRole: "admin" }), "pro")
  assert.equal(resolveInitialEditorModeProfile({ tree: legacyTree(), userRole: "client" }), "simple")
  // The person's saved choice wins; anything else is ignored.
  assert.equal(resolveInitialEditorModeProfile({ tree, userRole: "client", storedPreference: "pro" }), "pro")
  assert.equal(resolveInitialEditorModeProfile({ tree, userRole: "client", storedPreference: "studio" }), "simple")
  assert.equal(editorModeStorageKey("site_abc"), "orvenix:editor-mode:site_abc")
})

/* ------------------------------ same tree ------------------------------ */

test("CV1-2 same tree: Simple and Pro render the same store tree with the same renderer, unchanged", async () => {
  const tree = await commercialSiteTree()
  const before = JSON.stringify(tree)
  useEditorStore.setState({ tree, websiteId: "draft:cv1-2", currentDevice: "desktop", selectedId: null, selectedIds: [], hoveredId: null, editingNodeId: null, isPreviewMode: false })
  const stored = useEditorStore.getState().tree
  const render = (profile: EditorModeProfile) => renderToStaticMarkup(
    createElement(EditorExperienceContext.Provider, { value: experienceValue(profile) }, createElement(DynamicRenderer, { nodeId: tree.rootId, mode: "preview" })),
  )
  const simple = render("simple")
  const pro = render("pro")
  assert.ok(simple.length > 1000)
  assert.equal(simple, pro, "the website markup does not depend on the editor mode")
  assert.equal(useEditorStore.getState().tree, stored, "rendering in either mode never replaces the tree")
  assert.equal(JSON.stringify(useEditorStore.getState().tree), before, "nor mutates it")
  // Both shells read the very same store tree through DynamicRenderer.
  assert.match(read("components/editor/client-app/ClientPageRenderer.tsx"), /DynamicRenderer/)
  assert.match(read("components/editor/Canvas.tsx"), /DynamicRenderer/)
})

test("CV1-2 switching mode never mutates, regenerates or recompiles the tree", () => {
  const provider = read("components/editor/experience/ExperienceProvider.tsx")
  const setModeBody = provider.slice(provider.indexOf("const setMode = useCallback"), provider.indexOf("const value = useMemo"))
  assert.match(setModeBody, /setProfile\(nextProfile\)/)
  assert.doesNotMatch(setModeBody, /initialize|execute|updateNode|setTree|compile|saveToServer|fetch\(/)
  assert.doesNotMatch(provider, /compileCommercialDesignV1|runAutonomous|createSite/)
  // The choice is a per-site UI preference in this browser, never site data.
  assert.match(provider, /editorModeStorageKey\(websiteId\)/)
  assert.doesNotMatch(provider, /\/api\/editor|prisma/i)
})

/* --------------------------- hard constraints --------------------------- */

test("CV1-2 hard constraint: unsafe link schemes never render, whatever mode wrote them", () => {
  for (const unsafe of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "java\tscript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)", "\\\\evil.example/x"]) {
    for (const mode of ["preview", "published", "export"] as const) assert.equal(resolveRuntimeHref("site_x", unsafe, mode), "#", `${mode}: ${unsafe}`)
  }
  for (const safe of ["https://wa.me/528112345678", "http://example.com", "mailto:hola@negocio.mx", "tel:+528112345678", "#contacto", "/contacto"]) {
    assert.equal(resolveRuntimeHref("site_x", safe, "published"), safe)
  }
  assert.equal(resolveRuntimeHref("site_x", "page:servicios", "published"), "/p/site_x/servicios")
  // Menu items with their own href go through the same guard (no direct pass-through).
  assert.equal(resolveSiteNavItemTarget({ slug: "x", href: "javascript:alert(1)" }, "site_x", "published").runtimeHref, "#")
  assert.equal(resolveSiteNavItemTarget({ slug: "x", href: "data:text/html,x" }, "site_x", "export").runtimeHref, "#")
  assert.equal(resolveSiteNavItemTarget({ slug: "x", href: "#servicios" }, "site_x", "published").runtimeHref, "#servicios")
  assert.equal(resolveSiteNavItemTarget({ slug: "x", href: "https://wa.me/528112345678" }, "site_x", "published").runtimeHref, "https://wa.me/528112345678")
  assert.equal(resolveSiteNavItemTarget({ slug: "servicios" }, "site_x", "published").runtimeHref, "/p/site_x/servicios")
  // Both link renderers and the static export go through the guarded resolver.
  assert.match(read("components/editor/primitives/CtaButton.tsx"), /resolveRuntimeHref\(/)
  assert.match(read("components/editor/primitives/SiteNav.tsx"), /resolveRuntimeHref\(/)
  assert.match(read("lib/builder-core/compiler/exportNodes.ts"), /resolveRuntimeHref\(/)
})

test("CV1-2 hard constraints are server-side or data-driven, never keyed by the editor mode", () => {
  const saveRoute = read("app/api/editor/[id]/route.ts")
  assert.match(saveRoute, /canManageSite\(id, user\.id, user\.role\)/)
  assert.doesNotMatch(saveRoute, /profile|experience|isClient|isStudio/)
  // Raw HTML is sanitized on every save/load, with no mode in the signature.
  const sanitized = validateTree({ rootId: "r", nodes: { r: { id: "r", type: "genericWrapper", props: { content: '<img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a>' }, children: [] } } })
  assert.doesNotMatch(JSON.stringify(sanitized.nodes.r.props), /onerror|javascript:/i)
  // Authoritative commerce data stays protected from visual edits regardless of mode.
  assert.equal(getProtectedReason({ id: "p", type: "store-product-card", props: { productId: "prod_1", priceMxn: 100 }, children: [], version: 1 }), "commerce")
  assert.equal(getProtectedReason.length, 1, "the protection takes no mode argument")
})

/* ------------------------------ Simple surface ------------------------------ */

test("CV1-2 Simple surface: visible mode switch, IA kept out of the commercial path, honest business-data guide", () => {
  const toggle = read("components/editor/experience/ExperienceModeToggle.tsx")
  assert.match(toggle, /Modo Simple/)
  assert.match(toggle, /Modo Profesional/)
  assert.match(read("components/editor/client-shell/ClientTopbar.tsx"), /<ExperienceModeToggle \/>/)
  assert.match(read("components/editor/studio/StudioTopBar.tsx"), /<ExperienceModeToggle \/>/)
  const sidebar = read("components/editor/experience/client/ClientWorkspaceSidebar.tsx")
  assert.match(sidebar, /isCommercialSite \? <OrvenixAiComingSoonPanel \/> : <AiAssistantPanel \/>/)
  assert.match(sidebar, /Orvenix IA — Próximamente/)
  assert.match(sidebar, /isPro \|\| state\.availablePages\.length > 1/)
  const brand = read("components/editor/experience/client/ClientBrandPanel.tsx")
  // CV1-3: the guide remains only for commercial sites created before Business Fields existed.
  assert.match(brand, /isCommercialSite && !hasBusinessFields && \(\s*<PanelSection title="Datos de tu negocio"/)
  assert.match(brand, /!isCommercialSite && <PanelSection title="Contacto"/)
  // VE-4 surfaces stay untouched.
  assert.doesNotMatch(read("components/editor/sidebar/AiAssistantPanel.tsx"), /Próximamente/)
})
