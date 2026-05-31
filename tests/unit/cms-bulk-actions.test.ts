import test from "node:test"
import assert from "node:assert/strict"
import {
  applyBulkWorkflowStatus,
  removeBulkSelectedRecords,
  summarizeSelectedWorkflow,
  type CmsBulkRecordLike,
} from "../../lib/cms/bulk-actions"

function createRecord(id: string, status: "draft" | "review" | "published"): CmsBulkRecordLike {
  return {
    id,
    data: status === "draft" ? {} : { __orvenix: { workflowStatus: status } },
    publishedAt: status === "published" ? "2026-05-30T10:00:00.000Z" : null,
    workflowStatus: status,
  }
}

test("cms bulk actions summarizes selected workflow states", () => {
  const records = [
    createRecord("r1", "draft"),
    createRecord("r2", "review"),
    createRecord("r3", "published"),
  ]

  assert.deepEqual(summarizeSelectedWorkflow(records, ["r1", "r3"]), {
    total: 2,
    draft: 1,
    review: 0,
    published: 1,
  })
})

test("cms bulk actions applies workflow status to selected records only", () => {
  const records = [
    createRecord("r1", "draft"),
    createRecord("r2", "review"),
  ]

  const next = applyBulkWorkflowStatus(records, ["r2"], "published", "2026-05-30T12:00:00.000Z")

  assert.equal(next[0].workflowStatus, "draft")
  assert.equal(next[1].workflowStatus, "published")
  assert.equal(next[1].publishedAt, "2026-05-30T12:00:00.000Z")
})

test("cms bulk actions removes selected records", () => {
  const records = [
    createRecord("r1", "draft"),
    createRecord("r2", "review"),
    createRecord("r3", "published"),
  ]

  const next = removeBulkSelectedRecords(records, ["r1", "r3"])
  assert.deepEqual(next.map((record) => record.id), ["r2"])
})
