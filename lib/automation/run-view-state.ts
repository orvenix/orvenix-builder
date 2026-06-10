import type { AutomationTriggerType } from "@/lib/automation/config"

export type AutomationRunResultFilter = "all" | "processed" | "skipped" | "failed"

export interface AutomationRunsViewState {
  automationId: string
  result: AutomationRunResultFilter
  trigger: "all" | AutomationTriggerType
}

const AUTOMATION_RUN_RESULT_VALUES = new Set<AutomationRunResultFilter>(["all", "processed", "skipped", "failed"])
const AUTOMATION_RUN_TRIGGER_VALUES = new Set<AutomationTriggerType>([
  "contact_created",
  "store_checkout_started",
  "cms_record_created",
])

export function buildAutomationRunsViewQuery(view: AutomationRunsViewState): string {
  const params = new URLSearchParams()
  const trimmedAutomationId = view.automationId.trim()

  if (trimmedAutomationId) params.set("runAutomationId", trimmedAutomationId)
  if (view.result !== "all") params.set("runResult", view.result)
  if (view.trigger !== "all") params.set("runTrigger", view.trigger)

  return params.toString()
}

export function parseAutomationRunsViewState(
  input: { get(name: string): string | null }
): AutomationRunsViewState {
  const automationId = input.get("runAutomationId")?.trim() || ""
  const rawResult = input.get("runResult")
  const rawTrigger = input.get("runTrigger")

  return {
    automationId,
    result: rawResult && AUTOMATION_RUN_RESULT_VALUES.has(rawResult as AutomationRunResultFilter)
      ? rawResult as AutomationRunResultFilter
      : "all",
    trigger: rawTrigger && AUTOMATION_RUN_TRIGGER_VALUES.has(rawTrigger as AutomationTriggerType)
      ? rawTrigger as AutomationTriggerType
      : "all",
  }
}
