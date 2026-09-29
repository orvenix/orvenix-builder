"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { ShoppingCart, Tag } from "lucide-react";
import { buildCartItemFromProductCardV1, isProductCardBoundV1, resolveProductCardDetailHrefV1 } from "./product-card-binding";

interface Props {
  id?: string;
  productId?: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  priceMxn?: number;
  comparePriceMxn?: number;
  imageUrl?: string;
  badge?: string;
  accentColor?: string;
  stock?: number;           // -1 = unlimited
  lowStockThreshold?: number;
  /** COMMERCE-2A: Site Creation preview reference to a product that will be provisioned on confirm (never executable). */
  provisioningRef?: string;
  /** COMMERCE-5B: Orvenix-resolved `page:<detail-slug>` for this exact product; absent -> no detail link. */
  detailHref?: string;
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
}: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const websiteId = useEditorStore((s) => s.websiteId);
  const pathname = usePathname();
  // Same mode rules as CtaButton; never a live link on the editor canvas (a click there selects, it must not navigate).
  const isEditorCanvas = pathname?.startsWith("/editor/") || pathname?.startsWith("/constructor");
  const hrefMode = pathname?.startsWith("/p/") ? "published" : "preview";
  const detailLink = isEditorCanvas ? null : resolveProductCardDetailHrefV1(websiteId, detailHref, hrefMode);

  const isOutOfStock = stock !== -1 && stock <= 0;
  const isLowStock   = stock !== -1 && stock > 0 && stock <= lowStockThreshold;

  // COMMERCE-1: no demo/default ids -- an unbound card is presentation-only.
  const isBound = isProductCardBoundV1({ productId, variantId });

  const handleAdd = () => {
    const item = buildCartItemFromProductCardV1({ productId, variantId, productName, variantName, priceMxn, imageUrl, stock });
    if (!item) return;
    addItem(item);
  };

  const discount = comparePriceMxn && comparePriceMxn > priceMxn
    ? Math.round((1 - priceMxn / comparePriceMxn) * 100)
    : null;

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-white/2 hover:border-white/[0.14] transition-all duration-300">

      {/* Imagen -- a pointer shortcut to the detail page; the title link below is the keyboard/AT target. */}
      <ProductDetailLink href={detailLink} className="block" tabIndex={-1} ariaHidden>
      <div className="relative aspect-square bg-white/4 overflow-hidden">
        {imageUrl
          ? <Image fill unoptimized src={imageUrl} alt={productName ?? ""} className="object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full grid place-items-center text-slate-700"><Tag size={32} /></div>
        }
        {badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
            style={{ background: accentColor }}>
            {badge}
          </span>
        )}
        {discount && !isOutOfStock && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">
            -{discount}%
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900/90 text-slate-400 border border-white/10">
              Sin stock
            </span>
          </div>
        )}
      </div>
      </ProductDetailLink>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-sm font-semibold text-white mb-1 line-clamp-2">
          <ProductDetailLink href={detailLink} className="hover:underline focus-visible:underline focus-visible:outline-none" dataState="detail-link">
            {productName}
          </ProductDetailLink>
        </p>
        <p className="text-xs text-slate-600 mb-1">{variantName}</p>
        {isLowStock && (
          <p className="text-[10px] text-amber-400 font-semibold mb-2">
            ¡Solo quedan {stock} unidades!
          </p>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-extrabold" style={{ color: accentColor }}>
              {formatMxn(priceMxn)}
            </span>
            {comparePriceMxn && comparePriceMxn > priceMxn && (
              <span className="text-xs text-slate-600 line-through">{formatMxn(comparePriceMxn)}</span>
            )}
          </div>

          {!isBound && provisioningRef ? (
            <p className="w-full rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-semibold text-slate-400" data-store-card-state="pending">
              Se activará al crear tu tienda
            </p>
          ) : !isBound ? (
            <p className="w-full rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-semibold text-slate-400" data-store-card-state="unbound">
              Producto sin vincular a la tienda
            </p>
          ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            data-store-card-state={isOutOfStock ? "out-of-stock" : "bound"}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: isOutOfStock ? "#374151" : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
          >
            <ShoppingCart size={14} />
            {isOutOfStock ? "Sin stock" : "Añadir al carrito"}
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
