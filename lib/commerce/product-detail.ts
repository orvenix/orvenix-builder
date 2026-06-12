type ProductVariant = {
  id: string
  name: string
  priceMxn: number
  comparePriceMxn?: number
  stock: number
}

function parseInteger(value: string | undefined): number | undefined {
  if (!value || !value.trim()) return undefined
  const parsed = Number.parseInt(value.trim(), 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseProductDetailVariants(config: string, fallbackVariant: ProductVariant): ProductVariant[] {
  if (!config.trim()) return [fallbackVariant]

  const variants = config
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, name, price, comparePrice, stock] = line.split("|").map((part) => part.trim())
      const priceMxn = parseInteger(price)
      const stockValue = parseInteger(stock)
      if (!id || !name || typeof priceMxn !== "number" || typeof stockValue !== "number") return null

      const variant: ProductVariant = {
        id,
        name,
        priceMxn,
        stock: stockValue,
      }
      const comparePriceMxn = parseInteger(comparePrice)
      if (typeof comparePriceMxn === "number") variant.comparePriceMxn = comparePriceMxn
      return variant
    })
    .filter((variant): variant is ProductVariant => Boolean(variant))

  return variants.length > 0 ? variants : [fallbackVariant]
}

export function parseProductDetailGallery(primaryImage: string, galleryCsv: string): string[] {
  const seen = new Set<string>()
  const urls = [primaryImage, ...galleryCsv.split(",")]
    .map((value) => value.trim())
    .filter(Boolean)

  const result: string[] = []
  for (const url of urls) {
    if (seen.has(url)) continue
    seen.add(url)
    result.push(url)
  }
  return result
}

export function clampProductQuantity(quantity: number, stock: number): number {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1
  if (stock < 0) return safeQuantity
  return Math.min(safeQuantity, stock)
}
