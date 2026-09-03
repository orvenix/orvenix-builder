import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"
import type { EditorTree } from "../../types/editor"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }

  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

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
          props: { maxWidth: "full" },
          children: index === 0 ? ids.slice(1) : [],
          version: 1,
          ...(index === 0 ? {} : { parentId: rootId }),
        },
      ]),
    ),
  }
}

test("site_creation previews without writing and executes only after confirmation", async () => {
  const { runOrvenixAgent } = await import("../../lib/orvenix-ai/agent/orvenix-agent")

  const before = createTree(["before-root"])
  const after = createTree(["after-root", "hero", "services", "faq", "contact", "footer"])
  const plan = {
    siteId: "draft:site-creation:test-user",
    snapshot: {
      id: "ai-snapshot-test",
      siteId: "draft:site-creation:test-user",
      createdAt: new Date(0).toISOString(),
      tree: before,
    },
    before,
    after,
    addedNodes: 6,
    removedNodes: 1,
    changedNodes: 0,
    safe: true,
    safetyScore: 100,
    readyToApply: true,
    warnings: [],
  }

  const input = {
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

  const preview = await runOrvenixAgent({ ...input, mode: "preview" })

  assert.equal(preview.ok, true)
  assert.equal(preview.action, "preview")
  assert.equal(preview.scope, "site_creation")
  assert.equal(preview.policy?.limits.requireConfirmation, true)
  assert.equal(preview.snapshot?.id, plan.snapshot.id)

  let created = 0
  const unconfirmed = await runOrvenixAgent(
    { ...input, mode: "execute", confirmed: false },
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
    { ...input, mode: "execute", confirmed: true },
    {
      createDraftSite: async ({ tree }: { tree: EditorTree }) => {
        created += 1
        assert.equal(tree.rootId, plan.after.rootId)
        assert.ok(tree.theme)
        assert.ok(tree.globalTheme)
        assert.deepEqual(tree.theme, tree.globalTheme)
        return { siteId: "site_created", nextRoute: "/editor/site_created", verified: true }
      },
    },
  )

  assert.equal(executed.ok, true, JSON.stringify(executed))
  assert.equal(executed.action, "executed")
  assert.equal(executed.scope, "site_creation")
  assert.equal(executed.createdSite?.siteId, "site_created")
  assert.equal(created, 1)
})


test("site_creation normaliza theme ausente desde el starter", async () => {
  const { runOrvenixAgent } = await import("../../lib/orvenix-ai/agent/orvenix-agent")
  const { getDefaultStarterEditorTree } = await import("../../lib/editorWebs")
  const starter = getDefaultStarterEditorTree()
  const after = createTree(["after-root", "hero"])
  const plan = {
    siteId: "draft:site-creation:theme-missing",
    snapshot: { id: "snapshot_theme_missing", siteId: "draft:site-creation:theme-missing", createdAt: new Date(0).toISOString(), tree: createTree(["before-root"]) },
    before: createTree(["before-root"]),
    after,
    addedNodes: 2,
    removedNodes: 0,
    changedNodes: 0,
    safe: true,
    safetyScore: 100,
    readyToApply: true,
    warnings: [],
  }

  const preview = await runOrvenixAgent({
    siteId: plan.siteId,
    message: "Crea un sitio desde cero para una clinica",
    mode: "preview",
    siteCreationPlan: plan,
  })

  assert.equal(preview.scope, "site_creation")
  assert.deepEqual(preview.plan?.after.theme, starter.theme)
  assert.deepEqual(preview.plan?.after.globalTheme, starter.theme)
  assert.notEqual(preview.plan?.after.theme, preview.plan?.after.globalTheme)
})

test("site_creation sincroniza globalTheme cuando solo existe theme", async () => {
  const { runOrvenixAgent } = await import("../../lib/orvenix-ai/agent/orvenix-agent")
  const { getDefaultStarterEditorTree } = await import("../../lib/editorWebs")
  const starterTheme = getDefaultStarterEditorTree().theme!
  const customTheme = { ...starterTheme, colors: { ...starterTheme.colors, primary: "#111111" } }
  const after = { ...createTree(["after-root", "hero"]), theme: customTheme }
  const plan = {
    siteId: "draft:site-creation:theme-only",
    snapshot: { id: "snapshot_theme_only", siteId: "draft:site-creation:theme-only", createdAt: new Date(0).toISOString(), tree: createTree(["before-root"]) },
    before: createTree(["before-root"]),
    after,
    addedNodes: 2,
    removedNodes: 0,
    changedNodes: 0,
    safe: true,
    safetyScore: 100,
    readyToApply: true,
    warnings: [],
  }

  const preview = await runOrvenixAgent({
    siteId: plan.siteId,
    message: "Crea un sitio desde cero para una clinica",
    mode: "preview",
    siteCreationPlan: plan,
  })

  assert.deepEqual(preview.plan?.after.theme, customTheme)
  assert.deepEqual(preview.plan?.after.globalTheme, customTheme)
  assert.notEqual(preview.plan?.after.theme, preview.plan?.after.globalTheme)
})

test("site_creation sincroniza theme cuando solo existe globalTheme", async () => {
  const { runOrvenixAgent } = await import("../../lib/orvenix-ai/agent/orvenix-agent")
  const { getDefaultStarterEditorTree } = await import("../../lib/editorWebs")
  const starterTheme = getDefaultStarterEditorTree().theme!
  const customTheme = { ...starterTheme, colors: { ...starterTheme.colors, primary: "#222222" } }
  const after = { ...createTree(["after-root", "hero"]), globalTheme: customTheme }
  const plan = {
    siteId: "draft:site-creation:global-theme-only",
    snapshot: { id: "snapshot_global_theme_only", siteId: "draft:site-creation:global-theme-only", createdAt: new Date(0).toISOString(), tree: createTree(["before-root"]) },
    before: createTree(["before-root"]),
    after,
    addedNodes: 2,
    removedNodes: 0,
    changedNodes: 0,
    safe: true,
    safetyScore: 100,
    readyToApply: true,
    warnings: [],
  }

  const preview = await runOrvenixAgent({
    siteId: plan.siteId,
    message: "Crea un sitio desde cero para una clinica",
    mode: "preview",
    siteCreationPlan: plan,
  })

  assert.deepEqual(preview.plan?.after.theme, customTheme)
  assert.deepEqual(preview.plan?.after.globalTheme, customTheme)
  assert.notEqual(preview.plan?.after.theme, preview.plan?.after.globalTheme)
})
