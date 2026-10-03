import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import Module from "node:module"

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

// Dev review tooling only: offline, no provider, no DB.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("review-sites test: network is forbidden")
}) as typeof fetch

import { REVIEW_FRAME_BASE_V1, REVIEW_SITES_V1, isReviewSiteKeyV1, loadReviewSiteV1, type ReviewSiteKeyV1 } from "../../app/dev-motif-review/review-sites"

const hrefs = (value: unknown, out: string[] = []): string[] => {
  if (Array.isArray(value)) value.forEach((entry) => hrefs(entry, out))
  else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "string" && (key === "href" || key.endsWith("Href"))) out.push(entry)
      else hrefs(entry, out)
    }
  }
  return out
}

test("review sites: every fixture builds offline as a multipage site with a home page", async () => {
  for (const key of Object.keys(REVIEW_SITES_V1) as ReviewSiteKeyV1[]) {
    const site = await loadReviewSiteV1(key)
    assert.ok(site.pages.length >= 1, key)
    assert.equal(site.pages.filter((page) => page.isHome).length, 1, key)
    assert.equal(site.summary.pages, site.pages.length, key)
  }
  assert.equal(isReviewSiteKeyV1("a"), true)
  assert.equal(isReviewSiteKeyV1("../etc"), false)
})

test("review sites: internal page links stay inside the dev frame viewer; nothing points to public/customer routes", async () => {
  for (const key of Object.keys(REVIEW_SITES_V1) as ReviewSiteKeyV1[]) {
    const site = await loadReviewSiteV1(key)
    const slugs = new Set(site.pages.map((page) => page.slug))
    for (const page of site.pages) {
      for (const href of hrefs(page.tree.nodes)) {
        assert.equal(href.startsWith("/p/"), false, `${key}: ${href}`)
        assert.equal(href.startsWith("/dev-assisted-generation-e2e/"), false, `${key}: ${href}`)
        if (href.startsWith(REVIEW_FRAME_BASE_V1)) assert.ok(slugs.has(decodeURIComponent(href.split("/").pop()!)), `${key}: ${href}`)
      }
    }
  }
})

test("review routes are dev-only (.dev.tsx) and guard production", () => {
  const dir = path.join(process.cwd(), "app/dev-motif-review")
  const routes = ["page.dev.tsx", "evidence/page.dev.tsx", "site/[fixture]/[slug]/page.dev.tsx", "frame/[fixture]/[slug]/page.dev.tsx", "diagnostics/[fixture]/page.dev.tsx"]
  for (const route of routes) {
    const source = fs.readFileSync(path.join(dir, route), "utf8")
    assert.ok(source.includes('process.env.NODE_ENV === "production") notFound()'), route)
    assert.equal(/runCf4dControlledExperimentV1|createAnthropicFullSiteCreativeProviderV1|editorPrisma/.test(source), false, route)
  }
  const files = fs.readdirSync(dir, { recursive: true }) as string[]
  assert.equal(files.some((file) => /page\.tsx$/.test(file) && !/\.dev\.tsx$/.test(file)), false, "no production page files")
})

test("zz) zero network attempts", () => {
  assert.equal(networkAttempts, 0)
})
