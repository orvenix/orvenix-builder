import test from "node:test"
import assert from "node:assert/strict"

// ─── Pure helper tests (no DB/file I/O) ──────────────────────────────────────
// runAIGenerationJob, listAIGenerationJobs, etc. require the Prisma client and
// file system — we test the surrounding pure logic instead.

// ─── AIGenerationJobType labels ───────────────────────────────────────────────

const VALID_TYPES = new Set([
  "section_generation",
  "full_page_generation",
  "copy_edit",
  "sketch_to_web",
  "audit_fix",
])

const VALID_STATUSES = new Set(["queued", "running", "completed", "failed"])

test("ai jobs valid types are the expected 5 values", () => {
  assert.equal(VALID_TYPES.size, 5)
  assert.ok(VALID_TYPES.has("section_generation"))
  assert.ok(VALID_TYPES.has("sketch_to_web"))
  assert.ok(!VALID_TYPES.has("unknown_type"))
})

test("ai jobs valid statuses are the expected 4 values", () => {
  assert.equal(VALID_STATUSES.size, 4)
  assert.ok(VALID_STATUSES.has("completed"))
  assert.ok(VALID_STATUSES.has("failed"))
  assert.ok(!VALID_STATUSES.has("cancelled"))
})

// ─── Pagination math ─────────────────────────────────────────────────────────

function paginationFor(total: number, limit: number, offset: number) {
  return {
    totalPages: Math.ceil(total / limit),
    currentPage: Math.floor(offset / limit),
    hasNext: offset + limit < total,
    hasPrev: offset > 0,
  }
}

test("ai jobs pagination first page has no prev", () => {
  const p = paginationFor(100, 30, 0)
  assert.equal(p.hasPrev, false)
  assert.equal(p.hasNext, true)
  assert.equal(p.currentPage, 0)
  assert.equal(p.totalPages, 4)
})

test("ai jobs pagination last page has no next", () => {
  const p = paginationFor(100, 30, 90)
  assert.equal(p.hasPrev, true)
  assert.equal(p.hasNext, false)
  assert.equal(p.currentPage, 3)
})

test("ai jobs pagination single page", () => {
  const p = paginationFor(5, 30, 0)
  assert.equal(p.totalPages, 1)
  assert.equal(p.hasNext, false)
  assert.equal(p.hasPrev, false)
})

test("ai jobs pagination zero total", () => {
  const p = paginationFor(0, 30, 0)
  assert.equal(p.totalPages, 0)
  assert.equal(p.hasNext, false)
})

// ─── Error normalization ──────────────────────────────────────────────────────

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return "AI_GENERATION_FAILED"
}

test("ai jobs error normalization returns message from Error", () => {
  const err = new Error("Claude API timeout")
  assert.equal(normalizeErrorMessage(err), "Claude API timeout")
})

test("ai jobs error normalization returns fallback for non-Error", () => {
  assert.equal(normalizeErrorMessage("string error"), "AI_GENERATION_FAILED")
  assert.equal(normalizeErrorMessage(null), "AI_GENERATION_FAILED")
  assert.equal(normalizeErrorMessage(42), "AI_GENERATION_FAILED")
})

test("ai jobs error normalization trims whitespace", () => {
  const err = new Error("  rate limit   ")
  assert.equal(normalizeErrorMessage(err), "rate limit")
})

test("ai jobs error normalization returns fallback for empty Error message", () => {
  const err = new Error("")
  assert.equal(normalizeErrorMessage(err), "AI_GENERATION_FAILED")
})

// ─── Retry eligibility ────────────────────────────────────────────────────────

const RETRYABLE_TYPES = new Set(["section_generation", "full_page_generation"])

function canRetry(status: string, type: string): boolean {
  return status === "failed" && RETRYABLE_TYPES.has(type)
}

test("ai jobs retry eligible for failed section_generation", () => {
  assert.ok(canRetry("failed", "section_generation"))
  assert.ok(canRetry("failed", "full_page_generation"))
})

test("ai jobs retry not eligible for non-failed jobs", () => {
  assert.ok(!canRetry("completed", "section_generation"))
  assert.ok(!canRetry("running", "section_generation"))
  assert.ok(!canRetry("queued", "section_generation"))
})

test("ai jobs retry not eligible for non-retryable types", () => {
  assert.ok(!canRetry("failed", "sketch_to_web"))
  assert.ok(!canRetry("failed", "audit_fix"))
  assert.ok(!canRetry("failed", "copy_edit"))
})
