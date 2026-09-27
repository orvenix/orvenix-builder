/**
 * ASSISTED-4A: deterministic, fully SYNTHETIC ecommerce stress fixture
 * ("NovaMarket"). Dev/test-only -- consumed exclusively by
 * ./comparison-harness.ts and its unit tests. Not a real business, brand,
 * product line or price list; no testimonials, ratings, rankings, awards
 * or superlative claims; no network images (asset intent is a local
 * description only, never a URL).
 *
 * COMMERCE-1: two modes.
 *   - PRESENTATION (default, what the dev harness route uses):
 *     toSupportedBuilderProductsV1() maps each product to a
 *     CommerceProductFactV1 WITHOUT any store binding (category, variants,
 *     price, compare price, availability) -- static presentation only.
 *   - MOCK EXECUTABLE (unit tests only): buildNovaMarketMockStoreRecordsV1()
 *     returns deterministic, obviously-fake "nm-mock-" Product/ProductVariant
 *     rows for the builder's trusted `commerceStore` input. These ids do NOT
 *     exist in any database; they only prove the generated tree carries the
 *     bound ids through to the existing store blocks.
 * Synthetic product `id`/`assetIntent` are never forwarded as store ids.
 */

export const NOVAMARKET_FIXTURE_NAME_V1 = "NovaMarket"

export const NOVAMARKET_CATEGORIES_V1 = [
  { slug: "tecnologia", name: "Tecnología" },
  { slug: "hogar", name: "Hogar" },
  { slug: "oficina", name: "Oficina" },
  { slug: "accesorios", name: "Accesorios" },
  { slug: "audio", name: "Audio" },
  { slug: "gaming", name: "Gaming" },
] as const

export type NovaMarketCategorySlugV1 = (typeof NOVAMARKET_CATEGORIES_V1)[number]["slug"]

export type NovaMarketAvailabilityV1 = "in_stock" | "low_stock" | "out_of_stock" | "preorder"

export type NovaMarketVariantV1 = {
  sku: string
  label: string
  /** Integer MXN cents, same unit as ProductVariant.priceMxn. */
  priceMxn: number
}

export type NovaMarketProductV1 = {
  id: string
  name: string
  category: NovaMarketCategorySlugV1
  shortDescription: string
  /** Integer MXN cents. */
  priceMxn: number
  /** Integer MXN cents; only present when strictly greater than priceMxn. */
  compareAtPriceMxn?: number
  availability: NovaMarketAvailabilityV1
  variants?: NovaMarketVariantV1[]
  /** Local art-direction description only -- never a URL, never sent to an image provider by the harness. */
  assetIntent: string
}

