export type VariantMatrixDimension = {
  name: string
  values: string[]
}

export type VariantMatrixRow = {
  sku: string
  name: string
  attributes: Record<string, string>
}

function normalizeValue(value: string): string {
  return value.trim()
}

function asciiSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toUpperCase()
}

export function slugifyVariantSku(value: string): string {
  return asciiSlug(value)
}

export function parseVariantMatrixDimensions(input: string): VariantMatrixDimension[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawName, rawValues = ""] = line.split(":")
      const seen = new Set<string>()
      const values = rawValues
        .split(",")
        .map(normalizeValue)
        .filter(Boolean)
        .filter((value) => {
          const key = value.toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

      return {
        name: rawName.trim(),
        values,
      }
    })
    .filter((dimension) => dimension.name && dimension.values.length > 0)
}

export function generateVariantMatrix(options: {
  dimensions: VariantMatrixDimension[]
  skuPrefix: string
  existingSkus?: string[]
  limit?: number
}): VariantMatrixRow[] {
  const { dimensions, skuPrefix, existingSkus = [], limit = 100 } = options
  const total = dimensions.reduce((acc, dimension) => acc * Math.max(1, dimension.values.length), 1)
  if (total > limit) {
    throw new Error(`Se excede el limite de ${limit} variantes`)
  }

  const existing = new Set(existingSkus.map((sku) => sku.toUpperCase()))
  const rows: VariantMatrixRow[] = []

  function walk(index: number, attributes: Record<string, string>) {
    if (index >= dimensions.length) {
      const values = Object.values(attributes)
      const sku = slugifyVariantSku([skuPrefix, ...values].join(" "))
      if (existing.has(sku)) return
      rows.push({
        sku,
        name: values.join(" / "),
        attributes: { ...attributes },
      })
      return
    }

    const dimension = dimensions[index]
    for (const value of dimension.values) {
      attributes[dimension.name] = value
      walk(index + 1, attributes)
    }
  }

  walk(0, {})
  return rows
}
