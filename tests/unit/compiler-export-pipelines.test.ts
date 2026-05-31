import test from "node:test"
import assert from "node:assert/strict"
import { buildHtmlExportArtifact, buildJsxExportArtifact } from "../../lib/builder-core/compiler/exportPipelines"
import type { EditorTree } from "../../types/editor"

function createTree(): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: ["title", "cta"],
        version: 1,
      },
      title: {
        id: "title",
        type: "heading",
        props: { level: 1, text: "Hola Orvenix" },
        children: [],
        version: 1,
        parentId: "root",
      },
      cta: {
        id: "cta",
        type: "ctaButton",
        props: { label: "Ver más", href: "page:home" },
        children: [],
        version: 1,
        parentId: "root",
      },
    },
    seo: {
      title: "Demo SEO",
      description: "Descripcion demo",
    },
    theme: {
      colors: {
        primary: "#111827",
        secondary: "#2563eb",
        background: "#ffffff",
        text: "#111827",
        accent: "#f97316",
      },
    },
  }
}

test("compiler export pipelines builds html artifact", () => {
  const result = buildHtmlExportArtifact(createTree(), "Sitio Demo", {
    siteId: "site_demo",
    stylesHref: "site.css",
  })

  assert.match(result.html, /<title>Demo SEO<\/title>/)
  assert.match(result.html, /href="site\.css"/)
  assert.match(result.html, /<h1>Hola Orvenix<\/h1>/)
  assert.match(result.html, /href="\/index\.html"/)
  assert.match(result.css, /body \{\s+--primary:/)
})

test("compiler export pipelines builds jsx artifact", () => {
  const result = buildJsxExportArtifact(createTree(), "Sitio Demo", {
    siteId: "site_demo",
    currentPageSlug: "home",
  })

  assert.match(result.pageTsx, /title: "Demo SEO"/)
  assert.match(result.pageTsx, /<h1>Hola Orvenix<\/h1>/)
  assert.match(result.pageTsx, /href="\/index\.html"/)
  assert.match(result.layoutTsx, /<html lang="es">/)
  assert.match(result.packageJson, /"next": "16\.2\.4"/)
})
