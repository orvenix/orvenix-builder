"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEditorStore } from "@/store/useEditorStore";
import { resolveRuntimeHref } from "@/lib/builder-core/tree/pageLinks";
import { resolveSiteNavPages } from "@/lib/builder-core/tree/siteNavigation";
import type { BlockComponentProps } from "@/types/editor";

export interface SiteNavProps {
  title?: string;
  subtitle?: string;
  labelOverrides?: string;
  showHome?: boolean;
  hiddenSlugs?: string;
  showCta?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  layout?: "row" | "column";
  justify?: "start" | "center" | "end";
  variant?: "pill" | "minimal";
  surface?: "dark" | "light";
}

const JUSTIFY_CLASS = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

const VARIANT_CLASS = {
  dark: {
    pill: {
      base: "rounded-full border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-white/84 transition-colors hover:border-white/25 hover:bg-white/[0.1] hover:text-white md:text-[15px]",
      active: "border-[#fbbf24]/55 bg-[#fbbf24]/18 text-white shadow-[0_10px_24px_-14px_rgba(251,191,36,0.75)]",
    },
    minimal: {
      base: "px-3 py-2 text-sm font-bold text-white/78 transition-colors hover:text-white md:text-[15px]",
      active: "text-[#fbbf24]",
    },
  },
  light: {
    pill: {
      base: "rounded-full border border-neutral-900/10 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 shadow-sm transition-colors hover:border-[#4f6f68]/35 hover:bg-[#f0f2ee] md:text-[15px]",
      active: "border-[#4f6f68]/40 bg-[#4f6f68] text-white shadow-[0_10px_24px_-16px_rgba(79,111,104,0.75)]",
    },
    minimal: {
      base: "px-3 py-2 text-sm font-bold text-neutral-700 transition-colors hover:text-[#385953] md:text-[15px]",
      active: "text-[#385953]",
    },
  },
} as const;

