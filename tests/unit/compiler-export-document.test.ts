import test from "node:test"
import assert from "node:assert/strict"
import {
  getExportHtmlSeoMetaModel,
  getExportJsxMetadataModel,
  getExportSeoModel,
} from "../../lib/builder-core/compiler/exportDocument"

test("compiler export document normalizes export SEO with site fallback", () => {
  const seo = getExportSeoModel("Sitio Demo", {
    title: "  ",
    description: "Descripcion de prueba",
    keywords: "seo, export",
    ogImage: "https://cdn.orvenix.com.mx/og.png",
    canonicalUrl: " https://orvenix.com.mx/demo ",
  })

  assert.equal(seo.title, "Sitio Demo")
  assert.equal(seo.description, "Descripcion de prueba")
  assert.equal(seo.keywords, "seo, export")
  assert.equal(seo.ogImage, "https://cdn.orvenix.com.mx/og.png")
  assert.equal(seo.canonicalUrl, "https://orvenix.com.mx/demo")
})

test("compiler export document derives html and jsx metadata models", () => {
  const seo = getExportSeoModel("Sitio Demo", {
    title: "Orvenix Demo",
    description: "Landing exportada",
    ogImage: "https://cdn.orvenix.com.mx/og.png",
  })
  const htmlMeta = getExportHtmlSeoMetaModel(seo)
  const jsxMeta = getExportJsxMetadataModel(seo)

  assert.equal(htmlMeta.openGraph[0]?.property, "og:title")
  assert.equal(htmlMeta.twitter[0]?.name, "twitter:card")
  assert.equal(jsxMeta.title, "Orvenix Demo")
  assert.equal(jsxMeta.openGraph.images?.[0]?.url, "https://cdn.orvenix.com.mx/og.png")
  assert.equal(jsxMeta.twitter.images?.[0], "https://cdn.orvenix.com.mx/og.png")
})