export const NOVAMARKET_PRODUCTS_V1: readonly NovaMarketProductV1[] = [
  // Tecnología
  { id: "nm-001", name: "Tablet Nova 10", category: "tecnologia", shortDescription: "Tablet de 10 pulgadas para lectura, video y trabajo ligero.", priceMxn: 549900, compareAtPriceMxn: 629900, availability: "in_stock", variants: [{ sku: "NM-001-64", label: "64 GB", priceMxn: 549900 }, { sku: "NM-001-128", label: "128 GB", priceMxn: 649900 }], assetIntent: "tablet sobre escritorio claro, vista frontal" },
  { id: "nm-002", name: "Cargador USB-C 65W", category: "tecnologia", shortDescription: "Cargador compacto de 65W con dos puertos USB-C.", priceMxn: 64900, availability: "in_stock", assetIntent: "cargador compacto sobre fondo neutro" },
  { id: "nm-003", name: "Hub USB-C 7 en 1", category: "tecnologia", shortDescription: "Adaptador con HDMI, lector de tarjetas y puertos USB.", priceMxn: 89900, availability: "low_stock", assetIntent: "adaptador multipuerto junto a laptop" },
  { id: "nm-004", name: "Batería portátil 20 000 mAh", category: "tecnologia", shortDescription: "Batería externa con carga rápida y pantalla de nivel.", priceMxn: 74900, compareAtPriceMxn: 84900, availability: "in_stock", assetIntent: "batería portátil en mochila abierta" },
  // Hogar
  { id: "nm-005", name: "Lámpara de escritorio LED", category: "hogar", shortDescription: "Lámpara regulable con tres temperaturas de color.", priceMxn: 59900, availability: "in_stock", variants: [{ sku: "NM-005-BL", label: "Blanca", priceMxn: 59900 }, { sku: "NM-005-NG", label: "Negra", priceMxn: 59900 }], assetIntent: "lámpara encendida en sala de noche" },
  { id: "nm-006", name: "Enchufe inteligente Wi-Fi", category: "hogar", shortDescription: "Enchufe con programación horaria desde el teléfono.", priceMxn: 29900, availability: "in_stock", assetIntent: "enchufe en pared con planta al fondo" },
  { id: "nm-007", name: "Purificador de aire compacto", category: "hogar", shortDescription: "Purificador para habitaciones pequeñas con filtro reemplazable.", priceMxn: 199900, availability: "preorder", assetIntent: "purificador en recámara luminosa" },
  { id: "nm-008", name: "Set de organizadores de cajón", category: "hogar", shortDescription: "Cinco organizadores modulares para cocina o escritorio.", priceMxn: 34900, availability: "out_of_stock", assetIntent: "cajón ordenado vista cenital" },
  // Oficina
  { id: "nm-009", name: "Silla ergonómica Base", category: "oficina", shortDescription: "Silla con soporte lumbar ajustable y malla transpirable.", priceMxn: 329900, compareAtPriceMxn: 389900, availability: "in_stock", variants: [{ sku: "NM-009-GR", label: "Gris", priceMxn: 329900 }, { sku: "NM-009-NG", label: "Negra", priceMxn: 329900 }], assetIntent: "silla en oficina en casa, luz natural" },
  { id: "nm-010", name: "Soporte para monitor", category: "oficina", shortDescription: "Brazo articulado para monitores de hasta 27 pulgadas.", priceMxn: 99900, availability: "in_stock", assetIntent: "monitor elevado sobre escritorio minimalista" },
  { id: "nm-011", name: "Libreta reutilizable A5", category: "oficina", shortDescription: "Libreta de hojas borrables compatible con escaneo.", priceMxn: 44900, availability: "in_stock", assetIntent: "libreta abierta con bolígrafo" },
  { id: "nm-012", name: "Organizador de cables", category: "oficina", shortDescription: "Canaleta y clips para ordenar cables del escritorio.", priceMxn: 19900, availability: "low_stock", assetIntent: "cables ordenados bajo escritorio" },
  // Accesorios
  { id: "nm-013", name: "Mochila urbana 20 L", category: "accesorios", shortDescription: "Mochila con compartimento acolchado para laptop de 15 pulgadas.", priceMxn: 119900, availability: "in_stock", variants: [{ sku: "NM-013-AZ", label: "Azul", priceMxn: 119900 }, { sku: "NM-013-NG", label: "Negra", priceMxn: 119900 }], assetIntent: "mochila en banca de estación, estilo urbano" },
  { id: "nm-014", name: "Funda para laptop 14\"", category: "accesorios", shortDescription: "Funda delgada con cierre y bolsillo frontal.", priceMxn: 49900, availability: "in_stock", assetIntent: "funda sobre mesa de madera" },
  { id: "nm-015", name: "Soporte plegable para teléfono", category: "accesorios", shortDescription: "Soporte de aluminio con ángulo ajustable.", priceMxn: 24900, compareAtPriceMxn: 29900, availability: "in_stock", assetIntent: "teléfono en soporte junto a taza" },
  { id: "nm-016", name: "Correa de reloj deportiva", category: "accesorios", shortDescription: "Correa de silicón con broche de liberación rápida.", priceMxn: 17900, availability: "out_of_stock", assetIntent: "correa en muñeca durante caminata" },
  // Audio
  { id: "nm-017", name: "Audífonos inalámbricos Aria", category: "audio", shortDescription: "Audífonos de diadema con cancelación de ruido.", priceMxn: 249900, compareAtPriceMxn: 299900, availability: "in_stock", variants: [{ sku: "NM-017-NG", label: "Negro", priceMxn: 249900 }, { sku: "NM-017-AR", label: "Arena", priceMxn: 249900 }], assetIntent: "audífonos sobre escritorio con luz cálida" },
  { id: "nm-018", name: "Bocina portátil Pulse", category: "audio", shortDescription: "Bocina resistente a salpicaduras con 12 horas de uso.", priceMxn: 139900, availability: "in_stock", assetIntent: "bocina en picnic al aire libre" },
  { id: "nm-019", name: "Micrófono USB de estudio", category: "audio", shortDescription: "Micrófono cardioide para videollamadas y podcast.", priceMxn: 159900, availability: "low_stock", assetIntent: "micrófono con brazo en home studio" },
  { id: "nm-020", name: "Audífonos in-ear Lite", category: "audio", shortDescription: "Audífonos compactos con estuche de carga.", priceMxn: 79900, availability: "in_stock", assetIntent: "estuche abierto en mano" },
  // Gaming
  { id: "nm-021", name: "Control inalámbrico Vector", category: "gaming", shortDescription: "Control con conexión Bluetooth y batería recargable.", priceMxn: 119900, availability: "in_stock", variants: [{ sku: "NM-021-NG", label: "Negro", priceMxn: 119900 }, { sku: "NM-021-BL", label: "Blanco", priceMxn: 119900 }], assetIntent: "control sobre sillón con pantalla al fondo" },
  { id: "nm-022", name: "Teclado mecánico compacto", category: "gaming", shortDescription: "Teclado 75% con interruptores intercambiables.", priceMxn: 179900, compareAtPriceMxn: 199900, availability: "in_stock", assetIntent: "teclado con iluminación tenue" },
  { id: "nm-023", name: "Mouse ligero Orbit", category: "gaming", shortDescription: "Mouse de 60 g con sensor óptico ajustable.", priceMxn: 89900, availability: "preorder", assetIntent: "mouse sobre mousepad amplio" },
  { id: "nm-024", name: "Mousepad extendido", category: "gaming", shortDescription: "Superficie de tela de 90 × 40 cm con base antideslizante.", priceMxn: 39900, availability: "in_stock", assetIntent: "mousepad cubriendo escritorio completo" },
]

