import test from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import fs from "node:fs"
// Static import only so tsc emits .tmp/unit/next.config.js; the tests below re-require it per NODE_ENV.
import nextConfigAtLoad from "../../next.config"

// ASSISTED-4A finalization: dev-only `*.dev.ts[x]` route files must never be
// routable in a production build (next build runs with NODE_ENV=production).

void nextConfigAtLoad

const CONFIG_COMPILED = path.join(process.cwd(), ".tmp/unit/next.config.js")

function loadPageExtensions(nodeEnv: string): string[] {
  const env = process.env as Record<string, string | undefined>
  const original = env.NODE_ENV
  env.NODE_ENV = nodeEnv
  try {
    delete require.cache[CONFIG_COMPILED]
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(CONFIG_COMPILED) as { default: { pageExtensions?: string[] } }
    return mod.default.pageExtensions ?? []
  } finally {
    if (original === undefined) delete env.NODE_ENV
    else env.NODE_ENV = original
    delete require.cache[CONFIG_COMPILED]
  }
}

test("production pageExtensions are exactly the previous list (no dev.* extensions)", () => {
  assert.deepEqual(loadPageExtensions("production"), ["tsx", "ts", "jsx", "js"])
})

test("non-production pageExtensions add only dev.tsx/dev.ts", () => {
  for (const nodeEnv of ["development", "test"]) {
    assert.deepEqual(loadPageExtensions(nodeEnv), ["tsx", "ts", "jsx", "js", "dev.tsx", "dev.ts"])
  }
})

test("the assisted-generation harness has NO plain route/page file (only dev-extension ones)", () => {
  const root = path.join(process.cwd(), "app/dev-assisted-generation-e2e")
  if (!fs.existsSync(root)) return
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else files.push(entry.name)
    }
  }
  walk(root)
  const special = /^(page|route|layout|template|loading|error|not-found|default)\.(tsx|ts|jsx|js)$/
  assert.deepEqual(files.filter((name) => special.test(name)), [])
})
