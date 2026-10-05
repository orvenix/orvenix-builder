// Relative on purpose: export/publication tests load this module without the "@/" alias (same as types/validateTree).
import { safeUrlV1 } from "../../security/html-sanitizer";

export const INTERNAL_PAGE_LINK_PREFIX = "page:";

export function isInternalPageLink(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(INTERNAL_PAGE_LINK_PREFIX);
}

export function parseInternalPageLink(value: unknown) {
  if (!isInternalPageLink(value)) {
    return null;
  }

  const slug = value.slice(INTERNAL_PAGE_LINK_PREFIX.length).trim();
  return slug || "home";
}

export function buildPublishedPageHref(siteId: string, slug: string) {
  return slug === "home" ? `/p/${siteId}` : `/p/${siteId}/${slug}`;
}

export function buildPreviewPageHref(siteId: string, slug: string) {
  return slug === "home" ? `/preview/${siteId}` : `/preview/${siteId}?page=${encodeURIComponent(slug)}`;
}

export function buildExportPageHref(slug: string) {
  return slug === "home" ? "/index.html" : `/${slug}/index.html`;
}

/**
 * COMMERCE-6: the dynamic product-detail runtime target `product:<productId>`
 * (see lib/orvenix-ai/commerce/product-detail-target.ts). Published sites
 * serve it at /p/<siteId>/producto/<productId>; the owner preview at
 * /preview/<siteId>?product=<productId>. There is no static-export form.
 */
export const DYNAMIC_PRODUCT_LINK_PREFIX = "product:";
const DYNAMIC_PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]{1,191}$/;

export function parseDynamicProductLink(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith(DYNAMIC_PRODUCT_LINK_PREFIX)) return null;
  const productId = value.slice(DYNAMIC_PRODUCT_LINK_PREFIX.length);
  return DYNAMIC_PRODUCT_ID_PATTERN.test(productId) ? productId : null;
}

export function isValidDynamicProductId(value: unknown): value is string {
  return typeof value === "string" && DYNAMIC_PRODUCT_ID_PATTERN.test(value);
}

export function buildPublishedProductHref(siteId: string, productId: string) {
  return `/p/${siteId}/producto/${encodeURIComponent(productId)}`;
}

export function buildPreviewProductHref(siteId: string, productId: string) {
  return `/preview/${siteId}?product=${encodeURIComponent(productId)}`;
}

export function resolveDynamicProductHref(
  siteId: string | null,
  href: unknown,
  mode: "preview" | "published" | "export"
): string | null {
  const productId = parseDynamicProductLink(href);
  if (!productId || !siteId || mode === "export") return null;
  return mode === "preview" ? buildPreviewProductHref(siteId, productId) : buildPublishedProductHref(siteId, productId);
}

export function resolveRuntimeHref(
  siteId: string | null,
  href: unknown,
  mode: "preview" | "published" | "export" = "published"
) {
  if (typeof href !== "string" || !href.trim()) {
    return "#";
  }

  const internalSlug = parseInternalPageLink(href);
  if (!internalSlug) {
    // CV1-2 hard constraint: whatever editor mode wrote the link, a runtime href
    // is only http(s)/mailto/tel or relative -- javascript:/data:/vbscript: render as "#".
    return safeUrlV1(href) ?? "#";
  }

  if (mode === "export") {
    return buildExportPageHref(internalSlug);
  }

  if (!siteId) {
    return "#";
  }

  return mode === "preview"
    ? buildPreviewPageHref(siteId, internalSlug)
    : buildPublishedPageHref(siteId, internalSlug);
}

export interface SiteNavDispatchTarget {
  isPageLink: boolean;
  targetSlug: string | null;
  runtimeHref: string;
}

/**
 * Decides whether a SiteNav entry targets a real site page (the canonical
 * `page:<slug>` contract, or a store-resolved page with no href at all) or a
 * plain anchor/external link, and resolves the href a link should render.
 */
export function resolveSiteNavItemTarget(
  page: { slug: string; href?: string | null },
  siteId: string | null,
  mode: "preview" | "published" | "export" = "published"
): SiteNavDispatchTarget {
  const rawHref = typeof page.href === "string" ? page.href.trim() : "";

  if (rawHref && !isInternalPageLink(rawHref)) {
    // Same hard constraint as resolveRuntimeHref: nav items never render an unsafe scheme.
    return { isPageLink: false, targetSlug: null, runtimeHref: safeUrlV1(rawHref) ?? "#" };
  }

  const targetSlug = rawHref ? parseInternalPageLink(rawHref) ?? page.slug : page.slug;
  const runtimeHref = resolveRuntimeHref(siteId, rawHref || `${INTERNAL_PAGE_LINK_PREFIX}${page.slug}`, mode);

  return { isPageLink: true, targetSlug, runtimeHref };
}
