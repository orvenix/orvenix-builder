import { z } from "zod"

import type { CmsFieldDef } from "./schema"

const CMS_FILTER_OPS = [
  "eq",
  "neq",
  "contains",
  "starts",
  "ends",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "empty",
  "notempty",
] as const

const CmsFilterRuleSchema = z.object({
  field: z.string().min(1),
  op: z.enum(CMS_FILTER_OPS),
  value: z.unknown().optional(),
  value2: z.unknown().optional(),
})

const CmsFilterGroupSchema = z.object({
  logic: z.enum(["and", "or"]).default("and"),
  rules: z.array(CmsFilterRuleSchema).min(1),
})

export type CmsFilterOp = (typeof CMS_FILTER_OPS)[number]
export type CmsFilterRule = z.infer<typeof CmsFilterRuleSchema>
export type CmsFilterGroup = z.infer<typeof CmsFilterGroupSchema>

type CmsRecordLike = {
  id: string
  data: Record<string, unknown>
}

const TEXT_OPS: CmsFilterOp[] = ["eq", "neq", "contains", "starts", "ends", "empty", "notempty"]
const NUMBER_OPS: CmsFilterOp[] = ["eq", "neq", "gt", "gte", "lt", "lte", "between", "empty", "notempty"]

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value.trim().toLowerCase()
  if (typeof value === "number" || typeof value === "boolean") return String(value).toLowerCase()
  return ""
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || typeof value === "undefined") return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

function matchesRule(value: unknown, rule: CmsFilterRule): boolean {
  if (rule.op === "empty") return isEmptyValue(value)
  if (rule.op === "notempty") return !isEmptyValue(value)

  if (["gt", "gte", "lt", "lte", "between"].includes(rule.op)) {
    const left = normalizeNumber(value)
    const right = normalizeNumber(rule.value)
    const right2 = normalizeNumber(rule.value2)
    if (left === null || right === null) return false
    if (rule.op === "gt") return left > right
    if (rule.op === "gte") return left >= right
    if (rule.op === "lt") return left < right
    if (rule.op === "lte") return left <= right
    return right2 !== null && left >= Math.min(right, right2) && left <= Math.max(right, right2)
  }

  const haystack = normalizeText(value)
  const needle = normalizeText(rule.value)
  if (rule.op === "eq") return haystack === needle
  if (rule.op === "neq") return haystack !== needle
  if (rule.op === "contains") return haystack.includes(needle)
  if (rule.op === "starts") return haystack.startsWith(needle)
  if (rule.op === "ends") return haystack.endsWith(needle)
  return false
}

export function parseCmsFilterGroup(input: unknown): CmsFilterGroup | null {
  if (!input) return null

  const source = typeof input === "string"
    ? (() => {
        try {
          return JSON.parse(input)
        } catch {
          return null
        }
      })()
    : input

  if (!source) return null
  const parsed = CmsFilterGroupSchema.safeParse(source)
  return parsed.success ? parsed.data : null
}

export function applyCmsFilterGroup<T extends CmsRecordLike>(records: T[], group: CmsFilterGroup | null): T[] {
  if (!group || group.rules.length === 0) return records

  return records.filter((record) => {
    const data = record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? record.data
      : {}
    const results = group.rules.map((rule) => matchesRule(data[rule.field], rule))
    return group.logic === "or" ? results.some(Boolean) : results.every(Boolean)
  })
}

export function opsForField(field: CmsFieldDef): CmsFilterOp[] {
  return field.type === "number" ? NUMBER_OPS : TEXT_OPS
}
