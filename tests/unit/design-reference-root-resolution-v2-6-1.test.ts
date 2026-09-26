import test from "node:test"
import assert from "node:assert/strict"
import { join } from "node:path"

import {
  discoverDesignReferences,
  discoverWebsCandidates,
  resolveDesignReferenceRepoRoot,
} from "../../lib/orvenix-ai/design-reference/extract"
import { getDesignReferences, resetDesignReferenceCacheForTests } from "../../lib/orvenix-ai/design-reference/library"

/**
 * V2-6.1 regression coverage for the confirmed reference-root-resolution
 * bug: __dirname inside a live Next.js runtime resolves under
 * .next/server/... instead of the real repo root, so a naive
 * package.json-only walk-up either fails or lands on the wrong directory,
 * silently producing 0 design references instead of 25.
 */

function withPatchedCwd<T>(fakeCwd: string, fn: () => T): T {
  const original = process.cwd
  process.cwd = () => fakeCwd
  try {
    return fn()
  } finally {
    process.cwd = original
  }
}

test("1) getDesignReferences() resolves exactly 25 real references via the default (no-arg) path", () => {
  resetDesignReferenceCacheForTests()
  const references = getDesignReferences()
  assert.equal(references.length, 25)
})

test("2) resolveDesignReferenceRepoRoot ignores a startDir shaped like a bundled .next runtime path and still resolves via process.cwd()", () => {
  const simulatedNextDirname = join("/tmp", "simulated-next-runtime", ".next", "server", "app", "lib", "orvenix-ai", "design-reference")
  const root = resolveDesignReferenceRepoRoot(simulatedNextDirname)
  const websRootUnderResolvedRoot = join(root, "app", "webs")
  const references = discoverDesignReferences(websRootUnderResolvedRoot)
  assert.equal(references.length, 25)
})

test("3) resolution still succeeds when startDir is bogus as long as process.cwd() is the real repo root", () => {
  const bogusStartDir = join("/tmp", "does-not-exist-anywhere", "a", "b", "c", "d")
  const root = resolveDesignReferenceRepoRoot(bogusStartDir)
  assert.equal(discoverDesignReferences(join(root, "app", "webs")).length, 25)
})

test("4) when neither process.cwd() nor startDir carry a repo-root marker, resolution degrades safely instead of throwing or hanging", () => {
  const fakeCwd = join("/tmp", "no-marker-cwd", "x", "y", "z")
  const fakeStartDir = join("/tmp", "no-marker-startdir", "a", "b", "c")
  const root = withPatchedCwd(fakeCwd, () => resolveDesignReferenceRepoRoot(fakeStartDir))
  assert.equal(typeof root, "string")
  assert.ok(root.length > 0)
})

test("5) an unavailable/nonexistent websRoot degrades to an empty reference list rather than throwing", () => {
  const nonexistentRoot = join("/tmp", "definitely-nonexistent-webs-root-v2-6-1")
  assert.deepEqual(discoverWebsCandidates(nonexistentRoot), [])
  assert.deepEqual(discoverDesignReferences(nonexistentRoot), [])
})

test("6) bounded walk-up never scans an unbounded number of parent directories", () => {
  const deepFakeCwd = "/" + Array.from({ length: 50 }, (_, i) => `level-${i}`).join("/")
  const deepFakeStartDir = "/" + Array.from({ length: 50 }, (_, i) => `other-${i}`).join("/")
  const start = Date.now()
  const root = withPatchedCwd(deepFakeCwd, () => resolveDesignReferenceRepoRoot(deepFakeStartDir))
  assert.ok(Date.now() - start < 1000)
  assert.equal(typeof root, "string")
})
