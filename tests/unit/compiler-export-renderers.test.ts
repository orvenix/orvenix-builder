import test from "node:test"
import assert from "node:assert/strict"
import { renderHtmlExportNode, renderJsxExportNode } from "../../lib/builder-core/compiler/exportRenderers"
import type { EditorNode } from "../../types/editor"

function createNode(overrides: Partial<EditorNode>): EditorNode {
  return {
    id: "node_renderer",
    type: "text",
    version: 1,
    children: [],
    props: {},
    ...overrides,
  }
}

test("compiler export renderers render html button and placeholder", () => {
  const buttonNode = createNode({
    type: "ctaButton",
    props: { label: "Abrir", href: "https://orvenix.com.mx" },
  })
  const placeholderNode = createNode({
    type: "landing-hero",
  })

  const button = renderHtmlExportNode(
    { node: buttonNode, props: buttonNode.props, indent: "  ", children: "" },
    {},
    {
      escape: (value) => String(value),
      styleAttr: () => "",
    }
  )
  const placeholder = renderHtmlExportNode(
    { node: placeholderNode, props: placeholderNode.props, indent: "  ", children: "" },
    {},
    {
      escape: (value) => String(value),
      styleAttr: () => "",
    }
  )

  assert.match(button, /target="_blank"/)
  assert.match(button, /rel="noopener noreferrer"/)
  assert.match(placeholder, /aria-labelledby="landing-hero-heading"/)
})

test("compiler export renderers render jsx text and nav", () => {
  const textNode = createNode({
    type: "text",
    props: { content: "Hola", align: "center" },
  })
  const navNode = createNode({
    type: "siteNav",
    props: { title: "Principal" },
  })

  const text = renderJsxExportNode(
    { node: textNode, props: textNode.props, indent: "  ", children: "" },
    {},
    {
      escape: (value) => String(value),
      styleExpr: () => "",
    }
  )
  const nav = renderJsxExportNode(
    { node: navNode, props: navNode.props, indent: "  ", children: "" },
    {
      siteId: "site_demo",
      pages: [{ id: "home", siteId: "site_demo", name: "Inicio", slug: "home", isHome: true, published: true, source: "site-page" }],
      currentPageSlug: "home",
    },
    {
      escape: (value) => String(value),
      styleExpr: () => "",
    }
  )

  assert.equal(text, `  <p className="text-center">Hola</p>`)
  assert.match(nav, /aria-current="page"/)
})
