"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEditorStore } from "@/store/useEditorStore";
import { getFocusableElements, isEscapeKey, restoreFocus } from "@/lib/builder-core/runtime/interaction";
import { resolveRuntimeHref, resolveSiteNavItemTarget } from "@/lib/builder-core/tree/pageLinks";
import { buildEditorPageUrl } from "@/components/editor/pageNavigation";
import { resolveSiteNavPages } from "@/lib/builder-core/tree/siteNavigation";
import { readableTextOn } from "@/lib/orvenix-ai/theme/visual-direction";
import type { BlockComponentProps } from "@/types/editor";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

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
  /** V2-5C.1: "glass" (default) is the existing translucent gradient + backdrop-blur shell, unchanged. "solid" is a flat, opaque, non-blurred shell in the same surface color family -- a real pattern found in the reference audit (bg-white, no blur) that the glass-only shell couldn't express. */
  surfaceStyle?: "glass" | "solid";
  /**
   * V2-5C.1 refinement: the site's real, already-resolved theme accent
   * hex (Orvenix-owned -- see composeNavigation's context.accentColor,
   * itself the single-theme-authority value from the V2-5C accent fix;
   * the Creative Director never sets this). Absent -> every accent-
   * colored element (brand mark, CTA, active link) keeps its EXACT
   * original fixed-blue styling, unchanged, for full backward
   * compatibility with nodes persisted before this prop existed.
   */
  accent?: string;
  navLayout?: "classic" | "centered-editorial" | "split" | "overlay";
  pages?: InlineNavLink[];
  /** PCE-2: set by the store shell ONLY when the page can sell; renders the cart entry inside the nav. */
  showCart?: boolean;
  /** PCE-2: bounded cart treatment (blueprint navigation.cartProminence); absent -> "standard". */
  cartProminence?: "none" | "subtle" | "prominent";
}

type NavCartTreatment = "compact" | "standard" | "prominent";

/** PCE-2: the bounded prominence -> treatment map. "none" cannot hide the only checkout path, so it reads as compact. */
export function navCartTreatment(prominence: SiteNavProps["cartProminence"]): NavCartTreatment {
  if (prominence === "prominent") return "prominent";
  if (prominence === "subtle" || prominence === "none") return "compact";
  return "standard";
}

