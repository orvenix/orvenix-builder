"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { ShoppingCart } from "lucide-react";
import { buildCartItemFromProductCardV1, isProductCardBoundV1, resolveProductCardDetailHrefV1 } from "./product-card-binding";
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

  const discount = comparePriceMxn && comparePriceMxn > priceMxn
    ? Math.round((1 - priceMxn / comparePriceMxn) * 100)
    : null;
  const tileBackground = mixHexV1(surface.accent, surface.card, surface.tone === "light" ? 0.9 : 0.82);
  const statusNote = { borderColor: surface.border, color: surface.muted };

  return (
    <div
      className="group flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: surface.card, borderColor: surface.border }}
      data-store-surface={themed ? surface.tone : "legacy"}
    >

      {/* Imagen -- a pointer shortcut to the detail page; the title link below is the keyboard/AT target. */}
      <ProductDetailLink href={detailLink} className="block" tabIndex={-1} ariaHidden>
      <div className="relative aspect-square overflow-hidden" style={{ background: tileBackground }}>
        {image
          ? <Image fill unoptimized src={image} alt={productName ?? ""} className="object-cover group-hover:scale-105 transition-transform duration-500" data-store-media="image" />
          : (
            // PCE-2: honest, non-photographic stand-in -- never stock imagery presented as the product.
            <div className="w-full h-full grid place-items-center" data-store-media="fallback" aria-hidden="true">
              <span className="text-4xl font-black tracking-tight" style={{ color: surface.accent }}>{productMonogramV1(productName)}</span>
            </div>
          )
        }
        {badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold"
            style={{ background: surface.accent, color: surface.onAccent }}>
            {badge}
          </span>
        )}
        {discount && !isOutOfStock && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white">
            -{discount}%
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold border" style={{ background: surface.card, color: surface.muted, borderColor: surface.border }}>
              Sin stock
            </span>
          </div>
        )}
      </div>
      </ProductDetailLink>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: surface.heading }}>
          <ProductDetailLink href={detailLink} className="hover:underline focus-visible:underline focus-visible:outline-none" dataState="detail-link">
            {productName}
          </ProductDetailLink>
        </p>
        <p className="text-xs mb-1" style={{ color: surface.muted }}>{variantName}</p>
        {isLowStock && (
          <p className="text-[10px] text-amber-600 font-semibold mb-2">
            ¡Solo quedan {stock} unidades!
          </p>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-extrabold" style={{ color: surface.accent }}>
              {formatMxn(priceMxn)}
            </span>
            {comparePriceMxn && comparePriceMxn > priceMxn && (
              <span className="text-xs line-through" style={{ color: surface.muted }}>{formatMxn(comparePriceMxn)}</span>
            )}
          </div>

          {!isBound && provisioningRef ? (
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
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            style={isOutOfStock ? { background: surface.border, color: surface.muted } : { background: surface.accent, color: surface.onAccent }}
          >
            <ShoppingCart size={14} aria-hidden="true" />
            {isOutOfStock ? "Sin stock" : "Añadir al carrito"}
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
