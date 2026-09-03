import test from "node:test"
import assert from "node:assert/strict"
import { detectMutationScope, evaluateMutationPolicy } from "../../lib/orvenix-ai/policy"
import type { OrvenixAIMutationPlan } from "../../lib/orvenix-ai/mutation/types"
import type { EditorTree } from "../../types/editor"

function createTree(ids: string[]): EditorTree {
  const rootId = ids[0] ?? "root"
  return {
    rootId,
    nodes: Object.fromEntries(
      ids.map((id, index) => [
        id,
        {
          id,
          type: "section",
          displayName: id,
          props: {},
          children: index === 0 ? ids.slice(1) : [],
          version: 1,
          ...(index === 0 ? {} : { parentId: rootId }),
        },
      ]),
    ),
  }
}

test("site_creation is detected and requires confirmation by policy", () => {
  const request = "Crea un sitio desde cero para una clinica dental en Puebla"
  const scope = detectMutationScope(request)

  assert.equal(scope, "site_creation")

  const before = createTree(["before-root"])
  const after = createTree(["after-root", "hero", "services", "contact"])
  const plan: OrvenixAIMutationPlan = {
    siteId: "draft:site-creation:test-user",
    snapshot: {
      id: "ai-snapshot-test",
      siteId: "draft:site-creation:test-user",
      createdAt: new Date(0).toISOString(),
      tree: before,
    },
    before,
    after,
    addedNodes: 4,
    removedNodes: 1,
    changedNodes: 0,
    safe: true,
    safetyScore: 100,
    readyToApply: true,
    warnings: [],
  }

  const policy = evaluateMutationPolicy({
    request,
    scopeOverride: scope,
    plan,
  })

  assert.equal(policy.allowed, true)
  assert.equal(policy.scope, "site_creation")
  assert.equal(policy.limits.requireSnapshot, true)
  assert.equal(policy.limits.requireConfirmation, true)
})
