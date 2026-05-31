import test from "node:test"
import assert from "node:assert/strict"
import { renderExportNodeTree, renderExportRootChildren } from "../../lib/builder-core/compiler/exportTraversal"
import type { EditorTree } from "../../types/editor"

const tree: EditorTree = {
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      type: "section",
      props: {},
      children: ["a", "hidden"],
      version: 1,
    },
    a: {
      id: "a",
      type: "text",
      props: { content: "A" },
      children: ["b"],
      version: 1,
      parentId: "root",
    },
    b: {
      id: "b",
      type: "heading",
      props: { text: "B" },
      children: [],
      version: 1,
      parentId: "a",
    },
    hidden: {
      id: "hidden",
      type: "text",
      props: { content: "Hidden" },
      children: [],
      hidden: true,
      version: 1,
      parentId: "root",
    },
  },
}

test("compiler export traversal renders descendants and skips hidden nodes", () => {
  const output = renderExportNodeTree("a", tree, 2, ({ node, indent, children }) => {
    return `${indent}${node.id}${children ? `\n${children}` : ""}`
  })

  assert.match(output, /^    a/m)
  assert.match(output, /^      b/m)
  assert.doesNotMatch(output, /hidden/)
})

test("compiler export traversal renders root children with blank-line separator", () => {
  const output = renderExportRootChildren(tree, 1, ({ node, indent }) => `${indent}${node.id}`)
  assert.equal(output, "  a")
})
