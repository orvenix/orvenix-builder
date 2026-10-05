import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import { safeInternalPath } from "../../lib/security/internal-path"
import {
  DESIGN_INTENT_PARAM,
  parseDesignIntentId,
  parseDesignStartTarget,
  readDesignIntent,
  withDesignIntent,
} from "../../lib/commercial/sales-funnel"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")

/* ------------------------------ no open redirect ------------------------------ */

test("SALES-2: post-login destinations are only paths on this site", () => {
  for (const ok of ["/dashboard", "/templates/hotel/comenzar", "/precios?checkout=pro&interval=month&design=hotel"]) {
    assert.equal(safeInternalPath(ok), ok, ok)
  }
  for (const bad of [
    "//evil.example",
    "//evil.example/templates/hotel/comenzar",
    "/\\evil.example",
    "/..//evil.example",
    "/.//evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "/\tevil",
    "/\n//evil.example",
    "dashboard",
    "",
    null,
    undefined,
    42,
    "/" + "a".repeat(600),
  ]) {
    assert.equal(safeInternalPath(bad), null, JSON.stringify(bad))
  }
})

test("SALES-2: login and register only follow validated callbackUrl / returnTo", () => {
  for (const file of ["app/login/page.impl.tsx", "app/register/page.impl.tsx"]) {
    const source = read(file)
    assert.match(source, /const callbackUrl = safeInternalPath\(params\.get\("callbackUrl"\)\);/, file)
    assert.match(source, /const returnTo = safeInternalPath\(params\.get\("returnTo"\)\);/, file)
    assert.doesNotMatch(source, /callbackUrl\?\.startsWith\("\/"\)|returnTo\?\.startsWith\("\/"\)/, file)
  }
})

/* ------------------------------ design intent ------------------------------ */

test("SALES-2: a design intent is only ever a sellable Orvenix design", () => {
  assert.equal(DESIGN_INTENT_PARAM, "design")
  assert.equal(parseDesignIntentId("hotel")?.href, "/templates/hotel/comenzar")
  for (const bad of ["arquitectura", "HOTEL", "hotel/../admin", "https://evil.example", "", null, { id: "hotel" }]) {
    assert.equal(parseDesignIntentId(bad), null, JSON.stringify(bad))
  }
  assert.equal(readDesignIntent({ design: "clinica" })?.templateId, "clinica")
  assert.equal(readDesignIntent({ callbackUrl: "/templates/hotel/comenzar" })?.templateId, "hotel")
  assert.equal(readDesignIntent({ design: "nope", callbackUrl: "//evil.example" }), null)
  assert.equal(withDesignIntent("/dashboard", "hotel"), "/dashboard?design=hotel")
  assert.equal(withDesignIntent("/precios?checkout=pro", "hotel"), "/precios?checkout=pro&design=hotel")
  assert.equal(withDesignIntent("/dashboard", "evil&x=1"), "/dashboard")
  assert.equal(withDesignIntent("/dashboard", null), "/dashboard")
})

