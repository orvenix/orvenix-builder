import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"
import type { EditorTree } from "../../types/editor"

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

type FetchCall = {
  url: string
  tree: EditorTree
}

function tree(label: string): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: { id: "root", type: "section", props: { label }, children: [], version: 1 },
    },
  }
}

function installLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
      clear: () => { store.clear() },
    },
  })
  return store
}

function jsonResponse(ok = true, payload: Record<string, unknown> = {}) {
  return {
    ok,
    json: async () => ok ? payload : ({ error: "No se pudo guardar." }),
  } as Response
}

function recoveryEnvelope(params: {
  websiteId: string
  pageSlug: string
  baseServerVersion: string | null
  currentTree: EditorTree
}) {
  return JSON.stringify({
    version: 3,
    websiteId: params.websiteId,
    pageSlug: params.pageSlug,
    tree: params.currentTree,
    savedAt: 123456,
    baseServerVersion: params.baseServerVersion,
  })
}

function recoveryKey(websiteId: string, pageSlug: string) {
  return `orvenix_editor_tree:v3:${websiteId}:${pageSlug}`
}

async function waitFor(predicate: () => boolean) {
  for (let index = 0; index < 30; index += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(predicate(), true);
}

async function loadStore() {
  installLocalStorage()
  const compiledStorePath = path.join(process.cwd(), ".tmp/unit/components/editor/store/useEditorStore.js")
  const compiledNavigationPath = path.join(process.cwd(), ".tmp/unit/components/editor/pageNavigation.js")
  delete require.cache[compiledStorePath]
  delete require.cache[compiledNavigationPath]
  return import("../../components/editor/store/useEditorStore")
}

function markDirty(store: Awaited<ReturnType<typeof loadStore>>["useEditorStore"], params: {
  currentTree: EditorTree
  rev: number
  pageSlug?: string
  lastSavedRev?: number
}) {
  store.setState({
    tree: params.currentTree,
    rev: params.rev,
    lastSavedRev: params.lastSavedRev ?? 0,
    activePageSlug: params.pageSlug ?? "home",
    saveStatus: "dirty",
    lastError: null,
  })
}

test("flushPendingSave sin dirty no dispara save", async () => {
  const { useEditorStore } = await loadStore()
  const calls: FetchCall[] = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), tree: JSON.parse(String(init?.body)).tree })
    return jsonResponse()
  }

  useEditorStore.getState().initialize("site_1", tree("saved"), null, { activePageSlug: "home", activePageName: "Inicio" })

  const result = await useEditorStore.getState().flushPendingSave()

  assert.equal(result.success, true)
  assert.equal(calls.length, 0)
})

test("saveToServer reconcilia serverVersion post-save", async () => {
  const { useEditorStore } = await loadStore()
  globalThis.fetch = async () => jsonResponse(true, { serverVersion: "server-v2" })

  useEditorStore.getState().initialize("site_1", tree("saved"), null, { activePageSlug: "home", activePageName: "Inicio", serverVersion: "server-v1" })
  markDirty(useEditorStore, { currentTree: tree("changed"), rev: 1 })

  const result = await useEditorStore.getState().saveToServer()

  assert.equal(result.success, true)
  assert.equal(result.serverVersion, "server-v2")
  assert.equal(useEditorStore.getState().serverVersion, "server-v2")
  assert.equal(useEditorStore.getState().lastSavedRev, 1)
})

test("flushPendingSave guarda dirty antes de navegar y usa snapshot rev/pageSlug exactos", async () => {
  const { useEditorStore } = await loadStore()
  const calls: FetchCall[] = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), tree: JSON.parse(String(init?.body)).tree })
    return jsonResponse()
  }

  useEditorStore.getState().initialize("site_1", tree("saved"), null, { activePageSlug: "servicios", activePageName: "Servicios" })
  markDirty(useEditorStore, { currentTree: tree("changed"), rev: 1, pageSlug: "servicios" })

  const pending = useEditorStore.getState().flushPendingSave()
  assert.equal(calls.length, 1)
  assert.match(calls[0]!.url, /\/api\/editor\/site_1\?page=servicios$/)
  assert.deepEqual(calls[0]!.tree, tree("changed"))

  markDirty(useEditorStore, { currentTree: tree("after-click"), rev: 2, pageSlug: "contacto", lastSavedRev: 0 })

  const result = await pending
  assert.equal(result.success, true)
  assert.equal(calls.length, 2)
  assert.match(calls[1]!.url, /\/api\/editor\/site_1\?page=contacto$/)
  assert.deepEqual(calls[1]!.tree, tree("after-click"))
  assert.equal(useEditorStore.getState().lastSavedRev, 2)
  assert.equal(useEditorStore.getState().saveStatus, "saved")
})

