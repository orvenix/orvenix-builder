"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { ShoppingCart } from "lucide-react";
import { buildCartItemFromProductCardV1, isProductCardBoundV1, resolveProductCardDetailHrefV1 } from "./product-card-binding";
import type { SectionInstanceProductCardTreatment } from "@/lib/orvenix-ai/architect/composition-plan";
import { isSafeProductMediaUrlV1 } from "@/lib/commerce/product-media";
import {
  LEGACY_DARK_COMMERCE_SURFACE_V1,
  mixHexV1,
  productMonogramV1,
  sanitizeCommerceSurfaceV1,
  type CommerceSurfaceV1,
} from "@/lib/orvenix-ai/commerce/commerce-surface";

interface Props {
  id?: string;
  productId?: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  priceMxn?: number;
  comparePriceMxn?: number;
  /** PCE-2: authoritative store media only (Product.media); absent -> honest monogram tile. */
  imageUrl?: string;
  badge?: string;
  accentColor?: string;
  stock?: number;           // -1 = unlimited
  lowStockThreshold?: number;
  /** COMMERCE-2A: Site Creation preview reference to a product that will be provisioned on confirm (never executable). */
  provisioningRef?: string;
  /** COMMERCE-5B: Orvenix-resolved `page:<detail-slug>` for this exact product; absent -> no detail link. */
  detailHref?: string;
  /** PCE-2: Orvenix-computed theme surface (commerce-surface.ts); absent -> the pre-PCE-2 dark look. */
  surface?: CommerceSurfaceV1;
  className?: string;
  /** PCE-3: bounded renderer-owned card treatment. */
  treatment?: SectionInstanceProductCardTreatment;
}

/** A plain anchor when there is a detail target, otherwise the children unchanged (never a dead link). */
function ProductDetailLink({
  href,
  className,
  tabIndex,
  ariaHidden,
  dataState,
  children,
}: {
  href: string | null;
  className?: string;
  tabIndex?: number;
  ariaHidden?: boolean;
  dataState?: string;
  children: React.ReactNode;
}) {
  if (!href) return <>{children}</>;
  return (
    <a href={href} className={className} tabIndex={tabIndex} aria-hidden={ariaHidden || undefined} data-store-card-link={dataState}>
      {children}
    </a>
  );
}

