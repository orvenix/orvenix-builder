import { z } from "zod"

export const CMS_FIELD_TYPES = [
  "text",
  "number",
  "date",
  "toggle",
  "select",
  "relation",
  "media",
  "richtext",
] as const

export const CmsRelationSchema = z.object({
  collectionSlug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/),
  multiple: z.boolean().optional().default(false),
  displayField: z.string().min(1).max(128).optional(),
})

export const CmsFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(CMS_FIELD_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  maxLength: z.number().optional(),
  relation: CmsRelationSchema.optional(),
}).superRefine((field, ctx) => {
  if (field.type === "select" && field.options && field.options.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["options"],
      message: "Los campos select deben tener al menos una opcion",
    })
  }

  if (field.type === "relation" && !field.relation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["relation"],
      message: "Los campos relation necesitan configuracion de relacion",
    })
  }

  if (field.type !== "relation" && field.relation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["relation"],
      message: "Solo los campos relation pueden tener configuracion de relacion",
    })
  }
})

export const CmsFieldsSchema = z.array(CmsFieldSchema)

export type CmsFieldType = (typeof CMS_FIELD_TYPES)[number]
export type CmsFieldDef = z.infer<typeof CmsFieldSchema>
export type CmsRelationDef = z.infer<typeof CmsRelationSchema>

export function parseCmsFields(input: unknown): CmsFieldDef[] {
  const parsed = CmsFieldsSchema.safeParse(input)
  return parsed.success ? parsed.data : []
}

export function getDefaultFieldValue(field: CmsFieldDef): unknown {
  if (field.type === "toggle") return false
  if (field.type === "number") return 0
  if (field.type === "relation" && field.relation?.multiple) return []
  return ""
}

export function normalizeCmsFieldValue(field: CmsFieldDef, value: unknown): unknown {
  if (field.type === "number") {
    if (value === "" || value === null || typeof value === "undefined") return ""
    const next = typeof value === "number" ? value : Number(value)
    return Number.isFinite(next) ? next : ""
  }

  if (field.type === "toggle") {
    if (typeof value === "boolean") return value
    if (typeof value === "string") return value.toLowerCase() === "true"
    return Boolean(value)
  }

  if (field.type === "relation") {
    const multiple = Boolean(field.relation?.multiple)
    if (multiple) {
      if (Array.isArray(value)) {
        return value.map((item) => String(item)).filter(Boolean)
      }
      if (typeof value === "string") {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      }
      return []
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : ""
    }
    if (value === null || typeof value === "undefined") return ""
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.join(", ")
  }

  if (value === null || typeof value === "undefined") return ""
  return value
}

export function normalizeCmsRecordData(fields: CmsFieldDef[], input: unknown): Record<string, unknown> {
  const source = input && typeof input === "object" && !Array.isArray(input)
    ? { ...(input as Record<string, unknown>) }
    : {}

  const bySlug = new Map(fields.map((field) => [field.slug, field]))
  for (const [key, rawValue] of Object.entries(source)) {
    const field = bySlug.get(key)
    if (field) {
      source[key] = normalizeCmsFieldValue(field, rawValue)
    }
  }
  return source
}

export function getRelationIds(field: CmsFieldDef, value: unknown): string[] {
  const normalized = normalizeCmsFieldValue(field, value)
  if (Array.isArray(normalized)) return normalized.map((item) => String(item)).filter(Boolean)
  if (typeof normalized === "string" && normalized) return [normalized]
  return []
}

export function pickRelationDisplayField(fields: CmsFieldDef[], preferred?: string | null): string | null {
  if (preferred && fields.some((field) => field.slug === preferred)) return preferred

  const priorities = ["title", "name", "label", "headline", "slug"]
  for (const slug of priorities) {
    if (fields.some((field) => field.slug === slug)) return slug
  }

  const fallback = fields.find((field) => ["text", "richtext", "select"].includes(field.type))
  return fallback?.slug ?? fields[0]?.slug ?? null
}

export function getRelationRecordLabel(
  fields: CmsFieldDef[],
  record: { id: string; data: Record<string, unknown> },
  preferred?: string | null
): string {
  const displayField = pickRelationDisplayField(fields, preferred)
  if (displayField) {
    const value = record.data[displayField]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }

  return record.id
}