/** PCE-2: the nav cart entry -- desktop and mobile instances share the ONE cart store (same drawer, same count). */
function NavCartButton({
  treatment,
  surface,
  navAccent,
  mobile = false,
}: {
  treatment: NavCartTreatment;
  surface: "dark" | "light";
  navAccent: { background: string; text: string } | null;
  mobile?: boolean;
}) {
  const toggle = useCartStore((s) => s.toggle);
  const cartOpen = useCartStore((s) => s.isOpen);
  const count = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const accentBackground = navAccent?.background ?? "#1BB3FA";
  const accentText = navAccent?.text ?? readableTextOn(accentBackground);
  const iconOnly = mobile || treatment === "compact";
  const filled = treatment === "prominent";
  const outline = surface === "dark" ? "rgba(255,255,255,0.22)" : "rgba(7,89,133,0.2)";
  const ink = surface === "dark" ? "#ffffff" : "#075985";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={count > 0 ? `Abrir carrito (${count} ${count === 1 ? "producto" : "productos"})` : "Abrir carrito"}
      aria-haspopup="dialog"
      aria-expanded={cartOpen}
      data-nav-cart={treatment}
      data-cart-trigger=""
      className={`orvenix-site-nav-cart relative inline-flex shrink-0 items-center justify-center gap-2 border font-bold transition-all duration-[var(--orv-interaction-duration,300ms)] hover:-translate-y-[var(--orv-motion-distance-sm,2px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1BB3FA]/70 focus-visible:ring-offset-2 ${iconOnly ? "h-10 w-10 rounded-xl" : "min-h-11 rounded-full px-4 text-sm md:text-[15px]"}`}
      style={filled
        ? { background: accentBackground, color: accentText, borderColor: accentBackground }
        : { background: "transparent", color: ink, borderColor: outline }}
    >
      <ShoppingCart size={iconOnly ? 18 : 16} aria-hidden="true" />
      {!iconOnly && <span>Carrito</span>}
      {count > 0 && (
        <span
          className={iconOnly
            ? "absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold"
            : "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold"}
          style={filled ? { background: accentText, color: accentBackground } : { background: accentBackground, color: accentText }}
        >
          {count}
        </span>
      )}
    </button>
  );
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
  surfaceStyle = "glass",
  accent,
  navLayout = "classic",
  pages,
  showCart = false,
  cartProminence,
}: BlockComponentProps<SiteNavProps>) {
  const cartTreatment = navCartTreatment(cartProminence);
  const availablePages = useEditorStore((state) => state.availablePages);
  const storeActivePageSlug = useEditorStore((state) => state.activePageSlug);
  const websiteId = useEditorStore((state) => state.websiteId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const flushPendingSave = useEditorStore((state) => state.flushPendingSave);
  const markError = useEditorStore((state) => state.markError);
  const navigationInFlightRef = useRef(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobilePanelId = useId();

  // Close the mobile panel on route change -- otherwise a client-side
  // editor-canvas page switch (no component unmount) can leave it stuck
  // open. Adjusted DURING RENDER (React's own recommended pattern for
  // "reset state when a prop changes"), not in a useEffect -- avoids an
  // extra commit/cascading-render entirely, rather than merely guarding one.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  // PCE-4A: mobile menu keyboard behavior. Focus enters the panel on open;
  // Escape closes it and returns focus to the trigger. Following a link
  // closes it WITHOUT refocusing the trigger (that would scroll the page back
  // to the header after an in-page anchor jump).
  useEffect(() => {
    if (!mobileOpen) return;
    getFocusableElements<HTMLElement>(mobilePanelRef.current)[0]?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEscapeKey(event)) return;
      event.preventDefault();
      setMobileOpen(false);
      restoreFocus(mobileTriggerRef.current);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const closeMobileMenuAfterNavigation = () => {
    if (mobileOpen) setMobileOpen(false);
  };

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

  const navigateInsideEditor = async (slug: string) => {
    if (!pathname || slug === currentPageSlug || navigationInFlightRef.current) return;

    navigationInFlightRef.current = true;
    try {
      const saveResult = await flushPendingSave();
      if (!saveResult.success) {
        markError(saveResult.error ?? "No se pudieron guardar los cambios antes de cambiar de página.");
        return;
      }

      const targetUrl = buildEditorPageUrl(pathname, searchParams?.toString() ?? "", slug);
      if (targetUrl) router.push(targetUrl);
    } finally {
      navigationInFlightRef.current = false;
    }
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
  const isSolidSurface = surfaceStyle === "solid";
  const isCenteredEditorialNav = navLayout === "centered-editorial";
  const isSplitNav = navLayout === "split";
  const isOverlayNav = navLayout === "overlay";

  const shellStyle: React.CSSProperties = {
    display: isCenteredEditorialNav ? "grid" : "flex",
    gridTemplateColumns: isCenteredEditorialNav ? "1fr" : undefined,
    alignItems: "center",
    justifyContent: isCenteredEditorialNav ? "center" : "space-between",
    gap: isCenteredEditorialNav ? "0.72rem" : isSplitNav ? "clamp(1rem, 4vw, 4rem)" : "1rem",
    width: "100%",
    minHeight: isOverlayNav ? "72px" : isCenteredEditorialNav ? "112px" : isIntegratedChrome ? "88px" : "76px",
    padding: isOverlayNav ? "0 clamp(1rem, 3.2vw, 3.5rem)" : isCenteredEditorialNav ? "1rem clamp(1.25rem, 4vw, 4.5rem)" : isIntegratedChrome ? "0 clamp(1.25rem, 4vw, 4.5rem)" : "0.58rem 0.62rem",
    borderRadius: isIntegratedChrome ? "0" : "999px",
    border: isIntegratedChrome ? "0" : surface === "dark" ? "1px solid rgba(154, 229, 255, 0.14)" : "1px solid rgba(255,255,255,0.74)",
    background: isOverlayNav
      ? surface === "dark"
        ? "linear-gradient(135deg, rgba(7,14,24,0.62), rgba(8,31,49,0.38))"
        : "linear-gradient(135deg, rgba(255,255,255,0.74), rgba(239,250,255,0.48))"
      : isSolidSurface
      ? surface === "dark"
        ? "#070E18"
        : "#ffffff"
      : isIntegratedChrome
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
    ...(isSolidSurface ? {} : { backdropFilter: "blur(24px) saturate(1.18)", WebkitBackdropFilter: "blur(24px) saturate(1.18)" }),
  };

  const titleStyle: React.CSSProperties = {
    color: surface === "dark" ? "#ffffff" : "#062F44",
    fontSize: isIntegratedChrome ? "clamp(1.08rem, 1.7vw, 1.46rem)" : "clamp(1.06rem, 2vw, 1.34rem)",
    fontWeight: 920,
    letterSpacing: "0.005em",
    lineHeight: 1,
    whiteSpace: "nowrap",
    // V2-5C.1: a long real business name (vs. the short placeholder) must
    // never overflow the header row on narrow viewports -- the brand's
    // parent already has min-w-0 (flex truncation needs both).
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "min(52vw, 320px)",
    textAlign: isCenteredEditorialNav ? "center" : undefined,
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
  const brandInitials = deriveBrandInitials(title);

  /*
   * V2-5C.1 refinement: when a real resolved theme accent is supplied,
   * every accent-colored element (brand mark, active link, CTA) becomes
   * a SOLID accent background with a contrast-CHECKED text color
   * (readableTextOn, theme/visual-direction.ts -- the same deterministic
   * safeguard already used elsewhere, never a new heuristic), instead of
   * the fixed "#1BB3FA" blue family. Absent accent -> `navAccent` stays
   * null and every consumer below falls through to its EXACT original
   * fixed-color expression, unchanged.
   */
  const navAccent = accent ? { background: accent, text: readableTextOn(accent) } : null;

  /*
   * V2-5C.1: link descriptors are computed ONCE and rendered TWICE
   * (desktop pill/minimal list + mobile stacked panel) -- the canonical
   * href/onClick resolution (real page routes, editor-canvas SPA
   * navigation) is exactly the logic that must never drift between the
   * two, so it lives here, not duplicated per rendering.
   */
  const linkDescriptors = navPages.map((page) => {
    const label = labelMap.get(page.slug.toLowerCase()) || page.name;
    const target = resolveSiteNavItemTarget(page, websiteId, hrefMode);
    const editorHref = (() => {
      if (!target.isPageLink) return target.runtimeHref;
      if (!isEditorCanvas || !pathname) return target.runtimeHref;
      return buildEditorPageHref(pathname, searchParams, target.targetSlug ?? page.slug);
    })();
    const href = isEditorCanvas ? editorHref : target.runtimeHref;
    const isActive = target.isPageLink && (target.targetSlug ?? page.slug) === currentPageSlug;
    const onClick = !target.isPageLink
      ? (event: React.MouseEvent) => {
          if (isEditorCanvas && scrollToInlineTarget(href)) event.preventDefault();
        }
      : isEditorCanvas
        ? (event: React.MouseEvent) => {
            event.preventDefault();
            void navigateInsideEditor(target.targetSlug ?? page.slug);
          }
        : undefined;
    return { key: `${page.slug}-${page.href}`, label, href, isActive, onClick };
  });

  const ctaHrefResolved = isEditorCanvas && ctaEditorSlug && pathname ? buildEditorPageHref(pathname, searchParams, ctaEditorSlug) : ctaRuntimeHref;
  const ctaOnClick = (event: React.MouseEvent) => {
    if (!isEditorCanvas) return;
    const rawHref = effectiveCtaHref;
    if (rawHref.startsWith("#")) {
      if (scrollToInlineTarget(rawHref)) event.preventDefault();
      return;
    }
    if (ctaEditorSlug) {
      event.preventDefault();
      void navigateInsideEditor(ctaEditorSlug);
    }
  };

  const ctaBackground = navAccent
    ? navAccent.background
    : surface === "dark"
      ? "linear-gradient(135deg, #E6F8FF, #9AE5FF, #1BB3FA)"
      : "linear-gradient(135deg, #1BB3FA, #1794CC 52%, #075985)";
  const ctaTextColor = navAccent ? navAccent.text : surface === "dark" ? "#062F44" : "#ffffff";

  const mobileTriggerColor = surface === "dark" ? "#ffffff" : "#075985";

  return (
    <>
      <nav aria-label={title} className={`orvenix-premium-site-nav orvenix-premium-site-nav--${navLayout} ${isIntegratedChrome ? "orvenix-premium-site-nav--integrated" : ""} w-full`} style={shellStyle}>
        <div className={`orvenix-site-brand relative flex min-w-0 items-center gap-3 ${isCenteredEditorialNav ? "mx-auto flex-col text-center" : ""}`}>
          <span
            aria-hidden="true"
            className="orvenix-site-brand-mark relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[18px] text-[13px] font-black shadow-[0_20px_42px_-24px_rgba(27,179,250,0.95)]"
            style={{
              background: navAccent
                ? navAccent.background
                : surface === "dark"
                  ? "linear-gradient(145deg, #075985, #1BB3FA)"
                  : "linear-gradient(145deg, #1BB3FA, #1379A8 58%, #075985)",
              color: navAccent ? navAccent.text : "#ffffff",
              border: surface === "dark" ? "1px solid rgba(154,229,255,0.28)" : "1px solid rgba(255,255,255,0.72)",
            }}
          >
            <span className="absolute inset-[5px] rounded-[14px] border border-white/20 bg-white/10" />
            <span className="relative tracking-[0.12em]">{brandInitials}</span>
          </span>
          <div className="orvenix-site-brand-copy min-w-0">
            <div style={titleStyle}>{title}</div>
            {subtitle ? <div style={titleAccentStyle}>{subtitle}</div> : null}
          </div>
        </div>

        <ul
          className={[
            "orvenix-site-nav-links hidden md:flex list-none flex-wrap items-center gap-1.5 p-1.5 m-0 border",
            isCenteredEditorialNav ? "mx-auto justify-center" : isSplitNav ? "ml-auto justify-end" : layout === "column" ? "flex-col items-start" : JUSTIFY_CLASS[justify],
          ].join(" ")}
          style={{
            justifyContent: isCenteredEditorialNav ? "center" : isSplitNav ? "flex-end" : "flex-end",
            borderRadius: isIntegratedChrome ? "0" : "999px",
            borderColor: isIntegratedChrome ? "transparent" : surface === "dark" ? "rgba(255,255,255,0.075)" : "rgba(27,179,250,0.08)",
            background: isCenteredEditorialNav || isSplitNav || isOverlayNav || isIntegratedChrome ? "transparent" : surface === "dark" ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.38)",
            boxShadow: isCenteredEditorialNav || isSplitNav || isOverlayNav || isIntegratedChrome ? "none" : surface === "dark" ? "inset 0 1px 0 rgba(255,255,255,0.045)" : "inset 0 1px 0 rgba(255,255,255,0.62)",
          }}
        >
          {linkDescriptors.map(({ key, label, href, isActive, onClick }) => {
            const variantClasses = VARIANT_CLASS[surface][variant];
            const linkStyle: React.CSSProperties = {
              color: isActive ? (navAccent ? navAccent.text : "#ffffff") : surface === "dark" ? "rgba(247, 252, 255, 0.92)" : "#075985",
              background: isActive ? (navAccent ? navAccent.background : "linear-gradient(135deg, #075985, #1794CC)") : undefined,
              borderColor: isActive ? "rgba(27, 179, 250, 0.55)" : undefined,
              fontSize: "15px",
              fontWeight: 780,
              letterSpacing: "0.01em",
              minHeight: isIntegratedChrome ? "46px" : "40px",
              display: "inline-flex",
              alignItems: "center",
            };

            return (
              <li key={key}>
                <a
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onClick}
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
                href={ctaHrefResolved}
                onClick={ctaOnClick}
                className="orvenix-site-nav-cta group relative inline-flex min-h-[44px] items-center overflow-hidden rounded-full px-5 py-2.5 text-sm font-black transition-all duration-[var(--orv-interaction-duration,300ms)] hover:-translate-y-[var(--orv-motion-distance-sm,2px)] hover:shadow-[0_22px_44px_-22px_rgba(27,179,250,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1BB3FA]/70 focus-visible:ring-offset-2 md:text-[15px]"
                style={{
                  background: ctaBackground,
                  color: ctaTextColor,
                  boxShadow: surface === "dark" ? "0 18px 34px -20px rgba(154,229,255,0.85)" : "0 18px 36px -18px rgba(7,89,133,0.62)",
                }}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/28 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative z-10">{ctaLabel}</span>
                <span className="relative z-10 ml-2 transition-transform duration-300 group-hover:translate-x-0.5">{">"}</span>
              </a>
            </li>
          ) : null}
          {showCart ? (
            <li>
              <NavCartButton treatment={cartTreatment} surface={surface} navAccent={navAccent} />
            </li>
          ) : null}
        </ul>

        {/* PCE-2: the same cart entry on small screens, next to the menu trigger (not hidden inside the panel). */}
        {showCart ? (
          <div className="ml-auto md:hidden">
            <NavCartButton treatment={cartTreatment} surface={surface} navAccent={navAccent} mobile />
          </div>
        ) : null}

        {/* V2-5C.1: mobile menu trigger -- desktop keeps its unchanged link list above; this button (and the panel below) only ever render meaningfully at <md, via Tailwind's md:hidden. */}
        <button
          type="button"
          className="orvenix-site-nav-trigger relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-[var(--orv-interaction-duration,300ms)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1BB3FA]/70 focus-visible:ring-offset-2 md:hidden"
          ref={mobileTriggerRef}
          style={{
            borderColor: surface === "dark" ? "rgba(255,255,255,0.16)" : "rgba(7,89,133,0.18)",
            color: mobileTriggerColor,
            background: surface === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)",
          }}
          aria-expanded={mobileOpen}
          aria-controls={mobilePanelId}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMobileOpen((value) => !value)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            {mobileOpen ? (
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <>
                <path d="M3 5H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 9H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 13H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* V2-5C.1: mobile navigation panel -- same real canonical links/CTA as
          desktop (linkDescriptors, computed once above), a simple stacked
          shell coherent with the header's own surface/accent. Structurally
          always present (so aria-controls always resolves to a real element
          and layout never shifts); visibility toggles via the hidden attribute.
          PCE-4A: the restrained open motion is CSS-owned
          (.orvenix-site-nav-mobile-panel in globals.css) and follows data-motion
          and prefers-reduced-motion; closing is always immediate. */}
      <div
        id={mobilePanelId}
        ref={mobilePanelRef}
        hidden={!mobileOpen}
        className="orvenix-site-nav-mobile-panel md:hidden w-full"
        style={{
          marginTop: "0.5rem",
          borderRadius: isIntegratedChrome ? "16px" : "20px",
          padding: "0.65rem",
          background: surface === "dark" ? "#0b1a29" : "#ffffff",
          border: surface === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(7,89,133,0.12)",
          boxShadow: "0 18px 40px -28px rgba(0,0,0,0.45)",
        }}
      >
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {linkDescriptors.map(({ key, label, href, isActive, onClick }) => (
            <li key={key}>
              <a
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => { onClick?.(event); closeMobileMenuAfterNavigation(); }}
                className="block w-full rounded-lg px-3 py-2.5 text-sm font-bold transition-colors"
                style={{
                  color: isActive ? (navAccent ? navAccent.text : "#ffffff") : surface === "dark" ? "rgba(247,252,255,0.92)" : "#075985",
                  background: isActive ? (navAccent ? navAccent.background : surface === "dark" ? "rgba(255,255,255,0.08)" : "rgba(7,89,133,0.08)") : "transparent",
                }}
              >
                {label}
              </a>
            </li>
          ))}
          {showCta && ctaLabel ? (
            <li className="pt-1">
              <a
                href={ctaHrefResolved}
                onClick={(event) => { ctaOnClick(event); closeMobileMenuAfterNavigation(); }}
                className="block w-full rounded-lg px-3 py-2.5 text-center text-sm font-black"
                style={{ background: ctaBackground, color: ctaTextColor }}
              >
                {ctaLabel}
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
}

/**
 * V2-5C.1 refinement: a bounded, deterministic 1-2 character monogram
 * derived from the REAL title text already passed in (Orvenix-owned --
 * composeNavigation already resolves title to the real business name
 * when known, "Nombre del negocio" otherwise; this never invents a
 * name, it only summarizes whatever real/placeholder text it is given).
 * Unicode-safe (Array.from + toLocaleUpperCase, not raw .slice/.toUpperCase,
 * so accented/multi-byte first characters like "Ñ"/"É" are never split
 * mid-codepoint). Falls back to "OV" -- the ORIGINAL hardcoded value --
 * only when the title is genuinely empty, preserving the old visual
 * identity in that edge case.
 */
export function deriveBrandInitials(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "OV";
  const words = trimmed.split(/\s+/).filter(Boolean);
  const firstChar = (word: string) => Array.from(word)[0] ?? "";
  const initials = words.length >= 2 ? firstChar(words[0]) + firstChar(words[1]) : Array.from(words[0]).slice(0, 2).join("");
  return (initials || "OV").toLocaleUpperCase();
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
  surfaceStyle: "glass",
} satisfies SiteNavProps;
