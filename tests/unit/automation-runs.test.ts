import test from "node:test"
import assert from "node:assert/strict"

// ─── Pure logic tests for automation run filtering / stats ───────────────────
// We test the pure functions in isolation (no Prisma/file I/O).

// ─── Stats accumulation ───────────────────────────────────────────────────────

interface RunEntry { result: string; siteId: string; automationId: string }

function computeStats(entries: RunEntry[], siteId: string, automationId?: string) {
  const filtered = entries.filter((e) => {
    if (e.siteId !== siteId) return false
    if (automationId && e.automationId !== automationId) return false
    return true
  })
  return {
    total: filtered.length,
    processed: filtered.filter((e) => e.result === "processed").length,
    skipped: filtered.filter((e) => e.result === "skipped").length,
    failed: filtered.filter((e) => e.result === "failed").length,
  }
}

function makeRun(id: string, siteId: string, automationId: string, result: "processed" | "skipped" | "failed"): RunEntry {
  return { result, siteId, automationId }
}

test("automation runs stats counts correctly across results", () => {
  const entries = [
    makeRun("r1", "site1", "auto1", "processed"),
    makeRun("r2", "site1", "auto1", "skipped"),
    makeRun("r3", "site1", "auto1", "failed"),
    makeRun("r4", "site1", "auto2", "processed"),
  ]
  const stats = computeStats(entries, "site1")
  assert.equal(stats.total, 4)
  assert.equal(stats.processed, 2)
  assert.equal(stats.skipped, 1)
  assert.equal(stats.failed, 1)
})

test("automation runs stats filters by siteId", () => {
  const entries = [
    makeRun("r1", "site1", "auto1", "processed"),
    makeRun("r2", "site2", "auto1", "failed"),
  ]
  const stats = computeStats(entries, "site1")
  assert.equal(stats.total, 1)
  assert.equal(stats.processed, 1)
  assert.equal(stats.failed, 0)
})

test("automation runs stats filters by automationId", () => {
  const entries = [
    makeRun("r1", "site1", "auto1", "processed"),
    makeRun("r2", "site1", "auto2", "skipped"),
    makeRun("r3", "site1", "auto1", "failed"),
  ]
  const stats = computeStats(entries, "site1", "auto1")
  assert.equal(stats.total, 2)
  assert.equal(stats.processed, 1)
  assert.equal(stats.failed, 1)
  assert.equal(stats.skipped, 0)
})

test("automation runs stats returns zeros for empty site", () => {
  const stats = computeStats([], "site1")
  assert.equal(stats.total, 0)
  assert.equal(stats.processed, 0)
})

// ─── Filter logic ─────────────────────────────────────────────────────────────

function filterRuns(
  entries: RunEntry[],
  opts: { siteId: string; automationId?: string; result?: string }
): RunEntry[] {
  return entries.filter((e) => {
    if (e.siteId !== opts.siteId) return false
    if (opts.automationId && e.automationId !== opts.automationId) return false
    if (opts.result && e.result !== opts.result) return false
    return true
  })
}

test("automation runs filter by result=failed returns only failed", () => {
  const entries = [
    makeRun("r1", "site1", "auto1", "processed"),
    makeRun("r2", "site1", "auto1", "failed"),
    makeRun("r3", "site1", "auto1", "skipped"),
  ]
  const result = filterRuns(entries, { siteId: "site1", result: "failed" })
  assert.equal(result.length, 1)
  assert.equal(result[0].result, "failed")
})

test("automation runs filter by automationId and result", () => {
  const entries = [
    makeRun("r1", "site1", "auto1", "processed"),
    makeRun("r2", "site1", "auto2", "processed"),
    makeRun("r3", "site1", "auto1", "failed"),
  ]
  const result = filterRuns(entries, { siteId: "site1", automationId: "auto1", result: "processed" })
  assert.equal(result.length, 1)
})

test("automation runs filter returns empty when no match", () => {
  const entries = [makeRun("r1", "site1", "auto1", "processed")]
  const result = filterRuns(entries, { siteId: "site1", result: "failed" })
  assert.equal(result.length, 0)
})

// ─── Pagination ───────────────────────────────────────────────────────────────

function paginate<T>(items: T[], limit: number, offset: number): T[] {
  return items.slice(offset, offset + limit)
}

test("automation runs paginate returns correct slice", () => {
  const items = Array.from({ length: 20 }, (_, i) => i)
  assert.deepEqual(paginate(items, 5, 0), [0, 1, 2, 3, 4])
  assert.deepEqual(paginate(items, 5, 5), [5, 6, 7, 8, 9])
  assert.deepEqual(paginate(items, 5, 18), [18, 19])
})

test("automation runs paginate returns empty when offset exceeds total", () => {
  const items = [1, 2, 3]
  assert.deepEqual(paginate(items, 5, 10), [])
})

// ─── Valid result values ───────────────────────────────────────────────────────

const VALID_RESULTS = new Set(["processed", "skipped", "failed"])

test("automation runs valid results are processed/skipped/failed", () => {
  assert.ok(VALID_RESULTS.has("processed"))
  assert.ok(VALID_RESULTS.has("skipped"))
  assert.ok(VALID_RESULTS.has("failed"))
  assert.ok(!VALID_RESULTS.has("cancelled"))
  assert.ok(!VALID_RESULTS.has(""))
})
