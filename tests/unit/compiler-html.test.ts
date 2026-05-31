import test from "node:test"
import assert from "node:assert/strict"
import {
  buildDocumentCss,
  escapeHtml,
  getHtmlTag,
  getNodeAttributes,
  getNodeStyle,
  renderNodeToHtml,
} from "../../lib/builder-core/compiler/html"
import type { EditorNode, EditorTree, GlobalTheme } from "../../types/editor"

const theme: GlobalTheme = {
  colors: {
    primary: "#111827",
    secondary: "#4f46e5",
    background: "#ffffff",
    text: "#1f2937",
    accent: "#06b6d4",
  },
  fontHeading: "Inter, sans-serif",
  fontBody: "Inter, sans-serif",
  spacing: {
    sectionX: "1.5rem",
    sectionY: "3rem",
    stack: "1.5rem",
  },
  radius: {
    card: "1rem",
    button: "999px",
  },
  shadow: {
    soft: "0 12px 32px rgba(15,23,42,0.08)",
    strong: "0 24px 60px rgba(15,23,42,0.18)",
  },
  motion: {
    duration: "240ms",
    easing: "ease",
  },
}

function createNode(overrides: Partial<EditorNode>): EditorNode {
  return {
    id: overrides.id ?? "node",
    type: overrides.type ?? "text",
    props: overrides.props ?? {},
    children: overrides.children ?? [],
    version: overrides.version ?? 1,
    ...(overrides.parentId ? { parentId: overrides.parentId } : {}),
    ...(overrides.hidden ? { hidden: overrides.hidden } : {}),
  }
}

test("compiler html escapes unsafe text safely", () => {
  assert.equal(escapeHtml(`Tom & Jerry <script>"x"</script>`), "Tom &amp; Jerry &lt;script&gt;&quot;x&quot;&lt;/script&gt;")
})

test("compiler html resolves semantic tags and styles", () => {
  const heading = createNode({
    type: "heading",
    props: { level: 3, size: "4xl", weight: "extrabold", text: "Hola" },
  })
  assert.equal(getHtmlTag(heading), "h3")
  assert.match(getNodeStyle(heading, theme), /font-size:3.75rem;/)
  assert.match(getNodeStyle(heading, theme), /font-weight:800;/)
})

test("compiler html builds safe attributes for links and images", () => {
  const cta = createNode({
    type: "ctaButton",
    props: { href: "contacto", label: "Escribir" },
  })
  const image = createNode({
    type: "image",
    props: { src: "img/hero.png", alt: "Hero" },
  })

  assert.match(getNodeAttributes(cta, theme), /href="\/contacto"/)
  assert.match(getNodeAttributes(image, theme), /src="\/img\/hero\.png"/)
  assert.match(getNodeAttributes(image, theme), /loading="lazy"/)
})

test("compiler html renders nested nodes into semantic html", () => {
  const tree: EditorTree = {
    rootId: "root",
    nodes: {
      root: createNode({
        id: "root",
        type: "section",
        props: { maxWidth: "lg", paddingX: "md" },
        children: ["title", "copy"],
      }),
      title: createNode({
        id: "title",
        type: "heading",
        props: { level: 1, text: "Impulsa tu operación" },
        parentId: "root",
      }),
      copy: createNode({
        id: "copy",
        type: "text",
        props: { content: "Automatiza ventas\nsin fricción" },
        parentId: "root",
      }),
    },
  }

  const html = renderNodeToHtml(tree.nodes.root, tree, theme)
  assert.match(html, /<section/)
  assert.match(html, /<h1[^>]*>Impulsa tu operación<\/h1>/)
  assert.match(html, /Automatiza ventas<br>sin fricción/)
})

test("compiler html builds global document css from theme tokens", () => {
  const css = buildDocumentCss(theme)
  assert.match(css, /--primary:#111827;/)
  assert.match(css, /--space-sectionX:1.5rem;/)
  assert.match(css, /--radius-button:999px;/)
  assert.match(css, /font-family:var\(--font-body\)/)
})
