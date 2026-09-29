import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

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

import {
  buildAssistedViewerPageHrefV1,
  resolveAssistedViewerHrefV1,
  rewriteTreeForAssistedViewerV1,
  UNRESOLVED_INTERNAL_HREF_V1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/viewer-links"
import { resolveRuntimeHref } from "../../lib/builder-core/tree/pageLinks"
import type { EditorTree } from "../../types/editor"

// FULL-SITE-5A: pure, offline; no artifact, no network, no DB.

const PAGES: ReadonlySet<string> = new Set([
  "home",
  "productos",
  "categoria-tecnologia",
  "producto-silla-ergonomica-base",
  "help",
])

function node(id: string, type: string, props: Record<string, unknown>) {
  return { id, type, props, children: [], version: 1 }
}

function fixtureTree(): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: node("root", "section", {}),
      nav: node("nav", "siteNav", {
        ctaHref: "#contacto",
        pages: [
          { slug: "home", label: "Inicio", href: "page:home" },
          { slug: "productos", label: "Productos", href: "page:productos" },
          { slug: "help", label: "Ayuda", href: "page:help" },
        ],
      }),
      hero: node("hero", "ctaButton", { label: "Ver catálogo", href: "page:productos" }),
      category: node("category", "ctaButton", { label: "Tecnología", href: "page:categoria-tecnologia" }),
      product: node("product", "ctaButton", { label: "Silla", href: "page:producto-silla-ergonomica-base" }),
      ghost: node("ghost", "ctaButton", { label: "Nope", href: "page:no-existe" }),
      ext: node("ext", "ctaButton", { label: "Ext", href: "https://example.com/x" }),
      mail: node("mail", "ctaButton", { label: "Mail", href: "mailto:hola@example.com" }),
      tel: node("tel", "ctaButton", { label: "Tel", href: "tel:+5491100000000" }),
    },
  }
}

test("canonical page: hrefs stay canonical in the stored tree (rewrite works on a copy)", () => {
  const tree = fixtureTree()
  const snapshot = JSON.stringify(tree)
  const { tree: viewerTree } = rewriteTreeForAssistedViewerV1(tree, "assisted", PAGES)
  assert.equal(JSON.stringify(tree), snapshot)
  assert.equal(tree.nodes.hero.props.href, "page:productos")
  assert.notEqual(viewerTree.nodes.hero.props.href, "page:productos")
  // the production resolver contract is unchanged for canonical hrefs
  assert.equal(resolveRuntimeHref("site-1", "page:productos", "published"), "/p/site-1/productos")
  assert.equal(resolveRuntimeHref("site-1", "page:home", "published"), "/p/site-1")
})

test("viewer-only rewrite maps home, catalog, category, product and help", () => {
  const { tree, stats } = rewriteTreeForAssistedViewerV1(fixtureTree(), "assisted", PAGES)
  const nav = tree.nodes.nav.props.pages as Array<{ href: string }>
  assert.deepEqual(
    nav.map((entry) => entry.href),
    [
      "/dev-assisted-generation-e2e/view/assisted/home",
      "/dev-assisted-generation-e2e/view/assisted/productos",
      "/dev-assisted-generation-e2e/view/assisted/help",
    ],
  )
  assert.equal(tree.nodes.hero.props.href, "/dev-assisted-generation-e2e/view/assisted/productos")
  assert.equal(tree.nodes.category.props.href, "/dev-assisted-generation-e2e/view/assisted/categoria-tecnologia")
  assert.equal(tree.nodes.product.props.href, "/dev-assisted-generation-e2e/view/assisted/producto-silla-ergonomica-base")
  assert.equal(stats.internal, 7)
  assert.equal(stats.resolved, 6)
  assert.deepEqual(stats.dead, ["page:no-existe"])
})

test("root/home mapping: page:home, bare page: and site-relative / all open the home page", () => {
  const home = "/dev-assisted-generation-e2e/view/off/home"
  assert.equal(resolveAssistedViewerHrefV1("page:home", "off", PAGES).href, home)
  assert.equal(resolveAssistedViewerHrefV1("page:", "off", PAGES).href, home)
  assert.equal(resolveAssistedViewerHrefV1("/", "off", PAGES).href, home)
  assert.equal(resolveAssistedViewerHrefV1("/productos", "off", PAGES).href, "/dev-assisted-generation-e2e/view/off/productos")
})

test("unknown internal target fails safely to an inert # (no guessed or fuzzy route)", () => {
  for (const href of ["page:no-existe", "page:producto-silla", "/categoria", "/no-existe"]) {
    const result = resolveAssistedViewerHrefV1(href, "assisted", PAGES)
    assert.equal(result.href, UNRESOLVED_INTERNAL_HREF_V1, href)
    assert.equal(result.internal, true)
    assert.equal(result.resolved, false)
  }
  const { tree } = rewriteTreeForAssistedViewerV1(fixtureTree(), "assisted", PAGES)
  assert.equal(tree.nodes.ghost.props.href, "#")
})

test("external URLs, anchors, mailto and tel are never rewritten", () => {
  const { tree } = rewriteTreeForAssistedViewerV1(fixtureTree(), "assisted", PAGES)
  assert.equal(tree.nodes.ext.props.href, "https://example.com/x")
  assert.equal(tree.nodes.mail.props.href, "mailto:hola@example.com")
  assert.equal(tree.nodes.tel.props.href, "tel:+5491100000000")
  assert.equal(tree.nodes.nav.props.ctaHref, "#contacto")
  for (const href of ["#contacto", "//cdn.example.com/a", "http://x.test", "/productos/extra", "/productos?x=1"]) {
    assert.equal(resolveAssistedViewerHrefV1(href, "assisted", PAGES).href, href, href)
  }
})

test("off vs assisted variant is preserved in every rewritten link", () => {
  const off = rewriteTreeForAssistedViewerV1(fixtureTree(), "off", PAGES).tree
  const assisted = rewriteTreeForAssistedViewerV1(fixtureTree(), "assisted", PAGES).tree
  assert.equal(off.nodes.product.props.href, "/dev-assisted-generation-e2e/view/off/producto-silla-ergonomica-base")
  assert.equal(assisted.nodes.product.props.href, "/dev-assisted-generation-e2e/view/assisted/producto-silla-ergonomica-base")
  assert.equal(buildAssistedViewerPageHrefV1("off", "help"), "/dev-assisted-generation-e2e/view/off/help")
})
