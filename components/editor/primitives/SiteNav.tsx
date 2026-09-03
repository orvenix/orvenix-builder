"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEditorStore } from "@/store/useEditorStore";
import { resolveRuntimeHref } from "@/lib/builder-core/tree/pageLinks";
import { resolveSiteNavPages } from "@/lib/builder-core/tree/siteNavigation";
import type { BlockComponentProps } from "@/types/editor";

type InlineNavLink = {
  label?: string;
  name?: string;
  href?: string;
  slug?: string;
};

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
  chrome?: "floating" | "integrated";
  pages?: InlineNavLink[];
}

const JUSTIFY_CLASS = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

const VARIANT_CLASS = {
  dark: {
    pill: {
      base: "group relative overflow-hidden rounded-full border border-transparent px-4 py-2.5 text-sm font-semibold text-white/76 transition-all duration-300 hover:bg-white/[0.09] hover:text-white md:text-[15px]",
      active: "border-white/16 bg-white/[0.10] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
    },
    minimal: {
      base: "group relative overflow-hidden px-3 py-2 text-sm font-bold text-white/78 transition-all duration-300 hover:text-white md:text-[15px]",
      active: "text-[#9AE5FF]",
    },
  },
  light: {
    pill: {
      base: "group relative overflow-hidden rounded-full border border-transparent px-4 py-2.5 text-sm font-semibold text-[#075985]/82 transition-all duration-300 hover:border-[#1BB3FA]/25 hover:bg-[#e5f6ff] hover:text-[#062F44] md:text-[15px]",
      active: "border-[#1BB3FA]/40 bg-[#075985] text-white shadow-[0_16px_32px_-22px_rgba(7,89,133,0.72),inset_0_1px_0_rgba(255,255,255,0.20)]",
    },
    minimal: {
      base: "group relative overflow-hidden px-3 py-2 text-sm font-bold text-[#075985] transition-all duration-300 hover:text-[#1BB3FA] md:text-[15px]",
      active: "text-[#1BB3FA]",
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
  chrome = "floating",
  pages,
}: BlockComponentProps<SiteNavProps>) {
  const availablePages = useEditorStore((state) => state.availablePages);
  const storeActivePageSlug = useEditorStore((state) => state.activePageSlug);
  const websiteId = useEditorStore((state) => state.websiteId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setActivePageContext = useEditorStore((state) => state.setActivePageContext);

  const currentPageSlug = useMemo(() => {
    if (storeActivePageSlug) return storeActivePageSlug;
    if (pathname?.startsWith("/p/")) {
      const segments = pathname.split("/").filter(Boolean);
      return segments[2] || "home";
    }
    return searchParams?.get("page")?.trim() || "home";
  }, [pathname, searchParams, storeActivePageSlug]);

  const labelMap = useMemo(() => parseLabelOverrides(labelOverrides), [labelOverrides]);
  const inlinePages = useMemo(() => normalizeInlinePages(pages), [pages]);
  const resolvedPages = useMemo(
    () => resolveSiteNavPages(availablePages, { showHome, hiddenSlugs }),
    [availablePages, hiddenSlugs, showHome]
  );
  const inlinePagesAreAnchors = inlinePages.every((page) => page.href.startsWith("#"));
  const usesRealSitePages = resolvedPages.length > 1 && inlinePagesAreAnchors;
  const usesInlinePages = inlinePages.length > 0 && !usesRealSitePages;
  const navPages = usesInlinePages ? inlinePages : resolvedPages;

  const hrefMode = pathname?.startsWith("/preview/")
    ? "preview"
    : pathname?.startsWith("/p/")
      ? "published"
      : "preview";
  const isEditorCanvas = pathname?.startsWith("/editor/") || pathname?.startsWith("/constructor");

  const navigateInsideEditor = (slug: string, name: string) => {
    if (!pathname) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (slug === "home") params.delete("page");
    else params.set("page", slug);
    setActivePageContext({ activePageSlug: slug, activePageName: name, availablePages });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const scrollToInlineTarget = (href: string) => {
    if (!href.startsWith("#")) return false;
    const target = document.getElementById(href.slice(1));
    if (!target) return false;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  };

  if (navPages.length === 0) {
    return (
      <nav aria-label={title} className="w-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/55">
        Agrega más páginas para construir la navegación del sitio.
      </nav>
    );
  }

  const isIntegratedChrome = chrome === "integrated" || (!usesInlinePages && navPages.length > 1);

  const shellStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    width: "100%",
    minHeight: isIntegratedChrome ? "88px" : "76px",
    padding: isIntegratedChrome ? "0 clamp(1.25rem, 4vw, 4.5rem)" : "0.58rem 0.62rem",
    borderRadius: isIntegratedChrome ? "0" : "999px",
    border: isIntegratedChrome ? "0" : surface === "dark" ? "1px solid rgba(154, 229, 255, 0.14)" : "1px solid rgba(255,255,255,0.74)",
    background:
      isIntegratedChrome
        ? surface === "dark"
          ? "linear-gradient(135deg, rgba(7,14,24,0.96), rgba(8,31,49,0.92) 52%, rgba(23,148,204,0.22))"
          : "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(247,252,255,0.94) 52%, rgba(229,246,255,0.88))"
        : surface === "dark"
          ? "linear-gradient(135deg, rgba(7, 14, 24, 0.88), rgba(8, 31, 49, 0.76) 52%, rgba(23, 148, 204, 0.26))"
          : "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(239,250,255,0.76) 48%, rgba(218,244,255,0.66))",
    boxShadow:
      isIntegratedChrome
        ? surface === "dark"
          ? "0 18px 48px -42px rgba(0,0,0,0.72), inset 0 -1px 0 rgba(154,229,255,0.16)"
          : "0 18px 48px -42px rgba(7,89,133,0.28), inset 0 -1px 0 rgba(7,89,133,0.10)"
        : surface === "dark"
          ? "0 28px 80px -52px rgba(0,0,0,0.88), inset 0 1px 0 rgba(255,255,255,0.12)"
          : "0 26px 72px -48px rgba(7,89,133,0.38), inset 0 1px 0 rgba(255,255,255,0.96)",
    backdropFilter: "blur(24px) saturate(1.18)",
    WebkitBackdropFilter: "blur(24px) saturate(1.18)",
  };

  const titleStyle: React.CSSProperties = {
    color: surface === "dark" ? "#ffffff" : "#062F44",
    fontSize: isIntegratedChrome ? "clamp(1.08rem, 1.7vw, 1.46rem)" : "clamp(1.06rem, 2vw, 1.34rem)",
    fontWeight: 920,
    letterSpacing: "0.005em",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const titleAccentStyle: React.CSSProperties = {
    color: surface === "dark" ? "#9AE5FF" : "#1794CC",
    fontSize: isIntegratedChrome ? "0.68rem" : "0.66rem",
    fontWeight: 820,
    letterSpacing: "0.14em",
    marginTop: "0.34rem",
    textTransform: "uppercase",
  };

  const hasContactPage = resolvedPages.some((page) => page.slug === "contacto");
  const effectiveCtaHref = !usesInlinePages && hasContactPage && (!ctaHref || ctaHref.startsWith("#"))
    ? "page:contacto"
    : ctaHref || "page:contacto";
  const ctaRuntimeHref = resolveRuntimeHref(websiteId, effectiveCtaHref, hrefMode);
  const ctaEditorSlug = parseEditorPageHref(effectiveCtaHref);

  return (
    <nav aria-label={title} className={`orvenix-premium-site-nav ${isIntegratedChrome ? "orvenix-premium-site-nav--integrated" : ""} w-full`} style={shellStyle}>
      <div className="orvenix-site-brand relative flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="orvenix-site-brand-mark relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[18px] text-[13px] font-black text-white shadow-[0_20px_42px_-24px_rgba(27,179,250,0.95)]"
          style={{
            background: surface === "dark"
              ? "linear-gradient(145deg, #075985, #1BB3FA)"
              : "linear-gradient(145deg, #1BB3FA, #1379A8 58%, #075985)",
            border: surface === "dark" ? "1px solid rgba(154,229,255,0.28)" : "1px solid rgba(255,255,255,0.72)",
          }}
        >
          <span className="absolute inset-[5px] rounded-[14px] border border-white/20 bg-white/10" />
          <span className="relative tracking-[0.12em]">OV</span>
        </span>
        <div className="orvenix-site-brand-copy min-w-0">
          <div style={titleStyle}>{title}</div>
          {subtitle ? <div style={titleAccentStyle}>{subtitle}</div> : null}
        </div>
      </div>

      <ul
        className={[
          "orvenix-site-nav-links flex list-none flex-wrap items-center gap-1.5 p-1.5 m-0 border",
          layout === "column" ? "flex-col items-start" : JUSTIFY_CLASS[justify],
        ].join(" ")}
        style={{
          justifyContent: "flex-end",
          borderRadius: isIntegratedChrome ? "0" : "999px",
          borderColor: isIntegratedChrome ? "transparent" : surface === "dark" ? "rgba(255,255,255,0.075)" : "rgba(27,179,250,0.08)",
          background: isIntegratedChrome ? "transparent" : surface === "dark" ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.38)",
          boxShadow: isIntegratedChrome ? "none" : surface === "dark" ? "inset 0 1px 0 rgba(255,255,255,0.045)" : "inset 0 1px 0 rgba(255,255,255,0.62)",
        }}
      >
        {navPages.map((page) => {
          const label = labelMap.get(page.slug.toLowerCase()) || page.name;
          const runtimeHref = page.href || resolveRuntimeHref(websiteId, `page:${page.slug}`, hrefMode);
          const editorHref = (() => {
            if (usesInlinePages) return page.href || runtimeHref;
            if (!isEditorCanvas || !pathname) return runtimeHref;
            const params = new URLSearchParams(searchParams?.toString() ?? "");
            if (page.slug === "home") params.delete("page");
            else params.set("page", page.slug);
            const query = params.toString();
            return query ? `${pathname}?${query}` : pathname;
          })();
          const href = isEditorCanvas ? editorHref : runtimeHref;
          const isActive = !usesInlinePages && page.slug === currentPageSlug;
          const variantClasses = VARIANT_CLASS[surface][variant];
          const linkStyle: React.CSSProperties = {
            color: isActive ? "#ffffff" : surface === "dark" ? "rgba(247, 252, 255, 0.92)" : "#075985",
            background: isActive ? "linear-gradient(135deg, #075985, #1794CC)" : undefined,
            borderColor: isActive ? "rgba(27, 179, 250, 0.55)" : undefined,
            fontSize: "15px",
            fontWeight: 780,
            letterSpacing: "0.01em",
            minHeight: isIntegratedChrome ? "46px" : "40px",
            display: "inline-flex",
            alignItems: "center",
          };

          return (
            <li key={`${page.slug}-${page.href}`}>
              <a
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={usesInlinePages ? (event) => {
                  if (isEditorCanvas && scrollToInlineTarget(href)) event.preventDefault();
                } : isEditorCanvas ? (event) => {
                  event.preventDefault();
                  navigateInsideEditor(page.slug, label);
                } : undefined}
                className={`${variantClasses.base} ${isActive ? variantClasses.active : ""}`}
                style={linkStyle}
              >
                <span className="pointer-events-none absolute inset-x-4 bottom-1.5 h-px origin-center scale-x-0 rounded-full bg-current opacity-45 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="relative z-10">{label}</span>
              </a>
            </li>
          );
        })}
        {showCta && ctaLabel ? (
          <li>
            <a
              href={isEditorCanvas && ctaEditorSlug && pathname ? buildEditorPageHref(pathname, searchParams, ctaEditorSlug) : ctaRuntimeHref}
              onClick={(event) => {
                if (!isEditorCanvas) return;
                const rawHref = effectiveCtaHref;
                if (rawHref.startsWith("#")) {
                  if (scrollToInlineTarget(rawHref)) event.preventDefault();
                  return;
                }
                if (ctaEditorSlug) {
                  event.preventDefault();
                  navigateInsideEditor(ctaEditorSlug, ctaLabel);
                }
              }}
              className="orvenix-site-nav-cta group relative inline-flex min-h-[44px] items-center overflow-hidden rounded-full px-5 py-2.5 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_rgba(27,179,250,0.95)] md:text-[15px]"
              style={{
                background: surface === "dark"
                  ? "linear-gradient(135deg, #E6F8FF, #9AE5FF, #1BB3FA)"
                  : "linear-gradient(135deg, #1BB3FA, #1794CC 52%, #075985)",
                color: surface === "dark" ? "#062F44" : "#ffffff",
                boxShadow: surface === "dark" ? "0 18px 34px -20px rgba(154,229,255,0.85)" : "0 18px 36px -18px rgba(7,89,133,0.62)",
              }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/28 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative z-10">{ctaLabel}</span>
              <span className="relative z-10 ml-2 transition-transform duration-300 group-hover:translate-x-0.5">{">"}</span>
            </a>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

function parseEditorPageHref(href: string) {
  const value = href.trim();
  if (!value.startsWith("page:")) return null;
  return value.slice("page:".length).trim() || "home";
}

function buildEditorPageHref(pathname: string, searchParams: { toString(): string } | null, slug: string) {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  if (slug === "home") params.delete("page");
  else params.set("page", slug);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function normalizeInlinePages(pages: InlineNavLink[] | undefined) {
  if (!Array.isArray(pages)) return [];

  return pages
    .map((page, index) => {
      const label = String(page.label ?? page.name ?? "").trim();
      if (!label) return null;
      const href = String(page.href ?? "").trim() || "#";
      const fallbackSlug = "link-" + (index + 1);
      const slug = String((page.slug ?? href.replace(/^#/, "")) || fallbackSlug)
        .trim()
        .toLowerCase();
      return {
        id: null,
        siteId: "inline",
        name: label,
        slug,
        isHome: index === 0,
        published: true,
        source: "legacy-site-tree" as const,
        href,
      };
    })
    .filter((page): page is NonNullable<typeof page> => Boolean(page));
}

function parseLabelOverrides(value: string) {
  const map = new Map<string, string>();
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separator = line.includes("=") ? "=" : ":";
      const [rawKey, ...rest] = line.split(separator);
      const key = rawKey?.trim().toLowerCase();
      const label = rest.join(separator).trim();
      if (key && label) map.set(key, label);
    });
  return map;
}

SiteNav.defaults = {
  title: "Orvenix",
  subtitle: "Builder para negocios y agencias",
  showHome: true,
  showCta: true,
  ctaLabel: "Contactar",
  ctaHref: "#contacto",
  layout: "row",
  justify: "end",
  variant: "pill",
  surface: "light",
  chrome: "floating",
} satisfies SiteNavProps;
