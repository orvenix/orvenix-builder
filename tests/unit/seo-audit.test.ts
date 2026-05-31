import test from "node:test"
import assert from "node:assert/strict"
import { calcSeoScore, runSeoAudit } from "../../lib/audit/seoAudit"
import type { EditorTree } from "../../types/editor"

function createTree(overrides?: Partial<EditorTree>): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: ["h1", "p1", "img1"],
        version: 1,
      },
      h1: {
        id: "h1",
        type: "heading",
        props: { level: 1, text: "Titulo principal de la pagina con longitud razonable" },
        children: [],
        version: 1,
        parentId: "root",
      },
      p1: {
        id: "p1",
        type: "text",
        props: { content: "Contenido descriptivo suficiente para evitar thin content en esta prueba unitaria del auditor SEO." },
        children: [],
        version: 1,
        parentId: "root",
      },
      img1: {
        id: "img1",
        type: "image",
        props: { alt: "Equipo trabajando en una interfaz" },
        children: [],
        version: 1,
        parentId: "root",
      },
    },
    seo: {
      title: "Titulo SEO suficientemente descriptivo para pasar",
      description: "Descripcion SEO con longitud adecuada para buscadores y redes sociales en el flujo de prueba automatizada del proyecto.",
      ogImage: "/img/logo-main.png",
    },
    ...overrides,
  }
}

test("runSeoAudit reports missing title and description", () => {
  const issues = runSeoAudit(createTree({ seo: {} }))
  const ids = issues.map((issue) => issue.id)

  assert.ok(ids.includes("seo-no-title"))
  assert.ok(ids.includes("seo-no-description"))
})

test("runSeoAudit exposes safe auto-fixes for missing SEO metadata", () => {
  const issues = runSeoAudit(createTree({ seo: {} }))
  const titleIssue = issues.find((issue) => issue.id === "seo-no-title")
  const descriptionIssue = issues.find((issue) => issue.id === "seo-no-description")
  const ogIssue = issues.find((issue) => issue.id === "seo-no-og-image")

  assert.equal(titleIssue?.autoFixable, true)
  assert.match(String(titleIssue?.fix?.().title ?? ""), /Titulo principal/i)
  assert.equal(descriptionIssue?.autoFixable, true)
  assert.ok(String(descriptionIssue?.fix?.().description ?? "").length > 0)
  assert.equal(ogIssue?.autoFixable, true)
  assert.equal(ogIssue?.fix?.().ogImage, "/img/logo-main.png")
})

test("runSeoAudit warns when there is no H1 and image alt is missing", () => {
  const tree = createTree()
  tree.nodes.h1.props = { level: 2, text: "Subtitulo" }
  tree.nodes.img1.props = {}

  const issues = runSeoAudit(tree)
  const ids = issues.map((issue) => issue.id)

  assert.ok(ids.includes("seo-no-h1"))
  assert.ok(ids.some((id) => id.startsWith("seo-img-no-alt-img1")))
})

test("calcSeoScore penalizes errors more than warnings", () => {
  const issues = runSeoAudit(createTree({ seo: {} }))
  const score = calcSeoScore(issues)

  assert.ok(score < 100)
  assert.ok(score >= 0)
})
