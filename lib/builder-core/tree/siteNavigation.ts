import type { SitePageListItem } from "@/lib/builder-core/tree/sitePages";

export interface SiteNavOptions {
  showHome?: boolean;
  hiddenSlugs?: string | null;
}

export function parseHiddenSlugs(value: string | null | undefined) {
  return new Set(
    String(value ?? "")
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function resolveSiteNavPages(pages: SitePageListItem[], options?: SiteNavOptions) {
  const hiddenSlugs = parseHiddenSlugs(options?.hiddenSlugs);
  const showHome = options?.showHome !== false;

  return pages.filter((page) => {
    if (!showHome && page.slug === "home") {
      return false;
    }
    return !hiddenSlugs.has(page.slug.toLowerCase());
  });
}
