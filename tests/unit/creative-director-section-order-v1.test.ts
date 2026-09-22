import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import { resolveCreativeDirectorSectionOrderV1 } from "../../lib/orvenix-ai/creative-director/section-order"

// ---------------------------------------------------------------------------
// V2-4 sections 4/19: bounded section-ORDER authority. Pure function --
// never throws, always returns SOME valid order (the default, when the
// proposed one is invalid).
// ---------------------------------------------------------------------------

const DEFAULT_ORDER = ["navigation", "hero", "trust", "services", "cta", "footer"]

test("M) a valid permutation (same roles, navigation first, footer last) is applied", () => {
  const proposed = ["navigation", "services", "trust", "hero", "cta", "footer"]
  const result = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  assert.deepEqual(result, proposed)
})

test("N) an invented/unregistered role falls back to the default order", () => {
  const proposed = ["navigation", "hero", "testimonials-carousel", "services", "cta", "footer"]
  const result = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  assert.deepEqual(result, DEFAULT_ORDER)
})

test("O) a duplicated role falls back to the default order", () => {
  const proposed = ["navigation", "hero", "hero", "services", "cta", "footer"]
  const result = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  assert.deepEqual(result, DEFAULT_ORDER)
})

test("P) navigation not first falls back to the default order", () => {
  const proposed = ["hero", "navigation", "trust", "services", "cta", "footer"]
  const result = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  assert.deepEqual(result, DEFAULT_ORDER)
})

test("P) footer not last falls back to the default order", () => {
  const proposed = ["navigation", "footer", "hero", "trust", "services", "cta"]
  const result = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  assert.deepEqual(result, DEFAULT_ORDER)
})

test("Q) a proposed order missing a required role (wrong length) falls back to the default order", () => {
  const proposed = ["navigation", "hero", "services", "cta", "footer"] // missing "trust"
  const result = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  assert.deepEqual(result, DEFAULT_ORDER)
})

test("undefined preferredOrder returns the default order unchanged", () => {
  const result = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, undefined)
  assert.deepEqual(result, DEFAULT_ORDER)
})

test("pages without navigation/footer in their recipe don't require them at the edges", () => {
  const order = ["hero", "services", "cta"]
  const proposed = ["services", "hero", "cta"]
  const result = resolveCreativeDirectorSectionOrderV1(order, proposed)
  assert.deepEqual(result, proposed)
})

test("never mutates the input arrays", () => {
  const proposed = ["navigation", "services", "trust", "hero", "cta", "footer"]
  const proposedCopy = [...proposed]
  const defaultCopy = [...DEFAULT_ORDER]
  resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  assert.deepEqual(proposed, proposedCopy)
  assert.deepEqual(DEFAULT_ORDER, defaultCopy)
})

test("deterministic: same input always returns the same result", () => {
  const proposed = ["navigation", "services", "trust", "hero", "cta", "footer"]
  const first = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  const second = resolveCreativeDirectorSectionOrderV1(DEFAULT_ORDER, proposed)
  assert.deepEqual(first, second)
})
