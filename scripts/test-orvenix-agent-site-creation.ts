import assert from "node:assert/strict"
import { runOrvenixAgent } from "../lib/orvenix-ai/agent/orvenix-agent"
import { createDryRunMutationPlan, rollbackMutation } from "../lib/orvenix-ai/mutation"
import { getDefaultStarterEditorTree } from "../lib/editorWebs"

const before = getDefaultStarterEditorTree()
const after = structuredClone(before)
const root = after.nodes[after.rootId]
if (!root) throw new Error("Starter tree without root")

const createdNodeId = "site-creation-agent-test-node"
after.nodes[createdNodeId] = {
  id: createdNodeId,
  type: "section",
  displayName: "Home creada por IA",
  props: { maxWidth: "full", paddingY: "xl", paddingX: "lg" },
  children: [],
  version: 1,
  parentId: after.rootId,
}
root.children = [...(root.children ?? []), createdNodeId]

const plan = createDryRunMutationPlan({
  siteId: "draft:site-creation:test-user",
  before,
  after,
})

const baseInput = {
  siteId: plan.siteId,
  message: "Crea un sitio desde cero para una consultoria financiera",
  business: {
    name: "Norte Capital",
    industry: "consultoria financiera",
    location: "Monterrey",
    objective: "Agendar llamadas de diagnostico",
  },
  siteCreationPlan: plan,
}

const preview = await runOrvenixAgent({
  ...baseInput,
  mode: "preview",
})

assert.equal(preview.ok, true)
assert.equal(preview.action, "preview")
assert.equal(preview.scope, "site_creation")
assert.equal(preview.policy?.limits.requireConfirmation, true)
assert.equal(preview.snapshot?.id, plan.snapshot.id)

let created = 0
const unconfirmed = await runOrvenixAgent(
  {
    ...baseInput,
    mode: "execute",
    confirmed: false,
  },
  {
    createDraftSite: async () => {
      created += 1
      return { siteId: "site_should_not_exist", nextRoute: "/editor/site_should_not_exist", verified: true }
    },
  },
)

assert.equal(unconfirmed.action, "confirmation_required")
assert.equal(created, 0)

const executed = await runOrvenixAgent(
  {
    ...baseInput,
    mode: "execute",
    confirmed: true,
  },
  {
    createDraftSite: async ({ tree }) => {
      created += 1
      assert.deepEqual(tree, plan.after)
      return { siteId: "site_created", nextRoute: "/editor/site_created", verified: true }
    },
  },
)

assert.equal(executed.ok, true)
assert.equal(executed.action, "executed")
assert.equal(executed.scope, "site_creation")
assert.equal(executed.createdSite?.siteId, "site_created")
assert.equal(created, 1)

assert.equal(typeof rollbackMutation, "function")

console.log("site_creation agent ok")
