import test from "node:test"
import assert from "node:assert/strict"
import {
  parseExperimentTargeting,
  isEligibleForExperiment,
  extractVisitorContext,
  type VisitorContext,
} from "../../lib/commerce/experiment-targeting"

// ─── parseExperimentTargeting ─────────────────────────────────────────────────

test("targeting parse returns null on bad input", () => {
  assert.equal(parseExperimentTargeting(null), null)
  assert.equal(parseExperimentTargeting("bad"), null)
  assert.equal(parseExperimentTargeting(42), null)
})

test("targeting parse accepts empty rules array", () => {
  const result = parseExperimentTargeting({ rules: [] })
  assert.ok(result !== null)
  assert.equal(result!.rules.length, 0)
  assert.equal(result!.logic, "and")
})

test("targeting parse accepts valid rule", () => {
  const result = parseExperimentTargeting({
    logic: "and",
    rules: [{ type: "device", op: "eq", value: "mobile" }],
  })
  assert.ok(result !== null)
  assert.equal(result!.rules[0].type, "device")
  assert.equal(result!.rules[0].value, "mobile")
})

test("targeting parse rejects invalid type", () => {
  const result = parseExperimentTargeting({
    rules: [{ type: "INVALID", op: "eq", value: "x" }],
  })
  assert.equal(result, null)
})

// ─── isEligibleForExperiment — no rules ──────────────────────────────────────

test("targeting always eligible when targeting is null", () => {
  assert.ok(isEligibleForExperiment(null, {}))
})

test("targeting always eligible when rules array is empty", () => {
  const targeting = parseExperimentTargeting({ rules: [] })!
  assert.ok(isEligibleForExperiment(targeting, {}))
})

// ─── device rules ─────────────────────────────────────────────────────────────

const mobileCtx: VisitorContext = {
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
}
const desktopCtx: VisitorContext = {
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
}

test("targeting device=mobile matches mobile UA", () => {
  const t = parseExperimentTargeting({ rules: [{ type: "device", op: "eq", value: "mobile" }] })!
  assert.ok(isEligibleForExperiment(t, mobileCtx))
  assert.ok(!isEligibleForExperiment(t, desktopCtx))
})

test("targeting device=desktop matches desktop UA", () => {
  const t = parseExperimentTargeting({ rules: [{ type: "device", op: "eq", value: "desktop" }] })!
  assert.ok(isEligibleForExperiment(t, desktopCtx))
  assert.ok(!isEligibleForExperiment(t, mobileCtx))
})

test("targeting device neq excludes mobile for non-mobile rule", () => {
  const t = parseExperimentTargeting({ rules: [{ type: "device", op: "neq", value: "mobile" }] })!
  assert.ok(isEligibleForExperiment(t, desktopCtx))
  assert.ok(!isEligibleForExperiment(t, mobileCtx))
})

// ─── UTM rules ────────────────────────────────────────────────────────────────

test("targeting utm_source eq matches exact value", () => {
  const t = parseExperimentTargeting({ rules: [{ type: "utm_source", op: "eq", value: "google" }] })!
  assert.ok(isEligibleForExperiment(t, { utmSource: "google" }))
  assert.ok(!isEligibleForExperiment(t, { utmSource: "facebook" }))
  assert.ok(!isEligibleForExperiment(t, {}))
})

test("targeting utm_medium contains partial match", () => {
  const t = parseExperimentTargeting({ rules: [{ type: "utm_medium", op: "contains", value: "social" }] })!
  assert.ok(isEligibleForExperiment(t, { utmMedium: "paid_social" }))
  assert.ok(!isEligibleForExperiment(t, { utmMedium: "email" }))
})

// ─── path_prefix rules ────────────────────────────────────────────────────────

test("targeting path_prefix starts match", () => {
  const t = parseExperimentTargeting({ rules: [{ type: "path_prefix", op: "starts", value: "/tienda" }] })!
  assert.ok(isEligibleForExperiment(t, { pathname: "/tienda/zapatos" }))
  assert.ok(!isEligibleForExperiment(t, { pathname: "/blog/post" }))
})

// ─── language rules ───────────────────────────────────────────────────────────

test("targeting language eq matches prefix", () => {
  const t = parseExperimentTargeting({ rules: [{ type: "language", op: "eq", value: "es" }] })!
  assert.ok(isEligibleForExperiment(t, { language: "es" }))
  assert.ok(!isEligibleForExperiment(t, { language: "en" }))
})

// ─── AND / OR logic ───────────────────────────────────────────────────────────

test("targeting AND requires all rules to match", () => {
  const t = parseExperimentTargeting({
    logic: "and",
    rules: [
      { type: "device", op: "eq", value: "mobile" },
      { type: "utm_source", op: "eq", value: "google" },
    ],
  })!
  assert.ok(isEligibleForExperiment(t, { ...mobileCtx, utmSource: "google" }))
  assert.ok(!isEligibleForExperiment(t, { ...mobileCtx, utmSource: "facebook" }))
  assert.ok(!isEligibleForExperiment(t, { ...desktopCtx, utmSource: "google" }))
})

test("targeting OR requires only one rule to match", () => {
  const t = parseExperimentTargeting({
    logic: "or",
    rules: [
      { type: "utm_source", op: "eq", value: "google" },
      { type: "utm_source", op: "eq", value: "bing" },
    ],
  })!
  assert.ok(isEligibleForExperiment(t, { utmSource: "google" }))
  assert.ok(isEligibleForExperiment(t, { utmSource: "bing" }))
  assert.ok(!isEligibleForExperiment(t, { utmSource: "facebook" }))
})

// ─── extractVisitorContext ────────────────────────────────────────────────────

test("targeting extractVisitorContext reads UTM params from URL", () => {
  const req = new Request("https://example.com/p/site?utm_source=google&utm_medium=cpc&utm_campaign=verano", {
    headers: { "user-agent": "Mozilla/5.0 Chrome/120" },
  })
  const ctx = extractVisitorContext(req)
  assert.equal(ctx.utmSource, "google")
  assert.equal(ctx.utmMedium, "cpc")
  assert.equal(ctx.utmCampaign, "verano")
  assert.equal(ctx.pathname, "/p/site")
})

test("targeting extractVisitorContext reads cookies from header", () => {
  const req = new Request("https://example.com/", {
    headers: { cookie: "session=abc123; theme=dark" },
  })
  const ctx = extractVisitorContext(req)
  assert.equal(ctx.cookies?.session, "abc123")
  assert.equal(ctx.cookies?.theme, "dark")
})

test("targeting extractVisitorContext reads accept-language header", () => {
  const req = new Request("https://example.com/", {
    headers: { "accept-language": "es-MX,es;q=0.9,en;q=0.8" },
  })
  const ctx = extractVisitorContext(req)
  assert.equal(ctx.language, "es")
})