test("save failure no acredita revision y bloquea flush", async () => {
  const { useEditorStore } = await loadStore()
  globalThis.fetch = async () => jsonResponse(false)

  useEditorStore.getState().initialize("site_1", tree("saved"), null, { activePageSlug: "home", activePageName: "Inicio" })
  markDirty(useEditorStore, { currentTree: tree("changed"), rev: 1 })

  const result = await useEditorStore.getState().flushPendingSave()

  assert.equal(result.success, false)
  assert.equal(useEditorStore.getState().lastSavedRev, 0)
  assert.equal(useEditorStore.getState().saveStatus, "error")
})

test("lastSavedRev nunca retrocede", async () => {
  const { useEditorStore } = await loadStore()

  useEditorStore.getState().initialize("site_1", tree("saved"), null, { activePageSlug: "home", activePageName: "Inicio" })
  useEditorStore.setState({ rev: 7, lastSavedRev: 6, saveStatus: "dirty" })

  useEditorStore.getState().markSaved(5)

  assert.equal(useEditorStore.getState().lastSavedRev, 6)
  assert.equal(useEditorStore.getState().saveStatus, "dirty")
})

test("in-flight mas nueva edicion guarda serializado y flush espera la revision nueva", async () => {
  const { useEditorStore } = await loadStore()
  const calls: FetchCall[] = []
  const resolvers: Array<() => void> = []
  let activeRequests = 0
  let maxConcurrentRequests = 0

  globalThis.fetch = async (url, init) => {
    activeRequests += 1
    maxConcurrentRequests = Math.max(maxConcurrentRequests, activeRequests)
    calls.push({ url: String(url), tree: JSON.parse(String(init?.body)).tree })
    await new Promise<void>((resolve) => resolvers.push(resolve))
    activeRequests -= 1
    return jsonResponse()
  }

  useEditorStore.getState().initialize("site_1", tree("saved"), null, { activePageSlug: "home", activePageName: "Inicio" })
  markDirty(useEditorStore, { currentTree: tree("rev5"), rev: 5, lastSavedRev: 4 })

  const firstSave = useEditorStore.getState().saveToServer()
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0]!.tree, tree("rev5"))

  markDirty(useEditorStore, { currentTree: tree("rev6"), rev: 6, lastSavedRev: 4 })
  const flush = useEditorStore.getState().flushPendingSave()

  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(calls.length, 1)

  resolvers.shift()?.()
  await waitFor(() => calls.length === 2)
  assert.equal(useEditorStore.getState().lastSavedRev, 5)
  assert.deepEqual(calls[1]!.tree, tree("rev6"))

  resolvers.shift()?.()
  const [flushResult, firstResult] = await Promise.all([flush, firstSave])

  assert.equal(firstResult.success, true)
  assert.equal(flushResult.success, true)
  assert.equal(useEditorStore.getState().lastSavedRev, 6)
  assert.equal(useEditorStore.getState().saveStatus, "saved")
  assert.equal(maxConcurrentRequests, 1)
})