export function SiteNav({
  title = "Navegación",
  subtitle = "Sitio profesional",
  labelOverrides = "",
  showHome = true,
  hiddenSlugs = "",
  showCta = true,
  ctaLabel = "Contactar",
  ctaHref = "#contacto",
  layout = "row",
  justify = "start",
  variant = "pill",
  surface = "dark",
}: BlockComponentProps<SiteNavProps>) {
  const availablePages = useEditorStore((state) => state.availablePages);
  const storeActivePageSlug = useEditorStore((state) => state.activePageSlug);
  const websiteId = useEditorStore((state) => state.websiteId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setActivePageContext = useEditorStore((state) => state.setActivePageContext);

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

  const labelMap = useMemo(() => parseLabelOverrides(labelOverrides), [labelOverrides]);
  const navPages = useMemo(
    () => resolveSiteNavPages(availablePages, { showHome, hiddenSlugs }),
    [availablePages, hiddenSlugs, showHome]
  );

  const hrefMode = pathname?.startsWith("/preview/")
    ? "preview"
    : pathname?.startsWith("/p/")
      ? "published"
      : "preview";
  const isEditorCanvas = pathname?.startsWith("/editor/") || pathname?.startsWith("/constructor");

  const navigateInsideEditor = (slug: string, name: string) => {
    if (!pathname) return;

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (slug === "home") {
      params.delete("page");
    } else {
      params.set("page", slug);
    }

    setActivePageContext({
      activePageSlug: slug,
      activePageName: name,
      availablePages,
    });

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  if (navPages.length === 0) {
    return (
      <nav aria-label={title} className="w-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/55">
        Agrega más páginas para construir la navegación del sitio.
      </nav>
    );
  }

  const shellStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    width: "100%",
    minHeight: "72px",
    padding: "0.85rem 1.25rem",
    borderRadius: "18px",
    border: surface === "dark" ? "1px solid rgba(148, 163, 184, 0.22)" : "1px solid rgba(35, 37, 34, 0.12)",
    background: surface === "dark" ? "rgba(31, 41, 55, 0.96)" : "rgba(247, 247, 244, 0.96)",
    boxShadow: surface === "dark" ? "0 18px 50px rgba(0, 0, 0, 0.18)" : "0 16px 40px rgba(35, 37, 34, 0.10)",
  };

  const titleStyle: React.CSSProperties = {
    color: surface === "dark" ? "#ffffff" : "#232522",
    fontSize: "clamp(1.05rem, 2vw, 1.35rem)",
    fontWeight: 900,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const titleAccentStyle: React.CSSProperties = {
    color: surface === "dark" ? "#d8cda9" : "#4f6f68",
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginTop: "0.28rem",
    textTransform: "uppercase",
  };

  return (
    <nav aria-label={title} className="w-full" style={shellStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={titleStyle}>{title}</div>
        {subtitle ? <div style={titleAccentStyle}>{subtitle}</div> : null}
      </div>

      <ul
        className={[
          "flex list-none flex-wrap items-center gap-2 p-0 m-0",
          layout === "column" ? "flex-col items-start" : JUSTIFY_CLASS[justify],
        ].join(" ")}
        style={{ justifyContent: "flex-end" }}
      >
        {navPages.map((page) => {
          const label = labelMap.get(page.slug.toLowerCase()) || page.name;
          const runtimeHref = resolveRuntimeHref(websiteId, `page:${page.slug}`, hrefMode);
          const editorHref = (() => {
            if (!isEditorCanvas || !pathname) return runtimeHref;
            const params = new URLSearchParams(searchParams?.toString() ?? "");
            if (page.slug === "home") {
              params.delete("page");
            } else {
              params.set("page", page.slug);
            }
            const query = params.toString();
            return query ? `${pathname}?${query}` : pathname;
          })();
          const href = isEditorCanvas ? editorHref : runtimeHref;
          const isActive = page.slug === currentPageSlug;
          const variantClasses = VARIANT_CLASS[surface][variant];
          const linkStyle: React.CSSProperties = {
            color: isActive ? "#ffffff" : surface === "dark" ? "rgba(247, 247, 244, 0.92)" : "#232522",
            background: isActive ? (surface === "dark" ? "#4f6f68" : "#4f6f68") : surface === "dark" ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
            borderColor: isActive ? "rgba(79, 111, 104, 0.55)" : surface === "dark" ? "rgba(255, 255, 255, 0.16)" : "rgba(35, 37, 34, 0.14)",
            fontSize: "15px",
            fontWeight: 850,
            minHeight: "42px",
            display: "inline-flex",
            alignItems: "center",
          };

          return (
            <li key={page.slug}>
              <a
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={isEditorCanvas ? (event) => {
                  event.preventDefault();
                  navigateInsideEditor(page.slug, label);
                } : undefined}
                className={`${variantClasses.base} ${isActive ? variantClasses.active : ""}`}
                style={linkStyle}
              >
                {label}
              </a>
            </li>
          );
        })}
        {showCta && ctaLabel ? (
          <li>
            <a
              href={ctaHref || "#contacto"}
              onClick={isEditorCanvas ? (event) => event.preventDefault() : undefined}
              className="inline-flex min-h-[42px] items-center rounded-full px-4 py-2.5 text-sm font-black transition-transform hover:-translate-y-0.5 md:text-[15px]"
              style={{
                background: surface === "dark" ? "#d6b287" : "#315c57",
                color: surface === "dark" ? "#1f2933" : "#ffffff",
                boxShadow: surface === "dark" ? "0 14px 26px -18px rgba(214,178,135,0.85)" : "0 14px 26px -18px rgba(49,92,87,0.75)",
              }}
            >
              {ctaLabel}
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

function parseLabelOverrides(value: string) {
  const entries = String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [slug, ...labelParts] = line.includes("=") ? line.split("=") : line.split(":");
      return [slug?.trim().toLowerCase(), labelParts.join("=").trim()] as const;
    })
    .filter(([slug, label]) => slug && label);

  return new Map(entries);
}

SiteNav.defaults = {
  title: "Navegación",
  subtitle: "Sitio profesional",
  labelOverrides: "",
  showHome: true,
  hiddenSlugs: "",
  showCta: true,
  ctaLabel: "Contactar",
  ctaHref: "#contacto",
  layout: "row",
  justify: "start",
  variant: "pill",
  surface: "dark",
} satisfies SiteNavProps;
