import test from "node:test"
import assert from "node:assert/strict"
import {
  getEmptyCmsWorkflowSummary,
  mergeCmsWorkflowSummaries,
  summarizeCmsWorkflowRecords,
} from "../../lib/cms/collection-summary"

test("cms collection summary counts draft review and published records", () => {
  const summary = summarizeCmsWorkflowRecords([
    { data: {}, publishedAt: null },
    { data: { __orvenix: { workflowStatus: "review" } }, publishedAt: null },
    { data: { __orvenix: { workflowStatus: "draft" } }, publishedAt: "2026-05-30T10:00:00.000Z" },
  ])

  assert.deepEqual(summary, {
    total: 3,
    draft: 1,
    review: 1,
    published: 1,
  })
})

test("cms collection summary merge aggregates multiple collections", () => {
  const merged = mergeCmsWorkflowSummaries([
    { total: 4, draft: 2, review: 1, published: 1 },
    getEmptyCmsWorkflowSummary(),
    { total: 2, draft: 0, review: 1, published: 1 },
  ])

  assert.deepEqual(merged, {
    total: 6,
    draft: 2,
    review: 2,
    published: 2,
  })
})
