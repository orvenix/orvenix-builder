import test from "node:test"
import assert from "node:assert/strict"
import {
  LOCKED_BLOCKS,
  detectParentLayout,
  normalizeInsertion,
} from "../../lib/editor/layoutNormalizer"
import type { EditorNode, EditorTree, NodeProps } from "../../types/editor"

function createNode(overrides: Partial<EditorNode> = {}): EditorNode {
  return {
    id: overrides.id ?? "node-1",
    type: overrides.type ?? "section",
    props: overrides.props ?? {},
    children: overrides.children ?? [],
    version: overrides.version ?? 1,
    parentId: overrides.parentId,
  }
}

function createTree(parent: EditorNode): EditorTree {
  const root = createNode({ id: "root", type: "page" })
  return {
    rootId: "root",
    nodes: {
      root,
      [parent.id]: parent,
    },
  }
}

test("detectParentLayout resolves free, grid, flex-row and column layouts", () => {
  assert.equal(detectParentLayout(createNode({ props: { positionMode: "free" } })), "free")
  assert.equal(detectParentLayout(createNode({ props: { display: "grid" } })), "grid")
  assert.equal(
    detectParentLayout(createNode({ props: { display: "flex", flexDirection: "row" } })),
    "flex-row"
  )
  assert.equal(detectParentLayout(createNode({ props: { display: "flex" } })), "column")
})

test("normalizeInsertion redirects locked blocks to root and strips free-position props", () => {
  const lockedType = Array.from(LOCKED_BLOCKS)[0]
  const parent = createNode({ id: "container" })
  const tree = createTree(parent)

  const result = normalizeInsertion({
    type: lockedType,
    parentId: parent.id,
    tree,
    props: {
      positionMode: "free",
      x: 120,
      y: 160,
      width: 700,
      height: 320,
      zIndex: 10,
      className: "hero",
    },
  })

  assert.equal(result.parentId, tree.rootId)
  assert.deepEqual(result.props, { className: "hero" })
})

test("normalizeInsertion assigns free-layout defaults and staggered coordinates", () => {
  const parent = createNode({
    id: "free-parent",
    props: { positionMode: "free" },
    children: ["a", "b"],
  })
  const tree = createTree(parent)

  const result = normalizeInsertion({
    type: "image",
    parentId: parent.id,
    tree,
    props: { alt: "preview" },
  })

  assert.equal(result.parentId, parent.id)
  assert.equal(result.props.positionMode, "free")
  assert.equal(result.props.width, 400)
  assert.equal(result.props.height, 240)
  assert.equal(result.props.x, 88)
  assert.equal(result.props.y, 88)
  assert.equal(result.props.alt, "preview")
})

test("normalizeInsertion keeps explicit free-layout coordinates and custom size overrides", () => {
  const parent = createNode({
    id: "free-parent",
    props: { positionMode: "free" },
  })
  const tree = createTree(parent)
  const props: NodeProps = {
    width: 999,
    height: 111,
    x: 12,
    y: 34,
    label: "custom",
  }

  const result = normalizeInsertion({
    type: "heading",
    parentId: parent.id,
    tree,
    props,
  })

  assert.equal(result.props.width, 999)
  assert.equal(result.props.height, 111)
  assert.equal(result.props.x, 12)
  assert.equal(result.props.y, 34)
  assert.equal(result.props.positionMode, "free")
  assert.equal(result.props.label, "custom")
})

test("normalizeInsertion strips free props for column, grid and row layouts", () => {
  const flowParent = createNode({
    id: "flow-parent",
    props: { display: "grid" },
  })
  const tree = createTree(flowParent)

  const result = normalizeInsertion({
    type: "text",
    parentId: flowParent.id,
    tree,
    props: {
      positionMode: "free",
      x: 1,
      y: 2,
      width: 300,
      height: 80,
      zIndex: 5,
      content: "hola",
    },
  })

  assert.deepEqual(result.props, { content: "hola" })
  assert.equal(result.parentId, flowParent.id)
})

test("normalizeInsertion leaves props untouched when parent is missing", () => {
  const props = { x: 10, content: "sin padre" }
  const tree: EditorTree = {
    rootId: "root",
    nodes: {
      root: createNode({ id: "root", type: "page" }),
    },
  }

  const result = normalizeInsertion({
    type: "text",
    parentId: "missing-parent",
    tree,
    props,
  })

  assert.equal(result.parentId, "missing-parent")
  assert.equal(result.props, props)
})