export const NOVAMARKET_BUSINESS_V1 = {
  name: NOVAMARKET_FIXTURE_NAME_V1,
  industry: "tienda en linea de tecnologia, hogar y oficina",
  description: "FIXTURE SINTETICO: tienda en linea con catalogo amplio de tecnologia, hogar, oficina, accesorios, audio y gaming.",
  location: "Mexico",
  objective: "Vender productos en linea",
} as const

export const NOVAMARKET_REQUEST_V1 = "Crea una tienda en linea para NovaMarket con catalogo de productos por categoria"

const CATEGORY_LABEL_BY_SLUG = new Map<string, string>(NOVAMARKET_CATEGORIES_V1.map((category) => [category.slug, category.name]))

function categoryLabel(slug: NovaMarketCategorySlugV1): string {
  return CATEGORY_LABEL_BY_SLUG.get(slug) ?? slug
}

function presentationVariants(product: NovaMarketProductV1) {
  if (!product.variants?.length) {
    return [{
      label: "Unica",
      priceMxn: product.priceMxn,
      ...(product.compareAtPriceMxn ? { comparePriceMxn: product.compareAtPriceMxn } : {}),
      availability: product.availability,
    }]
  }
  return product.variants.map((variant) => ({
    label: variant.label,
    priceMxn: variant.priceMxn,
    ...(product.compareAtPriceMxn && variant.priceMxn === product.priceMxn ? { comparePriceMxn: product.compareAtPriceMxn } : {}),
    availability: product.availability,
    sku: variant.sku,
  }))
}

/** PRESENTATION commerce facts (CommerceProductFactV1 without storeBinding) -- never executable. */
export function toSupportedBuilderProductsV1(products: readonly NovaMarketProductV1[] = NOVAMARKET_PRODUCTS_V1) {
  return products.map((product) => ({
    name: product.name,
    description: product.shortDescription,
    category: categoryLabel(product.category),
    variants: presentationVariants(product),
  }))
}

/** Fixture facts the pipeline still does not carry -- reported as gaps, never smuggled into copy or ids. */
export const NOVAMARKET_DROPPED_COMMERCE_FIELDS_V1 = [
  "id",
  "assetIntent",
] as const

export const NOVAMARKET_MOCK_SITE_ID_V1 = "nm-mock-site"

const MOCK_STOCK_BY_AVAILABILITY: Record<NovaMarketAvailabilityV1, number> = {
  in_stock: 25,
  low_stock: 3,
  out_of_stock: 0,
  // The store runtime has no preorder concept: a mocked bound preorder product is simply unavailable.
  preorder: 0,
}

/**
 * TEST ONLY: deterministic, obviously-fake store rows shaped like the
 * Prisma Product/ProductVariant records a trusted caller would read.
 * They do NOT exist in any DB and must never be sent to checkout.
 */
export function buildNovaMarketMockStoreRecordsV1(siteId: string = NOVAMARKET_MOCK_SITE_ID_V1) {
  return NOVAMARKET_PRODUCTS_V1.map((product) => ({
    id: `nm-mock-prod-${product.id.slice(3)}`,
    siteId,
    name: product.name,
    description: product.shortDescription,
    status: "active",
    metadata: { category: categoryLabel(product.category) },
    variants: (product.variants?.length ? product.variants : [{ sku: `NM-${product.id.slice(3)}-U`, label: "Unica", priceMxn: product.priceMxn }]).map((variant, index) => ({
      id: `nm-mock-var-${product.id.slice(3)}-${index + 1}`,
      sku: variant.sku,
      name: variant.label,
      priceMxn: variant.priceMxn,
      comparePriceMxn: product.compareAtPriceMxn && variant.priceMxn === product.priceMxn ? product.compareAtPriceMxn : null,
      stock: MOCK_STOCK_BY_AVAILABILITY[product.availability],
    })),
  }))
}
