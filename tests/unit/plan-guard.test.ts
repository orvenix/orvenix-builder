import test from "node:test"
import assert from "node:assert/strict"
import { getFeatureLimitMessage, getWebsiteLimitMessage, type PlanSnapshot } from "../../lib/plan-guard-messages"

test("getWebsiteLimitMessage returns upgrade message when there is no active plan", () => {
  const message = getWebsiteLimitMessage({ isActive: false, plan: null })
  assert.equal(message, "Necesitas un plan activo para crear sitios. Actualiza tu plan en /precios.")
})

test("getWebsiteLimitMessage uses singular when limit is one", () => {
  const access: Pick<PlanSnapshot, "isActive" | "plan"> = {
    isActive: true,
    plan: {
      id: "starter",
      name: "Starter",
      maxWebsites: 1,
      maxVisits: 1000,
      hasEcommerce: false,
      hasAI: false,
      hasExport: false,
    },
  }

  const message = getWebsiteLimitMessage(access)
  assert.equal(message, "Has alcanzado el límite de 1 sitio de tu plan. Actualiza tu plan en /precios.")
})

test("getWebsiteLimitMessage uses plural when limit is greater than one", () => {
  const access: Pick<PlanSnapshot, "isActive" | "plan"> = {
    isActive: true,
    plan: {
      id: "pro",
      name: "Pro",
      maxWebsites: 3,
      maxVisits: 5000,
      hasEcommerce: true,
      hasAI: true,
      hasExport: true,
    },
  }

  const message = getWebsiteLimitMessage(access)
  assert.equal(message, "Has alcanzado el límite de 3 sitios de tu plan. Actualiza tu plan en /precios.")
})

test("getFeatureLimitMessage returns the correct copy for each gated feature", () => {
  assert.match(getFeatureLimitMessage("ecommerce"), /e-commerce requiere un plan con tienda incluida/i)
  assert.match(getFeatureLimitMessage("export"), /exportacion requiere un plan Pro o superior/i)
  assert.match(getFeatureLimitMessage("ai"), /Orvenix AI requiere un plan con IA incluida/i)
})
