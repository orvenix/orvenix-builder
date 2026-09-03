import assert from "node:assert/strict"
import { detectMutationScope, evaluateMutationPolicy } from "../lib/orvenix-ai/policy"
import { createDryRunMutationPlan } from "../lib/orvenix-ai/mutation"
import { getDefaultStarterEditorTree } from "../lib/editorWebs"

const before = getDefaultStarterEditorTree()
const after = structuredClone(before)
const root = after.nodes[after.rootId]
if (!root) throw new Error("Starter tree without root")

const createdNodeId = "site-creation-test-node"
after.nodes[createdNodeId] = {
  id: createdNodeId,
  type: "section",
  displayName: "Seccion creada",
  props: { maxWidth: "full", paddingY: "lg", paddingX: "lg" },
  children: [],
  version: 1,
  parentId: after.rootId,
}
root.children = [...(root.children ?? []), createdNodeId]

const request = "Crea un sitio desde cero para una clinica dental en Puebla"
const scope = detectMutationScope(request)
assert.equal(scope, "site_creation")

const plan = createDryRunMutationPlan({
  siteId: "draft:site-creation:test-user",
  before,
  after,
})

const policy = evaluateMutationPolicy({
  request,
  scopeOverride: scope,
  plan,
})

assert.equal(policy.allowed, true)
assert.equal(policy.scope, "site_creation")
assert.equal(policy.limits.requireSnapshot, true)
assert.equal(policy.limits.requireConfirmation, true)
assert.ok(plan.snapshot)
assert.equal(plan.readyToApply, true)

console.log("site_creation policy ok")
