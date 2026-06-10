import test from "node:test"
import assert from "node:assert/strict"
import { calculateSignificance } from "../../lib/commerce/experiment-significance"

// ─── calculateSignificance ────────────────────────────────────────────────────

test("experiment significance returns no winner when both groups are empty", () => {
  const sig = calculateSignificance(0, 0, 0, 0)
  assert.equal(sig.significant, false)
  assert.equal(sig.winner, "none")
  assert.equal(sig.pValue, 1)
  assert.equal(sig.confidenceLevel, 0)
})

test("experiment significance returns no winner with tiny samples", () => {
  // 1 success out of 2 vs 0 out of 2 — not significant
  const sig = calculateSignificance(1, 2, 0, 2)
  assert.equal(sig.significant, false)
  assert.equal(sig.winner, "none")
})

test("experiment significance detects B winner with strong signal", () => {
  // A: 5/100 (5%), B: 20/100 (20%) — should be significant
  const sig = calculateSignificance(5, 100, 20, 100)
  assert.ok(sig.significant, "Should be significant")
  assert.equal(sig.winner, "B")
  assert.ok(sig.pValue < 0.05, `pValue should be < 0.05, got ${sig.pValue}`)
  assert.ok(sig.confidenceLevel >= 95, `confidence should be >= 95, got ${sig.confidenceLevel}`)
})

test("experiment significance detects A winner with strong signal", () => {
  // A: 30/100 (30%), B: 5/100 (5%)
  const sig = calculateSignificance(30, 100, 5, 100)
  assert.ok(sig.significant)
  assert.equal(sig.winner, "A")
})

test("experiment significance with equal rates is not significant", () => {
  // A: 10/100, B: 10/100 — identical rates
  const sig = calculateSignificance(10, 100, 10, 100)
  assert.equal(sig.significant, false)
  assert.equal(sig.winner, "none")
})

test("experiment significance with large samples and small difference", () => {
  // A: 100/1000 (10%), B: 115/1000 (11.5%) — borderline
  const sig = calculateSignificance(100, 1000, 115, 1000)
  // Just check it returns a valid structure
  assert.ok(typeof sig.pValue === "number")
  assert.ok(sig.pValue >= 0 && sig.pValue <= 1)
  assert.ok(typeof sig.chiSquared === "number")
})

test("experiment significance handles zero conversions in both variants", () => {
  const sig = calculateSignificance(0, 200, 0, 200)
  assert.equal(sig.significant, false)
  assert.equal(sig.winner, "none")
})

test("experiment significance chiSquared is non-negative", () => {
  const sig = calculateSignificance(15, 200, 25, 200)
  assert.ok(sig.chiSquared >= 0)
})