test("useAutosave conserva debounce y delega en saveToServer sin PUT independiente", () => {
  const source = readFileSync(path.join(process.cwd(), "hooks/useAutosave.ts"), "utf8")

  assert.match(source, /const DEBOUNCE_MS = 800/)
  assert.match(source, /setTimeout\(/)
  assert.match(source, /saveToServer\(\)/)
  assert.doesNotMatch(source, /\/api\/editor\//)
  assert.doesNotMatch(source, /method:\s*["']PUT["']/)
})



test("useAutosave scopea timers por website y pagina", () => {
  const source = readFileSync(path.join(process.cwd(), "hooks/useAutosave.ts"), "utf8")

  assert.match(source, /getAutosaveScopeKey\(websiteId, activePageSlug\)/)
  assert.match(source, /autosaveScopeRef\.current !== autosaveScope/)
  assert.match(source, /const scheduledScope = autosaveScope/)
  assert.match(source, /getAutosaveScopeKey\(currentBeforeSave\.websiteId, currentBeforeSave\.activePageSlug\) !== scheduledScope/)
  assert.match(source, /currentBeforeSave\.rev === currentBeforeSave\.lastSavedRev/)
})

test("legacy local draft sin version metadata no reemplaza server tree", async () => {
  installLocalStorage()
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} })
  const { inspectSavedTreeRecovery, loadSavedTree } = await import("../../hooks/useAutosave")

  localStorage.setItem("orvenix_editor_tree:v2:site_1:home", JSON.stringify(tree("legacy-local")))

  assert.equal(loadSavedTree("site_1", "home", "server-v1"), null)
  assert.deepEqual(inspectSavedTreeRecovery("site_1", "home", "server-v1"), { status: "legacy", tree: null })
})

test("local draft de otro website u otra page no se recupera", async () => {
  installLocalStorage()
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} })
  const { inspectSavedTreeRecovery, loadSavedTree } = await import("../../hooks/useAutosave")

  localStorage.setItem(recoveryKey("site_1", "home"), recoveryEnvelope({
    websiteId: "site_2",
    pageSlug: "home",
    baseServerVersion: "server-v1",
    currentTree: tree("wrong-site"),
  }))
  assert.equal(loadSavedTree("site_1", "home", "server-v1"), null)
  assert.equal(inspectSavedTreeRecovery("site_1", "home", "server-v1").status, "stale")

  localStorage.setItem(recoveryKey("site_1", "servicios"), recoveryEnvelope({
    websiteId: "site_1",
    pageSlug: "home",
    baseServerVersion: "server-v1",
    currentTree: tree("wrong-page"),
  }))
  assert.equal(loadSavedTree("site_1", "servicios", "server-v1"), null)
  assert.equal(inspectSavedTreeRecovery("site_1", "servicios", "server-v1").status, "stale")
})

test("same page stale draft no reemplaza server tree y compatible recovery conserva cambio", async () => {
  installLocalStorage()
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} })
  const { inspectSavedTreeRecovery, loadSavedTree } = await import("../../hooks/useAutosave")

  localStorage.setItem(recoveryKey("site_1", "home"), recoveryEnvelope({
    websiteId: "site_1",
    pageSlug: "home",
    baseServerVersion: "server-v1",
    currentTree: tree("local-change"),
  }))

  assert.equal(loadSavedTree("site_1", "home", "server-v2"), null)
  assert.equal(inspectSavedTreeRecovery("site_1", "home", "server-v2").status, "stale")

  assert.deepEqual(loadSavedTree("site_1", "home", "server-v1"), tree("local-change"))
  const recovered = inspectSavedTreeRecovery("site_1", "home", "server-v1")
  assert.equal(recovered.status, "recovered")
  if (recovered.status === "recovered") {
    assert.equal(recovered.baseServerVersion, "server-v1")
    assert.deepEqual(recovered.tree, tree("local-change"))
  }
})

test("stale draft ignored inicializa limpio y no produce PUT", async () => {
  const { useEditorStore } = await loadStore()
  const calls: FetchCall[] = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), tree: JSON.parse(String(init?.body)).tree })
    return jsonResponse(true, { serverVersion: "server-v2" })
  }

  useEditorStore.getState().initialize("site_1", tree("server-v2"), null, { activePageSlug: "home", activePageName: "Inicio", serverVersion: "server-v2" })

  assert.equal(useEditorStore.getState().rev, 0)
  assert.equal(useEditorStore.getState().lastSavedRev, 0)
  assert.equal(useEditorStore.getState().saveStatus, "idle")
  const result = await useEditorStore.getState().flushPendingSave()
  assert.equal(result.success, true)
  assert.equal(calls.length, 0)
})

