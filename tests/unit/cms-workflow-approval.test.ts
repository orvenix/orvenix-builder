import test from "node:test"
import assert from "node:assert/strict"
import {
  getCmsWorkflowStatus,
  getCmsApprovalHistory,
  withCmsWorkflowStatus,
  withCmsWorkflowStatusApproval,
  getCmsWorkflowPublishedAt,
  stripCmsWorkflowMeta,
  isCmsWorkflowStatus,
} from "../../lib/cms/workflow"

// ─── Existing behaviour (regression guard) ───────────────────────────────────

test("workflow isCmsWorkflowStatus accepts valid statuses", () => {
  assert.ok(isCmsWorkflowStatus("draft"))
  assert.ok(isCmsWorkflowStatus("review"))
  assert.ok(isCmsWorkflowStatus("published"))
  assert.ok(!isCmsWorkflowStatus("deleted"))
  assert.ok(!isCmsWorkflowStatus(null))
})

test("workflow getCmsWorkflowStatus returns published when publishedAt is set", () => {
  const status = getCmsWorkflowStatus({}, "2026-05-01T00:00:00.000Z")
  assert.equal(status, "published")
})

test("workflow getCmsWorkflowStatus returns draft by default", () => {
  assert.equal(getCmsWorkflowStatus({}, null), "draft")
  assert.equal(getCmsWorkflowStatus(null, null), "draft")
})

test("workflow getCmsWorkflowStatus reads review from metadata", () => {
  const data = { __orvenix: { workflowStatus: "review" } }
  assert.equal(getCmsWorkflowStatus(data, null), "review")
})

test("workflow getCmsWorkflowPublishedAt returns Date for published", () => {
  const d = getCmsWorkflowPublishedAt("published")
  assert.ok(d instanceof Date)
})

test("workflow getCmsWorkflowPublishedAt returns null for draft/review", () => {
  assert.equal(getCmsWorkflowPublishedAt("draft"), null)
  assert.equal(getCmsWorkflowPublishedAt("review"), null)
})

test("workflow withCmsWorkflowStatus sets metadata without approval entry", () => {
  const data = withCmsWorkflowStatus({}, "review")
  const meta = (data.__orvenix as { workflowStatus: string; approvals?: unknown[] })
  assert.equal(meta.workflowStatus, "review")
  assert.ok(!meta.approvals || meta.approvals.length === 0)
})

test("workflow stripCmsWorkflowMeta removes __orvenix key", () => {
  const data = withCmsWorkflowStatus({ title: "hello" }, "draft")
  const stripped = stripCmsWorkflowMeta(data)
  assert.ok(!("__orvenix" in stripped))
  assert.equal(stripped.title, "hello")
})

// ─── Approval history ────────────────────────────────────────────────────────

test("workflow getCmsApprovalHistory returns empty array when no history", () => {
  assert.deepEqual(getCmsApprovalHistory({}), [])
  assert.deepEqual(getCmsApprovalHistory(null), [])
  assert.deepEqual(getCmsApprovalHistory({ __orvenix: {} }), [])
})

test("workflow withCmsWorkflowStatusApproval records one entry", () => {
  const user = { id: "u1", name: "Ana", email: "ana@test.com" }
  const data = withCmsWorkflowStatusApproval({}, "review", user, "Ready for review")
  const history = getCmsApprovalHistory(data)

  assert.equal(history.length, 1)
  assert.equal(history[0].status, "review")
  assert.equal(history[0].changedBy?.id, "u1")
  assert.equal(history[0].changedBy?.name, "Ana")
  assert.equal(history[0].comment, "Ready for review")
  assert.ok(typeof history[0].changedAt === "string")
})

test("workflow withCmsWorkflowStatusApproval stacks multiple entries", () => {
  const user1 = { id: "u1", name: "Ana", email: null }
  const user2 = { id: "u2", name: "Bob", email: null }

  let data = withCmsWorkflowStatusApproval({}, "review", user1)
  data = withCmsWorkflowStatusApproval(data, "published", user2, "LGTM")

  const history = getCmsApprovalHistory(data)
  assert.equal(history.length, 2)
  assert.equal(history[0].status, "review")
  assert.equal(history[1].status, "published")
  assert.equal(history[1].comment, "LGTM")
})

test("workflow withCmsWorkflowStatusApproval omits changedBy when user not provided", () => {
  const data = withCmsWorkflowStatusApproval({}, "draft")
  const history = getCmsApprovalHistory(data)
  assert.equal(history.length, 1)
  assert.ok(!history[0].changedBy)
})

test("workflow withCmsWorkflowStatusApproval caps history at 50 entries", () => {
  let data: Record<string, unknown> = {}
  for (let i = 0; i < 60; i++) {
    data = withCmsWorkflowStatusApproval(data, "draft")
  }
  const history = getCmsApprovalHistory(data)
  assert.equal(history.length, 50)
})

test("workflow getCmsWorkflowStatus still works after approval entries", () => {
  const user = { id: "u1", name: "Ana", email: null }
  const data = withCmsWorkflowStatusApproval({}, "review", user)
  assert.equal(getCmsWorkflowStatus(data, null), "review")
})

test("workflow approval preserves existing data fields", () => {
  const original = { title: "My post", content: "Hello world" }
  const data = withCmsWorkflowStatusApproval(original, "review")
  assert.equal(data.title, "My post")
  assert.equal(data.content, "Hello world")
})
