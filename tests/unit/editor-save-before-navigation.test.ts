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
}

function jsonResponse(ok = true) {
  return {
    ok,
    json: async () => ok ? ({}) : ({ error: "No se pudo guardar." }),
  } as Response
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
