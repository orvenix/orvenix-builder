import test from "node:test"
import assert from "node:assert/strict"
import { calcPerformanceScore, runPerformanceAudit } from "../../lib/audit/performanceAudit"
import type { EditorTree } from "../../types/editor"

function createTree(): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: ["hero", "image1", "image2", "free1", "free2", "free3", "free4", "free5", "free6", "free7", "free8", "free9", "free10", "free11", "free12", "free13", "free14", "animated1", "animated2", "animated3", "animated4", "animated5", "animated6", "animated7"],
        version: 1,
      },
      hero: {
        id: "hero",
        type: "section",
        props: { customCss: ".hero{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px;}".repeat(12) },
        children: [],
        version: 1,
        parentId: "root",
      },
      image1: {
        id: "image1",
        type: "image",
        props: { src: "/hero.png", alt: "Hero principal" },
        children: [],
        version: 1,
        parentId: "root",
      },
      image2: {
        id: "image2",
        type: "image",
        props: { src: "/gallery.png", alt: "Galeria", width: 1200, height: 900 },
        children: [],
        version: 1,
        parentId: "root",
      },
      ...Object.fromEntries(
        Array.from({ length: 14 }, (_, i) => {
          const id = `free${i + 1}`
          return [id, {
            id,
            type: "genericWrapper",
            props: { positionMode: "free", x: i * 10, y: i * 12, width: 120, height: 60 },
            children: [],
            version: 1,
            parentId: "root",
          }]
        })
      ),
      ...Object.fromEntries(
        Array.from({ length: 7 }, (_, i) => {
          const id = `animated${i + 1}`
          return [id, {
            id,
            type: "heading",
            props: { motionAnimation: "fade-up", text: `Anim ${i + 1}` },
            children: [],
            version: 1,
            parentId: "root",
          }]
        })
      ),
    },
  }
}

test("runPerformanceAudit reports missing image dimensions and dense free layout", () => {
  const issues = runPerformanceAudit(createTree())
  const ids = issues.map((issue) => issue.id)

  assert.ok(ids.includes("perf-many-free-nodes"))
  assert.ok(ids.includes("perf-some-animations"))
  assert.ok(ids.some((id) => id.startsWith("perf-image-size-missing-image1")))
  assert.ok(ids.some((id) => id.startsWith("perf-custom-css-heavy-hero")))
})

test("calcPerformanceScore decreases when performance issues accumulate", () => {
  const score = calcPerformanceScore(runPerformanceAudit(createTree()))
  assert.ok(score < 100)
  assert.ok(score >= 0)
})