test("valid same-page recovery inicializa dirty y permite autosave normal", async () => {
  const { useEditorStore } = await loadStore()
  const calls: FetchCall[] = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), tree: JSON.parse(String(init?.body)).tree })
    return jsonResponse(true, { serverVersion: "server-v2" })
  }

  useEditorStore.getState().initialize("site_1", tree("local-change"), null, {
    activePageSlug: "home",
    activePageName: "Inicio",
    serverVersion: "server-v1",
    recoveredFromLocal: true,
  })

  assert.equal(useEditorStore.getState().rev, 1)
  assert.equal(useEditorStore.getState().lastSavedRev, 0)
  assert.equal(useEditorStore.getState().saveStatus, "dirty")

  const result = await useEditorStore.getState().flushPendingSave()
  assert.equal(result.success, true)
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0]!.tree, tree("local-change"))
  assert.equal(useEditorStore.getState().serverVersion, "server-v2")
})

test("backup local de Home no hidrata Servicios", async () => {
  installLocalStorage()
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} })
  const { loadSavedTree } = await import("../../hooks/useAutosave")

  localStorage.setItem(recoveryKey("site_1", "home"), recoveryEnvelope({
    websiteId: "site_1",
    pageSlug: "home",
    baseServerVersion: "server-v1",
    currentTree: tree("home-local"),
  }))

  assert.equal(loadSavedTree("site_1", "servicios", "server-v1"), null)

  localStorage.setItem(recoveryKey("site_1", "servicios"), recoveryEnvelope({
    websiteId: "site_1",
    pageSlug: "servicios",
    baseServerVersion: "server-v1",
    currentTree: tree("servicios-local"),
  }))

  assert.deepEqual(loadSavedTree("site_1", "home", "server-v1"), tree("home-local"))
  assert.deepEqual(loadSavedTree("site_1", "servicios", "server-v1"), tree("servicios-local"))
})

test("autosave tiene un solo owner estructural y no vive dentro de shells intercambiables", () => {
  const experienceShell = readFileSync(path.join(process.cwd(), "components/editor/experience/EditorExperienceShell.tsx"), "utf8")
  const clientShell = readFileSync(path.join(process.cwd(), "components/editor/client-shell/ClientShell.tsx"), "utf8")
  const editorShell = readFileSync(path.join(process.cwd(), "components/editor/shell/EditorShell.tsx"), "utf8")

  assert.match(experienceShell, /useAutosave()/)
  assert.doesNotMatch(clientShell, /useAutosave()/)
  assert.doesNotMatch(editorShell, /useAutosave()/)
})

test("navegacion protegida espera flush, bloquea fallo y aplica first navigation wins", () => {
  const files = [
    "components/editor/toolbar/EditorOpsBar.tsx",
    "components/editor/experience/client/ClientWorkspaceSidebar.tsx",
    "components/editor/primitives/SiteNav.tsx",
  ]

  for (const file of files) {
    const source = readFileSync(path.join(process.cwd(), file), "utf8")
    assert.match(source, /navigationInFlightRef = useRef\(false\)/, file)
    assert.match(source, /navigationInFlightRef\.current\) return/, file)
    assert.match(source, /navigationInFlightRef\.current = true/, file)
    assert.match(source, /navigationInFlightRef\.current = false/, file)
    assert.match(source, /await flushPendingSave\(\)/, file)
    assert.match(source, /if \(!saveResult\.success\)/, file)
    assert.ok(source.indexOf("await flushPendingSave()") < source.indexOf("router.push"), file)
  }

  const siteNav = readFileSync(path.join(process.cwd(), "components/editor/primitives/SiteNav.tsx"), "utf8")
  assert.match(siteNav, /rawHref\.startsWith\("#"\)/)
  assert.match(siteNav, /parseEditorPageHref/)
  assert.match(siteNav, /void navigateInsideEditor\(ctaEditorSlug\)/)
  assert.match(siteNav, /slug === currentPageSlug/)
})

test("buildEditorPageUrl conserva query y usa page=slug", async () => {
  const { buildEditorPageUrl } = await import("../../components/editor/pageNavigation")

  assert.equal(buildEditorPageUrl("/editor/site_1", "panel=pages", "servicios"), "/editor/site_1?panel=pages&page=servicios")
  assert.equal(buildEditorPageUrl("/editor/site_1", "panel=pages&page=servicios", "home"), "/editor/site_1?panel=pages")
  assert.equal(buildEditorPageUrl(null, "", "home"), null)
})
