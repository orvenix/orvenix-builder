import test from "node:test"
import assert from "node:assert/strict"
import {
  DEFAULT_DOCUMENT_SEO,
  DEFAULT_DOCUMENT_THEME,
  normalizeDocumentSeo,
  normalizePublishedUrl,
  tokenToFontSize,
  tokenToFontWeight,
  tokenToMaxWidth,
  tokenToRadius,
  tokenToShadow,
  tokenToSpacing,
} from "../../lib/builder-core/compiler/document"

test("compiler document helpers expose stable defaults", () => {
  assert.equal(DEFAULT_DOCUMENT_THEME.colors?.primary, "#111827")
  assert.equal(DEFAULT_DOCUMENT_THEME.spacing?.sectionY, "3rem")
  assert.equal(DEFAULT_DOCUMENT_SEO.title, "Mi Sitio Web Orvenix")
})

test("compiler document helpers normalize SEO with defaults", () => {
  const seo = normalizeDocumentSeo({
    title: "  Landing Premium  ",
    description: "",
    keywords: "seo, builder",
  })

  assert.equal(seo.title, "Landing Premium")
  assert.equal(seo.description, DEFAULT_DOCUMENT_SEO.description)
  assert.equal(seo.keywords, "seo, builder")
  assert.equal(seo.ogImage, "")
})

test("compiler document helpers normalize published urls safely", () => {
  assert.equal(normalizePublishedUrl("contacto"), "/contacto")
  assert.equal(normalizePublishedUrl("./assets/logo.png"), "/assets/logo.png")
  assert.equal(normalizePublishedUrl("/legal"), "/legal")
  assert.equal(normalizePublishedUrl("mailto:hola@orvenix.com.mx"), "mailto:hola@orvenix.com.mx")
  assert.equal(normalizePublishedUrl("#faq"), "#faq")
})

test("compiler document helpers resolve spacing, sizing and tokens", () => {
  assert.equal(tokenToSpacing("lg"), "3rem")
  assert.equal(tokenToSpacing("unknown"), null)
  assert.equal(tokenToMaxWidth("xl"), "80rem")
  assert.equal(tokenToFontSize("md", "text"), "1rem")
  assert.equal(tokenToFontSize("md", "heading"), "1.25rem")
  assert.equal(tokenToFontWeight("extrabold"), "800")
  assert.equal(tokenToRadius("lg"), "1.25rem")
  assert.equal(tokenToShadow("md"), "0 16px 40px rgba(15, 23, 42, 0.12)")
})
