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
    return href.trim();
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
    return { isPageLink: false, targetSlug: null, runtimeHref: rawHref };
  }

  const targetSlug = rawHref ? parseInternalPageLink(rawHref) ?? page.slug : page.slug;
  const runtimeHref = resolveRuntimeHref(siteId, rawHref || `${INTERNAL_PAGE_LINK_PREFIX}${page.slug}`, mode);

  return { isPageLink: true, targetSlug, runtimeHref };
}