test("SALES-2: the chosen design survives start → login/register → pricing → checkout → dashboard → continue", async () => {
  const designId = "construction"
  const startHref = `/templates/${designId}/comenzar`

  // 1. The start page sends a visitor without a session to login, and one without a plan to pricing.
  const start = read("app/templates/[id]/comenzar/page.tsx")
  assert.match(start, /redirect\(`\/login\?callbackUrl=\$\{encodeURIComponent\(start\.href\)\}`\)/)
  assert.match(start, /redirect\(`\/precios\?upgrade=websites&callbackUrl=\$\{encodeURIComponent\(start\.href\)\}`\)/)

  // 2. Login (and the register link, which keeps the query) return to the start page.
  const loginUrl = new URL(`https://orvenix.test/login?callbackUrl=${encodeURIComponent(startHref)}`)
  assert.equal(safeInternalPath(loginUrl.searchParams.get("callbackUrl")), startHref)
  assert.match(read("app/login/page.impl.tsx"), /const registerHref = currentSearch \? `\/register\$\{currentSearch\}` : "\/register";/)

  // 3. Pricing recognises the design from the start page callback.
  const pricingUrl = new URL(`https://orvenix.test/precios?upgrade=websites&callbackUrl=${encodeURIComponent(startHref)}`)
  const atPricing = readDesignIntent({ design: pricingUrl.searchParams.get("design"), callbackUrl: pricingUrl.searchParams.get("callbackUrl") })
  assert.equal(atPricing?.templateId, designId)
  const precios = read("app/precios/page.tsx")
  assert.match(precios, /readDesignIntent\(\{ design: firstSearchValue\(rawSearchParams\?\.design\), callbackUrl: firstSearchValue\(rawSearchParams\?\.callbackUrl\) \}\)/)
  assert.match(precios, /designId=\{designTarget\?\.templateId \?\? null\}/)

  // 4. Without a session, the plan button registers first and comes back to checkout WITH the design.
  const checkoutReturn = withDesignIntent("/precios?checkout=starter&interval=month", atPricing!.templateId)
  const registerUrl = new URL(`https://orvenix.test/register?plan=starter&interval=month&callbackUrl=${encodeURIComponent(checkoutReturn)}`)
  const afterRegister = safeInternalPath(registerUrl.searchParams.get("callbackUrl"))!
  const backAtPricing = new URL(`https://orvenix.test${afterRegister}`)
  assert.equal(backAtPricing.searchParams.get("checkout"), "starter")
  assert.equal(readDesignIntent({ design: backAtPricing.searchParams.get("design") })?.templateId, designId)
  for (const file of ["components/marketing/home/PricingCheckoutButton.tsx", "components/marketing/home/PricingSection.tsx"]) {
    const source = read(file)
    assert.match(source, /withDesignIntent\(/, file)
    assert.match(source, /designId \}\)/, `${file} sends designId to /api/billing/subscribe`)
  }

  // 5. Checkout: only a validated id reaches Stripe's success URL.
  const subscribe = read("app/api/billing/subscribe/route.ts")
  assert.match(subscribe, /const designId = parseDesignIntentId\(body\.designId\)\?\.templateId \?\? null/)
  assert.match(subscribe, /createStripeCheckoutSession: \(checkout\) => createStripeCheckoutSession\(\{ \.\.\.checkout, designId \}\)/)

  const successUrl = await captureStripeSuccessUrl(designId)
  const returned = new URL(successUrl.replace("{CHECKOUT_SESSION_ID}", "cs_test"))
  assert.equal(returned.pathname, "/dashboard")
  assert.equal(returned.searchParams.get("sub"), "ok")

  // 6. The dashboard resumes it server-side; "Continuar" goes back to the start page.
  const resumed = parseDesignIntentId(returned.searchParams.get("design"))
  assert.equal(resumed?.href, startHref)
  assert.deepEqual(parseDesignStartTarget(resumed?.href), resumed)
  const dashboard = read("app/dashboard/page.impl.tsx")
  assert.match(dashboard, /const returnedDesign = parseDesignIntentId\(firstParam\(resolvedSearchParams\?\.design\)\);/)
  assert.match(dashboard, /<PendingDesignBanner returnedDesign=\{returnedDesign\} \/>/)
  const banner = read("app/dashboard/PendingDesignBanner.tsx")
  assert.match(banner, /const design = returnedDesign \?\? parsePendingDesign\(raw\)/)
  assert.match(banner, /<Link href=\{design\.href\}/)
})

test("SALES-2: Stripe's success URL carries the design only when it is a plain id", async () => {
  assert.doesNotMatch(await captureStripeSuccessUrl(null), /design=/)
  assert.doesNotMatch(await captureStripeSuccessUrl("evil&next=https://evil.example"), /design=|evil/)
})

async function captureStripeSuccessUrl(designId: string | null): Promise<string> {
  const stripe = await import("../../lib/stripe")
  const originalFetch = globalThis.fetch
  const originalKey = process.env.STRIPE_SECRET_KEY
  let successUrl = ""
  process.env.STRIPE_SECRET_KEY = "unit-test-placeholder"
  globalThis.fetch = (async (_input: unknown, init?: { body?: unknown }) => {
    successUrl = new URLSearchParams(String(init?.body)).get("success_url") ?? ""
    return new Response(JSON.stringify({ id: "cs_test", url: "https://checkout.example/cs_test" }), { status: 200 })
  }) as typeof fetch
  try {
    await stripe.createStripeCheckoutSession({ userId: "u1", userEmail: "u1@example.test", planId: "starter", interval: "month", priceId: "price_unit", designId })
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY
    else process.env.STRIPE_SECRET_KEY = originalKey
  }
  return successUrl
}
