"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { resolveRuntimeHref } from "@/lib/builder-core/tree/pageLinks";
import { resolveSiteNavPages } from "@/lib/builder-core/tree/siteNavigation";
import type { BlockComponentProps } from "@/types/editor";

export interface SiteNavProps {
  title?: string;
  showHome?: boolean;
  hiddenSlugs?: string;
  layout?: "row" | "column";
  justify?: "start" | "center" | "end";
  variant?: "pill" | "minimal";
}

const JUSTIFY_CLASS = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

const VARIANT_CLASS = {
  pill: {
    base: "rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/78 transition-colors hover:border-white/20 hover:text-white",
    active: "border-[#00b5f6]/45 bg-[#00b5f6]/18 text-white shadow-[0_10px_24px_-14px_rgba(0,181,246,0.75)]",
  },
  minimal: {
    base: "px-2 py-1 text-sm font-medium text-white/72 transition-colors hover:text-white",
    active: "text-[#67d7ff]",
  },
} as const;

export function SiteNav({
  title = "Navegación",
  showHome = true,
  hiddenSlugs = "",
  layout = "row",
  justify = "start",
  variant = "pill",
}: BlockComponentProps<SiteNavProps>) {
  const availablePages = useEditorStore((state) => state.availablePages);
  const storeActivePageSlug = useEditorStore((state) => state.activePageSlug);
  const websiteId = useEditorStore((state) => state.websiteId);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPageSlug = useMemo(() => {
    if (storeActivePageSlug) {
      return storeActivePageSlug;
    }

    if (pathname?.startsWith("/p/")) {
      const segments = pathname.split("/").filter(Boolean);
      return segments[2] || "home";
    }

    return searchParams?.get("page")?.trim() || "home";
  }, [pathname, searchParams, storeActivePageSlug]);

  const navPages = useMemo(
    () => resolveSiteNavPages(availablePages, { showHome, hiddenSlugs }),
    [availablePages, hiddenSlugs, showHome]
  );

  const hrefMode = pathname?.startsWith("/preview/")
    ? "preview"
    : pathname?.startsWith("/p/")
      ? "published"
      : "preview";
  const isEditorCanvas = pathname?.startsWith("/editor/");

  if (navPages.length === 0) {
    return (
      <nav aria-label={title} className="w-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/55">
        Agrega más páginas para construir la navegación del sitio.
      </nav>
    );
  }

  return (
    <nav aria-label={title} className="w-full">
      <ul
        className={[
          "flex list-none flex-wrap items-center gap-2 p-0 m-0",
          layout === "column" ? "flex-col items-start" : JUSTIFY_CLASS[justify],
        ].join(" ")}
      >
        {navPages.map((page) => {
          const href = resolveRuntimeHref(websiteId, `page:${page.slug}`, hrefMode);
          const isActive = page.slug === currentPageSlug;
          const variantClasses = VARIANT_CLASS[variant];

          return (
            <li key={page.slug}>
              <a
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={isEditorCanvas ? (event) => event.preventDefault() : undefined}
                className={`${variantClasses.base} ${isActive ? variantClasses.active : ""}`}
              >
                {page.name}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

SiteNav.defaults = {
  title: "Navegación",
  showHome: true,
  hiddenSlugs: "",
  layout: "row",
  justify: "start",
  variant: "pill",
} satisfies SiteNavProps;
