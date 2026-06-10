import assert from "node:assert/strict"
import test from "node:test"

import {
  getFunnelOfferApplyLabel,
  getFunnelOfferSkipLabel,
  getFunnelStepActionLabel,
} from "../../lib/commerce/funnel-step-copy"

test("funnel step action label maps advance actions to semantic copy", () => {
  assert.equal(getFunnelStepActionLabel("checkout", "advance"), "Ir al checkout")
  assert.equal(getFunnelStepActionLabel("upsell", "advance"), "Ver oferta upsell")
  assert.equal(getFunnelStepActionLabel("downsell", "advance"), "Ver oferta downsell")
  assert.equal(getFunnelStepActionLabel("thankyou", "advance"), "Ver confirmacion final")
})

test("funnel step action label maps return actions to semantic copy", () => {
  assert.equal(getFunnelStepActionLabel("checkout", "return"), "Volver al checkout")
  assert.equal(getFunnelStepActionLabel("upsell", "return"), "Volver al upsell")
  assert.equal(getFunnelStepActionLabel("downsell", "return"), "Volver al downsell")
  assert.equal(getFunnelStepActionLabel("landing", "return"), "Volver al inicio")
})

test("funnel step action label falls back to generic continue", () => {
  assert.equal(getFunnelStepActionLabel(null, "advance"), "Continuar")
  assert.equal(getFunnelStepActionLabel(undefined, "return"), "Continuar")
})

test("funnel offer labels use semantic upsell/downsell copy", () => {
  assert.equal(getFunnelOfferApplyLabel("upsell"), "Aplicar upsell")
  assert.equal(getFunnelOfferApplyLabel("downsell"), "Aplicar downsell")
  assert.equal(getFunnelOfferSkipLabel("upsell"), "Seguir sin upsell")
  assert.equal(getFunnelOfferSkipLabel("downsell"), "Seguir sin downsell")
})
