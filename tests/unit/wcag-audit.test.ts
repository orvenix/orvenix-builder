import test from "node:test"
import assert from "node:assert/strict"
import { calcWcagScore, runWcagAudit } from "../../lib/audit/wcagAudit"
import type { EditorTree } from "../../types/editor"

function createTree(): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: ["heading1", "button1", "image1", "text1"],
        version: 1,
      },
      heading1: {
        id: "heading1",
        type: "heading",
        props: { level: 2, text: "Encabezado secundario", color: "#777777", styleBackground: "#888888" },
        children: [],
        version: 1,
        parentId: "root",
      },
      button1: {
        id: "button1",
        type: "ctaButton",
        props: { label: "" },
        children: [],
        version: 1,
        parentId: "root",
      },
      image1: {
        id: "image1",
        type: "image",
        props: { alt: "imagen" },
        children: [],
        version: 1,
        parentId: "root",
      },
      text1: {
        id: "text1",
        type: "text",
        props: { content: "Texto de prueba", color: "#666666", styleBackground: "#777777" },
        children: [],
        version: 1,
        parentId: "root",
      },
    },
  }
}

test("runWcagAudit reports generic alt text and missing button label", () => {
  const issues = runWcagAudit(createTree())
  const ids = issues.map((issue) => issue.id)

  assert.ok(ids.includes("wcag-alt-generic-image1"))
  assert.ok(ids.includes("wcag-btn-no-label-button1"))
})

test("runWcagAudit reports heading hierarchy issue when page does not start with H1", () => {
  const issues = runWcagAudit(createTree())
  assert.ok(issues.some((issue) => issue.id === "wcag-heading-hierarchy"))
})

test("calcWcagScore decreases when there are accessibility issues", () => {
  const score = calcWcagScore(runWcagAudit(createTree()))
  assert.ok(score < 100)
  assert.ok(score >= 0)
})
