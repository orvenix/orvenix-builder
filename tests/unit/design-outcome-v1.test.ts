import test from "node:test"
import assert from "node:assert/strict"

import {
  computeDesignOutcomeV1,
  PUBLISHED_LOW_EDIT_MAX_V1,
  PUBLISHED_MEDIUM_EDIT_MAX_V1,
} from "../../lib/orvenix-ai/design-memory/design-outcome"

const createdAt = new Date("2026-09-01T00:00:00.000Z")

function outcome(status: string, now: string, editDistance?: number | null) {
  return computeDesignOutcomeV1({
    status,
    createdAt,
    now: new Date(now),
    editDistance,
  })
}

test("generated reciente queda sin calificar", () => {
  const result = outcome("generated", "2026-09-05T00:00:00.000Z")

  assert.equal(result.outcome, "generated_recent")
  assert.equal(result.outcomeScore, null)
  assert.equal(result.qualifiedAt, null)
})

test("generated intermedio queda no calificado, no stale", () => {
  const result = outcome("generated", "2026-09-12T00:00:00.000Z")

  assert.equal(result.outcome, "generated_unqualified")
  assert.equal(result.outcomeScore, null)
})

test("generated viejo queda stale", () => {
  const result = outcome("generated", "2026-10-01T00:00:00.000Z")

  assert.equal(result.outcome, "generated_stale")
  assert.equal(result.outcomeScore, 0.1)
  assert.ok(result.qualifiedAt instanceof Date)
})

test("accepted y edited producen scores explicables", () => {
  const accepted = outcome("accepted", "2026-09-02T00:00:00.000Z")
  const edited = outcome("edited", "2026-09-02T00:00:00.000Z")

  assert.equal(accepted.outcome, "accepted")
  assert.equal(accepted.outcomeScore, 0.4)
  assert.equal(edited.outcome, "edited")
  assert.equal(edited.outcomeScore, 0.45)
})

test("published sin medicion queda unmeasured y sin qualifiedAt", () => {
  const nullResult = outcome("published", "2026-09-02T00:00:00.000Z", null)
  const undefinedResult = outcome("published", "2026-09-02T00:00:00.000Z")
  const nanResult = outcome("published", "2026-09-02T00:00:00.000Z", Number.NaN)

  for (const result of [nullResult, undefinedResult, nanResult]) {
    assert.equal(result.outcome, "published_unmeasured")
    assert.equal(result.outcomeScore, null)
    assert.equal(result.qualifiedAt, null)
  }
})

test("published clasifica low, medium y high edit con thresholds exactos", () => {
  const zero = outcome("published", "2026-09-02T00:00:00.000Z", 0)
  const low = outcome("published", "2026-09-02T00:00:00.000Z", PUBLISHED_LOW_EDIT_MAX_V1)
  const medium = outcome("published", "2026-09-02T00:00:00.000Z", PUBLISHED_MEDIUM_EDIT_MAX_V1)
  const high = outcome("published", "2026-09-02T00:00:00.000Z", PUBLISHED_MEDIUM_EDIT_MAX_V1 + 0.001)

  assert.equal(zero.outcome, "published_low_edit")
  assert.equal(zero.outcomeScore, 1)
  assert.ok(zero.qualifiedAt instanceof Date)
  assert.equal(low.outcome, "published_low_edit")
  assert.equal(low.outcomeScore, 1)
  assert.equal(medium.outcome, "published_medium_edit")
  assert.equal(medium.outcomeScore, 0.8)
  assert.equal(high.outcome, "published_high_edit")
  assert.equal(high.outcomeScore, 0.6)
})

test("score siempre queda 0..1 o null", () => {
  for (const result of [
    outcome("generated", "2026-09-02T00:00:00.000Z"),
    outcome("generated", "2026-10-02T00:00:00.000Z"),
    outcome("accepted", "2026-09-02T00:00:00.000Z"),
    outcome("edited", "2026-09-02T00:00:00.000Z"),
    outcome("published", "2026-09-02T00:00:00.000Z", 0.9),
  ]) {
    assert.ok(result.outcomeScore === null || (result.outcomeScore >= 0 && result.outcomeScore <= 1))
  }
})