function formatMxn(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

export function ProductCard({
  productId,
  variantId,
  productName   = "Producto de ejemplo",
  variantName   = "Talla única",
  priceMxn      = 29900,
  comparePriceMxn,
  imageUrl,
  badge,
  accentColor   = "#00b5f6",
  stock         = -1,
  lowStockThreshold = 5,
  provisioningRef,
  detailHref,
  surface: rawSurface,
  className,
  treatment = "compact-catalog",
}: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const websiteId = useEditorStore((s) => s.websiteId);
  const pathname = usePathname();
  // Same mode rules as CtaButton; never a live link on the editor canvas (a click there selects, it must not navigate).
  const isEditorCanvas = pathname?.startsWith("/editor/") || pathname?.startsWith("/constructor");
  const hrefMode = pathname?.startsWith("/p/") ? "published" : "preview";
  const detailLink = isEditorCanvas ? null : resolveProductCardDetailHrefV1(websiteId, detailHref, hrefMode);

  const themed = sanitizeCommerceSurfaceV1(rawSurface);
  const surface = themed ?? { ...LEGACY_DARK_COMMERCE_SURFACE_V1, accent: accentColor };
  const image = isSafeProductMediaUrlV1(imageUrl) ? imageUrl.trim() : null;

  const isOutOfStock = stock !== -1 && stock <= 0;
  const isLowStock   = stock !== -1 && stock > 0 && stock <= lowStockThreshold;

  // COMMERCE-1: no demo/default ids -- an unbound card is presentation-only.
  const isBound = isProductCardBoundV1({ productId, variantId });

  const handleAdd = () => {
    const item = buildCartItemFromProductCardV1({ productId, variantId, productName, variantName, priceMxn, imageUrl: image ?? undefined, stock });
    if (!item) return;
    addItem(item);
  };

  const tileBackground = mixHexV1(surface.accent, surface.card, surface.tone === "light" ? 0.9 : 0.82);
  const statusNote = { borderColor: surface.border, color: surface.muted };
  const safeTreatment: SectionInstanceProductCardTreatment = ["compact-catalog", "editorial", "image-led", "featured", "horizontal"].includes(treatment) ? treatment : "compact-catalog";
  const isHorizontal = safeTreatment === "horizontal";
  const isFeatured = safeTreatment === "featured";
  const isImageLed = safeTreatment === "image-led";
  const isEditorial = safeTreatment === "editorial";
  const isCompact = safeTreatment === "compact-catalog";

  const commerceCardFinish = isHorizontal
    ? {
      media: "relative min-h-40 w-full overflow-hidden sm:min-h-0 sm:w-44 sm:shrink-0",
      root: "group flex flex-col overflow-hidden rounded-[1.35rem] border shadow-[0_22px_55px_-42px_rgba(15,23,42,0.65)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_-44px_rgba(15,23,42,0.78)] sm:flex-row",
      body: "flex min-w-0 flex-1 flex-col justify-center gap-1 p-[1.125rem] sm:p-5",
      title: "mb-1 line-clamp-2 text-base font-extrabold leading-tight",
      price: "text-lg font-black tracking-tight",
      button: "flex h-10 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
      monogram: "text-5xl font-black tracking-tight",
      eyebrow: "Vista rápida",
    }
    : isFeatured
      ? {
        media: "relative aspect-[1.18/1] overflow-hidden md:aspect-[16/9]",
        root: "group relative flex min-h-full flex-col overflow-hidden rounded-[2rem] border shadow-[0_36px_120px_-62px_rgba(15,23,42,0.9)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_44px_140px_-66px_rgba(15,23,42,0.95)]",
        body: "relative z-20 mx-4 -mt-10 mb-4 flex flex-1 flex-col rounded-[1.45rem] border p-5 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.9)] backdrop-blur-md md:mx-6 md:-mt-12 md:p-6",
        title: "mb-2 line-clamp-2 text-2xl font-black leading-[0.98] md:text-3xl",
        price: "text-3xl font-black tracking-tight",
        button: "flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        monogram: "text-7xl font-black tracking-tight md:text-8xl",
        eyebrow: "Destacado",
      }
      : isImageLed
        ? {
          media: "relative aspect-[3/4] overflow-hidden",
          root: "group relative flex flex-col overflow-hidden rounded-[1.7rem] border shadow-[0_28px_90px_-56px_rgba(15,23,42,0.82)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_110px_-60px_rgba(15,23,42,0.9)]",
          body: "relative z-20 flex flex-1 flex-col p-[1.125rem] md:p-5",
          title: "mb-2 line-clamp-2 text-lg font-black leading-tight",
          price: "text-xl font-black tracking-tight",
          button: "flex h-10 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
          monogram: "text-6xl font-black tracking-tight",
          eyebrow: "Imagen principal",
        }
        : isEditorial
          ? {
            media: "relative aspect-[5/4] overflow-hidden",
            root: "group flex flex-col overflow-hidden rounded-[1.7rem] border shadow-[0_28px_86px_-56px_rgba(15,23,42,0.74)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_104px_-60px_rgba(15,23,42,0.86)]",
            body: "flex flex-1 flex-col p-5 md:p-6",
            title: "mb-2 line-clamp-2 text-xl font-black leading-[1.02]",
            price: "text-xl font-black tracking-tight",
            button: "flex h-10 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
            monogram: "text-5xl font-black tracking-tight",
            eyebrow: "Selección",
          }
          : {
            media: "relative aspect-square overflow-hidden",
            root: "group flex flex-col overflow-hidden rounded-[1.15rem] border shadow-[0_14px_36px_-32px_rgba(15,23,42,0.58)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_54px_-40px_rgba(15,23,42,0.74)]",
            body: "flex flex-1 flex-col p-3",
            title: "mb-1 line-clamp-2 text-sm font-extrabold leading-tight",
            price: "text-lg font-black tracking-tight",
            button: "flex h-9 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
            monogram: "text-4xl font-black tracking-tight",
            eyebrow: "Catálogo",
          };
  const mediaClass = commerceCardFinish.media;
  const rootClass = commerceCardFinish.root;
  const bodyClass = commerceCardFinish.body;
  const titleClass = commerceCardFinish.title;
  const priceClass = commerceCardFinish.price;
  const buttonClass = commerceCardFinish.button;
  const fallbackBackground = isFeatured
    ? `radial-gradient(circle at 30% 20%, ${mixHexV1(surface.accent, surface.card, 0.42)}, transparent 34%), linear-gradient(135deg, ${tileBackground}, ${mixHexV1(surface.accent, surface.card, surface.tone === "light" ? 0.58 : 0.5)})`
    : `linear-gradient(135deg, ${tileBackground}, ${mixHexV1(surface.accent, surface.card, surface.tone === "light" ? 0.72 : 0.64)})`;
  const bodySurface = isFeatured
    ? { background: mixHexV1(surface.card, surface.background, surface.tone === "light" ? 0.16 : 0.28), borderColor: surface.border }
    : undefined;

  const media = (
    <ProductDetailLink href={detailLink} className="block h-full" tabIndex={-1} ariaHidden>
      <div className={mediaClass} style={{ background: fallbackBackground }} data-store-card-media-frame={safeTreatment}>
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_38%,rgba(2,6,23,0.22))] opacity-85" aria-hidden="true" />
        {isFeatured && <div className="pointer-events-none absolute bottom-4 right-4 z-10 h-24 w-24 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm" aria-hidden="true" />}
        {image
          ? <Image fill unoptimized src={image} alt={productName ?? ""} className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.055]" data-store-media="image" />
          : (
            <div className="grid h-full w-full place-items-center px-6" data-store-media="fallback" aria-hidden="true">
              <span className={`${commerceCardFinish.monogram} grid aspect-square min-h-20 min-w-20 place-items-center rounded-full border bg-white/20 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.48),0_22px_60px_-36px_rgba(15,23,42,0.84)] backdrop-blur-sm`} style={{ color: surface.accent, borderColor: mixHexV1(surface.accent, surface.card, 0.42) }}>{productMonogramV1(productName)}</span>
            </div>
          )}
        {badge && (
          <span className="absolute left-3 top-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-black shadow-sm" style={{ background: surface.accent, color: surface.onAccent }}>
            {badge}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full border px-3 py-1 text-[11px] font-bold" style={{ background: surface.card, color: surface.muted, borderColor: surface.border }}>
              Sin stock
            </span>
          </div>
        )}
      </div>
    </ProductDetailLink>
  );

  const title = (
    <ProductDetailLink href={detailLink} className="hover:underline focus-visible:underline focus-visible:outline-none" dataState="detail-link">
      {productName}
    </ProductDetailLink>
  );

  const action = !isBound && provisioningRef ? (
    <p className="w-full rounded-xl border px-3 py-2 text-center text-xs font-semibold" style={statusNote} data-store-card-state="pending">
      Se activará al crear tu tienda
    </p>
  ) : !isBound ? (
    <p className="w-full rounded-xl border px-3 py-2 text-center text-xs font-semibold" style={statusNote} data-store-card-state="unbound">
      Producto sin vincular a la tienda
    </p>
  ) : (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isOutOfStock}
      data-store-card-state={isOutOfStock ? "out-of-stock" : "bound"}
      data-commerce-cta="primary-purchase"
      className={buttonClass}
      style={isOutOfStock ? { background: surface.border, color: surface.muted } : { background: surface.accent, color: surface.onAccent }}
    >
      <ShoppingCart size={isFeatured ? 16 : 14} aria-hidden="true" />
      {isOutOfStock ? "Sin stock" : "Añadir al carrito"}
    </button>
  );

  return (
    <div
      className={`${rootClass} ${className ?? ""}`.trim()}
      style={{ background: surface.card, borderColor: surface.border }}
      data-store-surface={themed ? surface.tone : "legacy"}
      data-store-card-treatment={safeTreatment}
      data-commerce-card-finish="pce-3c"
    >
      {media}
      <div className={bodyClass} style={bodySurface}>
        {(isEditorial || isFeatured || isImageLed || isHorizontal) && <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: surface.muted }}>{commerceCardFinish.eyebrow}</p>}
        <p className={titleClass} style={{ color: surface.heading }}>
          {title}
        </p>
        <p className="mb-2 text-xs" style={{ color: surface.muted }}>{variantName}</p>
        {isLowStock && (
          <p className="mb-2 text-[10px] font-semibold" style={{ color: surface.muted }}>
            Quedan {stock} disponibles
          </p>
        )}

        <div className={isHorizontal ? "mt-2" : "mt-auto"}>
          <div className={isCompact ? "mb-2 flex flex-wrap items-baseline gap-1.5" : "mb-3 flex flex-wrap items-baseline gap-2"} data-commerce-price-system="pce-3c">
            <span className={priceClass} style={{ color: surface.accent }}>
              {formatMxn(priceMxn)}
            </span>
            {comparePriceMxn && comparePriceMxn > priceMxn && (
              <span className="text-xs font-semibold line-through opacity-75" style={{ color: surface.muted }}>Antes {formatMxn(comparePriceMxn)}</span>
            )}
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
