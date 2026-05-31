import test from "node:test"
import assert from "node:assert/strict"
import { serializeTreeToHtml } from "../../lib/export/serializeToHtml"
import { serializeTreeToJsx } from "../../lib/export/serializeToJsx"
import { validateHtmlExport } from "../../lib/export/validateHtmlExport"
import type { EditorTree } from "../../types/editor"

function createTree(): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: ["hero", "wrapper", "hidden"],
        version: 1,
      },
      hero: {
        id: "hero",
        type: "landing-hero",
        props: {
          styleBackground: "#0f172a",
          stylePadding: 32,
        },
        children: ["title", "copy", "cta", "image"],
        version: 1,
        parentId: "root",
      },
      title: {
        id: "title",
        type: "heading",
        props: {
          level: 1,
          text: "Impulsa tu operación",
          align: "center",
        },
        children: [],
        version: 1,
        parentId: "hero",
      },
      copy: {
        id: "copy",
        type: "text",
        props: {
          content: "Automatiza ventas\nsin <fricción>",
        },
        children: [],
        version: 1,
        parentId: "hero",
      },
      cta: {
        id: "cta",
        type: "ctaButton",
        props: {
          label: "Agenda demo",
          href: "https://orvenix.com.mx/demo",
          variant: "secondary",
        },
        children: [],
        version: 1,
        parentId: "hero",
      },
      image: {
        id: "image",
        type: "image",
        props: {
          src: "https://cdn.orvenix.com.mx/hero.png",
          alt: "Panel analítico principal",
          title: "Vista principal del dashboard",
          width: 960,
          height: 640,
          objectFit: "cover",
        },
        children: [],
        version: 1,
        parentId: "hero",
      },
      wrapper: {
        id: "wrapper",
        type: "genericWrapper",
        props: {
          positionMode: "free",
          x: 24,
          y: 48,
          width: 300,
          height: 120,
        },
        children: ["custom"],
        version: 1,
        parentId: "root",
      },
      custom: {
        id: "custom",
        type: "custom-widget",
        displayName: "Widget personalizado",
        props: {},
        children: [],
        version: 1,
        parentId: "wrapper",
      },
      hidden: {
        id: "hidden",
        type: "text",
        props: {
          content: "No debe exportarse",
        },
        children: [],
        hidden: true,
        version: 1,
        parentId: "root",
      },
    },
    seo: {
      title: "Orvenix Export Test",
      description: "Exportación con metadatos y contenido semántico.",
      keywords: "builder, export, nextjs",
      ogImage: "https://cdn.orvenix.com.mx/og.png",
    },
    theme: {
      colors: {
        primary: "#0ea5e9",
        secondary: "#22c55e",
        background: "#ffffff",
        text: "#0f172a",
        accent: "#f97316",
      },
      fontHeading: "Sora, sans-serif",
      fontBody: "Instrument Sans, sans-serif",
    },
  }
}

test("serializeTreeToHtml exports semantic HTML, styles and SEO metadata", () => {
  const result = serializeTreeToHtml(createTree(), "Sitio Demo")

  assert.match(result.html, /<header class="orv-block orv-block--landing-hero"[^>]*aria-labelledby="landing-hero-heading"/)
  assert.match(result.html, /<h2 id="landing-hero-heading" class="sr-only">Hero principal<\/h2>/)
  assert.match(result.html, /<h1 class="text-center">Impulsa tu operación<\/h1>/)
  assert.match(result.html, /Automatiza ventas<br \/>sin &lt;fricción&gt;/)
  assert.match(result.html, /<figure>/)
  assert.match(result.html, /<figcaption>Vista principal del dashboard<\/figcaption>/)
  assert.match(result.html, /target="_blank" rel="noopener noreferrer"/)
  assert.match(result.html, /style="position:absolute;left:24px;top:48px;width:300px;height:120px"/)
  assert.doesNotMatch(result.html, /No debe exportarse/)
  assert.equal(result.seo.title, "Orvenix Export Test")
  assert.equal(result.seo.description, "Exportación con metadatos y contenido semántico.")
  assert.match(result.css, /--font-heading: "Sora, sans-serif";/)
  assert.match(result.css, /\.sr-only \{/)
})

test("serializeTreeToJsx exports current framework versions and accessible placeholders", () => {
  const result = serializeTreeToJsx(createTree(), "Sitio Demo")
  const pkg = JSON.parse(result.packageJson) as {
    dependencies: Record<string, string>
  }

  assert.equal(pkg.dependencies.next, "16.2.4")
  assert.equal(pkg.dependencies.react, "19.2.4")
  assert.equal(pkg.dependencies["react-dom"], "19.2.4")
  assert.match(result.pageTsx, /export const metadata: Metadata =/)
  assert.match(result.pageTsx, /title: "Orvenix Export Test"/)
  assert.match(result.pageTsx, /<div style=\{\{ position: "absolute", left: 24, top: 48, width: 300, height: 120 \}\}>/)
  assert.match(result.pageTsx, /<section data-block="custom-widget" aria-label="Widget personalizado" \/>/)
  assert.match(result.layoutTsx, /<html lang="es">/)
  assert.match(result.nextConfig, /remotePatterns/)
})

test("validateHtmlExport accepts the generated static export without critical errors", () => {
  const { html } = serializeTreeToHtml(createTree(), "Sitio Demo")
  const report = validateHtmlExport(html)

  assert.equal(report.valid, true)
  assert.equal(report.errors, 0)
  assert.equal(report.issues.some((issue) => issue.code === "canonical-empty"), false)
})

test("validateHtmlExport flags duplicate ids, missing alt and unsafe blank links", () => {
  const report = validateHtmlExport(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Demo</title>
</head>
<body>
  <main>
    <h1 id="hero">Titulo</h1>
    <h3>Subtitulo</h3>
    <img src="/demo.png" />
    <a href="https://example.com" target="_blank">Abrir</a>
    <section id="hero"></section>
  </main>
</body>
</html>`)

  assert.equal(report.valid, false)
  assert.ok(report.issues.some((issue) => issue.code === "html-lang-missing"))
  assert.ok(report.issues.some((issue) => issue.code === "duplicate-id"))
  assert.ok(report.issues.some((issue) => issue.code === "img-alt-missing"))
  assert.ok(report.issues.some((issue) => issue.code === "blank-link-rel-missing"))
  assert.ok(report.issues.some((issue) => issue.code === "heading-skip"))
})
