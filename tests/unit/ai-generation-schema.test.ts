import test from "node:test"
import assert from "node:assert/strict"
import { extractFirstJsonObject, normalizeGeneratedTreeCandidate } from "../../lib/ai/generationSchema"

test("extractFirstJsonObject pulls the first complete JSON object from markdown-wrapped text", () => {
  const raw = "```json\n{\"tree\":{\"rootId\":\"hero\",\"nodes\":{\"hero\":{\"id\":\"hero\",\"type\":\"agency-hero\",\"props\":{},\"children\":[],\"version\":1}}}}\n```"
  const extracted = extractFirstJsonObject(raw)

  assert.equal(
    extracted,
    "{\"tree\":{\"rootId\":\"hero\",\"nodes\":{\"hero\":{\"id\":\"hero\",\"type\":\"agency-hero\",\"props\":{},\"children\":[],\"version\":1}}}}"
  )
})

test("normalizeGeneratedTreeCandidate unwraps tree payloads and preserves only allowed nodes", () => {
  const tree = normalizeGeneratedTreeCandidate(
    {
      tree: {
        rootId: "root section",
        nodes: {
          "root section": {
            id: "root section",
            type: "section",
            props: { paddingY: "xl" },
            children: ["hero 1", "rogue"],
            version: 3,
          },
          "hero 1": {
            id: "hero 1",
            type: "agency-hero",
            props: { shouldDrop: true },
            children: [],
            version: 1,
            parentId: "root section",
          },
          rogue: {
            id: "rogue",
            type: "unknown-block",
            props: { nope: true },
            children: [],
            version: 1,
          },
        },
      },
    },
    ["section", "agency-hero"]
  )

  assert.ok(tree)
  assert.equal(tree?.rootId, "root-section")
  assert.deepEqual(Object.keys(tree?.nodes ?? {}), ["root-section", "hero-1"])
  assert.deepEqual(tree?.nodes["root-section"]?.children, ["hero-1"])
  assert.deepEqual(tree?.nodes["hero-1"]?.props, {})
  assert.equal(tree?.nodes["hero-1"]?.parentId, "root-section")
})

test("normalizeGeneratedTreeCandidate removes unreachable nodes and invalid roots", () => {
  const tree = normalizeGeneratedTreeCandidate(
    {
      rootId: "missing-root",
      nodes: {
        first: {
          id: "first",
          type: "section",
          props: {},
          children: [],
          version: 1,
        },
        orphan: {
          id: "orphan",
          type: "text",
          props: { content: "fuera del arbol" },
          children: [],
          version: 1,
        },
      },
    },
    ["section", "text"]
  )

  assert.ok(tree)
  assert.equal(tree?.rootId, "first")
  assert.deepEqual(Object.keys(tree?.nodes ?? {}), ["first"])
})
