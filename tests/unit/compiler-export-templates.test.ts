import test from "node:test"
import assert from "node:assert/strict"
import {
  buildHtmlDocument,
  buildNextLayoutTsx,
  buildNextPageTsx,
} from "../../lib/builder-core/compiler/exportTemplates"

test("compiler export templates builds html document shell", () => {
  const html = buildHtmlDocument({
    title: "Titulo",
    description: "Descripcion",
    keywords: "seo, export",
    canonicalLine: `  <link rel="canonical" href="https://orvenix.com.mx" />`,
    openGraphLines: `  <meta property="og:title" content="Titulo" />`,
    twitterLines: `  <meta name="twitter:title" content="Titulo" />`,
    stylesHref: "styles.css",
    bodyContent: "  <section>Contenido</section>",
  })

  assert.match(html, /<title>Titulo<\/title>/)
  assert.match(html, /<meta name="description" content="Descripcion" \/>/)
  assert.match(html, /<link rel="stylesheet" href="styles\.css" \/>/)
  assert.match(html, /<section>Contenido<\/section>/)
})

test("compiler export templates builds next page and layout shells", () => {
  const page = buildNextPageTsx({
    metadata: {
      title: "Titulo",
      description: "Descripcion",
      keywords: "seo, export",
      openGraph: {
        title: "Titulo",
        description: "Descripcion",
        images: [{ url: "https://cdn.orvenix.com.mx/og.png" }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Titulo",
        description: "Descripcion",
        images: ["https://cdn.orvenix.com.mx/og.png"],
      },
    },
    bodyContent: "      <section>Contenido</section>",
  })
  const layout = buildNextLayoutTsx("Sitio Demo")

  assert.match(page, /export const metadata: Metadata =/)
  assert.match(page, /images: \[\{ url: "https:\/\/cdn\.orvenix\.com\.mx\/og\.png" \}\],/)
  assert.match(page, /<section>Contenido<\/section>/)
  assert.match(layout, /title: "Sitio Demo"/)
  assert.match(layout, /<html lang="es">/)
})
