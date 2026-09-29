import type { CartItem } from "@/store/useCartStore";
import { isInternalPageLink, parseDynamicProductLink, resolveDynamicProductHref, resolveRuntimeHref } from "@/lib/builder-core/tree/pageLinks";

/**
 * COMMERCE-1: the ONLY way a `store-product-card` produces a CartItem.
 * Requires a real, non-empty productId AND variantId (as bound by the
 * store / generated commerce binding) -- there is no demo/default
 * fallback anymore: an unbound card is presentation-only and cannot add
 * to cart. `priceMxn` here is DISPLAY data for the drawer subtotal only;
 * the checkout route sends just { variantId, quantity } and recomputes
 * every price from the DB (lib/commerce/checkout-pricing.ts).
 */
export type ProductCardBindingPropsV1 = {
  productId?: unknown;
  variantId?: unknown;
  productName?: unknown;
  variantName?: unknown;
  priceMxn?: unknown;
  imageUrl?: unknown;
  stock?: unknown;
  [key: string]: unknown;
};

const ID_PATTERN = /^[A-Za-z0-9_-]{1,191}$/;
const RETIRED_DEMO_IDS = new Set(["demo", "demo-v1"]);

function boundId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (!ID_PATTERN.test(id) || RETIRED_DEMO_IDS.has(id)) return null;
  return id;
}

export function isProductCardBoundV1(props: ProductCardBindingPropsV1): boolean {
  return boundId(props.productId) !== null && boundId(props.variantId) !== null;
}

export function isProductCardOutOfStockV1(stock: unknown): boolean {
  return typeof stock === "number" && stock !== -1 && stock <= 0;
}

/**
 * COMMERCE-5B/6: the runtime href for a card's "view product" affordance, or
 * null (no link). Only the canonical targets the generator emits: creative
 * `page:<slug>` (resolved exactly like every other internal link) or the
 * dynamic `product:<id>` runtime; a site-relative "/path" is also accepted
 * (a host that already resolved it). A pending `product-ref:` (not yet
 * provisioned), external URLs, schemes, anchors and anything malformed
 * render no link.
 */
export function resolveProductCardDetailHrefV1(
  siteId: string | null,
  detailHref: unknown,
  mode: "preview" | "published" | "export",
): string | null {
  if (typeof detailHref !== "string") return null;
  const href = detailHref.trim();
  if (parseDynamicProductLink(href)) return resolveDynamicProductHref(siteId, href, mode);
  if (isInternalPageLink(href)) {
    const resolved = resolveRuntimeHref(siteId, href, mode);
    return resolved === "#" ? null : resolved;
  }
  return /^\/(?!\/)[^\s\\]*$/.test(href) ? href : null;
}

export function buildCartItemFromProductCardV1(props: ProductCardBindingPropsV1): CartItem | null {
  const productId = boundId(props.productId);
  const variantId = boundId(props.variantId);
  if (!productId || !variantId) return null;
  if (isProductCardOutOfStockV1(props.stock)) return null;

  const priceMxn = typeof props.priceMxn === "number" && Number.isInteger(props.priceMxn) && props.priceMxn >= 0 ? props.priceMxn : 0;
  return {
    variantId,
    productId,
    productName: typeof props.productName === "string" && props.productName.trim() ? props.productName : "Producto",
    ...(typeof props.variantName === "string" && props.variantName ? { variantName: props.variantName } : {}),
    priceMxn,
    ...(typeof props.imageUrl === "string" && props.imageUrl ? { imageUrl: props.imageUrl } : {}),
    quantity: 1,
  };
}
