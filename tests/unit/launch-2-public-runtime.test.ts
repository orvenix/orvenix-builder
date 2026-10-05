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
import { PublicRenderer } from "../../components/PublicRenderer"
import { EditorProvider } from "../../components/editor/store/EditorProvider"
import type { EditorTree } from "../../types/editor"

/*
 * LAUNCH-2: the public runtime (/p/*, catalog demos, preview) still renders on
 * the client through the single EditorTree renderer, but its server HTML must
 * never show the editor's loading chrome or internal copy to a visitor.
 */

const tree: EditorTree = {
  rootId: "root",
  nodes: { root: { id: "root", type: "section", props: {}, children: [], version: 1 } },
}

test("LAUNCH-2: a visitor's first HTML never shows editor copy or chrome", () => {
  const html = renderToStaticMarkup(createElement(PublicRenderer, { siteId: "site_public", tree }))
  assert.doesNotMatch(html, /Abriendo diseño en el editor|editor-skeleton-line|No se pudo abrir el constructor/)
  assert.match(html, /aria-busy="true"/)
})

test("LAUNCH-2: the editor keeps its own loading skeleton", () => {
  const html = renderToStaticMarkup(createElement(EditorProvider, { websiteId: "site_editor", initialTree: tree } as Parameters<typeof EditorProvider>[0]))
  assert.match(html, /Abriendo diseño en el editor/)
})

test("LAUNCH-2: public pages render the published tree, never this browser's editor drafts; one renderer only", () => {
  const source = readFileSync(path.join(process.cwd(), "components/PublicRenderer.tsx"), "utf8")
  assert.match(source, /recoverLocalDraft=\{false\}/)
  assert.match(source, /<DynamicRenderer mode="preview" \/>/)
  const provider = readFileSync(path.join(process.cwd(), "components/editor/store/EditorProvider.tsx"), "utf8")
  assert.match(provider, /const recovery = recoverLocalDraft\s*\? inspectSavedTreeRecovery\(websiteId, initialPageSlug, initialServerVersion\)\s*: null;/)
})
